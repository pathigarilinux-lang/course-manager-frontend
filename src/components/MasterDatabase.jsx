import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart, MapPin, Users, Award, FileText, ChevronDown, ChevronUp 
} from 'lucide-react';
import * as XLSX from 'xlsx'; // ✅ Using the built-in xlsx library
import { styles } from '../config';

// --- CONFIG ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 1;

// --- INDEXED DB HELPER (Unchanged) ---
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

// --- PARSING HELPER ---
const parseCourseString = (str) => {
    if (!str) return { sat: 0, served: 0 };
    const s = str.match(/S:\s*(\d+)/);
    const seva = str.match(/Seva:\s*(\d+)/);
    return {
        sat: s ? parseInt(s[1]) : 0,
        served: seva ? parseInt(seva[1]) : 0
    };
};

export default function MasterDatabase() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, old: 0, new: 0, male: 0, female: 0, cities: {} });
    const [showUpload, setShowUpload] = useState(false);

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

    // ✅ UPDATED: EXCEL FILE HANDLER
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        setIsLoading(true);

        for (const file of files) {
            const data = await file.arrayBuffer();
            // 1. Read the Excel File
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 2. Get the First Sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 3. Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // 4. Process Rows
            const cleanData = jsonData.map(row => {
                // Key Mapping based on your Excel Headers
                const mobile = (row['PhoneMobile'] || row['PhoneHome'] || '').toString().replace(/\D/g, '');
                
                // Skip if no valid mobile (Primary Key)
                if (!mobile || mobile.length < 5) return null;

                const history = parseCourseString(row['Courses']);

                return {
                    mobile: mobile,
                    name: row['Name'],
                    gender: row['Gender'],
                    age: row['Age'],
                    city: row['City'],
                    state: row['State'],
                    email: row['Email'],
                    occupation: row['Occupation'],
                    courses_raw: row['Courses'],
                    sat_count: history.sat,
                    served_count: history.served,
                    last_course_conf: row['Conf No'],
                    last_update: new Date().toISOString()
                };
            }).filter(Boolean); // Remove nulls

            // 5. Save to DB
            if (cleanData.length > 0) {
                await dbHelper.addBulk(cleanData);
            }
        }
        
        await refreshData();
        setIsLoading(false);
        setShowUpload(false);
    };

    // Stats Calculation
    const calculateStats = (data) => {
        const s = { total: data.length, old: 0, new: 0, male: 0, female: 0, cities: {} };
        data.forEach(p => {
            if (p.sat_count > 0 || String(p.last_course_conf).startsWith('O')) s.old++;
            else s.new++;
            if (String(p.gender).toLowerCase().startsWith('m')) s.male++;
            else s.female++;
            const city = (p.city || 'Unknown').trim();
            s.cities[city] = (s.cities[city] || 0) + 1;
        });
        setStats(s);
    };

    // Filtering
    const filteredList = useMemo(() => {
        if (!searchTerm) return students.slice(0, 100);
        const lower = searchTerm.toLowerCase();
        return students.filter(s => 
            String(s.name).toLowerCase().includes(lower) || 
            String(s.mobile).includes(lower) ||
            String(s.city).toLowerCase().includes(lower)
        ).slice(0, 100);
    }, [students, searchTerm]);

    const topCities = Object.entries(stats.cities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Student Database
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        Historical Archive (IndexedDB) • {stats.total.toLocaleString()} Unique Records
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => dbHelper.clear().then(refreshData)} style={{...styles.btn(false), color:'#ef4444', borderColor:'#ef4444'}}>
                        <Trash2 size={16}/> Clear DB
                    </button>
                    <button onClick={() => setShowUpload(!showUpload)} style={{...styles.btn(true), background:'#10b981', borderColor:'#10b981'}}>
                        <Upload size={16}/> Import Excel
                    </button>
                </div>
            </div>

            {/* UPLOAD AREA */}
            {showUpload && (
                <div style={{background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:'12px', padding:'30px', textAlign:'center', marginBottom:'25px'}}>
                    <FileText size={40} color="#15803d" style={{marginBottom:'10px'}}/>
                    <h3 style={{margin:0, color:'#14532d'}}>Upload Excel Files (.xlsx)</h3>
                    <p style={{fontSize:'13px', color:'#166534', marginBottom:'20px'}}>
                        Select course completion files. The system will auto-merge duplicates based on Mobile No.
                    </p>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        multiple 
                        onChange={handleFileUpload}
                        style={{display:'block', margin:'0 auto', color:'#15803d'}}
                    />
                </div>
            )}

            {/* ANALYTICS DASHBOARD */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'30px'}}>
                <div style={cardStyle}>
                    <div style={labelStyle}>TOTAL STUDENTS</div>
                    <div style={numStyle}>{stats.total.toLocaleString()}</div>
                    <div style={subStyle}>Unique Individuals</div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>OLD vs NEW</div>
                    <div style={numStyle}>{stats.old.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>/ {stats.new.toLocaleString()}</span></div>
                    <div style={subStyle}>Based on History</div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>GENDER RATIO</div>
                    <div style={numStyle}>{stats.male.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>M</span> • {stats.female.toLocaleString()} <span style={{fontSize:'14px', color:'#94a3b8'}}>F</span></div>
                    <div style={subStyle}>Demographics</div>
                </div>
                <div style={cardStyle}>
                    <div style={labelStyle}>TOP CITY</div>
                    <div style={numStyle}>{topCities[0]?.[0] || '-'}</div>
                    <div style={subStyle}>{topCities[0]?.[1]} Students</div>
                </div>
            </div>

            {/* MAIN DATA TABLE */}
            <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', overflow:'hidden'}}>
                
                {/* Search Bar */}
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

                {/* Table Header */}
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr', background:'#f8fafc', padding:'12px 20px', fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                    <div>Student Name</div>
                    <div>Mobile</div>
                    <div>Gender / Age</div>
                    <div>City</div>
                    <div>History</div>
                    <div>Last Course Info</div>
                </div>

                {/* Table Body (Virtual Scroll Simulated) */}
                <div style={{maxHeight:'500px', overflowY:'auto'}}>
                    {isLoading ? <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Processing Database...</div> :
                     filteredList.length === 0 ? <div style={{padding:'40px', textAlign:'center', color:'#cbd5e1'}}>No records found. Import data to begin.</div> :
                     filteredList.map(s => (
                        <div key={s.mobile} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 2fr', padding:'15px 20px', borderBottom:'1px solid #f1f5f9', fontSize:'13px', alignItems:'center', ':hover':{background:'#f8fafc'}}}>
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
                            <div style={{display:'flex', gap:'5px'}}>
                                {s.sat_count > 0 && <span title="Courses Sat" style={{background:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold'}}>S:{s.sat_count}</span>}
                                {s.served_count > 0 && <span title="Courses Served" style={{background:'#f3e8ff', color:'#7e22ce', padding:'2px 6px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold'}}>Seva:{s.served_count}</span>}
                            </div>
                            <div style={{fontSize:'11px', color:'#94a3b8'}}>
                                {s.courses_raw ? s.courses_raw.substring(0, 30) + '...' : '-'}
                            </div>
                        </div>
                    ))}
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
