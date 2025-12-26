import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, BarChart2, Armchair, Filter, ChevronLeft, ChevronRight, AlertCircle, Save, X, Search } from 'lucide-react'; 
import { API_URL, styles } from '../config';
import Dashboard from './Dashboard'; 

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };
const tdPrint = { padding: '8px', border: '1px solid #000', fontSize:'12px', verticalAlign:'middle' };

export default function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, medical, food, seating
  const [showKitchenReport, setShowKitchenReport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); 

  useEffect(() => { 
      if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); 
  }, [courseId]);

  // --- SEATING STATS ENGINE ---
  const seatingStats = useMemo(() => {
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
          let category = 'Floor'; 
          if(type === 'Chowky') category = 'Chowky';
          else if(type === 'Chair') category = 'Chair';
          else if(type === 'BackRest') category = 'BackRest';
          stats[category].total++;
          stats[category][genderKey]++;
      });
      return stats;
  }, [participants]);

  // --- FILTERING LOGIC ---
  const filteredList = useMemo(() => {
      let data = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (activeFilter === 'medical') data = data.filter(p => p.medical_info && p.medical_info.trim().length > 0);
      if (activeFilter === 'food') data = data.filter(p => p.evening_food && p.evening_food !== 'None');
      if (activeFilter === 'seating') data = data.filter(p => p.special_seating && p.special_seating !== 'None' && p.special_seating !== 'Floor');
      
      // Sort by Conf No (Old students first usually helps ATs)
      return data.sort((a, b) => (a.conf_no || '').localeCompare(b.conf_no || ''));
  }, [participants, searchTerm, activeFilter]);

  // --- ACTIONS ---
  const handleLocalChange = (field, value) => setEditingStudent(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    // Optimistic Update
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(editingStudent) 
    });
    // Don't close modal, just show success or stay ready for next navigation
  };

  const navigateStudent = (direction) => {
      if (!editingStudent) return;
      const currentIndex = filteredList.findIndex(p => p.participant_id === editingStudent.participant_id);
      if (currentIndex === -1) return;
      
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < filteredList.length) {
          setEditingStudent(filteredList[newIndex]); // Switch to next student immediately
      }
  };

  // --- KITCHEN REPORT VIEW ---
  if (showKitchenReport) {
      const kitchenData = participants.filter(p => (p.evening_food && p.evening_food !== 'None') || (p.medical_info && p.medical_info.trim() !== ''));
      return (
          <div style={styles.card}>
              <div className="no-print" style={{marginBottom:'20px', display:'flex', gap:'10px'}}>
                  <button onClick={() => setShowKitchenReport(false)} style={styles.btn(false)}>← Back</button>
                  <button onClick={()=>window.print()} style={{...styles.toolBtn('#ff9800')}}>🖨️ Print Report</button>
              </div>
              <div className="print-area">
                  <h1 style={{textAlign:'center', margin:'0 0 20px 0'}}>Kitchen & Medical Report</h1>
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Evening Food</th><th style={thPrint}>Medical/Notes</th></tr></thead>
                      <tbody>{kitchenData.map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <h2 style={{margin:0, color:'#e65100', display:'flex', alignItems:'center', gap:'10px'}}><Armchair size={24}/> AT Console</h2>
          <div style={{display:'flex', gap:'10px'}}>
             <button onClick={()=>setShowDashboard(!showDashboard)} style={styles.btn(showDashboard)}><BarChart2 size={16}/> Stats</button>
             <button onClick={() => {setShowKitchenReport(true);}} disabled={!courseId} style={styles.toolBtn('#ff9800')}><Utensils size={16}/> Kitchen List</button>
          </div>
      </div>

      {/* DASHBOARD TOGGLE */}
      {showDashboard && courseId && (
          <div style={{marginBottom:'30px', animation:'fadeIn 0.3s'}}>
              {/* Seating Stats */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', marginBottom:'20px'}}>
                  {['Chowky','Chair','BackRest','Floor'].map(type => (
                      <div key={type} style={{background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'10px', textAlign:'center', borderTop: type==='Floor' ? '3px solid #28a745' : '3px solid #e91e63'}}>
                          <div style={{fontSize:'11px', color:'#888', fontWeight:'bold', textTransform:'uppercase'}}>{type}</div>
                          <div style={{fontSize:'22px', fontWeight:'900', color:'#333'}}>{seatingStats[type].total}</div>
                          <div style={{fontSize:'11px', color:'#666'}}>M:{seatingStats[type].m} • F:{seatingStats[type].f}</div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* CONTROLS ROW */}
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center'}}>
        <select style={{...styles.input, maxWidth:'250px'}} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        
        {/* QUICK FILTERS */}
        <div style={{display:'flex', gap:'5px', background:'#f8f9fa', padding:'5px', borderRadius:'8px', border:'1px solid #e9ecef'}}>
            {['All', 'Medical', 'Food', 'Seating'].map(f => (
                <button 
                    key={f} 
                    onClick={() => setActiveFilter(f.toLowerCase())}
                    style={{
                        padding:'6px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'bold',
                        background: activeFilter === f.toLowerCase() ? '#e65100' : 'transparent',
                        color: activeFilter === f.toLowerCase() ? 'white' : '#666',
                        transition: 'all 0.2s'
                    }}
                >
                    {f}
                </button>
            ))}
        </div>

        <div style={{position:'relative', flex:1}}>
            <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#999'}}/>
            <input style={{...styles.input, paddingLeft:'35px', width:'100%'}} placeholder="Search student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
        </div>
      </div>

      {/* STUDENT LIST */}
      {courseId && (
        <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.03)'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead style={{background:'#f9f9f9', borderBottom:'1px solid #e0e0e0'}}>
               <tr>
                 <th style={{padding:'12px', textAlign:'left', color:'#666'}}>Room</th>
                 <th style={{padding:'12px', textAlign:'left', color:'#666'}}>Name / ID</th>
                 <th style={{padding:'12px', textAlign:'left', color:'#666'}}>Requirements</th>
                 <th style={{padding:'12px', textAlign:'right', color:'#666'}}>Update</th>
               </tr>
             </thead>
             <tbody>{filteredList.map((p, i) => {
               const hasMedical = p.medical_info && p.medical_info.trim().length > 0;
               return (
                 <tr key={p.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: hasMedical ? '#fff5f5' : 'white'}}>
                   <td style={{padding:'12px', fontWeight:'bold', color:'#333', width:'80px'}}>{p.room_no || '-'}</td>
                   <td style={{padding:'12px'}}>
                       <div style={{fontWeight:'bold', color:'#333'}}>{p.full_name}</div>
                       <div style={{fontSize:'11px', color:'#888'}}>{p.conf_no} • {p.age} Yrs</div>
                   </td>
                   <td style={{padding:'12px'}}>
                       <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                           {p.special_seating && p.special_seating !== 'None' && <span style={{fontSize:'11px', background:'#e3f2fd', color:'#0d47a1', padding:'2px 8px', borderRadius:'12px'}}>🪑 {p.special_seating}</span>}
                           {p.evening_food && p.evening_food !== 'None' && <span style={{fontSize:'11px', background:'#fff3e0', color:'#e65100', padding:'2px 8px', borderRadius:'12px'}}>🍋 {p.evening_food}</span>}
                           {hasMedical && <span style={{fontSize:'11px', background:'#ffebee', color:'#c62828', padding:'2px 8px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'4px'}}><AlertCircle size={10}/> Medical</span>}
                       </div>
                   </td>
                   <td style={{padding:'12px', textAlign:'right'}}>
                       <button onClick={() => setEditingStudent(p)} style={{background:'white', border:'1px solid #ddd', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', color:'#007bff', fontSize:'12px'}}>Edit</button>
                   </td>
                 </tr>
               );
             })}</tbody>
           </table>
           {filteredList.length === 0 && <div style={{padding:'30px', textAlign:'center', color:'#999'}}>No students found matching filters.</div>}
        </div>
      )}

      {/* 🚀 SUPERCHARGED EDIT MODAL */}
      {editingStudent && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'0', borderRadius:'12px', width:'500px', maxWidth:'95%', overflow:'hidden', boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                  
                  {/* Modal Header */}
                  <div style={{background:'#f8f9fa', padding:'15px 20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                          <div style={{fontSize:'18px', fontWeight:'bold', color:'#333'}}>{editingStudent.full_name}</div>
                          <div style={{fontSize:'12px', color:'#777'}}>{editingStudent.conf_no} • Room: {editingStudent.room_no}</div>
                      </div>
                      <button onClick={() => setEditingStudent(null)} style={{background:'transparent', border:'none', cursor:'pointer', color:'#999'}}><X size={20}/></button>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleSave} style={{padding:'20px'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                          <div>
                              <label style={styles.label}>Special Seating</label>
                              <select style={{...styles.input, width:'100%'}} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}>
                                  <option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option>
                              </select>
                          </div>
                          <div>
                              <label style={styles.label}>Evening Food</label>
                              <select style={{...styles.input, width:'100%'}} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}>
                                  <option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option>
                              </select>
                          </div>
                      </div>
                      <div style={{marginBottom:'15px'}}>
                          <label style={styles.label}>Medical / Health Issues</label>
                          <textarea 
                              style={{...styles.input, width:'100%', height:'60px', borderColor: editingStudent.medical_info ? '#ffcdd2' : '#ddd', background: editingStudent.medical_info ? '#fff5f5' : 'white'}} 
                              value={editingStudent.medical_info || ''} 
                              onChange={e => handleLocalChange('medical_info', e.target.value)}
                              placeholder="Enter medical details..." 
                          />
                      </div>
                      <div style={{marginBottom:'20px'}}>
                          <label style={styles.label}>Teacher Notes</label>
                          <input style={{...styles.input, width:'100%'}} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} placeholder="Private notes for AT..." />
                      </div>

                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>
                          {/* ⚡ RAPID NAVIGATION BUTTONS */}
                          <div style={{display:'flex', gap:'5px'}}>
                              <button type="button" onClick={() => navigateStudent(-1)} style={{padding:'8px 12px', background:'#f1f3f5', border:'none', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center'}} title="Previous Student"><ChevronLeft size={16}/></button>
                              <button type="button" onClick={() => navigateStudent(1)} style={{padding:'8px 12px', background:'#f1f3f5', border:'none', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center'}} title="Next Student"><ChevronRight size={16}/></button>
                          </div>

                          <div style={{display:'flex', gap:'10px'}}>
                              <button type="button" onClick={() => setEditingStudent(null)} style={styles.btn(false)}>Close</button>
                              <button type="submit" style={{...styles.btn(true), background:'#e65100', color:'white', display:'flex', alignItems:'center', gap:'6px'}}><Save size={16}/> Save Changes</button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
