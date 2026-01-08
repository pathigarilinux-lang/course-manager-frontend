import React, { useState, useEffect, useMemo } from 'react';
import { 
    Database, Upload, Trash2, Search, Filter, Download, 
    PieChart as PieIcon, BarChart3, List, FileText, ChevronDown, 
    ChevronUp, ArrowUpDown, Table, MapPin, Hash, Globe, Flag, XCircle, 
    User, Shield, Lock, Save, GitMerge, AlertCircle, CheckCircle, 
    Link as LinkIcon, Cloud, RefreshCw 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import { styles } from '../config';
import { supabase } from '../supabaseClient'; 

// --- CONFIGURATION ---
const COURSE_COLS = ['60D', '45D', '30D', '20D', '10D', 'STP', 'SPL', 'TSC'];
const FIXED_COLS = [
    { key: 'sno', label: 'S.No', width: 50, left: 0 },
    { key: 'name', label: 'Student Name', width: 220, left: 50 },
    { key: 'gender', label: 'Gender', width: 70, left: 270 },
    { key: 'age', label: 'Age', width: 60, left: 340 },
    { key: 'mobile', label: 'Mobile', width: 110, left: 400 },
];
const OTHER_COLS = [
    { key: 'mentor', label: 'Assigned Mentor', width: 150 },
    { key: 'mentor_status', label: 'Status', width: 120 },
    { key: 'mentor_notes', label: 'Notes', width: 200 },
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- UTILS ---
const toTitleCase = (str) => String(str || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const findValue = (row, possibleKeys) => {
    if (!row) return '';
    const rowKeys = Object.keys(row);
    for (const target of possibleKeys) {
        if (row[target] !== undefined) return row[target];
        const match = rowKeys.find(k => k.toLowerCase().includes(target.toLowerCase()));
        if (match && row[match] !== undefined) return row[match];
    }
    return '';
};

// =========================================================
//  MAIN COMPONENT (DEBUG VERSION)
// =========================================================
export default function MasterDatabase({ user }) {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [showUpload, setShowUpload] = useState(false);
    const [mergeStatus, setMergeStatus] = useState('');
    
    // Filters
    const [filters, setFilters] = useState({ search: '', course: 'All', gender: 'All', city: 'All', state: 'All', mentor: 'All' });
    const [options, setOptions] = useState({ cities: [], states: [], mentors: [] });
    const [graphData, setGraphData] = useState({ courseDist: [], genderDist: [], ageDist: [], cityDist: [] });

    const canDelete = user && user.role === 'admin'; 

    // --- ☁️ INITIAL LOAD + DEBUG ---
    useEffect(() => { 
        refreshData(); 
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            console.log("Attempting to fetch from Supabase...");
            
            // 1. Check if Supabase client exists
            if (!supabase) throw new Error("Supabase Client is missing! Check src/supabaseClient.js");

            // 2. Fetch Data
            const { data, error } = await supabase
                .from('master_registry')
                .select('*')
                .limit(5000); // Safety limit
            
            // 3. HANDLE ERRORS EXPLICITLY
            if (error) {
                console.error("Supabase Error:", error);
                alert(`⚠️ CONNECTION ERROR:\n${error.message}\n\nHint: ${error.hint || 'Check your Table Name or API Keys.'}`);
                throw error;
            }

            // 4. Check if Empty
            if (!data || data.length === 0) {
                console.warn("Table is empty.");
                // Only warn if we expected data. 
                // alert("Connected successfully, but the database is empty. Please Upload your Excel file to populate the cloud.");
            } else {
                console.log(`Loaded ${data.length} records.`);
            }

            setStudents(data || []);
            prepareFilterOptions(data || []);
            prepareGraphData(data || []);

        } catch (e) { 
            console.error("Critical Load Error", e);
            // Alert user so they know what happened
            if (!e.message.includes('CONNECTION ERROR')) {
                alert(`⚠️ CRITICAL ERROR: ${e.message}`);
            }
        } finally { 
            setIsLoading(false); 
        }
    };

    // --- 🧬 DATA PROCESSING ---
    const prepareFilterOptions = (data) => {
        const getUnique = (key) => [...new Set(data.map(s => s[key]).filter(Boolean).map(s => s.trim()))].sort();
        setOptions({
            cities: getUnique('city'),
            states: getUnique('state'),
            mentors: getUnique('mentor')
        });
    };

    const processedList = useMemo(() => {
        let list = [...students];
        if (filters.course !== 'All') list = list.filter(s => (s.history?.[filters.course] || 0) > 0);
        if (filters.gender !== 'All') list = list.filter(s => String(s.gender).toLowerCase().startsWith(filters.gender.charAt(0).toLowerCase()));
        if (filters.city !== 'All') list = list.filter(s => s.city === filters.city);
        if (filters.state !== 'All') list = list.filter(s => s.state === filters.state);
        if (filters.mentor !== 'All') list = list.filter(s => s.mentor === filters.mentor);
        
        if (filters.search) {
            const lower = filters.search.toLowerCase();
            list = list.filter(s => String(s.name).toLowerCase().includes(lower) || String(s.mobile).includes(lower));
        }
        return list;
    }, [students, filters]);

    const prepareGraphData = (data) => {
        // Simplified for brevity
        const courses = COURSE_COLS.map(col => ({ name: col, students: data.filter(s => (s.history?.[col] || 0) > 0).length }));
        const male = data.filter(s => String(s.gender).toLowerCase().startsWith('m')).length;
        const female = data.filter(s => String(s.gender).toLowerCase().startsWith('f')).length;
        setGraphData({
            courseDist: courses,
            genderDist: [{ name: 'Male', value: male }, { name: 'Female', value: female }],
            ageDist: [], // Skipped for brevity
            cityDist: [] // Skipped for brevity
        });
    };

    // --- ☁️ PROCESS & UPLOAD ---
    const processIncomingData = async (rawJson) => {
        setMergeStatus(`Processing ${rawJson.length} records...`);
        
        const firstRow = rawJson[0] || {};
        const isTeacherList = findValue(firstRow, ['10D','STP']) !== '';

        const cleanData = rawJson.map(mainRow => {
            const mobile = (findValue(mainRow,['PhoneMobile','Mobile','Phone','Contact','WhatsApp'])||'').toString().replace(/\D/g, '');
            if (!mobile || mobile.length < 5) return null;

            let student = {
                mobile, 
                name: toTitleCase(findValue(mainRow, ['Name','Student','Full Name'])), 
                gender: toTitleCase(findValue(mainRow, ['Gender','Sex'])), 
                age: findValue(mainRow, ['Age']),
                city: toTitleCase(findValue(mainRow, ['City','Town','District'])), 
                state: toTitleCase(findValue(mainRow, ['State','Province','Region'])), 
                country: toTitleCase(findValue(mainRow, ['Country','Nation'])),
                pin: String(findValue(mainRow,['Pin','Zip','Postal'])), 
                email: String(findValue(mainRow,['Email'])), 
                phone_home: String(findValue(mainRow,['PhoneHome'])),
                education: findValue(mainRow,['Education']), 
                occupation: findValue(mainRow,['Occupation']),
                company: findValue(mainRow,['Company']), 
                mentor: findValue(mainRow, ['Mentor', 'Assigned To', 'Leader']),
                mentor_status: findValue(mainRow, ['Status', 'Mentor Status']),
                mentor_notes: findValue(mainRow, ['Notes', 'Mentor Notes']),
                last_update: new Date().toISOString(),
                history: {}
            };

            if(isTeacherList) {
                COURSE_COLS.forEach(c => student.history[c] = parseInt(mainRow[c]||0));
            } else {
                COURSE_COLS.forEach(c => student.history[c] = 0);
            }
            return student;
        }).filter(Boolean);

        if(cleanData.length > 0) {
            setMergeStatus(`Uploading ${cleanData.length} records to Cloud...`);
            const BATCH_SIZE = 100;
            for (let i = 0; i < cleanData.length; i += BATCH_SIZE) {
                const batch = cleanData.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('master_registry').upsert(batch, { onConflict: 'mobile' });
                if (error) {
                    console.error("Batch Upload Error", error);
                    alert(`Upload Error on Batch ${i}: ${error.message}`);
                    setMergeStatus(`Error: ${error.message}`);
                    return; 
                }
            }
        }
        await refreshData();
        setMergeStatus(`Success! Synced ${cleanData.length} records.`);
        setTimeout(() => setShowUpload(false), 3000);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setIsLoading(true); 
        setMergeStatus('Reading files...');
        let allData = [];
        for (const file of files) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            allData = allData.concat(jsonData);
        }
        await processIncomingData(allData);
    };

    return (
        <div style={{animation:'fadeIn 0.3s'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                    <h1 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#1e293b'}}>
                        <Database size={32} className="text-blue-600"/> Master Database (Cloud)
                    </h1>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        {students.length.toLocaleString()} Total Records • Cloud Synced
                    </div>
                </div>
                
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <button onClick={refreshData} style={{...styles.btn(false), padding:'8px'}} title="Refresh">
                        <RefreshCw size={16} className={isLoading?'animate-spin':''}/>
                    </button>
                    <button onClick={()=>setShowUpload(!showUpload)} style={{...styles.btn(true)}}><Cloud size={16}/> Sync / Import</button>
                </div>
            </div>

            {/* UPLOAD PANEL */}
            {showUpload && (
                <div style={{background:'#f0fdf4', border:'2px dashed #86efac', borderRadius:'12px', padding:'25px', marginBottom:'20px', textAlign:'center'}}>
                    <h3 style={{margin:0, color:'#14532d'}}>Upload Excel to Cloud</h3>
                    <input type="file" accept=".xlsx, .xls, .csv" multiple onChange={handleFileUpload} style={{display:'block', margin:'10px auto'}}/>
                    {isLoading && <div style={{marginTop:'10px', color:'#15803d', fontWeight:'bold'}}>{mergeStatus}</div>}
                </div>
            )}

            {/* LIST VIEW */}
            <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', overflowX:'auto', maxHeight:'650px'}}>
                <table style={{width:'max-content', borderCollapse:'separate', borderSpacing:0, fontSize:'12px'}}>
                    <thead style={{background:'#f1f5f9', position:'sticky', top:0, zIndex:30}}>
                        <tr>
                            {FIXED_COLS.map(c=><th key={c.key} style={{...thStyle, width:c.width, position:'sticky', left:c.left, zIndex:35, background:'#f1f5f9'}}>{c.label}</th>)}
                            {COURSE_COLS.map(c=><th key={c} style={{...thStyle, width:50, textAlign:'center'}}>{c}</th>)}
                            {OTHER_COLS.map(c=><th key={c.key} style={thStyle}>{c.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {processedList.length === 0 ? (
                            <tr><td colSpan={20} style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
                                {isLoading ? "Loading data from cloud..." : "No data found. Please Upload your Excel file."}
                            </td></tr>
                        ) : (
                            processedList.map((s,i)=><tr key={s.mobile} style={{background:i%2===0?'white':'#fafafa'}}>
                                {FIXED_COLS.map(c=><td key={c.key} style={{...tdStyle, position:'sticky', left:c.left, zIndex:20, background:i%2===0?'white':'#fafafa'}}>{c.key==='sno'?i+1:s[c.key]}</td>)}
                                {COURSE_COLS.map(c=><td key={c} style={{...tdStyle, textAlign:'center', fontWeight:'bold', color:s.history[c]>0?'black':'#e2e8f0'}}>{s.history[c]}</td>)}
                                {OTHER_COLS.map(c=><td key={c.key} style={tdStyle}>{s[c.key]}</td>)}
                            </tr>)
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// STYLES
const thStyle = { padding:'10px', fontSize:'11px', fontWeight:'700', color:'#475569', borderBottom:'2px solid #cbd5e1', textAlign:'left', borderRight:'1px solid #e2e8f0' };
const tdStyle = { padding:'8px', fontSize:'12px', borderBottom:'1px solid #f1f5f9', color:'#334155', borderRight:'1px solid #f1f5f9' };
