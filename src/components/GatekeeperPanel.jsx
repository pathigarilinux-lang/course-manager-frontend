import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, History } from 'lucide-react';
import { API_URL, styles } from '../config';
import Dashboard from './Dashboard'; // Import the Universal Dashboard

export default function GatekeeperPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [showDashboard, setShowDashboard] = useState(true); // Toggle for Dashboard

    useEffect(() => { 
        if (courses.length > 0) setCourseId(courses[0].course_id); 
    }, [courses]);

    useEffect(() => { 
        if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); 
    }, [courseId]);

    const handleGateCheckIn = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as ARRIVED at Gate?`)) return;
        try {
            await fetch(`${API_URL}/gate-checkin`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            setParticipants(await res.json());
        } catch (err) { alert("Error"); }
    };

    const handleGateCancel = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as CANCELLED?`)) return;
        try {
            await fetch(`${API_URL}/gate-cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            setParticipants(await res.json());
        } catch (err) { alert("Error"); }
    };

    const filtered = participants.filter(p => {
        const match = p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(search.toLowerCase()));
        if (!match) return false;
        if (p.status === 'Cancelled' && !search) return false;
        if (!showHistory && !search) return p.status === 'No Response' || !p.status;
        return true;
    });

    return (
        <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h2 style={{margin:0}}>🚧 Gate Check-In</h2>
                <button onClick={()=>setShowDashboard(!showDashboard)} style={styles.btn(showDashboard)}>{showDashboard ? 'Hide Stats' : 'Show Stats'}</button>
            </div>

            {/* EMBEDDED DASHBOARD */}
            {showDashboard && (
                <div style={{marginBottom:'30px', borderBottom:'2px solid #eee', paddingBottom:'20px'}}>
                    <Dashboard courses={courses} externalData={{ participants }} role="gatekeeper" />
                </div>
            )}

            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <select style={{...styles.input, flex:1}} value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <button onClick={()=>setShowHistory(!showHistory)} style={{...styles.btn(showHistory), flexShrink:0}}>{showHistory ? <EyeOff size={16}/> : <History size={16}/>} {showHistory ? 'Hide Arrived' : 'View History'}</button>
            </div>
            
            <div style={{marginBottom:'20px'}}>
                <input style={{...styles.input, padding:'15px', fontSize:'18px'}} placeholder="🔍 Search Name or Conf No..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
            </div>

            <div style={{height:'400px', overflowY:'auto'}}>
                {filtered.map(p => (
                    <div key={p.participant_id} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <div style={{fontWeight:'bold', fontSize:'16px'}}>{p.full_name}</div>
                            <div style={{color:'#666', fontSize:'14px'}}>{p.conf_no} | Age: {p.age}</div>
                            <div style={{fontSize:'12px', fontWeight:'bold', color: p.status==='Gate Check-In'?'orange':(p.status==='Attending'?'green':'#777')}}>{p.status}</div>
                        </div>
                        {p.status !== 'Attending' && p.status !== 'Gate Check-In' && p.status !== 'Cancelled' && (
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={()=>handleGateCheckIn(p)} style={{...styles.btn(true), background:'#007bff', color:'white', padding:'10px 20px'}}>Mark Arrived</button>
                                <button onClick={()=>handleGateCancel(p)} style={{...styles.btn(true), background:'#dc3545', color:'white', padding:'10px'}}>Cancel</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
