import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserCheck, UserX, Users, RefreshCw, CheckCircle, RotateCcw, BarChart3, PieChart as PieIcon, ArrowUpDown, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { API_URL, styles } from '../config';

const COLORS = { 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32',
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae',
    canM: '#b71c1c', canF: '#e57373',
    arrivedOld: '#1976d2', arrivedNew: '#009688', arrivedSvr: '#ff9800',
    pending: '#e0e0e0'
};

export default function GateReception({ courses, refreshCourses, userRole }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ✅ VISIBILITY LOGIC
  const visibleCourses = useMemo(() => {
      if (!courses) return [];
      
      // ✅ IF 'gate' USER: See EVERYTHING (Staff + Dn1Ops)
      // ✅ IF 'dn1ops' USER: See ONLY Dn1Ops courses (as per your previous request, or change to return 'courses' if they should see all)
      if (userRole === 'dn1ops') {
           // Uncomment below if dn1ops should ONLY see their own.
           // return courses.filter(c => c.owner_role === 'dn1ops');
           
           // OR return ALL if dn1ops should act like Gate user for this tab:
           return courses; 
      }
      
      // Admin/Staff/Gate see ALL
      return courses;
  }, [courses, userRole]);
  
  // Auto-select first course
  useEffect(() => {
      if (!selectedCourseId && visibleCourses.length > 0) {
          setSelectedCourseId(visibleCourses[0].course_id);
      }
  }, [visibleCourses]);

  // ... (Rest of the file remains exactly the same as the previous version I sent)
  // ... (Data loading, Check-in logic, Chart rendering)
  // ...
  // ...
  
  // (Paste the rest of the 'GateReception.jsx' content here from the previous successful file)
  
  // --- 1. DATA LOADING ---
  const loadParticipants = async () => {
    if (!selectedCourseId) return;
    setIsRefreshing(true);
    try {
        const res = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
        const data = await res.json();
        setParticipants(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setIsRefreshing(false); }
  };
  
  useEffect(() => { loadParticipants(); }, [selectedCourseId]);

  // ... (Keep all the handlers handleCheckIn, handleCancelStudent, etc.) ...
  
  const handleCheckIn = async (p) => {
      if (!window.confirm(`Mark ${p.full_name} as ARRIVED at Gate?`)) return;
      try {
          await fetch(`${API_URL}/participants/${p.participant_id}/status`, {
              method: 'PUT', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ status: 'Arrived' })
          });
          setParticipants(prev => prev.map(x => x.participant_id === p.participant_id ? { ...x, status: 'Arrived' } : x));
      } catch (e) { alert("Error updating status"); }
  };

  const handleCancelStudent = async (p) => {
      const reason = prompt(`Cancel ${p.full_name}? Enter reason:`, "Personal");
      if (!reason) return;
      try {
          await fetch(`${API_URL}/participants/${p.participant_id}/status`, {
              method: 'PUT', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ status: 'Cancelled', notes: reason })
          });
          setParticipants(prev => prev.map(x => x.participant_id === p.participant_id ? { ...x, status: 'Cancelled' } : x));
      } catch (e) { alert("Error cancelling"); }
  };

  const handleUndoCancel = async (p) => {
    if (!window.confirm(`Undo cancellation for ${p.full_name}?`)) return;
    try {
        await fetch(`${API_URL}/participants/${p.participant_id}/status`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: 'Confirmed' }) 
        });
        setParticipants(prev => prev.map(x => x.participant_id === p.participant_id ? { ...x, status: 'Confirmed' } : x));
    } catch (e) { alert("Error undoing"); }
  };

  const processedList = useMemo(() => {
      let data = [...participants];
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(p => p.full_name.toLowerCase().includes(q) || (p.conf_no||'').toLowerCase().includes(q) || (p.phone||'').includes(q));
      }
      if (activeFilter === 'Arrived') data = data.filter(p => p.status === 'Arrived' || p.status === 'Attending');
      else if (activeFilter === 'Pending') data = data.filter(p => p.status === 'Confirmed');
      else if (activeFilter === 'Cancelled') data = data.filter(p => p.status === 'Cancelled');

      if (sortConfig.key) {
          data.sort((a, b) => {
              if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
              if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return data;
  }, [participants, searchQuery, activeFilter, sortConfig]);

  const stats = useMemo(() => {
      const s = { 
          total: participants.length, arrived: 0, pending: 0, cancelled: 0,
          om:0, nm:0, of:0, nf:0, sm:0, sf:0 
      };
      participants.forEach(p => {
          if(p.status === 'Cancelled') { s.cancelled++; return; }
          if(p.status === 'Arrived' || p.status === 'Attending') s.arrived++;
          else s.pending++;

          const g = (p.gender || '').toLowerCase();
          const c = (p.conf_no || '').toUpperCase();
          const isOld = c.startsWith('O') || c.startsWith('S');
          
          if(g.startsWith('m')) {
             if(isOld) s.om++; else s.nm++;
             if(c.startsWith('S')) s.sm++;
          } else {
             if(isOld) s.of++; else s.nf++;
             if(c.startsWith('S')) s.sf++;
          }
      });
      return s;
  }, [participants]);

  const chartData = [
      { name: 'Arrived', value: stats.arrived, fill: '#4caf50' },
      { name: 'Pending', value: stats.pending, fill: '#ff9800' },
      { name: 'Cancelled', value: stats.cancelled, fill: '#f44336' },
  ];

  const handleSort = (key) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  return (
      <div style={{animation: 'fadeIn 0.3s ease'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                  <div style={{background:'#e3f2fd', padding:'10px', borderRadius:'50%', color:'#1565c0'}}><UserCheck size={24}/></div>
                  <div>
                      <h2 style={{margin:0, color:'#2c3e50', fontSize:'20px'}}>Gate Reception</h2>
                      <div style={{fontSize:'13px', color:'#666'}}>Mark student arrivals</div>
                  </div>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                  <select 
                      style={{padding:'10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', minWidth:'200px'}}
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                  >
                      <option value="">-- Select Course --</option>
                      {visibleCourses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                  </select>
                  <button onClick={loadParticipants} style={{...styles.btn(false), background:'#f5f5f5', border:'1px solid #ddd', padding:'10px'}} title="Refresh Data">
                      <RefreshCw size={18} className={isRefreshing ? 'spin' : ''}/>
                  </button>
              </div>
          </div>

          {selectedCourseId ? (
              <>
                  <div className="stats-panel" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'20px'}}>
                      <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px'}}>
                           <div style={{textAlign:'center', padding:'10px', background:'#fbe9e7', borderRadius:'8px', color:'#d84315'}}>
                               <div style={{fontSize:'24px', fontWeight:'bold'}}>{stats.total}</div>
                               <div style={{fontSize:'12px', fontWeight:'bold'}}>Total</div>
                           </div>
                           <div style={{textAlign:'center', padding:'10px', background:'#e8f5e9', borderRadius:'8px', color:'#2e7d32'}}>
                               <div style={{fontSize:'24px', fontWeight:'bold'}}>{stats.arrived}</div>
                               <div style={{fontSize:'12px', fontWeight:'bold'}}>Arrived</div>
                           </div>
                           <div style={{textAlign:'center', padding:'10px', background:'#fff3e0', borderRadius:'8px', color:'#ef6c00'}}>
                               <div style={{fontSize:'24px', fontWeight:'bold'}}>{stats.pending}</div>
                               <div style={{fontSize:'12px', fontWeight:'bold'}}>Pending</div>
                           </div>
                           <div style={{textAlign:'center', padding:'10px', background:'#ffebee', borderRadius:'8px', color:'#c62828'}}>
                               <div style={{fontSize:'24px', fontWeight:'bold'}}>{stats.cancelled}</div>
                               <div style={{fontSize:'12px', fontWeight:'bold'}}>Cancelled</div>
                           </div>
                           <div style={{gridColumn:'span 4', display:'flex', justifyContent:'space-around', marginTop:'10px', fontSize:'11px', color:'#555', background:'#f9fafb', padding:'8px', borderRadius:'6px'}}>
                               <span style={{color:COLORS.om}}>Old Male: {stats.om}</span>
                               <span style={{color:COLORS.nm}}>New Male: {stats.nm}</span>
                               <span style={{color:COLORS.of}}>Old Female: {stats.of}</span>
                               <span style={{color:COLORS.nf}}>New Female: {stats.nf}</span>
                           </div>
                      </div>

                      <div style={{background:'white', padding:'10px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', height:'160px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={5} dataKey="value">
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{fontSize:'10px'}}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div style={{background:'white', padding:'15px', borderRadius:'12px 12px 0 0', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{display:'flex', gap:'5px'}}>
                          {['All', 'Arrived', 'Pending', 'Cancelled'].map(f => (
                              <button 
                                  key={f} 
                                  onClick={()=>setActiveFilter(f)}
                                  style={{
                                      padding:'8px 15px', borderRadius:'20px', border:'none', fontSize:'13px', cursor:'pointer', fontWeight:'bold',
                                      background: activeFilter === f ? '#007bff' : '#f1f3f5',
                                      color: activeFilter === f ? 'white' : '#666',
                                      transition: 'all 0.2s'
                                  }}
                              >
                                  {f}
                              </button>
                          ))}
                      </div>
                      <div style={{position:'relative'}}>
                          <Search size={16} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                          <input 
                              style={{...styles.input, paddingLeft:'32px', width:'250px'}} 
                              placeholder="Search name, phone, ID..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                          />
                      </div>
                  </div>

                  <div style={{background:'white', maxHeight:'500px', overflowY:'auto', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                          <thead style={{position:'sticky', top:0, background:'#f8f9fa', zIndex:10}}>
                              <tr>
                                  <th onClick={()=>handleSort('full_name')} style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #eee', cursor:'pointer', color:'#555'}}><div style={{display:'flex', alignItems:'center', gap:'5px'}}>Name <ArrowUpDown size={12}/></div></th>
                                  <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #eee', color:'#555'}}>ID / Gender</th>
                                  <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #eee', color:'#555'}}>Phone</th>
                                  <th style={{padding:'12px', textAlign:'center', borderBottom:'2px solid #eee', color:'#555'}}>Status</th>
                                  <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #eee', color:'#555'}}>Action</th>
                              </tr>
                          </thead>
                          <tbody>
                              {processedList.map(p => {
                                  const isCheckedIn = p.status === 'Arrived' || p.status === 'Attending';
                                  const isCancelled = p.status === 'Cancelled';
                                  const rowBg = isCheckedIn ? '#e8f5e9' : (isCancelled ? '#ffebee' : 'white');
                                  
                                  return (
                                      <tr key={p.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: rowBg}}>
                                          <td style={{padding:'12px'}}>
                                              <div style={{fontWeight:'bold', color:'#333'}}>{p.full_name}</div>
                                              <div style={{fontSize:'11px', color:'#888'}}>Age: {p.age}</div>
                                          </td>
                                          <td style={{padding:'12px'}}>
                                              <div style={{fontWeight:'bold', fontFamily:'monospace', color:'#0d47a1'}}>{p.conf_no}</div>
                                              <div style={{fontSize:'11px', color:'#666'}}>{p.gender}</div>
                                          </td>
                                          <td style={{padding:'12px'}}>
                                              <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#555'}}>
                                                  <Phone size={12}/> {p.phone || p.mobile || '-'}
                                              </div>
                                          </td>
                                          <td style={{padding:'12px', textAlign:'center'}}>
                                              <span style={{
                                                  padding:'4px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold',
                                                  background: isCheckedIn ? '#c8e6c9' : (isCancelled ? '#ffcdd2' : '#fff3e0'),
                                                  color: isCheckedIn ? '#2e7d32' : (isCancelled ? '#c62828' : '#ef6c00')
                                              }}>
                                                  {p.status}
                                              </span>
                                          </td>
                                          <td style={{padding:'12px', textAlign:'right'}}>
                                              {!isCheckedIn && !isCancelled && (
                                                  <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                                      <button onClick={() => handleCheckIn(p)} style={{background:'#2e7d32', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'12px'}}>CHECK IN</button>
                                                      <button onClick={() => handleCancelStudent(p)} style={{background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', padding:'6px 8px', borderRadius:'6px', cursor:'pointer'}} title="Cancel"><UserX size={16}/></button>
                                                  </div>
                                              )}
                                              {isCheckedIn && <CheckCircle size={18} color="green"/>}
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
                      {processedList.length === 0 && <div style={{textAlign:'center', padding:'30px', color:'#999'}}>No students found.</div>}
                  </div>
              </>
          ) : (
              <div style={{textAlign:'center', padding:'40px', color:'#666'}}>Select a course to start.</div>
          )}
          
          <style>{`
            .stats-panel { grid-template-columns: 2fr 1fr; }
            @media (max-width: 768px) { 
                .stats-panel { grid-template-columns: 1fr; position: relative !important; z-index: 0; } 
            }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .spin { animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
      </div>
  );
}
