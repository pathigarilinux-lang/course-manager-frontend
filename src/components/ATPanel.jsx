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
      if (courseId) {
          fetch(`${API_URL}/courses/${courseId}/participants`)
            .then(res => res.json())
            .then(data => {
                // ✅ SAFETY CHECK: Ensure data is an array before setting state
                setParticipants(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error("Error fetching participants:", err);
                setParticipants([]);
            });
      } else {
          setParticipants([]);
      }
  }, [courseId]);

  // --- SEATING STATS ENGINE ---
  const seatingStats = useMemo(() => {
      const stats = { 
          Chowky: { total: 0, m: 0, f: 0 }, 
          Chair: { total: 0, m: 0, f: 0 }, 
          BackRest: { total: 0, m: 0, f: 0 }, 
          Cushion: { total: 0, m: 0, f: 0 },
          Bench: { total: 0, m: 0, f: 0 },
          None: { total: 0, m: 0, f: 0 }
      };
      
      // ✅ SAFETY CHECK: (participants || [])
      (participants || []).forEach(p => {
          if (p.status !== 'Attending') return;
          const type = p.special_seating || 'None';
          const gender = (p.gender || '').toLowerCase();
          const isMale = gender.startsWith('m');
          
          if (!stats[type]) stats[type] = { total: 0, m: 0, f: 0 };
          
          stats[type].total++;
          if(isMale) stats[type].m++; else stats[type].f++;
      });
      return stats;
  }, [participants]);

  // ✅ UPDATED FILTER LOGIC: Search by Name OR Conf No
  const filteredList = useMemo(() => {
      // ✅ SAFETY CHECK
      if (!Array.isArray(participants)) return [];

      let list = participants.filter(p => p.status === 'Attending');
      
      if (activeFilter === 'medical') list = list.filter(p => p.medical_info);
      if (activeFilter === 'food') list = list.filter(p => p.food_allergy);
      if (activeFilter === 'seating') list = list.filter(p => p.special_seating && p.special_seating !== 'None');

      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          list = list.filter(p => 
              (p.full_name || '').toLowerCase().includes(lower) || 
              (p.conf_no || '').toLowerCase().includes(lower)
          );
      }
      return list;
  }, [participants, searchTerm, activeFilter]);

  const handleEditSave = async (e) => {
      e.preventDefault();
      try {
          await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editingStudent)
          });
          // Refresh list
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const data = await res.json();
          setParticipants(Array.isArray(data) ? data : []);
          setEditingStudent(null);
      } catch (err) { alert("Failed to save"); }
  };

  const navigateStudent = (dir) => {
      if(!editingStudent) return;
      const idx = filteredList.findIndex(p => p.participant_id === editingStudent.participant_id);
      if(idx === -1) return;
      const newIdx = idx + dir;
      if(newIdx >= 0 && newIdx < filteredList.length) {
          setEditingStudent(filteredList[newIdx]);
      }
  };

  const getStats = () => {
      if (!courseId || !Array.isArray(participants)) return null;
      const active = participants.filter(p => p.status === 'Attending');
      return {
          total: active.length,
          m: active.filter(p => (p.gender||'').toLowerCase().startsWith('m')).length,
          f: active.filter(p => (p.gender||'').toLowerCase().startsWith('f')).length,
          old: active.filter(p => (p.conf_no||'').toUpperCase().startsWith('O')).length,
          new: active.filter(p => (p.conf_no||'').toUpperCase().startsWith('N')).length,
      };
  };

  const stats = getStats();

  if (showKitchenReport) {
      const kitchenList = (participants || []).filter(p => p.status === 'Attending' && (p.food_allergy || (p.dining_seat_type && p.dining_seat_type !== 'Floor')));
      return (
          <div style={styles.card}>
              <div className="no-print" style={{marginBottom:'20px'}}>
                  <button onClick={() => setShowKitchenReport(false)} style={styles.btn(false)}>← Back</button>
                  <button onClick={() => window.print()} style={{...styles.toolBtn('#007bff'), marginLeft:'10px'}}>🖨️ Print Kitchen Report</button>
              </div>
              <div className="print-area">
                  <h2 style={{textAlign:'center', textTransform:'uppercase'}}>Kitchen & Dining Report</h2>
                  <h3 style={{textAlign:'center', color:'#666'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3>
                  
                  <div style={{display:'flex', gap:'20px', marginBottom:'20px', justifyContent:'center'}}>
                      <div style={{border:'1px solid #000', padding:'10px'}}><strong>Total Students:</strong> {stats?.total}</div>
                      <div style={{border:'1px solid #000', padding:'10px'}}><strong>M:</strong> {stats?.m} | <strong>F:</strong> {stats?.f}</div>
                  </div>

                  <h3 style={{borderBottom:'2px solid #000'}}>⚠️ Special Diet & Allergies</h3>
                  <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'30px'}}>
                      <thead><tr><th style={thPrint}>Seat</th><th style={thPrint}>Name</th><th style={thPrint}>Issue / Requirement</th></tr></thead>
                      <tbody>
                          {kitchenList.filter(p=>p.food_allergy).map(p => (
                              <tr key={p.participant_id}>
                                  <td style={tdPrint}><strong>{p.dining_seat_no}</strong></td>
                                  <td style={tdPrint}>{p.full_name} ({p.gender})</td>
                                  <td style={tdPrint}><strong style={{color:'red'}}>{p.food_allergy}</strong></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>

                  <h3 style={{borderBottom:'2px solid #000'}}>🪑 Dining Seating (Table/Chair)</h3>
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead><tr><th style={thPrint}>Seat</th><th style={thPrint}>Name</th><th style={thPrint}>Type</th></tr></thead>
                      <tbody>
                          {kitchenList.filter(p=>p.dining_seat_type && p.dining_seat_type !== 'Floor').map(p => (
                              <tr key={p.participant_id}>
                                  <td style={tdPrint}><strong>{p.dining_seat_no}</strong></td>
                                  <td style={tdPrint}>{p.full_name}</td>
                                  <td style={tdPrint}>{p.dining_seat_type}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  // ✅ DASHBOARD VIEW RENDER
  if (showDashboard) {
      return (
          <div>
              <div style={{marginBottom:'20px'}}>
                  <button onClick={() => setShowDashboard(false)} style={styles.btn(false)}>← Back to List</button>
              </div>
              <Dashboard courses={courses} /> 
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>🎓 AT Panel</h2>
              <select style={styles.input} onChange={e=>setCourseId(e.target.value)} value={courseId}>
                  <option value="">-- Select Course --</option>
                  {courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
              </select>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
              <button onClick={()=>setShowDashboard(true)} style={{...styles.quickBtn(false), background:'#6f42c1', color:'white'}}><BarChart2 size={16}/> Live Dashboard</button>
              <button onClick={()=>setShowKitchenReport(true)} disabled={!courseId} style={styles.quickBtn(false)}><Utensils size={16}/> Kitchen Report</button>
          </div>
      </div>

      {stats && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', marginBottom:'20px'}}>
              <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'10px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#0d47a1', fontWeight:'bold'}}>TOTAL STUDENTS</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#1565c0'}}>{stats.total}</div>
                  <div style={{fontSize:'11px', color:'#555'}}>Old: {stats.old} | New: {stats.new}</div>
              </div>
              <div style={{background:'#e8f5e9', padding:'15px', borderRadius:'10px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#1b5e20', fontWeight:'bold'}}>MALE / FEMALE</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#2e7d32'}}>{stats.m} / {stats.f}</div>
              </div>
              <div style={{background:'#fff3e0', padding:'15px', borderRadius:'10px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#e65100', fontWeight:'bold'}}>SPECIAL SEATING</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#ef6c00'}}>{seatingStats.Chowky.total + seatingStats.Chair.total}</div>
                  <div style={{fontSize:'11px', color:'#555'}}>Chowky: {seatingStats.Chowky.total} | Chair: {seatingStats.Chair.total}</div>
              </div>
              <div style={{background:'#fce4ec', padding:'15px', borderRadius:'10px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#880e4f', fontWeight:'bold'}}>MEDICAL / DIET</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#c2185b'}}>{participants.filter(p=>p.medical_info || p.food_allergy).length}</div>
              </div>
          </div>
      )}

      {/* SEARCH & FILTER BAR */}
      <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'20px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', gap:'5px'}}>
              {['all', 'medical', 'food', 'seating'].map(f => (
                  <button key={f} onClick={()=>setActiveFilter(f)} style={{...styles.quickBtn(activeFilter===f), textTransform:'capitalize'}}>{f === 'all' ? 'Show All' : f}</button>
              ))}
          </div>
          <div style={{position:'relative', width:'300px'}}>
              <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#999'}}/>
              <input 
                  style={{...styles.input, paddingLeft:'35px', width:'100%'}} 
                  placeholder="Search Name or Conf No..." 
                  value={searchTerm}
                  onChange={e=>setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* STUDENT GRID */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'15px'}}>
          {filteredList.map(p => (
              <div key={p.participant_id} onClick={() => setEditingStudent(p)} style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'15px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 2px 5px rgba(0,0,0,0.02)', position:'relative', borderLeft: `4px solid ${p.gender === 'Male' ? '#007bff' : '#e91e63'}`}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                      <span style={{fontWeight:'bold', fontSize:'14px'}}>{p.full_name}</span>
                      <span style={{fontSize:'11px', background:'#eee', padding:'2px 6px', borderRadius:'4px'}}>{p.conf_no}</span>
                  </div>
                  <div style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>
                      {p.age} yrs | {getCategory(p.conf_no)} | {p.room_no || 'No Room'}
                  </div>
                  
                  {/* TAGS */}
                  <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                      {p.medical_info && <span style={{fontSize:'10px', background:'#ffebee', color:'#c62828', padding:'2px 6px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'3px'}}><AlertCircle size={10}/> MED</span>}
                      {p.food_allergy && <span style={{fontSize:'10px', background:'#fff3e0', color:'#e65100', padding:'2px 6px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'3px'}}><Utensils size={10}/> FOOD</span>}
                      {p.special_seating && p.special_seating !== 'None' && <span style={{fontSize:'10px', background:'#e3f2fd', color:'#0d47a1', padding:'2px 6px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'3px'}}><Armchair size={10}/> {p.special_seating}</span>}
                  </div>
              </div>
          ))}
      </div>

      {/* EDIT MODAL */}
      {editingStudent && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', width:'600px', maxHeight:'90vh', overflowY:'auto', borderRadius:'12px', padding:'25px', position:'relative', animation:'fadeIn 0.2s'}}>
                  <button onClick={() => setEditingStudent(null)} style={{position:'absolute', top:'15px', right:'15px', background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
                  
                  <h2 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>{editingStudent.full_name} <span style={{fontSize:'14px', color:'#666', fontWeight:'normal'}}>({editingStudent.conf_no})</span></h2>
                  
                  <form onSubmit={handleEditSave}>
                      {/* SECTION 1: SEATING */}
                      <div style={{marginBottom:'20px'}}>
                          <h4 style={{color:'#007bff', display:'flex', alignItems:'center', gap:'8px'}}><Armchair size={18}/> Dhamma Hall Seating</h4>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                              <div>
                                  <label style={styles.label}>Seat Type</label>
                                  <select style={styles.input} value={editingStudent.special_seating || 'None'} onChange={e => setEditingStudent({...editingStudent, special_seating: e.target.value})}>
                                      <option>None</option><option>Chowky</option><option>Chair</option><option>BackRest</option><option>Bench</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={styles.label}>Seat Number</label>
                                  <input style={styles.input} value={editingStudent.dhamma_hall_seat_no || ''} onChange={e => setEditingStudent({...editingStudent, dhamma_hall_seat_no: e.target.value})} placeholder="e.g. A1" />
                              </div>
                          </div>
                      </div>

                      {/* SECTION 2: KITCHEN */}
                      <div style={{marginBottom:'20px'}}>
                          <h4 style={{color:'#e65100', display:'flex', alignItems:'center', gap:'8px'}}><Utensils size={18}/> Kitchen & Dining</h4>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                              <div>
                                  <label style={styles.label}>Dining Seat Type</label>
                                  <select style={styles.input} value={editingStudent.dining_seat_type || 'Floor'} onChange={e => setEditingStudent({...editingStudent, dining_seat_type: e.target.value})}>
                                      <option>Floor</option><option>Table</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={styles.label}>Dining Seat No</label>
                                  <input style={styles.input} value={editingStudent.dining_seat_no || ''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} />
                              </div>
                          </div>
                          <div style={{marginTop:'10px'}}>
                              <label style={styles.label}>Food Allergies / Diet</label>
                              <textarea style={{...styles.input, height:'60px'}} value={editingStudent.food_allergy || ''} onChange={e => setEditingStudent({...editingStudent, food_allergy: e.target.value})} placeholder="e.g. No Spicy, Gluten Free..." />
                          </div>
                      </div>

                      {/* SECTION 3: MEDICAL */}
                      <div style={{marginBottom:'20px'}}>
                          <h4 style={{color:'#c2185b', display:'flex', alignItems:'center', gap:'8px'}}><AlertCircle size={18}/> Medical & Health</h4>
                          <textarea style={{...styles.input, height:'80px', border:'1px solid #f8bbd0', background:'#fff0f5'}} value={editingStudent.medical_info || ''} onChange={e => setEditingStudent({...editingStudent, medical_info: e.target.value})} placeholder="Notes on physical/mental health..." />
                      </div>

                      {/* FOOTER ACTIONS */}
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
