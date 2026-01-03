import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Search, Calendar, Phone, User, MapPin, 
    ChevronRight, History, Award, Mail, FileText, Filter, Copy, Check 
} from 'lucide-react';
import { API_URL, styles } from '../config';

// --- STYLES ---
const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0'
};

const badgeStyle = (type) => {
    switch (type) {
        case 'Old Student': return { bg: '#e0f2f1', color: '#00695c' }; // Teal
        case 'New Student': return { bg: '#fff3e0', color: '#e65100' }; // Orange
        case 'Server': return { bg: '#f3e5f5', color: '#7b1fa2' }; // Purple
        default: return { bg: '#f1f5f9', color: '#475569' };
    }
};

export default function AlumniDirectory({ courses }) {
    const [allRecords, setAllRecords] = useState([]);
    const [uniqueAlumni, setUniqueAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    
    // --- NEW: SERVER RECRUITMENT STATES ---
    const [recruitmentMode, setRecruitmentMode] = useState(false);
    const [serverFilter, setServerFilter] = useState({ gender: 'All', experienced: false });
    const [copied, setCopied] = useState(false);

    // 1. FETCH DATA
    useEffect(() => {
        const fetchAllHistory = async () => {
            if (!courses || courses.length === 0) return;
            setIsLoading(true);
            try {
                const promises = courses.map(c => 
                    fetch(`${API_URL}/courses/${c.course_id}/participants`)
                        .then(r => r.json())
                        .then(data => Array.isArray(data) ? data.map(p => ({ ...p, courseName: c.course_name, courseStart: c.start_date, role: p.category || (String(p.conf_no).startsWith('O') ? 'Old Student' : 'New Student') })) : [])
                        .catch(() => [])
                );
                const results = await Promise.all(promises);
                const flatList = results.flat();
                setAllRecords(flatList);
                processAlumni(flatList);
            } catch (err) { console.error("Alumni fetch error:", err); } 
            finally { setIsLoading(false); }
        };
        fetchAllHistory();
    }, [courses]);

    // 2. PROCESS ALUMNI
    const processAlumni = (records) => {
        const groups = {};
        records.forEach(r => {
            let key = r.mobile ? r.mobile.replace(/\D/g, '') : `${r.full_name}-${r.age}`;
            if (!key || key.length < 5) key = `UNKNOWN-${r.participant_id}`;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    name: r.full_name,
                    phone: r.mobile || '-',
                    gender: r.gender,
                    age: r.age,
                    history: [],
                    // Determine if they are an Old Student (Have they ever sat/served?)
                    isOldStudent: false,
                    hasServed: false
                };
            }
            
            // Check History for Roles
            const isOld = String(r.conf_no).startsWith('O') || r.status === 'Completed' || r.role === 'Old Student';
            const isServer = r.role === 'Server';

            if(isOld) groups[key].isOldStudent = true;
            if(isServer) groups[key].hasServed = true;

            groups[key].history.push({
                course: r.courseName,
                date: r.courseStart,
                role: r.role,
                status: r.status
            });
        });

        // Convert and Sort
        const alumniList = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
        setUniqueAlumni(alumniList);
    };

    // 3. SMART FILTER ENGINE
    const filteredList = useMemo(() => {
        let list = uniqueAlumni;

        // A. Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(a => a.name.toLowerCase().includes(lower) || a.phone.includes(lower));
        }

        // B. Recruitment Filters (Only applies if Recruitment Mode is ON)
        if (recruitmentMode) {
            // Must be Old Student to Serve
            list = list.filter(a => a.isOldStudent || a.hasServed);

            if (serverFilter.gender !== 'All') {
                const targetChar = serverFilter.gender.charAt(0).toLowerCase(); // 'm' or 'f'
                list = list.filter(a => String(a.gender).toLowerCase().startsWith(targetChar));
            }

            if (serverFilter.experienced) {
                list = list.filter(a => a.hasServed);
            }
        }

        return list;
    }, [uniqueAlumni, searchTerm, recruitmentMode, serverFilter]);

    // 4. BULK COPY FUNCTION
    const handleCopyNumbers = () => {
        const numbers = filteredList
            .map(a => a.phone.replace(/\D/g, '')) // Clean numbers
            .filter(n => n.length >= 10)
            .join(','); // Comma separated for easy pasting
        
        navigator.clipboard.writeText(numbers);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{animation: 'fadeIn 0.3s ease'}}>
            
            {/* HEADER WITH TOGGLE */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                    <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#1e293b'}}>
                        <History size={28} className="text-blue-600"/> 
                        {recruitmentMode ? 'Server Recruitment' : 'Global Alumni Directory'}
                    </h2>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        {recruitmentMode 
                            ? `Found ${filteredList.length} potential servers based on filters.` 
                            : `Total Unique Records: ${uniqueAlumni.length}`}
                    </div>
                </div>
                
                {/* MODE TOGGLE BUTTON */}
                <button 
                    onClick={() => setRecruitmentMode(!recruitmentMode)}
                    style={{
                        padding:'10px 20px', borderRadius:'30px', border:'none',
                        background: recruitmentMode ? '#10b981' : '#3b82f6', color:'white',
                        fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {recruitmentMode ? <Check size={18}/> : <Filter size={18}/>}
                    {recruitmentMode ? 'Done Recruiting' : 'Find Servers'}
                </button>
            </div>

            {/* --- RECRUITMENT TOOLBAR (Only Visible in Recruitment Mode) --- */}
            {recruitmentMode && (
                <div style={{background:'#f0f9ff', border:'1px solid #bae6fd', padding:'15px', borderRadius:'12px', marginBottom:'20px', animation:'fadeIn 0.2s'}}>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'15px', alignItems:'center', justifyContent:'space-between'}}>
                        
                        {/* FILTERS */}
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            <span style={{fontWeight:'bold', color:'#0369a1', fontSize:'14px'}}>Filter By:</span>
                            
                            <select 
                                style={{padding:'8px', borderRadius:'6px', border:'1px solid #ccc'}}
                                value={serverFilter.gender}
                                onChange={e => setServerFilter({...serverFilter, gender: e.target.value})}
                            >
                                <option value="All">All Genders</option>
                                <option value="Male">Male Only</option>
                                <option value="Female">Female Only</option>
                            </select>

                            <label style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'14px', cursor:'pointer', background:'white', padding:'8px 12px', borderRadius:'6px', border:'1px solid #ccc'}}>
                                <input 
                                    type="checkbox" 
                                    checked={serverFilter.experienced} 
                                    onChange={e => setServerFilter({...serverFilter, experienced: e.target.checked})}
                                />
                                Experienced Servers Only
                            </label>
                        </div>

                        {/* EXPORT ACTION */}
                        <button 
                            onClick={handleCopyNumbers}
                            style={{
                                background: copied ? '#059669' : '#0284c7', color:'white', border:'none',
                                padding:'10px 20px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer',
                                display:'flex', alignItems:'center', gap:'8px'
                            }}
                        >
                            {copied ? <Check size={18}/> : <Copy size={18}/>}
                            {copied ? 'Copied!' : 'Copy Phone Numbers'}
                        </button>
                    </div>
                </div>
            )}

            {/* STANDARD SEARCH BAR (Hide in recruitment mode to save space, or keep it) */}
            {!recruitmentMode && (
                <div style={{...cardStyle, padding:'15px', marginBottom:'20px', display:'flex', gap:'15px', alignItems:'center'}}>
                    <Search size={20} color="#94a3b8"/>
                    <input 
                        style={{...styles.input, border:'none', fontSize:'16px', width:'100%', outline:'none'}} 
                        placeholder="Search Alumni by Name, Phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* RESULTS GRID */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'20px'}}>
                {filteredList.map(student => (
                    <div 
                        key={student.id} 
                        onClick={() => setSelectedAlumni(student)}
                        style={{
                            ...cardStyle, 
                            cursor:'pointer', transition:'all 0.2s', 
                            borderLeft: `4px solid ${String(student.gender).toLowerCase().startsWith('m') ? '#3b82f6' : '#ec4899'}`
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                            <div>
                                <div style={{fontWeight:'bold', fontSize:'16px', color:'#334155'}}>{student.name}</div>
                                {student.hasServed && <span style={{fontSize:'10px', color:'#7b1fa2', background:'#f3e5f5', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', marginTop:'4px', display:'inline-block'}}>⭐ Has Served</span>}
                            </div>
                            <span style={{
                                fontSize:'10px', padding:'2px 8px', borderRadius:'12px', fontWeight:'bold', height:'fit-content',
                                background: student.isOldStudent ? '#e0f2f1' : '#fff3e0', color: student.isOldStudent ? '#00695c' : '#e65100'
                            }}>
                                {student.isOldStudent ? 'Old Student' : 'New Student'}
                            </span>
                        </div>
                        
                        <div style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', color:'#64748b'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Phone size={14}/> {student.phone}</div>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <Award size={14}/> Courses: {student.history.length}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DETAIL MODAL (Unchanged Logic, just visual) */}
            {selectedAlumni && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                    <div style={{background:'white', width:'600px', maxHeight:'85vh', borderRadius:'16px', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                        <div style={{padding:'25px', background: '#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between'}}>
                            <div>
                                <h2 style={{margin:0}}>{selectedAlumni.name}</h2>
                                <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>{selectedAlumni.phone} • {selectedAlumni.age} Yrs</div>
                            </div>
                            <button onClick={()=>setSelectedAlumni(null)} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Users size={16}/></button>
                        </div>
                        <div style={{padding:'25px', overflowY:'auto'}}>
                            {selectedAlumni.history.map((h, i) => (
                                <div key={i} style={{marginBottom:'15px', borderLeft:'3px solid #e2e8f0', paddingLeft:'15px'}}>
                                    <div style={{fontWeight:'bold', fontSize:'14px'}}>{h.course}</div>
                                    <div style={{fontSize:'12px', color:'#64748b'}}>{new Date(h.date).toLocaleDateString()} • {h.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
