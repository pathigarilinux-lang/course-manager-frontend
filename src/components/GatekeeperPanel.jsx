import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function GatekeeperPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);

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
            const data = await res.json();
            setParticipants(data);
        } catch (err) { alert("Error"); }
    };

    const handleGateCancel = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as CANCELLED?`)) return;
        try {
            await fetch(`${API_URL}/gate-cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const data = await res.json();
            setParticipants(data);
        } catch (err) { alert("Error"); }
    };

    // --- GATE DASHBOARD METRICS ---
    const all = participants.filter(p => p.status !== 'Cancelled');
    const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
    const pending = all.filter(p => p.status === 'No Response');
    
    const getBreakdown = (list, filterFn) => list.filter(filterFn).length;
    const isMale = (p) => (p.gender||'').toLowerCase().startsWith('m');
    const isFemale = (p) => (p.gender||'').toLowerCase().startsWith('f');
    const isOld = (p) => (p.conf_no||'').startsWith('O') || (p.conf_no||'').startsWith('S');
    const isNew = (p) => (p.conf_no||'').startsWith('N');

    const stats = {
        total: all.length,
        arrived: arrived.length,
        pending: pending.length,
        m: { tot: getBreakdown(all, isMale), arr: getBreakdown(arrived, isMale), pend: getBreakdown(pending, isMale) },
        f: { tot: getBreakdown(all, isFemale), arr: getBreakdown(arrived, isFemale), pend: getBreakdown(pending, isFemale) },
        cat: { old: getBreakdown(arrived, isOld), new: getBreakdown(arrived, isNew) }
    };

    const filtered = participants.filter(p => {
        const match = p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(search.toLowerCase()));
        if (!match) return false;
        
        // IMPORTANT: Show cancelled ONLY if searching specific user, otherwise hide
        if (p.status === 'Cancelled' && !search) return false;
        
        // "Disappearing" Logic: Show pending by default. Show Arrived only if history enabled.
        if (!showHistory && !search) return p.status === 'No Response' || !p.status;
        return true;
    });

    const StatBox = ({ label, v1, v2, v3, color }) => (
        <div style={{background:'white', padding:'10px', borderRadius:'6px', borderTop:`3px solid ${color}`, textAlign:'center', flex:1}}>
            <div style={{fontSize:'11px', color:'#777', fontWeight:'bold', textTransform:'uppercase'}}>{label}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px', fontSize:'13px'}}>
                <span title="Total">T:<b>{v1}</b></span>
                <span title="Arrived" style={{color:'green'}}>A:<b>{v2}</b></span>
                <span title="Pending" style={{color:'red'}}>P:<b>{v3}</b></span>
            </div>
        </div>
    );

    return (
        <div style={cardStyle}>
            {/* GATE DASHBOARD */}
            <div style={{background:'#f1f3f5', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
                <h3 style={{margin:'0 0 10px 0', fontSize:'16px'}}>Gate Dashboard</h3>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'12px', color:'#777'}}>Total Expected</div>
                        <div style={{fontSize:'20px', fontWeight:'bold'}}>{stats.total}</div>
                    </div>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #28a745'}}>
                        <div style={{fontSize:'12px', color:'green'}}>Checked In</div>
                        <div style={{fontSize:'20px', fontWeight:'bold', color:'green'}}>{stats.arrived}</div>
                    </div>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #dc3545'}}>
                        <div style={{fontSize:'12px', color:'red'}}>Pending</div>
                        <div style={{fontSize:'20px', fontWeight:'bold', color:'red'}}>{stats.pending}</div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <StatBox label="Male" v1={stats.m.tot} v2={stats.m.arr} v3={stats.m.pend} color="#007bff" />
                    <StatBox label="Female" v1={stats.f.tot} v2={stats.f.arr} v3={stats.f.pend} color="#e91e63" />
                </div>
                <div style={{marginTop:'10px', fontSize:'12px', textAlign:'center', color:'#555'}}>
                    <b>Arrived Breakdown:</b> Old Students: {stats.cat.old} | New Students: {stats.cat.new}
                </div>
            </div>

            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <select style={{...inputStyle, flex:1}} value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <button onClick={()=>setShowHistory(!showHistory)} style={{...btnStyle(showHistory), flexShrink:0}}>{showHistory ? <EyeOff size={16}/> : <History size={16}/>} {showHistory ? 'Hide Arrived' : 'View History'}</button>
            </div>
            
            <div style={{marginBottom:'20px'}}>
                <input style={{...inputStyle, padding:'15px', fontSize:'18px'}} placeholder="🔍 Search Name or Conf No..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
            </div>

            <div style={{height:'400px', overflowY:'auto'}}>
                {filtered.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px'}}>No pending students found matching filter.</div> : 
                filtered.map(p => (
                    <div key={p.participant_id} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <div style={{fontWeight:'bold', fontSize:'16px'}}>{p.full_name}</div>
                            <div style={{color:'#666', fontSize:'14px'}}>{p.conf_no} | Age: {p.age}</div>
                            <div style={{marginTop:'5px'}}>
                                {p.status === 'Gate Check-In' && <span style={{background:'#ffc107', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>AT GATE</span>}
                                {p.status === 'Attending' && <span style={{background:'#28a745', color:'white', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>INSIDE (DONE)</span>}
                                {p.status === 'Cancelled' && <span style={{background:'#dc3545', color:'white', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>CANCELLED</span>}
                                {(p.status === 'No Response' || !p.status) && <span style={{background:'#eee', padding:'2px 6px', borderRadius:'4px', fontSize:'12px'}}>PENDING</span>}
                            </div>
                        </div>
                        {p.status !== 'Attending' && p.status !== 'Gate Check-In' && p.status !== 'Cancelled' && (
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={()=>handleGateCheckIn(p)} style={{...btnStyle(true), background:'#007bff', color:'white', padding:'10px 20px'}}>Mark Arrived</button>
                                <button onClick={()=>handleGateCancel(p)} style={{...btnStyle(true), background:'#dc3545', color:'white', padding:'10px'}}>Cancel</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
