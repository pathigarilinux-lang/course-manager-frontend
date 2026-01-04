import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart as PieIcon, BarChart3, List, FileText, ChevronDown, 
    ChevronUp, ArrowUpDown, Table, MapPin 
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
const VERSION = 6; // Incremented for schema stability

// 1. COURSE COLUMNS
const COURSE_COLS = ['60D', '45D', '30D', '20D', '10D', 'STP', 'SPL', 'TSC'];

// 2. FIXED COLUMNS (Sticky Left)
const FIXED_COLS = [
    { key: 'name', label: 'Student Name', width: 220, left: 0 },
    { key: 'gender', label: 'Gender', width: 70, left: 220 },
    { key: 'age', label: 'Age', width: 60, left: 290 },
    { key: 'mobile', label: 'Mobile', width: 110, left: 350 },
];

// 3. DEMOGRAPHIC COLUMNS
const OTHER_COLS = [
    { key: 'language', label: 'Language', width: 100 },
    { key: 'city', label: 'City', width: 120 },
    { key: 'state', label: 'State', width: 120 },
    { key: 'country', label: 'Country', width: 100 },
    { key: 'pin', label: 'Pin Code', width: 80 },
    { key: 'email', label: 'Email', width: 200 },
    { key: 'phone_home', label: 'Phone (Home)', width: 120 },
    { key: 'education', label: 'Education', width: 150 },
    { key: 'occupation', label: 'Occupation', width: 150 },
    { key: 'company', label: 'Company', width: 150 },
];

// Combine for Export Order
const ALL_EXPORT_COLS = [...FIXED_COLS, ...COURSE_COLS.map(c => ({ key: c, label: c })), ...OTHER_COLS];

// --- DB HELPER ---
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

// --- UTILS ---
const cleanString = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Smart Finder: Looks for a value in row using multiple possible key names (case-insensitive)
const findValue = (row, possibleKeys) => {
    const rowKeys = Object.keys(row);
    for (const target of possibleKeys) {
        // Exact match check
        if (row[target]) return row[target];
        // Case-insensitive check
        const foundKey = rowKeys.find(k => k.toLowerCase().trim() === target.toLowerCase());
        if (foundKey && row[foundKey]) return row[foundKey];
    }
    return '';
};

export default function MasterDatabase() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    const [courseFilter, setCourseFilter] = useState('All');
    
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [graphData, setGraphData] = useState({ courseDist: [], genderDist: [], ageDist: [], cityDist: [], stateDist: [], pinDist: [] });

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

    const prepareGraphData = (data) => {
        // 1. Courses
        const courses = COURSE_COLS.map(col => ({
            name: col,
            students: data.filter(s => (s.history?.[col] || 0) > 0).length
        }));
        
        // 2. Demographics
        const male = data.filter(s => String(s.gender).toLowerCase().startsWith('m')).length;
        const female = data.filter(s => String(s.gender).toLowerCase().startsWith('f')).length;
        
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

        // 3. Geography Helper
        const getTopK = (key, k=10) => {
            const counts = {};
            data.forEach(s => {
                const val = (s[key] || 'Unknown').trim();
                if(val && val.toLowerCase() !== 'unknown') counts[val] = (counts[val] || 0) + 1;
            });
            return Object.entries(counts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, k);
        };

        setGraphData({
            courseDist: courses,
            genderDist: [{ name: 'Male', value: male }, { name: 'Female', value: female }],
            ageDist: Object.keys(buckets).map(k => ({ name: k, count: buckets[k] })),
            cityDist: getTopK('city', 10),
            stateDist: getTopK('state', 10),
            pinDist: getTopK('pin', 10)
        });
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
            // Fuzzy Finders for Keys
            const mobileRaw = findValue(mainRow, ['PhoneMobile', 'PhoneHome', 'Mobile', 'Cell']);
            const mobile = mobileRaw.toString().replace(/\D/g, '');
            if (!mobile || mobile.length < 5) return null;

            let student = {
                mobile: mobile,
                name: findValue(mainRow, ['Name', 'Student Name', 'Student']),
                gender: findValue(mainRow, ['Gender', 'Sex']),
                age: findValue(mainRow, ['Age']),
                
                // Detailed Fields (Using Fuzzy Finder)
                phone_home: findValue(mainRow, ['PhoneHome', 'Home Phone']),
                email: findValue(mainRow, ['Email', 'E-mail']),
                language: findValue(mainRow, ['Language', 'Mother Tongue']),
                city: findValue(mainRow, ['City', 'District']),
                state: findValue(mainRow, ['State', 'Province']),
                country: findValue(mainRow, ['Country']),
                pin: findValue(mainRow, ['Pin', 'Pin Code', 'Pincode', 'Zip']),
                education: findValue(mainRow, ['Education', 'Qualification']),
                occupation: findValue(mainRow, ['Occupation', 'Profession']),
                company: findValue(mainRow, ['Company', 'Organization']),
                
                accommodation: findValue(mainRow, ['Accommodation', 'Room', 'RoomNo']),
                last_course_conf: findValue(mainRow, ['Conf No', 'ConfNo']),
                last_update: new Date().toISOString(),
                history: {} 
            };

            COURSE_COLS.forEach(col => student.history[col] = 0);

            // Merge History
            const cleanName = cleanString(student.name);
            const cleanRoom = cleanString(student.accommodation).replace(/-/g, '').replace(/ /g, '');

            const teacherRow = teacherList.find(tRow => {
                const tName = cleanString(findValue(tRow, ['Student', 'Name']));
                const tRoom = cleanString(findValue(tRow, ['RoomNo', 'Room'])).replace(/-/g, '').replace(/ /g, '');
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

    // --- SORT ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const processedList = useMemo(() => {
        let list = [...students];

        if (courseFilter !== 'All') list = list.filter(s => (s.history?.[courseFilter] || 0) > 0);
        
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s => 
                String(s.name).toLowerCase().includes(lower) || 
                String(s.mobile).includes(lower) ||
                String(s.city).toLowerCase().includes(lower) ||
                String(s.email).toLowerCase().includes(lower)
            );
        }

        list.sort((a, b) => {
            let valA, valB;
            if (COURSE_COLS.includes(sortConfig.key)) {
                valA = a.history?.[sortConfig.key] || 0;
                valB = b.history?.[sortConfig.key] || 0;
            } else {
                valA = a[sortConfig.key] || '';
                valB = b[sortConfig.key] || '';
            }
            if (typeof valA === 'string') {
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        return list;
    }, [students, searchTerm, courseFilter, sortConfig]);

    // --- EXPORT ---
    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        const formatRow = (s) => {
            const row = {};
            FIXED_COLS.forEach(col => row[col.label] = s[col.key]);
            COURSE_COLS.forEach(col => row[col] = s.history?.[col] || 0);
            OTHER_COLS.forEach(col => row[col.label] = s[col.key]);
            return row;
        };

        const masterData = students.map(formatRow);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterData), "All Students");

        COURSE_COLS.forEach(course => {
            const filtered = students.filter(s => (s.history?.[course] || 0) > 0);
            if (filtered.length > 0) {
                const sheetData = filtered.map(formatRow);
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), `${course}`);
            }
        });

        XLSX.writeFile(wb, `Dhamma_Master_DB_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Database
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        {students.length.toLocaleString()} Total Records
                    </div>
                </div>
                
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'#e2e8f0', padding:'4px', borderRadius:'8px', display:'flex', gap:'5px'}}>
                        <button onClick={() => setViewMode('list')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? '#1e293b' : '#64748b', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}>
                            <List size={16}/> List
                        </button>
                        <button onClick={() => setViewMode('analytics')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'600', display:'flex', alignItems:'center', gap:'6px', background: viewMode === 'analytics' ? 'white' : 'transparent', color: viewMode === 'analytics' ? '#1e293b' : '#64748b', boxShadow: viewMode === 'analytics' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'}}>
                            <BarChart3 size={16}/> Stats
                        </button>
                    </div>

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
                        Select both files. The system will merge profile data with history columns.
                    </p>
                    <input type="file" accept=".xlsx, .xls" multiple onChange={handleFileUpload} style={{display:'block', margin:'0 auto', color:'#15803d'}}/>
                    {isLoading && <div style={{marginTop:'15px', fontWeight:'bold', color:'#0d9488'}}>{mergeStatus}</div>}
                </div>
            )}

            {/* --- ANALYTICS VIEW --- */}
            {viewMode === 'analytics' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', marginBottom:'40px', animation:'fadeIn 0.4s'}}>
                    
                    {/* CHART: CITY */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}><MapPin size={16} style={{marginRight:'5px'}}/> Top Cities</h3>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.cityDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{fontSize:'11px'}} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                     {/* CHART: STATE */}
                     <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>State Distribution</h3>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.stateDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" style={{fontSize:'10px'}} interval={0} angle={-30} textAnchor="end" height={60} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART: PIN CODE */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>Top PIN Codes</h3>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.pinDist} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} style={{fontSize:'11px'}} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART: COURSE */}
                    <div style={chartCardStyle}>
                        <h3 style={chartTitleStyle}>Course Portfolio</h3>
                        <div style={{height:'300px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={graphData.courseDist}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', overflow:'hidden'}}>
                    
                    {/* TOOLBAR */}
                    <div style={{padding:'15px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:'15px', alignItems:'center', background:'#f8fafc', flexWrap:'wrap'}}>
                        <div style={{position:'relative', width:'250px'}}>
                            <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#94a3b8'}}/>
                            <input 
                                style={{...styles.input, paddingLeft:'35px', width:'100%', border:'1px solid #e2e8f0'}}
                                placeholder="Search Name, Email, City..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <Filter size={16} color="#64748b"/>
                            <select 
                                value={courseFilter} 
                                onChange={e => setCourseFilter(e.target.value)}
                                style={{padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'13px', fontWeight:'600'}}
                            >
                                <option value="All">All Courses</option>
                                {COURSE_COLS.map(c => <option key={c} value={c}>Has done {c}</option>)}
                            </select>
                        </div>

                        <button 
                            onClick={handleExport}
                            style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px', background:'#0f172a', color:'white', border:'none', padding:'8px 16px', borderRadius:'6px', fontWeight:'600', cursor:'pointer'}}
                        >
                            <Download size={16}/> Export Master File
                        </button>
                    </div>

                    {/* TABLE CONTAINER */}
                    <div style={{overflowX:'auto', maxHeight:'650px', position:'relative'}}>
                        <table style={{width:'max-content', borderCollapse:'separate', borderSpacing:0, fontSize:'12px'}}>
                            <thead style={{background:'#f1f5f9', position:'sticky', top:0, zIndex:30}}>
                                <tr>
                                    {/* FIXED COLUMNS HEADERS */}
                                    {FIXED_COLS.map(col => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            style={{
                                                ...thStyle, width: col.width, minWidth: col.width, maxWidth: col.width,
                                                position: 'sticky', left: col.left, zIndex: 35,
                                                background: '#f1f5f9', borderRight:'1px solid #cbd5e1',
                                                cursor:'pointer'
                                            }}
                                        >
                                            <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                {col.label}
                                                {sortConfig.key === col.key && <ArrowUpDown size={12} color={sortConfig.direction === 'asc' ? '#3b82f6' : '#ec4899'}/>}
                                            </div>
                                        </th>
                                    ))}

                                    {/* COURSE COLUMNS HEADERS */}
                                    {COURSE_COLS.map(col => (
                                        <th 
                                            key={col} 
                                            onClick={() => handleSort(col)}
                                            style={{...thStyle, width: 50, minWidth: 50, textAlign:'center', color:'#2563eb', cursor:'pointer'}}
                                        >
                                            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'2px'}}>
                                                {col}
                                                {sortConfig.key === col && <ArrowUpDown size={10}/>}
                                            </div>
                                        </th>
                                    ))}

                                    {/* OTHER COLUMNS HEADERS */}
                                    {OTHER_COLS.map(col => (
                                        <th 
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            style={{...thStyle, width: col.width, minWidth: col.width, cursor:'pointer'}}
                                        >
                                            <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                {col.label}
                                                {sortConfig.key === col.key && <ArrowUpDown size={12}/>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {processedList.map((s, idx) => (
                                    <tr key={s.mobile} style={{background: idx%2===0 ? 'white' : '#fafafa'}}>
                                        
                                        {/* FIXED COLUMNS DATA */}
                                        {FIXED_COLS.map(col => (
                                            <td key={col.key} style={{
                                                ...tdStyle, 
                                                position: 'sticky', left: col.left, zIndex: 20,
                                                background: idx%2===0 ? 'white' : '#fafafa',
                                                borderRight: '1px solid #cbd5e1',
                                                fontWeight: col.key === 'name' ? '600' : '400',
                                                color: col.key === 'name' ? '#1e293b' : 'inherit'
                                            }}>
                                                <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width: col.width}} title={s[col.key]}>
                                                    {s[col.key]}
                                                </div>
                                            </td>
                                        ))}

                                        {/* COURSE DATA */}
                                        {COURSE_COLS.map(col => (
                                            <td key={col} style={{...tdStyle, textAlign:'center', fontWeight:'700', color: s.history[col] > 0 ? '#0f172a' : '#e2e8f0'}}>
                                                {s.history[col]}
                                            </td>
                                        ))}

                                        {/* OTHER DATA */}
                                        {OTHER_COLS.map(col => (
                                            <td key={col.key} style={tdStyle}>
                                                <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: col.width}} title={s[col.key]}>
                                                    {s[col.key]}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {processedList.length === 0 && <div style={{padding:'30px', textAlign:'center', color:'#94a3b8', position:'sticky', left:0}}>No records found</div>}
                    </div>
                    
                    <div style={{padding:'10px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', fontSize:'12px', color:'#64748b', fontWeight:'600'}}>
                        Showing {processedList.length} records
                    </div>
                </div>
            )}
        </div>
    );
}

// STYLES
const thStyle = { padding:'12px 10px', fontSize:'11px', fontWeight:'700', color:'#475569', textTransform:'uppercase', borderRight:'1px solid #e2e8f0', borderBottom:'2px solid #cbd5e1', textAlign:'left' };
const tdStyle = { padding:'8px 10px', fontSize:'12px', borderRight:'1px solid #f1f5f9', color:'#334155', borderBottom:'1px solid #f1f5f9' };
const chartCardStyle = { background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' };
const chartTitleStyle = { margin:'0 0 5px 0', fontSize:'16px', fontWeight:'700', color:'#1e293b', display:'flex', alignItems:'center' };
