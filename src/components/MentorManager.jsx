import React, { useState, useEffect } from 'react';
import { 
    Users, UserPlus, CheckCircle, Search, Filter, 
    ChevronRight, Briefcase, Phone, MapPin, Save, Trash2, PieChart
} from 'lucide-react';
import { styles } from '../config';

// Reusing DB Config from MasterDatabase
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 11; 

const dbHelper = {
    open: () => new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }),
    getAll: async () => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
        });
    },
    updateBulk: async (students) => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            students.forEach(s => store.put(s));
            tx.oncomplete = () => resolve();
        });
    }
};

export default function MentorManager() {
    const [students, setStudents] = useState([]);
    const [mentors, setMentors] = useState(() => JSON.parse(localStorage.getItem('dhammaMentors') || '[]'));
    const [activeMentor, setActiveMentor] = useState(null); // Which mentor we are viewing
    const [newMentorName, setNewMentorName] = useState('');
    
    // Distribution State
    const [distFilter, setDistFilter] = useState({ city: 'All', count: 50 });
    const [cities, setCities] = useState([]);

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        try {
            const data = await dbHelper.getAll();
            setStudents(data);
            const uniqueCities = [...new Set(data.map(s => s.city).filter(Boolean))].sort();
            setCities(uniqueCities);
        } catch (e) { console.error(e); }
    };

    // --- MENTOR MANAGEMENT ---
    const addMentor = () => {
        if (!newMentorName.trim()) return;
        const updated = [...mentors, newMentorName.trim()];
        setMentors(updated);
        localStorage.setItem('dhammaMentors', JSON.stringify(updated));
        setNewMentorName('');
    };

    const removeMentor = (name) => {
        if(!window.confirm(`Remove ${name}? Assigned students will remain assigned to them.`)) return;
        const updated = mentors.filter(m => m !== name);
        setMentors(updated);
        localStorage.setItem('dhammaMentors', JSON.stringify(updated));
        if (activeMentor === name) setActiveMentor(null);
    };

    // --- DISTRIBUTION LOGIC ---
    const handleDistribute = async (mentorName) => {
        // 1. Find eligible unassigned students
        let pool = students.filter(s => !s.mentor || s.mentor === '');
        
        // 2. Apply Filters
        if (distFilter.city !== 'All') {
            pool = pool.filter(s => s.city === distFilter.city);
        }

        // 3. Limit Count
        const toAssign = pool.slice(0, parseInt(distFilter.count));

        if (toAssign.length === 0) {
            alert('No unassigned students found with current filters.');
            return;
        }

        if (!window.confirm(`Assign ${toAssign.length} students to ${mentorName}?`)) return;

        // 4. Update
        const updatedStudents = toAssign.map(s => ({
            ...s,
            mentor: mentorName,
            mentor_status: 'Pending', // Default status
            mentor_notes: '',
            last_update: new Date().toISOString()
        }));

        await dbHelper.updateBulk(updatedStudents);
        await refreshData();
        alert(`Successfully assigned ${toAssign.length} students!`);
    };

    // --- TRACKING LOGIC ---
    const updateStudentStatus = async (student, newStatus) => {
        const updated = { ...student, mentor_status: newStatus, last_update: new Date().toISOString() };
        await dbHelper.updateBulk([updated]);
        
        // Optimistic UI Update
        setStudents(prev => prev.map(s => s.mobile === student.mobile ? updated : s));
    };

    const updateStudentNote = async (student, note) => {
        const updated = { ...student, mentor_notes: note, last_update: new Date().toISOString() };
        await dbHelper.updateBulk([updated]);
        setStudents(prev => prev.map(s => s.mobile === student.mobile ? updated : s));
    };

    // Stats
    const getStats = (name) => {
        const assigned = students.filter(s => s.mentor === name);
        const pending = assigned.filter(s => s.mentor_status === 'Pending').length;
        const completed = assigned.length - pending;
        return { total: assigned.length, pending, completed };
    };

    return (
        <div style={{display:'flex', height:'85vh', gap:'20px', animation:'fadeIn 0.3s'}}>
            
            {/* LEFT: MENTOR LIST */}
            <div style={{width:'300px', background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column'}}>
                <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc'}}>
                    <h3 style={{margin:0, color:'#1e293b', display:'flex', alignItems:'center', gap:'10px'}}>
                        <Briefcase size={20} className="text-blue-600"/> Mentors
                    </h3>
                    <div style={{display:'flex', marginTop:'15px', gap:'5px'}}>
                        <input 
                            style={styles.input} 
                            placeholder="Add new mentor..." 
                            value={newMentorName}
                            onChange={e => setNewMentorName(e.target.value)}
                        />
                        <button onClick={addMentor} style={{...styles.btn(true), padding:'8px'}}><UserPlus size={18}/></button>
                    </div>
                </div>
                <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
                    {mentors.map(m => {
                        const stats = getStats(m);
                        return (
                            <div 
                                key={m} 
                                onClick={() => setActiveMentor(m)}
                                style={{
                                    padding:'15px', borderRadius:'8px', marginBottom:'8px', cursor:'pointer',
                                    background: activeMentor === m ? '#eff6ff' : 'white',
                                    border: activeMentor === m ? '1px solid #3b82f6' : '1px solid #f1f5f9',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div style={{fontWeight:'700', color:'#334155'}}>{m}</div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); removeMentor(m); }}
                                        style={{border:'none', background:'transparent', color:'#cbd5e1', cursor:'pointer', padding:0}}
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                                <div style={{display:'flex', gap:'10px', marginTop:'8px', fontSize:'11px', color:'#64748b'}}>
                                    <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 6px', borderRadius:'4px'}}>Total: {stats.total}</span>
                                    <span style={{background:'#dcfce7', color:'#15803d', padding:'2px 6px', borderRadius:'4px'}}>Done: {stats.completed}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT: ACTION AREA */}
            <div style={{flex:1, background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                
                {/* HEADER */}
                <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc'}}>
                    {activeMentor ? (
                        <div>
                            <h2 style={{margin:0, color:'#1e293b'}}>Managing: {activeMentor}</h2>
                            <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>Assign new students or track progress.</div>
                        </div>
                    ) : (
                        <div style={{color:'#94a3b8', fontStyle:'italic'}}>Select a mentor to manage...</div>
                    )}
                </div>

                {activeMentor ? (
                    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                        
                        {/* 1. DISTRIBUTION PANEL */}
                        <div style={{padding:'20px', background:'#fff7ed', borderBottom:'1px solid #fed7aa', display:'flex', gap:'15px', alignItems:'center'}}>
                            <span style={{fontWeight:'700', color:'#c2410c', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px'}}>
                                <PieChart size={16}/> Distribute:
                            </span>
                            <select 
                                style={{padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                                value={distFilter.city}
                                onChange={e => setDistFilter({...distFilter, city: e.target.value})}
                            >
                                <option value="All">All Cities</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                                style={{padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                                value={distFilter.count}
                                onChange={e => setDistFilter({...distFilter, count: e.target.value})}
                            >
                                <option value="50">Assign 50</option>
                                <option value="100">Assign 100</option>
                                <option value="200">Assign 200</option>
                            </select>
                            <button 
                                onClick={() => handleDistribute(activeMentor)}
                                style={{...styles.btn(true), background:'#ea580c', borderColor:'#ea580c'}}
                            >
                                Assign Now
                            </button>
                            <div style={{marginLeft:'auto', fontSize:'12px', color:'#c2410c'}}>
                                Unassigned Available: {students.filter(s => (!s.mentor) && (distFilter.city === 'All' || s.city === distFilter.city)).length}
                            </div>
                        </div>

                        {/* 2. TRACKING LIST */}
                        <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                                <thead>
                                    <tr style={{borderBottom:'2px solid #e2e8f0', color:'#64748b'}}>
                                        <th style={{textAlign:'left', padding:'10px'}}>Student Name</th>
                                        <th style={{textAlign:'left', padding:'10px'}}>Mobile</th>
                                        <th style={{textAlign:'left', padding:'10px'}}>City</th>
                                        <th style={{textAlign:'left', padding:'10px'}}>Status</th>
                                        <th style={{textAlign:'left', padding:'10px'}}>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.filter(s => s.mentor === activeMentor).map(s => (
                                        <tr key={s.mobile} style={{borderBottom:'1px solid #f1f5f9'}}>
                                            <td style={{padding:'12px 10px', fontWeight:'600', color:'#334155'}}>{s.name}</td>
                                            <td style={{padding:'12px 10px', color:'#64748b'}}>{s.mobile}</td>
                                            <td style={{padding:'12px 10px', color:'#64748b'}}>{s.city}</td>
                                            <td style={{padding:'12px 10px'}}>
                                                <select 
                                                    value={s.mentor_status || 'Pending'}
                                                    onChange={(e) => updateStudentStatus(s, e.target.value)}
                                                    style={{
                                                        padding:'4px 8px', borderRadius:'12px', border:'none', fontSize:'12px', fontWeight:'600', cursor:'pointer',
                                                        background: s.mentor_status === 'Done' ? '#dcfce7' : s.mentor_status === 'Call Later' ? '#fef9c3' : '#f1f5f9',
                                                        color: s.mentor_status === 'Done' ? '#166534' : s.mentor_status === 'Call Later' ? '#854d0e' : '#475569'
                                                    }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Called">Called</option>
                                                    <option value="Call Later">Call Later</option>
                                                    <option value="Not Interested">Not Interested</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                            </td>
                                            <td style={{padding:'12px 10px'}}>
                                                <input 
                                                    placeholder="Add note..."
                                                    value={s.mentor_notes || ''}
                                                    onChange={(e) => updateStudentNote(s, e.target.value)}
                                                    style={{border:'1px solid #e2e8f0', borderRadius:'4px', padding:'4px 8px', width:'100%'}}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {students.filter(s => s.mentor === activeMentor).length === 0 && (
                                <div style={{textAlign:'center', padding:'50px', color:'#cbd5e1'}}>No students assigned yet. Use the top bar to assign.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', color:'#94a3b8'}}>
                        <Users size={48} style={{opacity:0.2, marginBottom:'15px'}}/>
                        <div>Select a mentor from the left list to begin.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
