import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart as PieIcon, BarChart3, List, FileText, ChevronDown 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import { styles } from '../config';

// --- CONFIG ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 3; 
const COURSE_COLS = ['10D', 'STP', 'SPL', 'TSC', '20D', '30D', '45D', '60D'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- INDEXED DB HELPER ---
const dbHelper = {
    open: () => new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'mobile' });
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
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'analytics'
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    const [courseFilter, setCourseFilter] = useState('All');

    // Stats for Graphs
    const [graphData, setGraphData] = useState({ courseDist: [], genderDist: [], ageDist: [], cityDist: [] });

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await dbHelper.getAll();
            setStudents(data);
            prepareGraphData(data);
        } catch (e) { console.error("DB Error", e); }
        finally { setIsLoading(false); }
    };

    // --- DATA PREP FOR GRAPHS ---
    const prepareGraphData = (data) => {
        // 1. Course Distribution (How many people have done at least 1 of each course)
        const courses = COURSE_COLS.map(col => {
            return {
                name: col,
                students: data.filter(s => (s.history?.[col] || 0) > 0).length
            };
        });

        // 2. Gender
        const male = data.filter(s => String(s.gender).toLowerCase().startsWith('m')).length;
        const female = data.filter(s => String(s.gender).toLowerCase().startsWith('f')).length;
        const gender = [
            { name: 'Male', value: male },
            { name: 'Female', value: female }
        ];

        // 3. Age Groups
        const buckets = { 'Under 20':0, '20-29':0, '30-39':0, '40-49':0, '50-59':0, '60+':0 };
        data.forEach(s => {
            const age = parseInt(s.age) || 0;
            if (age < 20) buckets['Under 20']++;
            else if (age < 30) buckets['20-29']++;
            else if (age < 40) buckets['30-39']++;
            else if (age < 50) buckets['40-49']++;
            else if (age < 60) buckets['50-59']++;
            else buckets['60+']++;
        });
        const ageDist = Object.keys(buckets).map(k => ({ name: k, count: buckets[k] }));

        setGraphData({ courseDist: courses, genderDist: gender, ageDist: ageDist });
    };

    // --- UPLOAD HANDLER ---
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
            
            if (firstRow['10D'] !== undefined || firstRow['STP'] !== undefined) {
                teacherList = teacherList.concat(jsonData);
            } else {
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
                history: {} 
            };

            COURSE_COLS.forEach(col => student.history[col] = 0);

            const cleanName = cleanString(student.name);
            const cleanRoom = cleanString(student.accommodation).replace(/-/g, '').replace(/ /g, '');

            const teacherRow = teacherList.find(tRow => {
                const tName = cleanString(tRow['Student']);
                const tRoom = cleanString(tRow['RoomNo']).replace(/-/g, '').replace(/ /g, '');
                return tName === cleanName || (tRoom && tRoom === cleanRoom && tRoom.length > 3);
            });

            if (teacherRow) {
                COURSE_COLS.forEach(col => {
                    const val = teacherRow[col];
                    student.history[col] = val ? parseInt(val) : 0;
                });
            }

            return student;
        }).filter(Boolean);

        if (finalData.length > 0) {
            await dbHelper.addBulk(finalData);
            setMergeStatus(`✅ Success! Merged ${finalData.length} records.`);
        } else {
            setMergeStatus("⚠️ No matching data found or invalid files.");
        }
        
        await refreshData();
        setIsLoading(false);
        setTimeout(() => setShowUpload(false), 3000);
    };

    // --- FILTER ENGINE ---
    const filteredList = useMemo(() => {
        let list = students;
        if (courseFilter !== 'All') {
            list = list.filter(s => (s.history?.[courseFilter] || 0) > 0);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s => 
                String(s.name).toLowerCase().includes(lower) || 
                String(s.mobile).includes(lower) ||
                String(s.city).toLowerCase().includes(lower)
            );
        }
        return list.slice(0, 100);
    }, [students, searchTerm, courseFilter]);

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* TOP HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Database
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        {students.length.toLocaleString()} Total Records
                    </div>
                </div>
                
                {/* VIEW TOGGLE */}
                <div style={{background:'#e2e8f0', padding:'4px', borderRadius:'8px', display:'flex', gap:'5px'}}>
                    <button 
                        onClick={() => setViewMode('list')}
                        style={{
                            padding:'8px 15px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px',
                            background: viewMode === 'list' ? 'white' : 'transparent',
                            color: viewMode === 'list' ? '#1e293b' : '#64748b',
                            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <List size={16}/> Data List
                    </button>
                    <button 
                        onClick={() => setViewMode('analytics')}
                        style={{
                            padding:'8px 15px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px',
                            background: viewMode === 'analytics' ? 'white' : 'transparent',
                            color: viewMode === 'analytics' ? '#1e293b' : '#64748b',
                            boxShadow: viewMode === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <BarChart3 size={16}/> Analytics
                    </button>
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => dbHelper.clear().then(refreshData)} style={{...styles.btn(false), color:'#ef4444', borderColor:'#ef4444'}}>
                        <Trash2 size={16}/> Clear
                    </button>
                    <button onClick={() => setShowUpload(!showUpload)} style={{...styles.btn(true), background:'#10b981', borderColor:'#10b981'}}>
                        <Upload size={16}/> Import
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

            {/* --- ANALYTICS VIEW --- */}
            {viewMode === 'analytics' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', marginBottom:'40px', animation:'fadeIn 0.4s'}}>
                    
                    {/* CHART 1: COURSE PORTFOLIO */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>Student Course Portfolio</h3>
                        <p style={{fontSize:'12px', color:'#64748b', marginBottom:'15px'}}>Number of students who have completed at least one:</p>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.courseDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART 2: AGE DISTRIBUTION */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>Age Distribution</h3>
                        <p style={{fontSize:'12px', color:'#64748b', marginBottom:'15px'}}>Breakdown by age groups</p>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.ageDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART 3: GENDER */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>Gender Ratio</h3>
                        <div style={{height:'250px', display:'flex', justifyContent:'center'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={graphData.genderDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {graphData.genderDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#3b82f6' : '#ec4899'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{textAlign:'center', marginTop:'10px', fontSize:'13px', fontWeight:'600'}}>
                            <span style={{color:'#3b82f6'}}>Male: {graphData.genderDist[0]?.value}</span> • 
                            <span style={{color:'#ec4899', marginLeft:'10px'}}>Female: {graphData.genderDist[1]?.value}</span>
                        </div>
                    </div>

                     {/* SUMMARY CARD */}
                     <div style={{...chartCardStyle, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                        <div style={{fontSize:'48px', fontWeight:'800', color:'#1e293b'}}>{students.length.toLocaleString()}</div>
                        <div style={{fontSize:'14px', color:'#64748b', fontWeight:'600'}}>Total Students Database</div>
                        <div style={{marginTop:'20px', padding:'10px 20px', background:'#f1f5f9', borderRadius:'20px', fontSize:'12px', color:'#475569'}}>
                            Last Data Update: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
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
            )}
        </div>
    );
}

// STYLES
const thStyle = { padding:'12px 10px', fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', borderRight:'1px solid #f1f5f9' };
const tdStyle = { padding:'10px', fontSize:'12px', borderRight:'1px solid #f8fafc' };
const chartCardStyle = { background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' };
const chartTitleStyle = { margin:'0 0 5px 0', fontSize:'16px', fontWeight:'700', color:'#1e293b' };
