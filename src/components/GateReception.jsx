import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserX, Users, UserPlus, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function GateReception({ courses }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Pending, CheckedIn
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Walk-in State
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: '', gender: 'Male', phone: '' });

  // --- 1. LOAD DATA ---
  const loadParticipants = async () => {
    if (!selectedCourseId) return;
    setIsRefreshing(true);
    try {
        const res = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
        const data = await res.json();
        setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(err);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
      loadParticipants();
      // Optional: Auto-refresh every 30 seconds to keep stats live for multiple gatekeepers
      const interval = setInterval(loadParticipants, 30000);
      return () => clearInterval(interval);
  }, [selectedCourseId]);

  // --- 2. ACTIONS ---
  const handleGateCheckIn = async (student) => {
      // Optimistic Update (Update UI immediately for speed)
      setParticipants(prev => prev.map(p => p.participant_id === student.participant_id ? { ...p, status: 'Gate Check-In' } : p));
      
      try {
          const res = await fetch(`${API_URL}/gate-checkin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ participantId: student.participant_id })
          });
          if (!res.ok) throw new Error("Failed");
      } catch (err) {
          alert("Sync Error: Could not check in student.");
          loadParticipants(); // Revert on error
      }
  };

  const handleCancelStudent = async (student) => {
      if(!window.confirm(`Mark ${student.full_name} as Cancelled/No-Show?`)) return;
      
      try {
          const res = await fetch(`${API_URL}/gate-cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ participantId: student.participant_id })
          });
          if (res.ok) loadParticipants();
      } catch (err) { console.error(err); }
  };

  const handleWalkIn = async (e) => {
      e.preventDefault();
      if(!newStudent.fullName) return alert("Name is required");
      
      try {
          const payload = {
              courseId: selectedCourseId,
              fullName: newStudent.fullName,
              gender: newStudent.gender,
              email: '', // Optional for gate
              age: '',
              confNo: `WALK-${Date.now().toString().slice(-4)}`, // Generate temp ID
              coursesInfo: 'Walk-In'
          };

          const res = await fetch(`${API_URL}/participants`, {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify(payload)
          });

          if(res.ok) {
              alert(`✅ Walk-in Registered: ${newStudent.fullName}`);
              setShowWalkIn(false);
              setNewStudent({ fullName: '', gender: 'Male', phone: '' });
              loadParticipants();
          } else {
              const err = await res.json();
              alert(`Error: ${err.error}`);
          }
      } catch(err) { console.error(err); }
  };

  // --- 3. FILTERING & STATS ---
  const filteredList = useMemo(() => {
      return participants.filter(p => {
          const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (p.conf_no && p.conf_no.toLowerCase().includes(searchQuery.toLowerCase()));
          
          if (!matchesSearch) return false;

          if (activeFilter === 'Pending') return p.status === 'No Response' || p.status === 'Pending';
          if (activeFilter === 'CheckedIn') return p.status === 'Gate Check-In' || p.status === 'Attending';
          return true;
      });
  }, [participants, searchQuery, activeFilter]);

  const stats = useMemo(() => {
      const total = participants.length;
      const arrived = participants.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending').length;
      const pending = total - arrived;
      const maleArrived = participants.filter(p => (p.gender === 'Male') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;
      const femaleArrived = participants.filter(p => (p.gender === 'Female') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;
      
      return { total, arrived, pending, maleArrived, femaleArrived };
  }, [participants]);

  // --- RENDER ---
  return (
    <div style={styles.card}>
      {/* HEADER & COURSE SELECTOR */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50'}}>
                  <UserCheck size={28} className="text-green-600"/> Gate Reception
              </h2>
              <div style={{fontSize:'13px', color:'#666', marginTop:'5px'}}>Rapid Check-In Console</div>
          </div>
          
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              <select 
                  style={{padding:'10px', borderRadius:'8px', border:'2px solid #007bff', fontSize:'14px', fontWeight:'bold', color:'#007bff', outline:'none'}}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                  <option value="">-- Select Active Course --</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
              </select>
              <button onClick={loadParticipants} style={{padding:'10px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer'}} title="Refresh">
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''}/>
              </button>
          </div>
      </div>

      {selectedCourseId ? (
          <>
              {/* 📊 LIVE STATS BAR */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'25px'}}>
                  <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #007bff'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#007bff', textTransform:'uppercase'}}>Total Expected</div>
                      <div style={{fontSize:'24px', fontWeight:'900', color:'#333'}}>{stats.total}</div>
                  </div>
                  <div style={{background:'#e8f5e9', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #2e7d32'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#2e7d32', textTransform:'uppercase'}}>Arrived (Total)</div>
                      <div style={{fontSize:'24px', fontWeight:'900', color:'#333'}}>{stats.arrived} <span style={{fontSize:'14px', color:'#666', fontWeight:'normal'}}>({Math.round((stats.arrived/stats.total)*100 || 0)}%)</span></div>
                  </div>
                  <div style={{background:'#fff3e0', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #ef6c00'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#ef6c00', textTransform:'uppercase'}}>Breakdown</div>
                      <div style={{fontSize:'14px', fontWeight:'bold', marginTop:'5px'}}>
                          <span style={{color:'#007bff'}}>M: {stats.maleArrived}</span> &nbsp;|&nbsp; <span style={{color:'#e91e63'}}>F: {stats.femaleArrived}</span>
                      </div>
                  </div>
                  <div style={{background:'#f5f5f5', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #999', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <button onClick={()=>setShowWalkIn(true)} style={{background:'#333', color:'white', border:'none', padding:'10px 20px', borderRadius:'30px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}>
                          <UserPlus size={16}/> New Walk-In
                      </button>
                  </div>
              </div>

              {/* 🔎 SEARCH & FILTERS */}
              <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                  <div style={{flex:1, position:'relative'}}>
                      <Search size={20} color="#999" style={{position:'absolute', left:'15px', top:'12px'}}/>
                      <input 
                          autoFocus
                          placeholder="Search Name or ID (Type to filter instantly)..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{width:'100%', padding:'12px 12px 12px 45px', borderRadius:'30px', border:'2px solid #eee', fontSize:'16px', outline:'none', transition:'all 0.2s', boxSizing:'border-box'}}
                          onFocus={(e) => e.target.style.borderColor = '#007bff'}
                          onBlur={(e) => e.target.style.borderColor = '#eee'}
                      />
                  </div>
                  <div style={{display:'flex', gap:'5px', background:'#f1f3f5', padding:'5px', borderRadius:'30px'}}>
                      {['All', 'Pending', 'CheckedIn'].map(f => (
                          <button 
                              key={f} 
                              onClick={() => setActiveFilter(f)}
                              style={{
                                  padding:'8px 20px', borderRadius:'25px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'13px',
                                  background: activeFilter === f ? 'white' : 'transparent',
                                  color: activeFilter === f ? '#333' : '#777',
                                  boxShadow: activeFilter === f ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
                              }}
                          >
                              {f === 'CheckedIn' ? 'Arrived' : f}
                          </button>
                      ))}
                  </div>
              </div>

              {/* 📋 STUDENT LIST */}
              <div style={{background:'white', borderRadius:'12px', border:'1px solid #eee', boxShadow:'0 4px 15px rgba(0,0,0,0.02)', maxHeight:'500px', overflowY:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead style={{background:'#f9fafb', position:'sticky', top:0, zIndex:10}}>
                          <tr>
                              <th style={{textAlign:'left', padding:'15px', color:'#666', fontSize:'12px', textTransform:'uppercase'}}>Status</th>
                              <th style={{textAlign:'left', padding:'15px', color:'#666', fontSize:'12px', textTransform:'uppercase'}}>Name / ID</th>
                              <th style={{textAlign:'left', padding:'15px', color:'#666', fontSize:'12px', textTransform:'uppercase'}}>Gender</th>
                              <th style={{textAlign:'right', padding:'15px', color:'#666', fontSize:'12px', textTransform:'uppercase'}}>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredList.map(p => {
                              const isCheckedIn = p.status === 'Gate Check-In' || p.status === 'Attending';
                              const isCancelled = p.status === 'Cancelled';
                              
                              return (
                                  <tr key={p.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: isCheckedIn ? '#f0fff4' : 'white'}}>
                                      <td style={{padding:'15px'}}>
                                          {isCheckedIn ? (
                                              <span style={{display:'flex', alignItems:'center', gap:'5px', color:'green', fontWeight:'bold', fontSize:'13px'}}><CheckCircle size={16}/> Arrived</span>
                                          ) : isCancelled ? (
                                              <span style={{color:'red', fontWeight:'bold', fontSize:'13px'}}>Cancelled</span>
                                          ) : (
                                              <span style={{display:'flex', alignItems:'center', gap:'5px', color:'orange', fontWeight:'bold', fontSize:'13px'}}><Clock size={16}/> Pending</span>
                                          )}
                                      </td>
                                      <td style={{padding:'15px'}}>
                                          <div style={{fontWeight:'bold', fontSize:'15px', color:'#333'}}>{p.full_name}</div>
                                          <div style={{fontSize:'12px', color:'#888'}}>{p.conf_no || 'No ID'}</div>
                                      </td>
                                      <td style={{padding:'15px'}}>
                                          <span style={{
                                              padding:'4px 10px', borderRadius:'15px', fontSize:'11px', fontWeight:'bold',
                                              background: p.gender === 'Male' ? '#e3f2fd' : '#fce4ec',
                                              color: p.gender === 'Male' ? '#0d47a1' : '#880e4f'
                                          }}>
                                              {p.gender}
                                          </span>
                                      </td>
                                      <td style={{padding:'15px', textAlign:'right'}}>
                                          {!isCheckedIn && !isCancelled && (
                                              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                                                  <button 
                                                      onClick={() => handleGateCheckIn(p)}
                                                      style={{background:'#28a745', color:'white', border:'none', padding:'8px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'13px', boxShadow:'0 2px 5px rgba(40,167,69,0.2)'}}
                                                  >
                                                      CHECK IN
                                                  </button>
                                                  <button 
                                                      onClick={() => handleCancelStudent(p)}
                                                      style={{background:'white', color:'#dc3545', border:'1px solid #ffcdd2', padding:'8px', borderRadius:'6px', cursor:'pointer'}}
                                                      title="Cancel / No Show"
                                                  >
                                                      <UserX size={16}/>
                                                  </button>
                                              </div>
                                          )}
                                          {isCheckedIn && <span style={{color:'#aaa', fontSize:'12px', fontStyle:'italic'}}>Checked In</span>}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {filteredList.length === 0 && <div style={{textAlign:'center', padding:'40px', color:'#999'}}>No students found matching your search.</div>}
              </div>
          </>
      ) : (
          <div style={{textAlign:'center', padding:'60px', color:'#666', background:'#f8f9fa', borderRadius:'12px', border:'2px dashed #ddd'}}>
              <Users size={40} color="#ccc" style={{marginBottom:'15px'}}/>
              <h3>Select a Course to Begin Gate Operations</h3>
              <p>Please select the active course from the dropdown above.</p>
          </div>
      )}

      {/* WALK-IN MODAL */}
      {showWalkIn && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'30px', borderRadius:'12px', width:'400px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                  <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}><UserPlus size={20}/> Register Walk-In</h3>
                  <form onSubmit={handleWalkIn}>
                      <div style={{marginBottom:'15px'}}>
                          <label style={styles.label}>Full Name</label>
                          <input style={styles.input} value={newStudent.fullName} onChange={e=>setNewStudent({...newStudent, fullName:e.target.value})} autoFocus placeholder="Enter Name"/>
                      </div>
                      <div style={{marginBottom:'15px'}}>
                          <label style={styles.label}>Gender</label>
                          <select style={styles.input} value={newStudent.gender} onChange={e=>setNewStudent({...newStudent, gender:e.target.value})}>
                              <option>Male</option><option>Female</option>
                          </select>
                      </div>
                      <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                          <button type="button" onClick={()=>setShowWalkIn(false)} style={styles.btn(false)}>Cancel</button>
                          <button type="submit" style={{...styles.btn(true), background:'#007bff', color:'white'}}>Register & Check-In</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
