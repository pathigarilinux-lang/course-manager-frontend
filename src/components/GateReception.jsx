import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserX, Users, RefreshCw, CheckCircle, Clock, Wifi } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function GateReception({ courses, refreshCourses }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- 1. DATA LOADING ---
  const loadParticipants = async () => {
    if (!selectedCourseId) return;
    setIsRefreshing(true);
    try {
        const res = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
        if (res.ok) {
            const data = await res.json();
            setParticipants(Array.isArray(data) ? data : []);
            if(refreshCourses) refreshCourses();
        }
    } catch (err) { console.error(err); }
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
      try {
          const res = await fetch(`${API_URL}/gate-checkin`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ participantId: student.participant_id })
          });
          if (!res.ok) throw new Error("Failed");
          if(refreshCourses) refreshCourses();
      } catch (err) { alert("Sync Error - Check Internet"); loadParticipants(); }
  };

  const handleCancelStudent = async (student) => {
      if(!window.confirm(`⚠️ Mark ${student.full_name} as Cancelled / No-Show?`)) return;
      setParticipants(prev => prev.map(p => p.participant_id === student.participant_id ? { ...p, status: 'Cancelled' } : p));
      try {
          const res = await fetch(`${API_URL}/gate-cancel`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ participantId: student.participant_id })
          });
          if (res.ok) { loadParticipants(); if(refreshCourses) refreshCourses(); }
      } catch (err) { console.error(err); }
  };

  // --- 3. FILTERING & STATS ---
  const filteredList = useMemo(() => {
      return participants.filter(p => {
          const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(searchQuery.toLowerCase()));
          if (!matchesSearch) return false;
          if (activeFilter === 'Pending') return p.status === 'No Response' || p.status === 'Pending';
          if (activeFilter === 'CheckedIn') return p.status === 'Gate Check-In' || p.status === 'Attending';
          if (activeFilter === 'Cancelled') return p.status === 'Cancelled';
          return p.status !== 'Cancelled'; 
      });
  }, [participants, searchQuery, activeFilter]);

  // STATS LOGIC
  const stats = useMemo(() => {
      const total = participants.length;
      const cancelledCount = participants.filter(p => p.status === 'Cancelled' || p.status === 'No-Show').length;
      const activeCount = total - cancelledCount;

      const totalMale = participants.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const totalFemale = participants.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;

      const arrived = participants.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending').length;
      const maleArrived = participants.filter(p => (p.gender === 'Male') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;
      const femaleArrived = participants.filter(p => (p.gender === 'Female') && (p.status === 'Gate Check-In' || p.status === 'Attending')).length;

      const mix = { om: 0, nm: 0, sm: 0, of: 0, nf: 0, sf: 0 };
      participants.forEach(p => {
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const conf = (p.conf_no || '').toUpperCase();
          if (isMale) {
              if (conf.startsWith('SM')) mix.sm++;
              else if (conf.startsWith('O') || conf.startsWith('S')) mix.om++;
              else mix.nm++;
          } else {
              if (conf.startsWith('SF')) mix.sf++;
              else if (conf.startsWith('O') || conf.startsWith('S')) mix.of++;
              else mix.nf++;
          }
      });

      return { total, totalMale, totalFemale, cancelledCount, activeCount, arrived, maleArrived, femaleArrived, mix };
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
              {/* 📊 RESPONSIVE STATS GRID (NOW 3 COLUMNS) */}
              <div className="stats-grid" style={{display:'grid', gap:'10px', marginBottom:'20px'}}>
                  
                  {/* 1. EXPECTED TOTAL CARD */}
                  <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #007bff'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#007bff', textTransform:'uppercase'}}>Expected Total</div>
                      <div style={{fontSize:'20px', fontWeight:'900', color:'#333', display:'flex', alignItems:'baseline', gap:'6px'}}>
                          {stats.total}
                          <span style={{fontSize:'11px', fontWeight:'normal', color:'#555'}}>(M: <span style={{color:'#007bff', fontWeight:'bold'}}>{stats.totalMale}</span> | F: <span style={{color:'#e91e63', fontWeight:'bold'}}>{stats.totalFemale}</span>)</span>
                      </div>
                      
                      {/* Breakdown */}
                      <div style={{fontSize:'10px', color:'#555', marginTop:'4px', background:'rgba(255,255,255,0.5)', padding:'3px', borderRadius:'4px'}}>
                          <div style={{display:'flex', gap:'8px'}}>
                              <span style={{color:'#007bff', fontWeight:'bold'}}>M:</span> OM:{stats.mix.om} NM:{stats.mix.nm} SM:{stats.mix.sm}
                          </div>
                          <div style={{display:'flex', gap:'8px'}}>
                              <span style={{color:'#e91e63', fontWeight:'bold'}}>F:</span> OF:{stats.mix.of} NF:{stats.mix.nf} SF:{stats.mix.sf}
                          </div>
                      </div>

                      {/* Footer */}
                      <div style={{marginTop:'5px', fontSize:'11px', display:'flex', justifyContent:'space-between', background:'rgba(255,255,255,0.8)', padding:'4px', borderRadius:'4px'}}>
                          <span style={{color:'#d32f2f', fontWeight:'bold'}}>🚫 Cancelled: {stats.cancelledCount}</span>
                          <span style={{color:'#1b5e20', fontWeight:'bold'}}>Active: {stats.activeCount}</span>
                      </div>
                  </div>

                  {/* 2. ARRIVED CARD */}
                  <div style={{background:'#e8f5e9', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #2e7d32'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#2e7d32', textTransform:'uppercase'}}>Arrived</div>
                      <div style={{fontSize:'20px', fontWeight:'900', color:'#333'}}>{stats.arrived} <small style={{color:'#666', fontSize:'12px'}}>({Math.round((stats.arrived/stats.activeCount)*100 || 0)}%)</small></div>
                  </div>

                  {/* 3. GENDER CARD */}
                  <div style={{background:'#fff3e0', padding:'15px', borderRadius:'10px', borderLeft:'5px solid #ef6c00'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#ef6c00', textTransform:'uppercase'}}>M / F (Arrived)</div>
                      <div style={{fontSize:'14px', fontWeight:'bold', marginTop:'5px'}}>
                          <span style={{color:'#007bff'}}>M: {stats.maleArrived}</span> | <span style={{color:'#e91e63'}}>F: {stats.femaleArrived}</span>
                      </div>
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
                                                  <button onClick={() => handleCancelStudent(p)} style={{background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', padding:'6px 8px', borderRadius:'6px', cursor:'pointer'}} title="Cancel">
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

      {/* Grid updated to 3 columns */}
      <style>{`
        .stats-grid { grid-template-columns: 1fr 1fr 1fr; }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
