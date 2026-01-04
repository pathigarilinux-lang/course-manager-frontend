import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart, MapPin, Users, Award, FileText, CheckCircle, AlertCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { styles } from '../config';

// --- CONFIG ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 2; // Incremented for schema update

// --- INDEXED DB HELPER ---
const dbHelper = {
    open: () => new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'mobile' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }),
    addBulk: async (students) => {
        const db = await dbHelper.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            let count = 0;
            students.forEach(s => {
                store.put(s);
                count++;
            });
            tx.oncomplete = () => resolve(count);
            tx.onerror = () => reject(tx.error);
        });
    },
    getAll: async () => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
        });
    },
    clear: async () => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
        });
    }
};

// --- INTELLIGENT PARSER ---
const cleanString = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

export default function MasterDatabase() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, old: 0, new: 0, male: 0, female: 0, cities: {} });
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await dbHelper.getAll();
            setStudents(data);
            calculateStats(data);
        } catch (e) { console.error("DB Error", e); }
        finally { setIsLoading(false); }
    };

    // ✅ INTELLIGENT MERGE LOGIC
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsLoading(true);
        setMergeStatus('Reading files...');

        let teacherList = []; // Holds data from "Teacher List"
        let attendedList = []; // Holds data from "Attended"

        // 1. READ ALL FILES FIRST
        for (const file of files) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Try to find header row automatically (Teacher list header is usually lower down)
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read as array of arrays
            
            // Detect Header Row
            let headerRowIndex = 0;
            let headers = [];
            
            for(let i=0; i<rawData.length; i++) {
                const rowStr = JSON.stringify(rawData[i]).toLowerCase();
                if (rowStr.includes('student') && (rowStr.includes('10d') || rowStr.includes('roomno'))) {
                    headerRowIndex = i; // Found Teacher List Header
                    break;
                }
                if (rowStr.includes('name') && rowStr.includes('mobile')) {
                    headerRowIndex = i; // Found Attended List Header
                    break;
                }
            }

            // Re-parse with correct header
            const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
            
            // Check file type based on columns
            const firstRow = jsonData[0] || {};
            if (firstRow['10D'] !== undefined || firstRow['STP'] !== undefined) {
                console.log("Identified Teacher List:", file.name);
                teacherList = teacherList.concat(jsonData);
            } else {
                console.log("Identified Attended List:", file.name);
                attendedList = attendedList.concat(jsonData);
            }
        }

        setMergeStatus(`Merging ${attendedList.length} students with ${teacherList.length} teacher records...`);

        // 2. MERGE LOGIC
        // If we only have Teacher List, we can't do much (no mobile nums usually). 
        // We prioritize Attended List as the "Master" source.
        
        const finalData = attendedList.map(mainRow => {
            // Key Mapping from Attended List
            const mobile = (mainRow['PhoneMobile'] || mainRow['PhoneHome'] || '').toString().replace(/\D/g, '');
            if (!mobile || mobile.length < 5) return null;

            // Prepare Basic Data
            let student = {
                mobile: mobile,
                name: mainRow['Name'],
                gender: mainRow['Gender'],
                age: mainRow['Age'],
                city: mainRow['City'],
                state: mainRow['State'],
                email: mainRow['Email'],
                occupation: mainRow['Occupation'],
                accommodation: mainRow['Accommodation'],
                last_course_conf: mainRow['Conf No'],
                last_update: new Date().toISOString(),
                // Default History Stats
                history: {
                    '10D': 0, 'STP': 0, 'SPL': 0, 'TSC': 0, 
                    '20D': 0, '30D': 0, '45D': 0, '60D': 0
                }
            };

            // 🔍 FIND MATCH IN TEACHER LIST
            // Strategy: Match by Normalized Name OR Normalized Room No
            const cleanName = cleanString(student.name);
            const cleanRoom = cleanString(student.accommodation).replace(/-/g, '').replace(/ /g, '');

            const teacherRow = teacherList.find(tRow => {
                const tName = cleanString(tRow['Student']);
                const tRoom = cleanString(tRow['RoomNo']).replace(/-/g, '').replace(/ /g, '');
                
                // Match Logic: Name exact match OR Room exact match (if matched room is unique enough)
                return tName === cleanName || (tRoom && tRoom === cleanRoom && tRoom.length > 3);
            });

            // 💉 INJECT DATA
            if (teacherRow) {
                student.history = {
                    '10D': parseInt(teacherRow['10D'] || 0),
                    'STP': parseInt(teacherRow['STP'] || 0),
                    'SPL': parseInt(teacherRow['SPL'] || 0),
                    'TSC': parseInt(teacherRow['TSC'] || 0),
                    '20D': parseInt(teacherRow['20D'] || 0),
                    '30D': parseInt(teacherRow['30D'] || 0),
                    '45D': parseInt(teacherRow['45D'] || 0),
                    '60D': parseInt(teacherRow['60D'] || 0)
                };
            }

            return student;
        }).filter(Boolean);

        // 3. SAVE TO DB
        if (finalData.length > 0) {
            await dbHelper.addBulk(finalData);
            setMergeStatus(`Successfully merged and saved ${finalData.length} records!`);
        } else if (teacherList.length > 0 && attendedList.length === 0) {
            setMergeStatus("⚠️ Only Teacher List found. Please upload 'Attended List' too for contact details.");
        } else {
            setMergeStatus("No valid data found.");
        }
        
        await refreshData();
        setIsLoading(false);
        setTimeout(() => setShowUpload(false), 3000);
    };

    // Stats
    const calculateStats = (data) => {
        const s = { total: data.length, old: 0, new: 0, male: 0, female: 0, cities: {} };
        data.forEach(p => {
            // Old student if history exists > 0
            const h = p.history || {};
            const coursesCount = (h['10D']||0) + (h['STP']||0) + (h['20D']||0);
            
            if (coursesCount > 0 || String(p.last_course_conf).startsWith('O')) s.old++;
            else s.new++;

            if (String(p.gender).toLowerCase().startsWith('m')) s.male++; else s.female++;
            const city = (p.city || 'Unknown').trim();
            s.cities[city] = (s.cities[city] || 0) + 1;
        });
        setStats(s);
    };

    const filteredList = useMemo(() => {
        if (!searchTerm) return students.slice(0, 100);
        const lower = searchTerm.toLowerCase();
        return students.filter(s => 
            String(s.name).toLowerCase().includes(lower) || 
            String(s.mobile).includes(lower) ||
            String(s.city).toLowerCase().includes(lower)
        ).slice(0, 100);
    }, [students, searchTerm]);

    const topCities = Object.entries(stats.cities).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Student Database
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        Smart Merge Enabled • {stats.total.toLocaleString()} Records
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => dbHelper.clear().then(refreshData)} style={{...styles.btn(false), color:'#ef4444', borderColor:'#ef4444'}}>
                        <Trash2 size={16}/> Clear DB
                    </button>
                    <button onClick={() => setShowUpload(!showUpload)} style={{...styles.btn(true), background:'#10b981', borderColor:'#10b981'}}>
                        <Upload size={16}/> Import & Merge
                    </button>
                </div>
            </div>

            {/* UPLOAD AREA */}
            {showUpload && (
                <div style={{background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:'12px', padding:'30px', textAlign:'center', marginBottom:'25px'}}>
                    <FileText size={40} color="#15803d" style={{marginBottom:'10px'}}/>
                    <h3 style={{margin:0, color:'#14532d'}}>Intelligent Course Merge</h3>
                    <p style={{fontSize:'13px', color:'#166534', marginBottom:'20px'}}>
                        Select BOTH <strong>Teacher List</strong> and <strong>Attended List</strong> files together.<br/>
                        The system will auto-match students and combine their data.
                    </p>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        multiple 
                        onChange={handleFileUpload}
                        style={{display:'block', margin:'0 auto', color:'#15803d'}}
                    />
                    {isLoading && <div style={{marginTop:'15px', fontWeight:'bold', color:'#0d9488'}}>{mergeStatus}</div>}
                </div>
            )}

            {/* ANALYTICS */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'30px'}}>
                <div style={cardStyle}>
                    <div style={labelStyle}>TOTAL STUDENTS</div>
                    <div style={numStyle}>{stats.total.toLocaleString()}</div>
                    <div style={subStyle}>Merged Records</div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>OLD vs NEW</div>
                    <div style={numStyle}>{stats.old.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>/ {stats.new.toLocaleString()}</span></div>
                    <div style={subStyle}>Course History</div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>GENDER</div>
                    <div style={numStyle}>{stats.male.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>M</span> • {stats.female.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>F</span></div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>TOP CITY</div>
                    <div style={numStyle}>{topCities[0]?.[0] || '-'}</div>
                    <div style={subStyle}>{topCities[0]?.[1]} Students</div>
                </div>
            </div>

            {/* MAIN TABLE */}
            <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', overflow:'hidden'}}>
                <div style={{padding:'15px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:'15px'}}>
                    <div style={{position:'relative', flex:1}}>
                        <Search size={18} style={{position:'absolute', left:'12px', top:'10px', color:'#94a3b8'}}/>
                        <input 
                            style={{...styles.input, paddingLeft:'35px', width:'100%', border:'1px solid #e2e8f0'}}
                            placeholder="Search by Name, Mobile, City..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr 1fr', background:'#f8fafc', padding:'12px 20px', fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                    <div>Student Name</div>
                    <div>Mobile</div>
                    <div>Gender / Age</div>
                    <div>City</div>
                    <div>Course History (Merged)</div>
                    <div>Last Conf No</div>
                </div>

                <div style={{maxHeight:'500px', overflowY:'auto'}}>
                    {filteredList.map(s => {
                        const h = s.history || {};
                        const historyStr = `10D:${h['10D']||0} STP:${h['STP']||0} 20D:${h['20D']||0}`;
                        
                        return (
                            <div key={s.mobile} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 2fr 1fr', padding:'15px 20px', borderBottom:'1px solid #f1f5f9', fontSize:'13px', alignItems:'center', ':hover':{background:'#f8fafc'}}}>
                                <div style={{fontWeight:'600', color:'#1e293b'}}>{s.name}</div>
                                <div style={{color:'#64748b'}}>{s.mobile}</div>
                                <div>
                                    <span style={{
                                        padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold',
                                        background: String(s.gender).toLowerCase().startsWith('m') ? '#e0f2fe' : '#fce7f3',
                                        color: String(s.gender).toLowerCase().startsWith('m') ? '#0284c7' : '#db2777'
                                    }}>{String(s.gender).charAt(0)}</span>
                                    <span style={{marginLeft:'8px', color:'#64748b'}}>{s.age}</span>
                                </div>
                                <div style={{color:'#334155'}}>{s.city}</div>
                                
                                {/* MERGED HISTORY DISPLAY */}
                                <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                                    {(h['10D'] > 0) && <span style={{background:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold'}}>10D:{h['10D']}</span>}
                                    {(h['STP'] > 0) && <span style={{background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold'}}>STP:{h['STP']}</span>}
                                    {(h['20D'] > 0) && <span style={{background:'#f3e8ff', color:'#7e22ce', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold'}}>20D:{h['20D']}</span>}
                                    {Object.values(h).every(v => v === 0) && <span style={{color:'#cbd5e1', fontSize:'11px'}}>No History</span>}
                                </div>
                                
                                <div style={{fontSize:'11px', color:'#94a3b8'}}>{s.last_course_conf}</div>
                            </div>
                        );
                    })}
                </div>
                <div style={{padding:'10px 20px', borderTop:'1px solid #f1f5f9', fontSize:'11px', color:'#94a3b8', background:'#f8fafc'}}>
                    Showing {filteredList.length} of {students.length} records
                </div>
            </div>
        </div>
    );
}

// STYLES
const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0' };
const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '5px' };
const numStyle = { fontSize: '24px', fontWeight: '800', color: '#1e293b' };
const subStyle = { fontSize: '12px', color: '#64748b', marginTop: '2px' };
