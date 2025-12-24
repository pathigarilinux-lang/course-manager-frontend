import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, BarChart2, Armchair } from 'lucide-react'; 
import { API_URL, styles } from '../config';
import Dashboard from './Dashboard'; 

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };
const tdPrint = { padding: '8px', border: '1px solid #000', fontSize:'12px', verticalAlign:'middle' };

export default function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [showKitchenReport, setShowKitchenReport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); 

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  // --- UPDATED SEATING STATS ENGINE (M/F Split) ---
  const seatingStats = useMemo(() => {
      // Structure: { total: 0, m: 0, f: 0 } for each type
      const stats = { 
          Chowky: { total: 0, m: 0, f: 0 }, 
          Chair: { total: 0, m: 0, f: 0 }, 
          BackRest: { total: 0, m: 0, f: 0 }, 
          Floor: { total: 0, m: 0, f: 0 } 
      };

      participants.forEach(p => {
          if(p.status === 'Cancelled') return;
          
          const type = p.special_seating || 'None';
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const genderKey = isMale ? 'm' : 'f';

          let category = 'Floor'; // Default
          if(type === 'Chowky') category = 'Chowky';
          else if(type === 'Chair') category = 'Chair';
          else if(type === 'BackRest') category = 'BackRest';

          stats[category].total++;
          stats[category][genderKey]++;
      });
      return stats;
  }, [participants]);

  const handleLocalChange = (field, value) => setEditingStudent(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) });
    setEditingStudent(null);
  };

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => { 
      const valA = a.conf_no || ''; 
      const valB = b.conf_no || ''; 
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); 
  });

  if (showKitchenReport) {
      const kitchenData = participants.filter(p => (p.evening_food && p.evening_food !== 'None') || (p.medical_info && p.medical_info.trim() !== ''));
      return (
          <div style={styles.card}>
              <div className="no-print"><button onClick={() => setShowKitchenReport(false)} style={styles.btn(false)}>← Back</button><button onClick={()=>window.print()} style={{...styles.toolBtn('#ff9800'), marginLeft:'10px'}}>Print</button></div>
              <div className="print-area">
                  <h1 style={{textAlign:'center'}}>Kitchen & Medical Report</h1>
                  <table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}>
                      <thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Evening Food</th><th style={thPrint}>Medical/Notes</th></tr></thead>
                      <tbody>{kitchenData.map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2>AT Panel</h2>
          <div style={{display:'flex', gap:'10px'}}>
             <button onClick={()=>setShowDashboard(!showDashboard)} style={styles.btn(showDashboard)}><BarChart2 size={16}/> {showDashboard ? 'Hide Stats' : 'View Arrival Stats'}</button>
             <button onClick={() => {setShowKitchenReport(true); setTimeout(() => window.print(), 500);}} disabled={!courseId} style={styles.toolBtn('#ff9800')}><Utensils size={16}/> Kitchen Report</button>
          </div>
      </div>

      {/* 1. SEATING LOGISTICS DASHBOARD (Enhanced M/F Split) */}
      {courseId && (
          <div style={{background:'linear-gradient(to right, #f8f9fa, #e9ecef)', padding:'20px', borderRadius:'12px', marginBottom:'25px', border:'1px solid #dee2e6', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                  <h3 style={{margin:'0 0 5px 0', color:'#495057', display:'flex', alignItems:'center', gap:'8px'}}>
                      <Armchair size={20}/> Dhamma Hall Setup Plan
                  </h3>
                  <div style={{fontSize:'12px', color:'#666'}}>Physical counts (Requested)</div>
              </div>
              <div style={{display:'flex', gap:'20px'}}>
                  {/* CHOWKY */}
                  <div style={{background:'white', padding:'10px 15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', textAlign:'center', borderBottom:'3px solid #007bff', minWidth:'100px'}}>
                      <div style={{fontSize:'24px', fontWeight:'bold', color:'#007bff'}}>{seatingStats.Chowky.total}</div>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#666', textTransform:'uppercase'}}>Chowky</div>
                      <div style={{fontSize:'10px', color:'#999', marginTop:'2px', background:'#f1f3f5', borderRadius:'4px', padding:'2px'}}>
                          M: <b>{seatingStats.Chowky.m}</b> | F: <b>{seatingStats.Chowky.f}</b>
                      </div>
                  </div>
                  {/* CHAIR */}
                  <div style={{background:'white', padding:'10px 15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', textAlign:'center', borderBottom:'3px solid #e91e63', minWidth:'100px'}}>
                      <div style={{fontSize:'24px', fontWeight:'bold', color:'#e91e63'}}>{seatingStats.Chair.total}</div>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#666', textTransform:'uppercase'}}>Chair</div>
                      <div style={{fontSize:'10px', color:'#999', marginTop:'2px', background:'#f1f3f5', borderRadius:'4px', padding:'2px'}}>
                          M: <b>{seatingStats.Chair.m}</b> | F: <b>{seatingStats.Chair.f}</b>
                      </div>
                  </div>
                  {/* BACKREST */}
                  <div style={{background:'white', padding:'10px 15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', textAlign:'center', borderBottom:'3px solid #fd7e14', minWidth:'100px'}}>
                      <div style={{fontSize:'24px', fontWeight:'bold', color:'#fd7e14'}}>{seatingStats.BackRest.total}</div>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#666', textTransform:'uppercase'}}>BackRest</div>
                      <div style={{fontSize:'10px', color:'#999', marginTop:'2px', background:'#f1f3f5', borderRadius:'4px', padding:'2px'}}>
                          M: <b>{seatingStats.BackRest.m}</b> | F: <b>{seatingStats.BackRest.f}</b>
                      </div>
                  </div>
                  {/* FLOOR */}
                  <div style={{background:'white', padding:'10px 15px', borderRadius:'8px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', textAlign:'center', borderBottom:'3px solid #28a745', minWidth:'100px'}}>
                      <div style={{fontSize:'24px', fontWeight:'bold', color:'#28a745'}}>{seatingStats.Floor.total}</div>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#666', textTransform:'uppercase'}}>Cushion</div>
                      <div style={{fontSize:'10px', color:'#999', marginTop:'2px', background:'#f1f3f5', borderRadius:'4px', padding:'2px'}}>
                          M: <b>{seatingStats.Floor.m}</b> | F: <b>{seatingStats.Floor.f}</b>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showDashboard && (
          <div style={{marginBottom:'30px', borderBottom:'2px solid #eee', paddingBottom:'20px'}}>
              <Dashboard courses={courses} externalData={{ participants }} role="teacher" />
          </div>
      )}

      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <select style={styles.input} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <input style={styles.input} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
      </div>
      {courseId && (
        <div style={{maxHeight:'500px', overflowY:'auto'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}>
               <th style={{padding:'10px'}}>S.N.</th>
               <th style={{padding:'10px'}}>Name</th>
               <th style={{padding:'10px', cursor:'pointer'}} onClick={toggleSort}>Conf {sortOrder==='asc'?'▲':'▼'}</th>
               <th style={{padding:'10px'}}>Special SEAT</th>
               <th style={{padding:'10px'}}>Food</th>
               <th style={{padding:'10px'}}>Medical</th>
               <th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>{filtered.map((p, i) => (
               <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                 <td style={{padding:'10px', color:'#777'}}>{i+1}</td>
                 <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td>
                 <td style={{padding:'10px'}}>{p.conf_no}</td>
                 <td style={{padding:'10px'}}>
                     {p.special_seating === 'Chair' && '🪑 '} 
                     {p.special_seating === 'Chowky' && '🧘 '}
                     {p.special_seating || '-'}
                 </td>
                 <td style={{padding:'10px'}}>{p.evening_food || '-'}</td>
                 <td style={{padding:'10px'}}>{p.medical_info || '-'}</td>
                 <td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={{...styles.toolBtn('#007bff'), padding:'5px 10px'}}>✏️ Detail</button></td>
               </tr>
             ))}</tbody>
           </table>
        </div>
      )}
      {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Update: {editingStudent.full_name}</h3><form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}><div><label style={styles.label}>Special Seating</label><select style={styles.input} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div><div><label style={styles.label}>Evening Food</label><select style={styles.input} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select></div><div><label style={styles.label}>Medical</label><textarea style={{...styles.input, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleLocalChange('medical_info', e.target.value)} /></div><div><label style={styles.label}>Notes</label><input style={styles.input} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} /></div><div style={{textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={styles.btn(false)}>Cancel</button><button type="submit" style={styles.btn(true)}>Save</button></div></form></div></div>)}
    </div>
  );
}
