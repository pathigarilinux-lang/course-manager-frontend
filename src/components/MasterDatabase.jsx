import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart, MapPin, Users, Award, FileText, CheckCircle, X, ChevronDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { styles } from '../config';

// --- CONFIG ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 3; // Schema Update
const COURSE_COLS = ['10D', 'STP', 'SPL', 'TSC', '20D', '30D', '45D', '60D'];

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
            students.forEach(s => { store.put(s); count++; });
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

const cleanString = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

export default function MasterDatabase() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, old: 0, new: 0, male: 0, female: 0 });
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    
    // ✅ NEW: Course Filter State
    const [courseFilter, setCourseFilter] = useState('All'); // 'All', '10D', '60D' etc.

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

    // ✅ INTELLIGENT PARSER WITH EXACT COLUMNS
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsLoading(true);
        setMergeStatus('Reading files...');

        let teacherList = [];
        let attendedList = [];

        for (const file of files) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Detect Header Row
            let headerRowIndex = 0;
            for(let i=0; i<rawData.length; i++) {
                const rowStr = JSON.stringify(rawData[i]).toLowerCase();
                if (rowStr.includes('student') && (rowStr.includes('10d') || rowStr.includes('stp'))) {
                    headerRowIndex = i; break;
                }
                if (rowStr.includes('name') && rowStr.includes('mobile')) {
                    headerRowIndex = i; break;
                }
            }

            const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
            const firstRow = jsonData[0] || {};
            
            // Check if specific columns exist to identify file type
            if (firstRow['10D'] !== undefined || firstRow['STP'] !== undefined) {
                console.log("Found Teacher List:", file.name);
                teacherList = teacherList.concat(jsonData);
            } else {
                console.log("Found Attended List:", file.name);
                attendedList = attendedList.concat(jsonData);
            }
        }

        setMergeStatus(`Merging ${attendedList.length} students with ${teacherList.length} history records...`);

        const finalData = attendedList.map(mainRow => {
            const mobile = (mainRow['PhoneMobile'] || mainRow['PhoneHome'] || '').toString().replace(/\D/g, '');
            if (!mobile || mobile.length < 5) return null;

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
                history: {} // Container for exact columns
            };

            // Initialize all columns to 0
            COURSE_COLS.forEach(col => student.history[col] = 0);

            // Match Logic
            const cleanName = cleanString(student.name);
            const cleanRoom = cleanString(student.accommodation).replace(/-/g, '').replace(/ /g, '');

            const teacherRow = teacherList.find(tRow => {
                const tName = cleanString(tRow['Student']);
                const tRoom = cleanString(tRow['RoomNo']).replace(/-/g, '').replace(/ /g, '');
                return tName === cleanName || (tRoom && tRoom === cleanRoom && tRoom.length > 3);
            });

            // Inject Exact Columns
            if (teacherRow) {
                COURSE_COLS.forEach(col => {
                    // Force 0 if undefined/null/empty, otherwise parse Int
                    const val = teacherRow[col];
                    student.history[col] = val ? parseInt(val) : 0;
                });
            }

            return student;
        }).filter(Boolean);

        if (finalData.length > 0) {
            await dbHelper.addBulk(finalData);
            setMergeStatus(`✅ Success! Merged ${finalData.length} records with full history.`);
        } else {
            setMergeStatus("⚠️ No matching data found or invalid files.");
        }
        
        await refreshData();
        setIsLoading(false);
        setTimeout(() => setShowUpload(false), 3000);
    };

    const calculateStats = (data) => {
        const s = { total: data.length, old: 0, new: 0, male: 0, female: 0 };
        data.forEach(p => {
            // Check if any course > 0
            const hasHistory = COURSE_COLS.some(col => p.history[col] > 0);
            if (hasHistory || String(p.last_course_conf).startsWith('O')) s.old++;
            else s.new++;

            if (String(p.gender).toLowerCase().startsWith('m')) s.male++; else s.female++;
        });
        setStats(s);
    };

    // ✅ ADVANCED FILTER ENGINE
    const filteredList = useMemo(() => {
        let list = students;

        // 1. Course Specific Filter
        if (courseFilter !== 'All') {
            list = list.filter(s => (s.history?.[courseFilter] || 0) > 0);
        }

        // 2. Search Text
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s => 
                String(s.name).toLowerCase().includes(lower) || 
                String(s.mobile).includes(lower) ||
                String(s.city).toLowerCase().includes(lower)
            );
        }

        return list.slice(0, 100); // Pagination limit
    }, [students, searchTerm, courseFilter]);

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Database
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        {stats.total.toLocaleString()} Records • {stats.old.toLocaleString()} Old Students
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => dbHelper.clear().then(refreshData)} style={{...styles.btn(false), color:'#ef4444', borderColor:'#ef4444'}}>
                        <Trash2 size={16}/> Clear DB
                    </button>
                    <button onClick={() => setShowUpload(!showUpload)} style={{...styles.btn(true), background:'#10b981', borderColor:'#10b981'}}>
                        <Upload size={16}/> Import Files
                    </button>
                </div>
            </div>

            {/* UPLOAD PANEL */}
            {showUpload && (
                <div style={{background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:'12px', padding:'25px', textAlign:'center', marginBottom:'25px'}}>
                    <FileText size={32} color="#15803d" style={{marginBottom:'10px'}}/>
                    <h3 style={{margin:0, color:'#14532d'}}>Upload "Teacher List" & "Attended List"</h3>
                    <p style={{fontSize:'12px', color:'#166534', marginBottom:'15px'}}>
                        Select both files. The system will create columns: {COURSE_COLS.join(', ')}
                    </p>
                    <input type="file" accept=".xlsx, .xls" multiple onChange={handleFileUpload} style={{display:'block', margin:'0 auto', color:'#15803d'}}/>
                    {isLoading && <div style={{marginTop:'15px', fontWeight:'bold', color:'#0d9488'}}>{mergeStatus}</div>}
                </div>
            )}

            {/* FILTERS & TABLE */}
            <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', overflow:'hidden'}}>
                
                {/* TOOLBAR */}
                <div style={{padding:'15px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:'15px', alignItems:'center', background:'#f8fafc'}}>
                    <div style={{position:'relative', width:'300px'}}>
                        <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#94a3b8'}}/>
                        <input 
                            style={{...styles.input, paddingLeft:'35px', width:'100%', border:'1px solid #e2e8f0'}}
                            placeholder="Search Name, City..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{height:'30px', width:'1px', background:'#e2e8f0'}}></div>

                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <Filter size={16} color="#64748b"/>
                        <span style={{fontSize:'13px', fontWeight:'600', color:'#475569'}}>Filter by Course:</span>
                        <select 
                            value={courseFilter} 
                            onChange={e => setCourseFilter(e.target.value)}
                            style={{padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'13px', fontWeight:'600', minWidth:'120px'}}
                        >
                            <option value="All">All Students</option>
                            {COURSE_COLS.map(c => <option key={c} value={c}>Has done {c}</option>)}
                        </select>
                    </div>

                    <div style={{marginLeft:'auto', fontSize:'12px', fontWeight:'600', color:'#3b82f6'}}>
                        Showing {filteredList.length} results
                    </div>
                </div>

                {/* TABLE HEADER */}
                <div style={{display:'grid', gridTemplateColumns:'200px 100px 80px 120px 50px 50px 50px 50px 50px 50px 50px 50px', borderBottom:'1px solid #e2e8f0', background:'#f1f5f9'}}>
                    <div style={thStyle}>Student Name</div>
                    <div style={thStyle}>Mobile</div>
                    <div style={thStyle}>Gen/Age</div>
                    <div style={thStyle}>City</div>
                    {COURSE_COLS.map(c => (
                        <div key={c} style={{...thStyle, textAlign:'center', color:'#2563eb'}}>{c}</div>
                    ))}
                </div>

                {/* TABLE BODY */}
                <div style={{maxHeight:'600px', overflowY:'auto'}}>
                    {filteredList.map((s) => (
                        <div key={s.mobile} style={{display:'grid', gridTemplateColumns:'200px 100px 80px 120px 50px 50px 50px 50px 50px 50px 50px 50px', borderBottom:'1px solid #f1f5f9', alignItems:'center', ':hover':{background:'#f8fafc'}}}>
                            
                            {/* Basic Info */}
                            <div style={tdStyle}>
                                <div style={{fontWeight:'600', color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={s.name}>{s.name}</div>
                            </div>
                            <div style={tdStyle}>{s.mobile}</div>
                            <div style={tdStyle}>
                                <span style={{
                                    padding:'1px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold',
                                    background: String(s.gender).toLowerCase().startsWith('m') ? '#e0f2fe' : '#fce7f3',
                                    color: String(s.gender).toLowerCase().startsWith('m') ? '#0284c7' : '#db2777'
                                }}>{String(s.gender).charAt(0)}</span>
                                <span style={{marginLeft:'5px', color:'#64748b'}}>{s.age}</span>
                            </div>
                            <div style={{...tdStyle, color:'#475569'}} title={s.city}>{s.city}</div>

                            {/* EXACT COLUMNS (0 is shown as 0) */}
                            {COURSE_COLS.map(col => (
                                <div key={col} style={{...tdStyle, textAlign:'center', fontWeight:'600', color: s.history[col] > 0 ? '#0f172a' : '#e2e8f0'}}>
                                    {s.history[col]}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// STYLES
const thStyle = { padding:'12px 10px', fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', borderRight:'1px solid #f1f5f9' };
const tdStyle = { padding:'10px', fontSize:'12px', borderRight:'1px solid #f8fafc' };
