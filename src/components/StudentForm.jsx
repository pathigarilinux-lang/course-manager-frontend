import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Save, Search, CheckCircle, AlertTriangle, X, Printer, Edit, Trash2, Filter } from 'lucide-react';
import { API_URL, styles } from '../config';
import { printStudentToken } from '../utils/printGenerator';

// --- DATA HELPERS ---
const getCategory = (conf) => { 
    if(!conf) return '-'; 
    const s = conf.toUpperCase(); 
    if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; 
    if (s.startsWith('N')) return 'NEW'; 
    return 'Other'; 
};

export default function StudentForm({ courseId, onStudentAdded }) {
  // --- STATE MANAGEMENT ---
  const [mode, setMode] = useState('checkin'); // 'form' or 'checkin'
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, OLD, NEW
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Initial State
  const initialForm = {
      full_name: '', 
      age: '', 
      gender: 'Male', 
      conf_no: '', 
      room_no: '', 
      dining_seat_no: '', 
      pagoda_cell_no: '',
      mobile_locker_no: '', 
      valuables_locker_no: '', 
      laundry_token_no: '',
      status: 'Attending',
      remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // --- DATA LOADING ---
  const loadStudents = async () => {
      if (!courseId) return;
      try {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          if (res.ok) {
              const data = await res.json();
              setStudents(Array.isArray(data) ? data : []);
          }
      } catch (err) { console.error("Load Error:", err); }
  };

  useEffect(() => { loadStudents(); }, [courseId]);

  // --- ACTIONS ---
  
  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!courseId) return alert("Please select a course first.");
      setIsSubmitting(true);
      
      const endpoint = editingId ? `${API_URL}/participants/${editingId}` : `${API_URL}/courses/${courseId}/participants`;
      const method = editingId ? 'PUT' : 'POST';
      
      try {
          const res = await fetch(endpoint, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          
          if (res.ok) {
              alert(editingId ? "✅ Student Updated Successfully" : "✅ Student Added Successfully");
              setFormData(initialForm);
              setEditingId(null);
              setMode('checkin'); // Auto-switch back to list
              loadStudents();
              if (onStudentAdded) onStudentAdded();
          } else {
              const err = await res.json();
              alert("❌ Failed: " + (err.error || "Unknown Error"));
          }
      } catch (err) { 
          console.error(err); 
          alert("Network Error: Could not save."); 
      }
      setIsSubmitting(false);
  };

  // ✅ QUICK UPDATE (For inline inputs in the table)
  const handleQuickUpdate = async (id, field, value) => {
      // 1. Optimistic UI Update
      setStudents(prev => prev.map(s => s.participant_id === id ? { ...s, [field]: value } : s));
      
      // 2. Background API Call
      try {
          const student = students.find(s => s.participant_id === id);
          if(!student) return;

          await fetch(`${API_URL}/participants/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...student, [field]: value })
          });
      } catch (e) { 
          console.error("Quick Update Failed", e); 
          // Revert logic could go here
      }
  };

  const handleEdit = (student) => {
      setFormData(student);
      setEditingId(student.participant_id);
      setMode('form');
  };

  const handleDelete = async (id) => {
      if(!window.confirm("🗑️ Are you sure you want to delete this student?")) return;
      try {
          await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' });
          loadStudents();
      } catch (e) { alert("Delete failed"); }
  };

  // --- FILTERING ---
  const filteredList = useMemo(() => {
      return students.filter(s => {
          const matchesSearch = (s.full_name||'').toLowerCase().includes(search.toLowerCase()) || 
                                (s.conf_no||'').toLowerCase().includes(search.toLowerCase());
          if(!matchesSearch) return false;

          const cat = getCategory(s.conf_no);
          if(filterType === 'OLD') return cat === 'OLD';
          if(filterType === 'NEW') return cat === 'NEW';
          
          return true;
      });
  }, [students, search, filterType]);

  // --- RENDER FORM VIEW ---
  if (mode === 'form') {
      return (
          <div style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                  <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#007bff'}}>
                      {editingId ? <Edit size={20}/> : <UserPlus size={20}/>}
                      {editingId ? 'Edit Student Details' : 'Registration Form'}
                  </h3>
                  <button onClick={() => { setMode('checkin'); setEditingId(null); setFormData(initialForm); }} style={styles.btn(false)}>
                      <X size={16}/> Cancel & Return
                  </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{display:'grid', gap:'20px'}}>
                  {/* Personal Info */}
                  <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', border:'1px solid #e9ecef'}}>
                      <h4 style={{margin:'0 0 15px 0', color:'#555'}}>Personal Information</h4>
                      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'15px', marginBottom:'15px'}}>
                          <div><label style={styles.label}>Full Name *</label><input required style={styles.input} value={formData.full_name} onChange={e=>setFormData({...formData, full_name:e.target.value})} placeholder="Enter full name"/></div>
                          <div><label style={styles.label}>Conf No *</label><input required style={styles.input} value={formData.conf_no} onChange={e=>setFormData({...formData, conf_no:e.target.value})} placeholder="e.g. OM20"/></div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                          <div><label style={styles.label}>Age</label><input type="number" style={styles.input} value={formData.age} onChange={e=>setFormData({...formData, age:e.target.value})} /></div>
                          <div><label style={styles.label}>Gender</label><select style={styles.input} value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
                          <div><label style={styles.label}>Status</label><select style={styles.input} value={formData.status} onChange={e=>setFormData({...formData, status:e.target.value})}><option>Attending</option><option>Checked In</option><option>Cancelled</option><option>No-Show</option></select></div>
                      </div>
                  </div>

                  {/* Allocation Info */}
                  <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'8px', border:'1px solid #bbdefb'}}>
                      <h4 style={{margin:'0 0 15px 0', color:'#0d47a1'}}>Accommodation & Seating</h4>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                          <div><label style={styles.label}>Room No</label><input style={styles.input} value={formData.room_no||''} onChange={e=>setFormData({...formData, room_no:e.target.value})} placeholder="Room"/></div>
                          <div><label style={styles.label}>Dining Seat</label><input style={styles.input} value={formData.dining_seat_no||''} onChange={e=>setFormData({...formData, dining_seat_no:e.target.value})} placeholder="Seat"/></div>
                          <div><label style={styles.label}>Pagoda Cell</label><input style={styles.input} value={formData.pagoda_cell_no||''} onChange={e=>setFormData({...formData, pagoda_cell_no:e.target.value})} placeholder="Cell"/></div>
                      </div>
                  </div>

                  {/* Locker Info */}
                  <div style={{background:'#fff3e0', padding:'15px', borderRadius:'8px', border:'1px solid #ffe0b2'}}>
                      <h4 style={{margin:'0 0 15px 0', color:'#e65100'}}>Lockers & Tokens</h4>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                          <div><label style={styles.label}>Mobile Locker</label><input style={styles.input} value={formData.mobile_locker_no||''} onChange={e=>setFormData({...formData, mobile_locker_no:e.target.value})} placeholder="M-Locker"/></div>
                          <div><label style={styles.label}>Valuables Locker</label><input style={styles.input} value={formData.valuables_locker_no||''} onChange={e=>setFormData({...formData, valuables_locker_no:e.target.value})} placeholder="V-Locker"/></div>
                          <div><label style={styles.label}>Laundry Token</label><input style={styles.input} value={formData.laundry_token_no||''} onChange={e=>setFormData({...formData, laundry_token_no:e.target.value})} placeholder="Token #"/></div>
                      </div>
                  </div>

                  <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                      <button type="submit" disabled={isSubmitting} style={{...styles.btn(true), background:'#28a745', color:'white', flex:1, justifyContent:'center', padding:'12px'}}>
                          <Save size={18}/> {isSubmitting ? 'Saving...' : (editingId ? 'Update Student Record' : 'Save New Student')}
                      </button>
                  </div>
              </form>
          </div>
      );
  }

  // --- RENDER LIST VIEW (CHECK-IN) ---
  return (
    <div style={styles.card}>
      {/* HEADER & TOOLS */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
              <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                  <CheckCircle size={24} color="#28a745"/> Onboarding Check-In
              </h3>
              <button onClick={() => setMode('form')} style={{...styles.quickBtn(true), background:'#007bff', color:'white'}}>
                  <UserPlus size={16}/> Add Student
              </button>
          </div>
          
          <div style={{display:'flex', gap:'10px'}}>
              {/* Filter Buttons */}
              <div style={{display:'flex', background:'#f1f3f5', padding:'4px', borderRadius:'8px'}}>
                  {['ALL', 'OLD', 'NEW'].map(f => (
                      <button 
                          key={f} 
                          onClick={()=>setFilterType(f)} 
                          style={{
                              padding:'6px 12px', border:'none', borderRadius:'6px', 
                              background: filterType===f ? 'white' : 'transparent',
                              color: filterType===f ? '#333' : '#777',
                              fontWeight: filterType===f ? 'bold' : 'normal',
                              cursor:'pointer', fontSize:'12px',
                              boxShadow: filterType===f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                          }}
                      >
                          {f}
                      </button>
                  ))}
              </div>

              {/* Search */}
              <div style={{position:'relative'}}>
                  <Search size={16} style={{position:'absolute', left:'10px', top:'10px', color:'#999'}}/>
                  <input 
                      placeholder="Search Name or ID..." 
                      value={search} 
                      onChange={e=>setSearch(e.target.value)} 
                      style={{...styles.input, paddingLeft:'35px', width:'250px', borderRadius:'20px'}} 
                  />
              </div>
          </div>
      </div>

      {/* TABLE */}
      <div style={{maxHeight:'650px', overflowY:'auto', border:'1px solid #eee', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.02)'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
              <thead style={{position:'sticky', top:0, background:'#f8f9fa', zIndex:10}}>
                  <tr style={{textAlign:'left', color:'#555', fontSize:'11px', textTransform:'uppercase'}}>
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd'}}>Name / ID</th>
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd'}}>Room</th>
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd'}}>Dining</th>
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd'}}>Pagoda</th>
                      
                      {/* ✅ FIXED HEADERS FOR UNIFORMITY */}
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd', width:'90px'}}>Mobile Lkr</th>
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd', width:'90px'}}>Valuables</th>
                      {/* ✅ MISSING HEADER RESTORED */}
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd', width:'90px'}}>Laundry</th>
                      
                      <th style={{padding:'15px', borderBottom:'2px solid #ddd', textAlign:'right'}}>Action</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredList.map(s => {
                      const cat = getCategory(s.conf_no);
                      return (
                          <tr key={s.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: 'white', transition:'background 0.2s', ':hover':{background:'#f8f9fa'}}}>
                              <td style={{padding:'15px'}}>
                                  <div style={{fontWeight:'bold', color:'#333', fontSize:'14px'}}>{s.full_name}</div>
                                  <div style={{fontSize:'11px', color:'#888', marginTop:'2px'}}>
                                      <span style={{background: cat==='OLD'?'#e3f2fd':'#fff3e0', color: cat==='OLD'?'#0d47a1':'#e65100', padding:'2px 6px', borderRadius:'4px', marginRight:'5px'}}>{s.conf_no}</span>
                                      {s.age} yrs • {s.gender}
                                  </div>
                              </td>
                              <td style={{padding:'15px', fontWeight:'bold', color:'#007bff'}}>{s.room_no || '-'}</td>
                              <td style={{padding:'15px'}}>{s.dining_seat_no || '-'}</td>
                              <td style={{padding:'15px'}}>{s.pagoda_cell_no || '-'}</td>
                              
                              {/* ✅ UNIFORM INPUT SIZES (80px) */}
                              <td style={{padding:'15px'}}>
                                  <input 
                                      placeholder="-" 
                                      value={s.mobile_locker_no || ''} 
                                      onChange={(e) => handleQuickUpdate(s.participant_id, 'mobile_locker_no', e.target.value)}
                                      style={{width:'80px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc', textAlign:'center', fontWeight:'bold'}} 
                                  />
                              </td>
                              <td style={{padding:'15px'}}>
                                  <input 
                                      placeholder="-" 
                                      value={s.valuables_locker_no || ''} 
                                      onChange={(e) => handleQuickUpdate(s.participant_id, 'valuables_locker_no', e.target.value)}
                                      style={{width:'80px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc', textAlign:'center', fontWeight:'bold'}} 
                                  />
                              </td>
                              <td style={{padding:'15px'}}>
                                  <input 
                                      placeholder="-" 
                                      value={s.laundry_token_no || ''} 
                                      onChange={(e) => handleQuickUpdate(s.participant_id, 'laundry_token_no', e.target.value)}
                                      style={{width:'80px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc', textAlign:'center', fontWeight:'bold'}} 
                                  />
                              </td>

                              <td style={{padding:'15px', textAlign:'right'}}>
                                  <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                      <button onClick={() => printStudentToken(s, '')} title="Print Seat Token" style={{padding:'6px', background:'#e3f2fd', color:'#0d47a1', border:'1px solid #bbdefb', borderRadius:'6px', cursor:'pointer'}}>
                                          <Printer size={16}/>
                                      </button>
                                      <button onClick={() => handleEdit(s)} title="Edit Details" style={{padding:'6px', background:'white', color:'#555', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer'}}>
                                          <Edit size={16}/>
                                      </button>
                                      <button onClick={() => handleDelete(s.participant_id)} title="Delete" style={{padding:'6px', background:'white', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer'}}>
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
          {filteredList.length === 0 && <div style={{textAlign:'center', padding:'40px', color:'#999', fontStyle:'italic'}}>No students found for this course.</div>}
      </div>
    </div>
  );
}
