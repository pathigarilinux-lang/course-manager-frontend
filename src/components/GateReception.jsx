import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserX, Users, UserPlus, RefreshCw, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { API_URL, styles } from '../config';
import { queueOfflineRequest, syncOfflineRequests, cacheData, getCachedData } from '../utils/offlineSync';

export default function GateReception({ courses, refreshCourses }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Walk-in State
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: '', gender: 'Male', phone: '' });

  // --- 1. NETWORK & DATA LOADING ---
  useEffect(() => {
      const handleOnline = () => { setIsOnline(true); syncOfflineRequests(API_URL); };
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const loadParticipants = async () => {
    if (!selectedCourseId) return;
    setIsRefreshing(true);
    try {
        const res = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
        if (res.ok) {
            const data = await res.json();
            setParticipants(Array.isArray(data) ? data : []);
            cacheData(`participants_${selectedCourseId}`, data);
            if(refreshCourses) refreshCourses();
        } else {
            throw new Error("API Error");
        }
    } catch (err) {
        console.warn("Offline Mode: Loading from Cache");
        const cached = getCachedData(`participants_${selectedCourseId}`);
        if (cached) setParticipants(cached);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
      loadParticipants();
      const interval = setInterval(loadParticipants, 30000);
      return () => clearInterval(interval);
  }, [selectedCourseId]);

  // --- 2. ACTIONS ---
  const handleGateCheckIn = async (student) => {
      setParticipants(prev => prev.map(p => p.participant_id === student.participant_id ? { ...p, status: 'Gate Check-In' } : p));
      
      const payload = { participantId: student.participant_id };
      
      if (!navigator.onLine) {
          queueOfflineRequest('/gate-checkin', 'POST', payload);
          return;
      }

      try {
          const res = await fetch(`${API_URL}/gate-checkin`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error("Failed");
          if(refreshCourses) refreshCourses();
      } catch (err) {
          queueOfflineRequest('/gate-checkin', 'POST', payload);
      }
  };

  const handleCancelStudent = async (student) => {
      if(!window.confirm(`⚠️ Mark ${student.full_name} as Cancelled / No-Show?`)) return;
      
      // Optimistic Update
      setParticipants(prev => prev.map(p => p.participant_id === student.participant_id ? { ...p, status: 'Cancelled' } : p));

      const payload = { participantId: student.participant_id };

      if (!navigator.onLine) {
          queueOfflineRequest('/gate-cancel', 'POST', payload);
          return;
      }

      try {
          const res = await fetch(`${API_URL}/gate-cancel`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (res.ok) { 
              loadParticipants(); 
              if(refreshCourses) refreshCourses(); 
          }
      } catch (err) {
          queueOfflineRequest('/gate-cancel', 'POST', payload);
      }
  };

  const handleWalkIn = async (e) => {
      e.preventDefault();
      if(!newStudent.fullName) return alert("Name is required");
      
      const payload = {
          courseId: selectedCourseId, fullName: newStudent.fullName, gender: newStudent.gender,
          email: '', age: '', confNo: `WALK-${Date.now().toString().slice(-4)}`, coursesInfo: 'Walk-In'
      };

      if (!navigator.onLine) {
          alert("⚠️ Offline: Cannot create new Walk-In records. Please use paper log until online.");
          return;
      }

      try {
          const res = await fetch(`${API_URL}/participants`, {
              method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
          });
          if(res.ok) {
              alert(`✅ Walk-in Registered`);
              setShowWalkIn(false); setNewStudent({ fullName: '', gender: 'Male', phone: '' });
              loadParticipants(); if(refreshCourses) refreshCourses();
          } else { const err = await res.json(); alert(`Error: ${err.error}`); }
      } catch(err) { console.error(err); }
  };

  // --- 3. FILTERING & STATS ---
  const filteredList = useMemo(() => {
      return participants.filter(p => {
          const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(searchQuery.toLowerCase()));
          if (!matchesSearch) return false;
          if (activeFilter === 'Pending') return p.status === 'No Response' || p.status === 'Pending';
          if (activeFilter === 'CheckedIn') return p.status === 'Gate Check-In' || p.status === 'Attending';
          if (activeFilter === 'Cancelled') return p.status === 'Cancelled';
          return p.status !== 'Cancelled'; // Default 'All' hides cancelled unless searched/filtered explicitly? Actually usually 'All' shows valid. Let's make 'All' show pending+arrived.
      });
  }, [participants, searchQuery, activeFilter]);

  const stats = useMemo(() => {
      const total = participants.filter(p => p.status !== 'Cancelled').length;
      const arrived = participants.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending').length;
      const pending = total - arrived;
      const maleArrived = participants.filter(p => (p.gender === 'Male') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;
      const femaleArrived = participants.filter(p => (p.gender === 'Female') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;
      return { total, arrived, pending, maleArrived, femaleArrived };
  }, [participants]);

  // --- RENDER ---
  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={{display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px', gap:'10px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'22px'}}>
                  <UserCheck size={28} className="text-green-600"/> Gate Reception
              </h2>
          </div>
          <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
              {/* Network Indicator */}
              <div style={{marginRight:'10px'}}>
                  {isOnline ? 
                      <span style={{color:'green', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:'bold', background:'#e8f5e9', padding:'4px 8px', borderRadius:'12px'}}><Wifi size={14}/> Online</span> : 
                      <button onClick={() => syncOfflineRequests(API_URL)} style={{background:'#dc3545', color:'white', border:'none', borderRadius:'20px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', animation:'pulse 2s infinite', fontSize:'12px'}}>
                          <WifiOff size={14}/> Offline (Tap to Sync)
                      </button>
                  }
              </div>

              <select 
                  style={{padding:'8px', borderRadius:'8px', border:'2px solid #007bff', fontSize:'14px', fontWeight:'bold', color:'#007bff', outline:'none', maxWidth:'200px'}}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                  <option value="">-- Select Active Course --</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
              </select>
              <button onClick={loadParticipants} style={{padding:'8px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer'}} title="Refresh">
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''}/>
              </button>
          </div>
      </div>

      {selectedCourseId ? (
          <>
              {/* 📊 RESPONSIVE STATS GRID */}
              <div className="stats-grid" style={{display:'grid', gap:'10px', marginBottom:'20px'}}>
                  <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #007bff'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#007bff', textTransform:'uppercase'}}>Expected</div>
                      <div style={{fontSize:'20px', fontWeight:'900', color:'#333'}}>{stats.total}</div>
                  </div>
                  <div style={{background:'#e8f5e9', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #2e7d32'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#2e7d32', textTransform:'uppercase'}}>Arrived</div>
                      <div style={{fontSize:'20px', fontWeight:'900', color:'#333'}}>{stats.arrived} <small style={{color:'#666', fontSize:'12px'}}>({Math.round((stats.arrived/stats.total)*100 || 0)}%)</small></div>
                  </div>
                  <div style={{background:'#fff3e0', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #ef6c00'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#ef6c00', textTransform:'uppercase'}}>M / F</div>
                      <div style={{fontSize:'14px', fontWeight:'bold', marginTop:'5px'}}>
                          <span style={{color:'#007bff'}}>M: {stats.maleArrived}</span> | <span style={{color:'#e91e63'}}>F: {stats.femaleArrived}</span>
                      </div>
                  </div>
                  <div style={{background:'#f5f5f5', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #999', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <button onClick={()=>setShowWalkIn(true)} style={{background:'#333', color:'white', border:'none', padding:'8px 15px', borderRadius:'30px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px'}}>
                          <UserPlus size={16}/> Walk-In
                      </button>
                  </div>
              </div>

              {/* 🔎 SEARCH & FILTERS */}
              <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px'}}>
                  <div style={{flex:1, minWidth:'200px', position:'relative'}}>
                      <Search size={18} color="#999" style={{position:'absolute', left:'15px', top:'10px'}}/>
                      <input 
                          placeholder="Search Name/ID..." 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{width:'100%', padding:'10px 10px 10px 40px', borderRadius:'30px', border:'2px solid #eee', fontSize:'14px', outline:'none', boxSizing:'border-box'}}
                      />
                  </div>
                  <div style={{display:'flex', gap:'5px', overflowX:'auto', paddingBottom:'5px'}}>
                      {['All', 'Pending', 'CheckedIn', 'Cancelled'].map(f => (
                          <button 
                              key={f} 
                              onClick={() => setActiveFilter(f)}
                              style={{
                                  padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'12px', whiteSpace:'nowrap',
                                  background: activeFilter === f ? '#333' : '#f1f3f5',
                                  color: activeFilter === f ? 'white' : '#555'
                              }}
                          >
                              {f === 'CheckedIn' ? 'Arrived' : f}
                          </button>
                      ))}
                  </div>
              </div>

              {/* 📋 TABLE */}
              <div style={{background:'white', borderRadius:'12px', border:'1px solid #eee', overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', minWidth:'600px'}}>
                      <thead style={{background:'#f9fafb'}}>
                          <tr>
                              <th style={{textAlign:'left', padding:'12px', color:'#666', fontSize:'11px', textTransform:'uppercase'}}>Status</th>
                              <th style={{textAlign:'left', padding:'12px', color:'#666', fontSize:'11px', textTransform:'uppercase'}}>Name / ID</th>
                              <th style={{textAlign:'left', padding:'12px', color:'#666', fontSize:'11px', textTransform:'uppercase'}}>Gender</th>
                              <th style={{textAlign:'right', padding:'12px', color:'#666', fontSize:'11px', textTransform:'uppercase'}}>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredList.map(p => {
                              const isCheckedIn = p.status === 'Gate Check-In' || p.status === 'Attending';
                              const isCancelled = p.status === 'Cancelled';
                              return (
                                  <tr key={p.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: isCheckedIn ? '#f0fff4' : (isCancelled ? '#fff5f5' : 'white')}}>
                                      <td style={{padding:'12px'}}>
                                          {isCheckedIn ? <span style={{color:'green', fontWeight:'bold', fontSize:'12px'}}>Arrived</span> : isCancelled ? <span style={{color:'red', fontWeight:'bold', fontSize:'12px'}}>🚫 Cancelled</span> : <span style={{color:'orange', fontWeight:'bold', fontSize:'12px'}}>Pending</span>}
                                      </td>
                                      <td style={{padding:'12px'}}>
                                          <div style={{fontWeight:'bold', fontSize:'14px', color:'#333'}}>{p.full_name}</div>
                                          <div style={{fontSize:'11px', color:'#888'}}>{p.conf_no || '-'}</div>
                                      </td>
                                      <td style={{padding:'12px'}}>
                                          <span style={{padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:'bold', background: p.gender==='Male'?'#e3f2fd':'#fce4ec', color: p.gender==='Male'?'#0d47a1':'#880e4f'}}>{p.gender}</span>
                                      </td>
                                      <td style={{padding:'12px', textAlign:'right'}}>
                                          {!isCheckedIn && !isCancelled && (
                                              <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                                  <button onClick={() => handleGateCheckIn(p)} style={{background:'#28a745', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'12px'}}>CHECK IN</button>
                                                  {/* ✅ CANCEL BUTTON RESTORED */}
                                                  <button onClick={() => handleCancelStudent(p)} style={{background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', padding:'6px 8px', borderRadius:'6px', cursor:'pointer', title:'Cancel / No Show'}}>
                                                      <UserX size={16}/>
                                                  </button>
                                              </div>
                                          )}
                                          {isCheckedIn && <CheckCircle size={18} color="green"/>}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                  {filteredList.length === 0 && <div style={{textAlign:'center', padding:'30px', color:'#999'}}>No students found.</div>}
              </div>
          </>
      ) : (
          <div style={{textAlign:'center', padding:'40px', color:'#666'}}>Select a course to start.</div>
      )}

      <style>{`
        .stats-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr 1fr; }
        }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
      
      {showWalkIn && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'20px', borderRadius:'12px', width:'90%', maxWidth:'400px'}}>
                  <h3>Register Walk-In</h3>
                  <input style={styles.input} value={newStudent.fullName} onChange={e=>setNewStudent({...newStudent, fullName:e.target.value})} placeholder="Full Name" />
                  <div style={{display:'flex', justifyContent:'flex-end', marginTop:'15px', gap:'10px'}}>
                      <button onClick={()=>setShowWalkIn(false)} style={styles.btn(false)}>Cancel</button>
                      <button onClick={handleWalkIn} style={{...styles.btn(true), background:'#007bff'}}>Save</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
