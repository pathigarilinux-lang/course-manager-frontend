import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart as PieIcon, BarChart3, List, FileText, ChevronDown, 
    ChevronUp, ArrowUpDown, Table, MapPin, Hash, Globe, Flag, XCircle, 
    User, Shield, Lock, Save, GitMerge, AlertCircle, CheckCircle 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import { styles } from '../config';

// --- CONFIGURATION ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 10; // Version 10 for Duplicate Feature Support

// 1. COURSE COLUMNS
const COURSE_COLS = ['60D', '45D', '30D', '20D', '10D', 'STP', 'SPL', 'TSC'];

// 2. FIXED COLUMNS (Sticky Left)
const FIXED_COLS = [
    { key: 'sno', label: 'S.No', width: 50, left: 0 },
    { key: 'name', label: 'Student Name', width: 220, left: 50 },
    { key: 'gender', label: 'Gender', width: 70, left: 270 },
    { key: 'age', label: 'Age', width: 60, left: 340 },
    { key: 'mobile', label: 'Mobile', width: 110, left: 400 },
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

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', 
    '#6366f1', '#14b8a6', '#f97316', '#d946ef', '#06b6d4', '#84cc16'
];

// --- DATABASE HELPER (IndexedDB) ---
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
    deleteBulk: async (keys) => {
        const db = await dbHelper.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            keys.forEach(k => store.delete(k));
            tx.oncomplete = () => resolve();
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

// --- UTILITIES ---
const cleanString = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

const toTitleCase = (str) => {
    if (!str) return '';
    return String(str).toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const findValue = (row, possibleKeys) => {
    if (!row) return '';
    const rowKeys = Object.keys(row);
    for (const target of possibleKeys) {
        if (row[target] !== undefined) return row[target];
        const match = rowKeys.find(k => k.toLowerCase().trim() === target.toLowerCase().trim());
        if (match && row[match] !== undefined) return row[match];
    }
    return '';
};

// ---------------------------------------------------------
//  MAIN COMPONENT
// ---------------------------------------------------------
export default function MasterDatabase({ user }) {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    
    // DUPLICATE RESOLUTION STATES
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState([]);

    // FILTERS & OPTIONS
    const [filters, setFilters] = useState({ 
        search: '', course: 'All', gender: 'All', city: 'All', state: 'All', country: 'All' 
    });
    const [options, setOptions] = useState({ cities: [], states: [], countries: [] });
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    
    // CHART DATA
    const [graphData, setGraphData] = useState({ 
        courseDist: [], genderDist: [], ageDist: [], cityDist: [], stateDist: [], pinDist: [], countryDist: [] 
    });

    // SECURITY CHECK
    const canDelete = user && user.role === 'admin'; 
    const userLabel = user ? `${user.username.charAt(0).toUpperCase() + user.username.slice(1)}` : 'Guest';
    const roleLabel = user ? (user.role === 'admin' ? 'Administrator' : 'AT (Master Data)') : 'Viewer';

    // --- INITIAL DATA LOAD ---
    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await dbHelper.getAll();
            setStudents(data);
            prepareFilterOptions(data);
            prepareGraphData(data); // Initial stats on full data
        } catch (e) { console.error("DB Error", e); }
        finally { setIsLoading(false); }
    };

    // --- 🕵️‍♂️ DUPLICATE SCANNER ENGINE ---
    const scanForDuplicates = () => {
        setIsLoading(true);
        const nameGroups = {};
        
        // 1. Group by Name
        students.forEach(s => {
            const key = cleanString(s.name);
            if (!nameGroups[key]) nameGroups[key] = [];
            nameGroups[key].push(s);
        });

        // 2. Filter Groups
        const groups = Object.values(nameGroups).filter(group => {
            if (group.length < 2) return false;
            // Ensure same gender to avoid false positives
            const genders = new Set(group.map(s => String(s.gender).toLowerCase().charAt(0)));
            return genders.size === 1;
        });

        setDuplicateGroups(groups);
        setShowDuplicates(true);
        setIsLoading(false);
    };

    const handleMergeGroup = async (group) => {
        // 1. Identify Master (Latest update is best)
        const sorted = [...group].sort((a, b) => new Date(b.last_update || 0) - new Date(a.last_update || 0));
        const master = { ...sorted[0] }; 
        const duplicates = sorted.slice(1);

        // 2. Merge Logic
        duplicates.forEach(dup => {
            COURSE_COLS.forEach(c => {
                master.history[c] = (master.history[c] || 0) + (dup.history[c] || 0);
            });
            // Fill gaps in master record
            Object.keys(master).forEach(key => {
                if (!master[key] && dup[key]) master[key] = dup[key];
            });
        });

        // 3. Save & Delete
        await dbHelper.addBulk([master]);
        await dbHelper.deleteBulk(duplicates.map(d => d.mobile));

        // 4. Update UI
        const remaining = duplicateGroups.filter(g => g !== group);
        setDuplicateGroups(remaining);
        if (remaining.length === 0) {
            setShowDuplicates(false);
            await refreshData();
        }
    };

    // --- DATA PROCESSING HELPER ---
    const prepareFilterOptions = (data) => {
        const getUnique = (key) => [...new Set(data.map(s => s[key]).filter(Boolean).map(s => s.trim()))].sort();
        setOptions({
            cities: getUnique('city'),
            states: getUnique('state'),
            countries: getUnique('country')
        });
    };

    // --- MAIN ENGINE: FILTER & SORT ---
    const processedList = useMemo(() => {
        let list = [...students];

        if (filters.course !== 'All') list = list.filter(s => (s.history?.[filters.course] || 0) > 0);
        if (filters.gender !== 'All') {
            const char = filters.gender.charAt(0).toLowerCase();
            list = list.filter(s => String(s.gender).toLowerCase().startsWith(char));
        }
        if (filters.city !== 'All') list = list.filter(s => s.city === filters.city);
        if (filters.state !== 'All') list = list.filter(s => s.state === filters.state);
        if (filters.country !== 'All') list = list.filter(s => s.country === filters.country);
        
        if (filters.search) {
            const lower = filters.search.toLowerCase();
            list = list.filter(s => 
                String(s.name).toLowerCase().includes(lower) || 
                String(s.mobile).includes(lower) ||
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
            if (typeof valA === 'string') return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });
        return list;
    }, [students, filters, sortConfig]);

    // Update charts when filters change
    useEffect(() => { prepareGraphData(processedList); }, [processedList]);

    const prepareGraphData = (data) => {
        const courses = COURSE_COLS.map(col => ({
            name: col,
            students: data.filter(s => (s.history?.[col] || 0) > 0).length
        }));
        
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

        const getTopK = (key, k=10) => {
            const counts = {};
            data.forEach(s => {
                const rawVal = s[key];
                if (rawVal === undefined || rawVal === null) return;
                const val = String(rawVal).trim();
                if(val && val.toLowerCase() !== 'unknown') {
                    const norm = toTitleCase(val); 
                    counts[norm] = (counts[norm] || 0) + 1;
                }
            });
            return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, k);
        };

        setGraphData({
            courseDist: courses,
            genderDist: [{ name: 'Male', value: male }, { name: 'Female', value: female }],
            ageDist: Object.keys(buckets).map(k => ({ name: k, count: buckets[k] })),
            cityDist: getTopK('city', 10),
            stateDist: getTopK('state', 10),
            pinDist: getTopK('pin', 10),
            countryDist: getTopK('country', 10)
        });
    };

    // --- FILE UPLOAD LOGIC ---
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
                if (rowStr.includes('10d') || rowStr.includes('stp')) { headerRowIndex = i; break; }
                if (rowStr.includes('name') && (rowStr.includes('mobile') || rowStr.includes('gender'))) { headerRowIndex = i; break; }
            }

            const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
            const firstRow = jsonData[0] || {};
            
            if (findValue(firstRow, ['10D', 'STP']) !== '') teacherList = teacherList.concat(jsonData);
            else attendedList = attendedList.concat(jsonData);
        }

        setMergeStatus(`Merging ${attendedList.length} students with ${teacherList.length} history records...`);

        const finalData = attendedList.map(mainRow => {
            const mobileRaw = findValue(mainRow, ['PhoneMobile', 'PhoneHome', 'Mobile', 'Cell', 'Phone']);
            const mobile = mobileRaw.toString().replace(/\D/g, '');
            if (!mobile || mobile.length < 5) return null;

            let student = {
                mobile: mobile,
                name: toTitleCase(findValue(mainRow, ['Name', 'Student Name', 'Student'])),
                gender: toTitleCase(findValue(mainRow, ['Gender', 'Sex'])),
                age: findValue(mainRow, ['Age']),
                phone_home: String(findValue(mainRow, ['PhoneHome', 'Home Phone'])),
                email: String(findValue(mainRow, ['Email', 'E-mail', 'Mail'])),
                language: toTitleCase(findValue(mainRow, ['Language', 'Languages', 'Mother Tongue'])),
                city: toTitleCase(findValue(mainRow, ['City', 'District', 'Town'])),
                state: toTitleCase(findValue(mainRow, ['State', 'Province', 'Region'])),
                country: toTitleCase(findValue(mainRow, ['Country', 'Nation'])),
                pin: String(findValue(mainRow, ['Pin', 'Pin Code', 'Pincode', 'Zip', 'Postal Code'])),
                education: findValue(mainRow, ['Education', 'Qualification', 'Degree']),
                occupation: findValue(mainRow, ['Occupation', 'Profession']),
                company: findValue(mainRow, ['Company', 'Organization']),
                accommodation: findValue(mainRow, ['Accommodation', 'Room', 'RoomNo']),
                last_course_conf: findValue(mainRow, ['Conf No', 'ConfNo']),
                last_update: new Date().toISOString(),
                history: {} 
            };
            COURSE_COLS.forEach(col => student.history[col] = 0);
            
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

        if (finalData.length > 0) await dbHelper.addBulk(finalData);
        await refreshData();
        setIsLoading(false);
        setTimeout(() => setShowUpload(false), 3000);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // --- 🌍 EXPORT FUNCTIONS ---
    const handleMasterExport = () => {
        const wb = XLSX.utils.book_new();
        const formatRow = (s, index) => {
            const row = { 'S.No': index + 1 };
            FIXED_COLS.filter(c => c.key !== 'sno').forEach(col => row[col.label] = s[col.key]);
            COURSE_COLS.forEach(col => row[col] = s.history?.[col] || 0);
            OTHER_COLS.forEach(col => row[col.label] = s[col.key]);
            return row;
        };

        const masterData = students.map((s, i) => formatRow(s, i));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(masterData), "All Students");

        COURSE_COLS.forEach(course => {
            const filtered = students.filter(s => (s.history?.[course] || 0) > 0);
            if (filtered.length > 0) {
                const sheetData = filtered.map((s, i) => formatRow(s, i));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetData), `${course}`);
            }
        });
        XLSX.writeFile(wb, `Dhamma_Master_FULL_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const handleFilteredExport = () => {
        const wb = XLSX.utils.book_new();
        const formatRow = (s, index) => {
            const row = { 'S.No': index + 1 };
            FIXED_COLS.filter(c => c.key !== 'sno').forEach(col => row[col.label] = s[col.key]);
            COURSE_COLS.forEach(col => row[col] = s.history?.[col] || 0);
            OTHER_COLS.forEach(col => row[col.label] = s[col.key]);
            return row;
        };

        const currentData = processedList.map((s, i) => formatRow(s, i));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(currentData), "Filtered Results");
        
        XLSX.writeFile(wb, `Dhamma_Filtered_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const resetFilters = () => setFilters({ search: '', course: 'All', gender: 'All', city: 'All', state: 'All', country: 'All' });

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
                
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    
                    {/* DUPLICATE BUTTON */}
                    <button onClick={scanForDuplicates} style={{...styles.btn(false), background:'#fff7ed', color:'#c2410c', borderColor:'#fed7aa'}}>
                        <GitMerge size={16}/> Find Duplicates
                    </button>

                    <div style={{display:'flex', gap:'10px', alignItems:'center', paddingLeft:'15px', borderLeft:'1px solid #e2e8f0'}}>
                        {/* User Badge */}
                        <div style={{display:'flex', alignItems:'center', gap:'10px', background:'white', padding:'6px 12px', borderRadius:'30px', border:'1px solid #e2e8f0'}}>
                            <div style={{width:'36px', height:'36px', borderRadius:'50%', background: canDelete?'#fef2f2':'#f0f9ff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <User size={18} color={canDelete?'#ef4444':'#0ea5e9'}/>
                            </div>
                            <div><div style={{fontSize:'13px', fontWeight:'700', color:'#1e293b'}}>{userLabel}</div><div style={{fontSize:'11px', color:'#64748b'}}>{roleLabel}</div></div>
                        </div>

                        {/* View Toggle */}
                        <div style={{display:'flex', gap:'5px', background:'#e2e8f0', padding:'4px', borderRadius:'8px'}}>
                            <button onClick={()=>setViewMode('list')} style={{padding:'8px', borderRadius:'6px', border:'none', background: viewMode==='list'?'white':'transparent', cursor:'pointer'}}><List size={16}/></button>
                            <button onClick={()=>setViewMode('analytics')} style={{padding:'8px', borderRadius:'6px', border:'none', background: viewMode==='analytics'?'white':'transparent', cursor:'pointer'}}><BarChart3 size={16}/></button>
                        </div>

                        {/* Secure Delete */}
                        {canDelete && <button onClick={()=>{if(window.confirm('Delete ALL?')) dbHelper.clear().then(refreshData)}} style={{...styles.btn(false), color:'#ef4444'}}><Trash2 size={16}/></button>}
                        
                        {/* Master Export */}
                        <button onClick={handleMasterExport} style={{...styles.btn(false)}}><Save size={16}/></button>
                        
                        {/* Import */}
                        <button onClick={()=>setShowUpload(!showUpload)} style={{...styles.btn(true)}}><Upload size={16}/></button>
                    </div>
                </div>
            </div>

            {/* DUPLICATE RESOLVER UI */}
            {showDuplicates && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', justifyContent:'center', alignItems:'center', padding:'40px'}}>
                    <div style={{background:'white', width:'800px', maxHeight:'80vh', borderRadius:'16px', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 10px 40px rgba(0,0,0,0.25)'}}>
                        <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', background:'#fff7ed'}}>
                            <div>
                                <h3 style={{margin:0, color:'#c2410c', display:'flex', alignItems:'center', gap:'10px'}}><GitMerge size={20}/> Resolve Duplicates</h3>
                                <div style={{fontSize:'13px', color:'#ea580c', marginTop:'5px'}}>Found {duplicateGroups.length} groups of students with same name but different mobiles.</div>
                            </div>
                            <button onClick={()=>setShowDuplicates(false)} style={{background:'white', border:'1px solid #fdba74', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer', color:'#c2410c'}}><XCircle size={18}/></button>
                        </div>
                        <div style={{overflowY:'auto', padding:'20px', background:'#f8fafc', flex:1}}>
                            {duplicateGroups.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#64748b'}}>No duplicates found!</div> :
                             duplicateGroups.map((group, i) => (
                                <div key={i} style={{background:'white', borderRadius:'12px', padding:'20px', marginBottom:'20px', border:'1px solid #e2e8f0'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                                        <div style={{fontWeight:'700', fontSize:'16px', color:'#1e293b'}}>{group[0].name} <span style={{fontWeight:'400', color:'#64748b'}}>({group[0].gender})</span></div>
                                        <button onClick={()=>handleMergeGroup(group)} style={{background:'#22c55e', color:'white', border:'none', padding:'6px 15px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}>
                                            <GitMerge size={14}/> Merge {group.length} Records
                                        </button>
                                    </div>
                                    <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
                                        {group.map((s, idx) => (
                                            <div key={idx} style={{minWidth:'200px', padding:'10px', background:'#f1f5f9', borderRadius:'8px', fontSize:'12px'}}>
                                                <div style={{fontWeight:'bold', color:'#334155'}}>{s.mobile}</div>
                                                <div style={{color:'#64748b'}}>{s.city}</div>
                                                <div style={{color:'#64748b', marginTop:'5px'}}>Courses: {Object.values(s.history).reduce((a,b)=>a+b,0)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOAD PANEL */}
            {showUpload && <div style={{background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:'12px', padding:'25px', textAlign:'center', marginBottom:'20px'}}><FileText size={32} color="#15803d" style={{marginBottom:'10px'}}/><h3 style={{margin:0, color:'#14532d'}}>Upload Files</h3><input type="file" accept=".xlsx, .xls" multiple onChange={handleFileUpload} style={{display:'block', margin:'10px auto'}}/>{isLoading && <div>{mergeStatus}</div>}</div>}

            {/* FILTER TOOLBAR */}
            <div style={{padding:'15px', marginBottom:'20px', border:'1px solid #e2e8f0', borderRadius:'12px', background:'white'}}>
                <div style={{display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', marginBottom:'10px'}}>
                    <div style={{position:'relative', width:'250px'}}>
                        <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#94a3b8'}}/>
                        <input style={{...styles.input, paddingLeft:'35px', width:'100%', border:'1px solid #cbd5e1'}} placeholder="Search Name..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}/>
                    </div>
                    <select value={filters.course} onChange={e => setFilters({...filters, course: e.target.value})} style={filterSelectStyle}>
                        <option value="All">All Courses</option>
                        {COURSE_COLS.map(c => <option key={c} value={c}>Has done {c}</option>)}
                    </select>
                    <select value={filters.gender} onChange={e => setFilters({...filters, gender: e.target.value})} style={filterSelectStyle}>
                        <option value="All">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <select value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} style={filterSelectStyle}>
                        <option value="All">All Cities</option>
                        {options.cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filters.state} onChange={e => setFilters({...filters, state: e.target.value})} style={filterSelectStyle}>
                        <option value="All">All States</option>
                        {options.states.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={resetFilters} style={{border:'none', background:'transparent', cursor:'pointer', color:'#ef4444', display:'flex', alignItems:'center'}}><XCircle size={18}/></button>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>Found {processedList.length} matches</div>
                    <button onClick={handleFilteredExport} style={{display:'flex', alignItems:'center', gap:'8px', background:'#0f172a', color:'white', border:'none', padding:'8px 16px', borderRadius:'6px', fontWeight:'600', cursor:'pointer'}}><Download size={16}/> Export Filtered Data</button>
                </div>
            </div>

            {/* --- ANALYTICS VIEW --- */}
            {viewMode === 'analytics' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'25px', marginBottom:'40px', animation:'fadeIn 0.4s'}}>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}><MapPin size={16} style={{marginRight:'5px'}}/> Top Cities</h3><div style={{height:'300px'}}><ResponsiveContainer><BarChart data={graphData.cityDist} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={100} style={{fontSize:'11px'}}/><Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15}>{graphData.cityDist.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}><Globe size={16} style={{marginRight:'5px'}}/> State Distribution</h3><div style={{height:'300px'}}><ResponsiveContainer><BarChart data={graphData.stateDist}><XAxis dataKey="name" style={{fontSize:'10px'}} interval={0} angle={-30} textAnchor="end" height={60}/><YAxis/><Tooltip/><Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>{graphData.stateDist.map((e, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}><BarChart3 size={16} style={{marginRight:'5px'}}/> Course Portfolio</h3><div style={{height:'300px'}}><ResponsiveContainer><BarChart data={graphData.courseDist}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="students" radius={[4, 4, 0, 0]} barSize={40}>{graphData.courseDist.map((e, i) => <Cell key={i} fill={COLORS[(i + 12) % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}><Hash size={16} style={{marginRight:'5px'}}/> Top PIN Codes</h3><div style={{height:'300px'}}><ResponsiveContainer><BarChart data={graphData.pinDist} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={60} style={{fontSize:'11px'}}/><Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={15}>{graphData.pinDist.map((e, i) => <Cell key={i} fill={COLORS[(i + 5) % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}>Gender Ratio</h3><div style={{height:'300px'}}><ResponsiveContainer><PieChart><Pie data={graphData.genderDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"><Cell fill="#3b82f6"/><Cell fill="#ec4899"/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></div>
                    <div style={chartCardStyle}><h3 style={chartTitleStyle}>Age Distribution</h3><div style={{height:'300px'}}><ResponsiveContainer><BarChart data={graphData.ageDist}><XAxis dataKey="name" style={{fontSize:'10px'}}/><YAxis/><Tooltip/><Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30}/></BarChart></ResponsiveContainer></div></div>
                </div>
            )}

            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
                    <div style={{overflowX:'auto', maxHeight:'650px'}}>
                        <table style={{width:'max-content', borderCollapse:'separate', borderSpacing:0, fontSize:'12px'}}>
                            <thead style={{background:'#f1f5f9', position:'sticky', top:0, zIndex:30}}><tr>{FIXED_COLS.map(c=><th key={c.key} style={{...thStyle, width:c.width, position:'sticky', left:c.left, zIndex:35, background:'#f1f5f9'}}>{c.label}</th>)}{COURSE_COLS.map(c=><th key={c} style={{...thStyle, width:50, textAlign:'center'}}>{c}</th>)}{OTHER_COLS.map(c=><th key={c.key} style={{...thStyle, width:c.width}}>{c.label}</th>)}</tr></thead>
                            <tbody>{processedList.map((s,i)=><tr key={s.mobile} style={{background:i%2===0?'white':'#fafafa'}}>{FIXED_COLS.map(c=><td key={c.key} style={{...tdStyle, position:'sticky', left:c.left, zIndex:20, background:i%2===0?'white':'#fafafa'}}>{c.key==='sno'?i+1:s[c.key]}</td>)}{COURSE_COLS.map(c=><td key={c} style={{...tdStyle, textAlign:'center', fontWeight:'bold'}}>{s.history[c]}</td>)}{OTHER_COLS.map(c=><td key={c.key} style={tdStyle}>{s[c.key]}</td>)}</tr>)}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// STYLES
const thStyle = { padding:'10px', fontSize:'11px', fontWeight:'700', color:'#475569', borderBottom:'2px solid #cbd5e1', textAlign:'left', borderRight:'1px solid #e2e8f0' };
const tdStyle = { padding:'8px', fontSize:'12px', borderBottom:'1px solid #f1f5f9', color:'#334155', borderRight:'1px solid #f1f5f9' };
const chartCardStyle = { background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0' };
const chartTitleStyle = { margin:'0 0 10px 0', fontSize:'14px', fontWeight:'700', color:'#1e293b', display:'flex', alignItems:'center' };
const filterSelectStyle = { padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'13px', fontWeight:'600', minWidth:'120px' };
