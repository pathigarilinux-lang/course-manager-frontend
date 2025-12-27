import React, { useState, useEffect } from 'react';
import { User, Bed, ArrowRight, Save, RefreshCw, X, Edit2 } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function AutoAllocationTool({ courseId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('config'); // config | preview | saving
    const [stats, setStats] = useState({ males: [], females: [], mRooms: [], fRooms: [] });
    const [proposal, setProposal] = useState([]);

    // 1. Fetch Data
    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        Promise.all([
            fetch(`${API_URL}/courses/${courseId}/participants`).then(r => r.json()),
            fetch(`${API_URL}/rooms`).then(r => r.json()),
            fetch(`${API_URL}/rooms/occupancy`).then(r => r.json())
        ]).then(([students, allRooms, occupancy]) => {
            
            // Get Unassigned Students
            const unassigned = students.filter(s => 
                (s.status === 'Attending' || s.status === 'Confirmed' || s.status === 'Active') && 
                (!s.room_no || s.room_no === '')
            );

            // Get Occupied Room Numbers
            const occupiedRoomSet = new Set(occupancy.map(o => String(o.room_no)));

            // Get Empty Rooms
            const emptyRooms = allRooms.filter(r => !occupiedRoomSet.has(String(r.room_no)));

            setStats({
                males: unassigned.filter(s => (s.gender||'').toLowerCase().startsWith('m')),
                females: unassigned.filter(s => (s.gender||'').toLowerCase().startsWith('f')),
                mRooms: emptyRooms.filter(r => (r.gender_type||'').startsWith('M')).sort((a,b) => String(a.room_no).localeCompare(String(b.room_no), undefined, {numeric:true})),
                fRooms: emptyRooms.filter(r => (r.gender_type||'').startsWith('F')).sort((a,b) => String(a.room_no).localeCompare(String(b.room_no), undefined, {numeric:true}))
            });
            setLoading(false);
        });
    }, [courseId]);

    // 2. The Logic Engine
    const generateProposal = () => {
        const assignments = [];

        // Sorter: Old > Age
        const sorter = (a, b) => {
            const isOldA = (a.conf_no||'').match(/^[OS]/i) ? 1 : 0;
            const isOldB = (b.conf_no||'').match(/^[OS]/i) ? 1 : 0;
            if (isOldA !== isOldB) return isOldB - isOldA;
            return (b.age || 0) - (a.age || 0);
        };

        // Males
        const sortedMales = [...stats.males].sort(sorter);
        const limitM = Math.min(sortedMales.length, stats.mRooms.length);
        for (let i = 0; i < limitM; i++) {
            assignments.push({
                participantId: sortedMales[i].participant_id,
                name: sortedMales[i].full_name,
                gender: 'Male',
                category: (sortedMales[i].conf_no||'').match(/^[OS]/i) ? 'Old' : 'New',
                age: sortedMales[i].age,
                roomNo: stats.mRooms[i].room_no
            });
        }

        // Females
        const sortedFemales = [...stats.females].sort(sorter);
        const limitF = Math.min(sortedFemales.length, stats.fRooms.length);
        for (let i = 0; i < limitF; i++) {
            assignments.push({
                participantId: sortedFemales[i].participant_id,
                name: sortedFemales[i].full_name,
                gender: 'Female',
                category: (sortedFemales[i].conf_no||'').match(/^[OS]/i) ? 'Old' : 'New',
                age: sortedFemales[i].age,
                roomNo: stats.fRooms[i].room_no
            });
        }

        setProposal(assignments);
        setStep('preview');
    };

    // ✅ NEW: Handle Manual Room Change in Preview
    const handleRoomChange = (index, newRoomNo) => {
        const updated = [...proposal];
        updated[index].roomNo = newRoomNo;
        setProposal(updated);
    };

    // 3. Save
    const commitChanges = async () => {
        if (!window.confirm(`Are you sure you want to assign rooms to ${proposal.length} students?\nThis cannot be easily undone.`)) return;
        
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/accommodations/bulk-assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments: proposal })
            });
            if (res.ok) {
                alert("✅ Allocation Complete!");
                onSuccess();
                onClose();
            } else {
                throw new Error("Server failed to update");
            }
        } catch (err) {
            alert("❌ Error saving assignments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{padding:'40px', textAlign:'center', color:'#666'}}>Processing Data...</div>;

    // --- Helper to get currently assigned rooms (to prevent double booking in dropdown) ---
    const assignedRoomsSet = new Set(proposal.map(p => p.roomNo));

    return (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
            <div style={{background:'white', width:'900px', maxWidth:'95%', maxHeight:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', boxShadow:'0 10px 25px rgba(0,0,0,0.2)'}}>
                
                {/* Header */}
                <div style={{padding:'20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>✨ Auto-Allocation Assistant</h3>
                        <div style={{fontSize:'12px', color:'#777'}}>Drafting Tool • Review & Edit before Applying</div>
                    </div>
                    <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
                </div>

                {/* Body */}
                <div style={{flex:1, overflowY:'auto', padding:'20px'}}>
                    
                    {step === 'config' && (
                        <div style={{textAlign:'center', padding:'20px'}}>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                                <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'10px'}}>
                                    <h4 style={{color:'#0d47a1', margin:'0 0 10px 0'}}>MALE Pending</h4>
                                    <div style={{fontSize:'32px', fontWeight:'bold', color:'#0d47a1'}}>{stats.males.length}</div>
                                    <div style={{fontSize:'12px', color:'#555'}}>Available Beds: {stats.mRooms.length}</div>
                                </div>
                                <div style={{background:'#fce4ec', padding:'20px', borderRadius:'10px'}}>
                                    <h4 style={{color:'#c2185b', margin:'0 0 10px 0'}}>FEMALE Pending</h4>
                                    <div style={{fontSize:'32px', fontWeight:'bold', color:'#c2185b'}}>{stats.females.length}</div>
                                    <div style={{fontSize:'12px', color:'#555'}}>Available Beds: {stats.fRooms.length}</div>
                                </div>
                            </div>

                            {stats.males.length === 0 && stats.females.length === 0 ? (
                                <div style={{color:'#28a745', fontWeight:'bold'}}>✅ Everyone has a room! No action needed.</div>
                            ) : (
                                <button onClick={generateProposal} style={{...styles.btn(true), background:'#007bff', color:'white', padding:'15px 40px', fontSize:'16px', borderRadius:'30px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
                                    <RefreshCw size={18} style={{marginRight:'8px'}}/> Generate Draft Plan
                                </button>
                            )}
                        </div>
                    )}

                    {step === 'preview' && (
                        <div>
                            <div style={{marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={{fontWeight:'bold', color:'#333'}}>Proposed Assignments ({proposal.length})</div>
                                <div style={{fontSize:'12px', color:'#777', fontStyle:'italic'}}>Tip: Use dropdown to change rooms if needed.</div>
                            </div>
                            <div style={{border:'1px solid #ddd', borderRadius:'8px', overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                                    <thead style={{background:'#f1f1f1'}}>
                                        <tr>
                                            <th style={{padding:'10px', textAlign:'left'}}>Name</th>
                                            <th style={{padding:'10px', textAlign:'left'}}>Cat</th>
                                            <th style={{padding:'10px', textAlign:'left'}}>Age</th>
                                            <th style={{padding:'10px', textAlign:'center'}}>➡️</th>
                                            <th style={{padding:'10px', textAlign:'left'}}>Assigned Room (Editable)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proposal.map((p, i) => {
                                            // Calculate valid options for this specific row
                                            // Allow: Current Assigned Room OR (Any Free Room AND Not Taken by someone else in proposal)
                                            const pool = p.gender === 'Male' ? stats.mRooms : stats.fRooms;
                                            const validOptions = pool.filter(r => r.room_no === p.roomNo || !assignedRoomsSet.has(r.room_no));

                                            return (
                                                <tr key={i} style={{borderBottom:'1px solid #eee', background: p.gender === 'Male' ? '#f0f8ff' : '#fff0f5'}}>
                                                    <td style={{padding:'8px', fontWeight:'bold'}}>{p.name}</td>
                                                    <td style={{padding:'8px'}}><span style={{background: p.category==='Old'?'#007bff':'#ffc107', color: p.category==='Old'?'white':'black', padding:'2px 6px', borderRadius:'4px', fontSize:'11px', fontWeight:'bold'}}>{p.category}</span></td>
                                                    <td style={{padding:'8px'}}>{p.age}</td>
                                                    <td style={{padding:'8px', textAlign:'center', color:'#999'}}><ArrowRight size={14}/></td>
                                                    <td style={{padding:'8px'}}>
                                                        <select 
                                                            value={p.roomNo} 
                                                            onChange={(e) => handleRoomChange(i, e.target.value)}
                                                            style={{
                                                                padding:'6px', 
                                                                borderRadius:'4px', 
                                                                border:'1px solid #ccc', 
                                                                fontWeight:'bold', 
                                                                color:'#333', 
                                                                cursor:'pointer',
                                                                background:'white',
                                                                minWidth:'100px'
                                                            }}
                                                        >
                                                            {validOptions.map(r => (
                                                                <option key={r.room_id} value={r.room_no}>{r.room_no}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={{padding:'20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'flex-end', gap:'10px', background:'#f8f9fa'}}>
                    {step === 'preview' && (
                        <>
                            <button onClick={()=>setStep('config')} style={styles.btn(false)}>Discard & Back</button>
                            <button onClick={commitChanges} style={{...styles.btn(true), background:'#28a745', color:'white', padding:'10px 25px'}}>
                                <Save size={16} style={{marginRight:'8px'}}/> Confirm & Apply
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
