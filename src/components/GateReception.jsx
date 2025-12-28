import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserX, Users, RefreshCw, CheckCircle, RotateCcw, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { API_URL, styles } from '../config';

const COLORS = { 
    male: '#007bff', female: '#e91e63', 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32',
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae'
};

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
      const interval = setInterval(loadParticipants, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
  }, [selectedCourseId]);

  // --- 2. ACTIONS ---
  const updateStatus = async (student, newStatus) => {
      // Optimistic Update
      setParticipants(prev => prev.map(p => p.participant_id === student.participant_id ? { ...p, status: newStatus } : p));
      
      let endpoint = '/gate-checkin'; // Default
      if (newStatus === 'Cancelled') endpoint = '/gate-cancel';
      if (newStatus === 'Pending') endpoint = '/gate-reset'; // Hypothetical endpoint, or reuse update logic

      try {
          // If resetting, we might need a specific endpoint or just update the participant directly
          if (newStatus === 'Pending') {
             await fetch(`${API_URL}/participants/${student.participant_id}`, {
                 method: 'PUT', headers: {'Content-Type':'application/json'},
                 body: JSON.stringify({ ...student, status: 'No Response' }) // Reset to default
             });
          } else {
             await fetch(`${API_URL}${endpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId: student.participant_id })
             });
          }
          if(refreshCourses) refreshCourses();
      } catch (err) { 
          alert("Sync Error - Check Internet"); 
          loadParticipants(); 
      }
  };

  const handleGateCheckIn = (p) => updateStatus(p, 'Gate Check-In');
  const handleCancelStudent = (p) => { if(window.confirm(`⚠️ Cancel ${p.full_name}?`)) updateStatus(p, 'Cancelled'); };
  const handleUndoCancel = (p) => { if(window.confirm(`↩️ Restore ${p.full_name} to List?`)) updateStatus(p, 'Pending'); };

  // --- 3. FILTERING & STATS ---
  const filteredList = useMemo(() => {
      return participants.filter(p => {
          const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(searchQuery.toLowerCase()));
          if (!matchesSearch) return false;
          
          const isArrived = p.status === 'Gate Check-In' || p.status === 'Attending';
          const isCancelled = p.status === 'Cancelled' || p.status === 'No-Show';
          
          if (activeFilter === 'Pending') return !isArrived && !isCancelled; // ✅ FIX: Catch-all for pending
          if (activeFilter === 'CheckedIn') return isArrived;
          if (activeFilter === 'Cancelled') return isCancelled;
          
          return !isCancelled; // Default 'All' view hides cancelled usually, or shows all active
      });
  }, [participants, searchQuery, activeFilter]);

  // STATS LOGIC
  const stats = useMemo(() => {
      const activeP = participants.filter(p => p.status !== 'Cancelled' && p.status !== 'No-Show');
      
      // Data for Stacked Bar Chart (Breakdown)
      const barData = [
          { name: 'Old (M)', value: activeP.filter(p => (p.gender||'').startsWith('M') && (p.conf_no||'').startsWith('O')).length, fill: COLORS.om },
          { name: 'New (M)', value: activeP.filter(p => (p.gender||'').startsWith('M') && (p.conf_no||'').startsWith('N')).length, fill: COLORS.nm },
          { name: 'Svr (M)', value: activeP.filter(p => (p.gender||'').startsWith('M') && (p.conf_no||'').startsWith('S')).length, fill: COLORS.sm },
          { name: 'Old (F)', value: activeP.filter(p => (p.gender||'').startsWith('F') && (p.conf_no||'').startsWith('O')).length, fill: COLORS.of },
          { name: 'New (F)', value: activeP.filter(p => (p.gender||'').startsWith('F') && (p.conf_no||'').startsWith('N')).length, fill: COLORS.nf },
          { name: 'Svr (F)', value: activeP.filter(p => (p.gender||'').startsWith('F') && (p.conf_no||'').startsWith('S')).length, fill: COLORS.sf },
      ].filter(d => d.value > 0);

      // Data for Pie Chart (Arrived vs Pending)
      const arrivedCount = activeP.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending').length;
      const pendingCount = activeP.length - arrivedCount;
      const pieData = [
          { name: 'Arrived', value: arrivedCount, color: '#2e7d32' },
          { name: 'Pending', value: pendingCount, color: '#ff9800' }
      ];

      return { barData, pieData, total: activeP.length, arrived: arrivedCount };
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
              {/* 📊 STICKY STATS PANEL */}
              <div className="stats-panel" style={{
                  position: 'sticky', top: 0, zIndex: 100, 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  backdropFilter: 'blur(5px)',
                  padding: '15px 0', borderBottom: '1px solid #eee', marginBottom: '20px',
                  display: 'grid', gap: '15px' 
              }}>
                  
                  {/* CHART 1: TOTAL BREAKDOWN (BAR) */}
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'10px', display:'flex', flexDirection:'column'}}>
                      <div style={{fontSize:'11px', fontWeight:'bold', color:'#555', textTransform:'uppercase', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                          <span>Expected Total</span>
                          <span style={{fontSize:'14px', color:'#007bff'}}>{stats.total}</span>
                      </div>
                      <div style={{flex:1, minHeight:'100px'}}>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stats.barData} layout="vertical" margin={{top:0, left:0, right:30, bottom:0}}>
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={60} tick={{fontSize:10}} />
                                  <Tooltip cursor={{fill: 'transparent'}} />
                                  <Bar dataKey="value" barSize={15} radius={[0, 4, 4, 0]}>
                                    {stats.barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* CHART 2: ARRIVAL PROGRESS (PIE) */}
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'10px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <div>
                          <div style={{fontSize:'11px', fontWeight:'bold', color:'#2e7d32', textTransform:'uppercase'}}>Arrived</div>
                          <div style={{fontSize:'24px', fontWeight:'900', color:'#333'}}>{stats.arrived}</div>
                          <div style={{fontSize:'11px', color:'#999'}}>of {stats.total}</div>
                      </div>
                      <div style={{width:'100px', height:'100px'}}>
                          <ResponsiveContainer>
                              <PieChart>
                                  <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={40} paddingAngle={5} dataKey="value">
                                      {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip />
                              </PieChart>
                          </ResponsiveContainer>
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
                              const isCancelled = p.status === 'Cancelled' || p.status === 'No-Show';
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
                                          {/* ✅ UNDO CANCEL OPTION */}
                                          {isCancelled && (
                                              <button onClick={() => handleUndoCancel(p)} style={{background:'#f3e5f5', color:'#7b1fa2', border:'1px solid #e1bee7', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'11px', display:'inline-flex', alignItems:'center', gap:'5px'}}>
                                                  <RotateCcw size={14}/> Undo
                                              </button>
                                          )}
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

      {/* Responsive Grid for Stats */}
      <style>{`
        .stats-panel { grid-template-columns: 2fr 1fr; }
        @media (max-width: 768px) {
            .stats-panel { grid-template-columns: 1fr; position: relative !important; }
        }
      `}</style>
    </div>
  );
}
