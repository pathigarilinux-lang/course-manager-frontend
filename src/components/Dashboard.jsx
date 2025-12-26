import React, { useState, useEffect, useMemo } from 'react';
import { Users, Home, Utensils, BookOpen, AlertCircle, CheckCircle, Clock, Activity, TrendingUp, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { API_URL, styles } from '../config';

export default function AdminDashboard({ courses, refreshCourses }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 1. DATA LOADING & PROCESSING ---
  useEffect(() => {
    if (selectedCourseId) loadCourseStats();
  }, [selectedCourseId]);

  const loadCourseStats = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
        if(res.ok) {
            const data = await res.json();
            processStats(data);
        }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const processStats = (participants) => {
      const s = {
          total: participants.length,
          arrived: 0,
          expected: 0,
          cancelled: 0,
          male: 0, female: 0,
          // Mix: Old Male, New Male, Sevak Male | Sevak Female, Old Female, New Female
          mix: { om: 0, nm: 0, sm: 0, sf: 0, of: 0, nf: 0 }, 
          discourse: {},
          pending: { room: 0, dining: 0, pagoda: 0, dhamma: 0 },
          medical: 0
      };

      participants.forEach(p => {
          // 1. GLOBAL STATUS
          if (p.status === 'Cancelled' || p.status === 'No-Show') {
              s.cancelled++;
              return; 
          }
          
          if (p.status !== 'Attending') {
              s.expected++; // Pending/Gate Check-In
              return;
          }

          // --- ONLY ARRIVED (Attending) BELOW THIS LINE ---
          s.arrived++;

          // 2. IDENTIFY CATEGORY (Strict Logic)
          const conf = (p.conf_no || '').toUpperCase();
          const gender = (p.gender || '').toUpperCase().startsWith('M') ? 'M' : 'F';
          
          // Logic: SM/SF are Servers. O/S (not SM/SF) are Old. N is New.
          let type = 'N'; // Default New
          if (conf.startsWith('SM')) type = 'SM';      // Sevak Male
          else if (conf.startsWith('SF')) type = 'SF'; // Sevak Female
          else if (conf.startsWith('O') || conf.startsWith('S')) type = 'O'; // Old Student
          else if (conf.startsWith('N')) type = 'N';   // New Student

          // 3. STUDENT MIX & GENDER
          if (gender === 'M') {
              s.male++;
              if (type === 'SM') s.mix.sm++;
              else if (type === 'O') s.mix.om++;
              else s.mix.nm++;
          } else {
              s.female++;
              if (type === 'SF') s.mix.sf++;
              else if (type === 'O') s.mix.of++;
              else s.mix.nf++;
          }

          // 4. DISCOURSE (Exclude SM/SF)
          if (type !== 'SM' && type !== 'SF') {
              const lang = p.discourse_language || 'Hindi';
              s.discourse[lang] = (s.discourse[lang] || 0) + 1;
          }

          // 5. CRITICAL PENDING (Unassigned Resources)
          if (!p.room_no) s.pending.room++;
          if (!p.dining_seat_no) s.pending.dining++;
          if (!p.dhamma_hall_seat_no) s.pending.dhamma++;
          // Pagoda logic: Usually only Old students get Pagoda, so only count pending if Old Student
          if (type === 'O' && (!p.pagoda_cell_no || p.pagoda_cell_no === 'None')) s.pending.pagoda++;

          // 6. MEDICAL ALERT
          if (p.medical_info && p.medical_info.length > 2) s.medical++;
      });

      setStats(s);
  };

  // --- CHART DATA HELPERS ---
  const getDiscourseData = () => {
      if(!stats) return [];
      return Object.keys(stats.discourse).map(k => ({ name: k, value: stats.discourse[k] }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // --- RENDER ---
  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#2c3e50'}}>
              <Activity size={24}/> Admin Dashboard
          </h2>
          <select 
              style={{...styles.input, maxWidth:'250px', fontWeight:'bold', color:'#007bff'}} 
              value={selectedCourseId} 
              onChange={e=>setSelectedCourseId(e.target.value)}
          >
              <option value="">-- Select Active Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
          </select>
      </div>

      {selectedCourseId && stats ? (
          <div className="dashboard-grid">
              
              {/* 1. MAIN METRICS ROW */}
              <div style={localStyles.statCard('#e3f2fd')}>
                  <div style={localStyles.iconBox('#2196f3')}><Users color="white" size={20}/></div>
                  <div>
                      <div style={localStyles.label}>Attending (Onboarded)</div>
                      <div style={localStyles.value}>{stats.arrived} <span style={{fontSize:'14px', color:'#666'}}>/ {stats.total}</span></div>
                      <div style={{fontSize:'11px', color:'#555', marginTop:'4px'}}>
                          Students: <strong>{stats.mix.om + stats.mix.nm + stats.mix.of + stats.mix.nf}</strong> | Servers: <strong>{stats.mix.sm + stats.mix.sf}</strong>
                      </div>
                  </div>
              </div>

              <div style={localStyles.statCard('#fff3e0')}>
                  <div style={localStyles.iconBox('#ff9800')}><AlertCircle color="white" size={20}/></div>
                  <div>
                      <div style={localStyles.label}>Critical Pending</div>
                      <div style={localStyles.value}>{stats.pending.room + stats.pending.dining + stats.pending.dhamma}</div>
                      <div style={{fontSize:'10px', color:'#d84315'}}>Unallocated Seats/Rooms</div>
                  </div>
              </div>

              <div style={localStyles.statCard('#e8f5e9')}>
                  <div style={localStyles.iconBox('#4caf50')}><TrendingUp color="white" size={20}/></div>
                  <div>
                      <div style={localStyles.label}>Student Mix</div>
                      {/* SEQUENCE: OM / NM / SM  |  SF / OF / NF  (Wait, user asked: OM/NM/SM/SF/OF/NF) */}
                      {/* Let's group by Gender visually though */}
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'#333'}}>
                          <span style={{color:'#1565c0'}}>M: {stats.mix.om}/{stats.mix.nm}/{stats.mix.sm}</span> 
                          <span style={{margin:'0 8px', color:'#ccc'}}>|</span>
                          <span style={{color:'#c2185b'}}>F: {stats.mix.sf}/{stats.mix.of}/{stats.mix.nf}</span>
                      </div>
                      <div style={{fontSize:'9px', color:'#666', marginTop:'2px'}}>Seq: OM/NM/SM | SF/OF/NF</div>
                  </div>
              </div>

              {/* 2. LIVE DISCOURSE & ALLOCATION */}
              <div style={{gridColumn:'span 3', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                  
                  {/* DISCOURSE CHART */}
                  <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #eee', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                      <h4 style={{marginTop:0, display:'flex', alignItems:'center', gap:'8px', color:'#444'}}><BookOpen size={18}/> Live Discourse Req</h4>
                      <div style={{height:'200px'}}>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getDiscourseData()} layout="vertical">
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={80} style={{fontSize:'12px', fontWeight:'bold'}} />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#8884d8" barSize={20} radius={[0, 10, 10, 0]}>
                                      {getDiscourseData().map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <div style={{textAlign:'center', fontSize:'11px', color:'#999', fontStyle:'italic'}}>* Excludes Servers (SM/SF)</div>
                  </div>

                  {/* ALLOCATION MATRIX */}
                  <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #eee', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                      <h4 style={{marginTop:0, display:'flex', alignItems:'center', gap:'8px', color:'#444'}}><CheckCircle size={18}/> Allocation Status</h4>
                      <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                          <AllocationRow label="Rooms" total={stats.arrived} pending={stats.pending.room} icon={<Home size={14}/>} color="#0088FE" />
                          <AllocationRow label="Dining" total={stats.arrived} pending={stats.pending.dining} icon={<Utensils size={14}/>} color="#00C49F" />
                          <AllocationRow label="Dhamma Seat" total={stats.arrived} pending={stats.pending.dhamma} icon={<UserCheck size={14}/>} color="#FFBB28" />
                          <div style={{borderTop:'1px dashed #eee', paddingTop:'10px'}}>
                              <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}>
                                  <span style={{display:'flex', gap:'8px', alignItems:'center'}}><AlertCircle size={14} color="red"/> Medical Cases</span>
                                  <span style={{fontWeight:'bold', color:'red'}}>{stats.medical}</span>
                              </div>
                          </div>
                      </div>
                  </div>

              </div>

          </div>
      ) : (
          <div style={{textAlign:'center', padding:'40px', color:'#999'}}>
              {loading ? "Loading statistics..." : "Select a course to view dashboard."}
          </div>
      )}

      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

// Sub-components for cleaner code
const AllocationRow = ({ label, total, pending, icon, color }) => {
    const assigned = total - pending;
    const percent = total > 0 ? Math.round((assigned / total) * 100) : 0;
    return (
        <div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px', fontWeight:'bold', color:'#555'}}>
                <span style={{display:'flex', alignItems:'center', gap:'6px'}}>{icon} {label}</span>
                <span style={{color: pending > 0 ? '#d32f2f' : '#2e7d32'}}>{assigned} / {total}</span>
            </div>
            <div style={{height:'8px', width:'100%', background:'#f0f0f0', borderRadius:'4px', overflow:'hidden'}}>
                <div style={{height:'100%', width:`${percent}%`, background: color, transition:'width 0.5s'}}></div>
            </div>
        </div>
    );
};

const localStyles = {
    statCard: (bg) => ({ background: bg, padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }),
    iconBox: (bg) => ({ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    label: { fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
    value: { fontSize: '24px', fontWeight: '900', color: '#333', lineHeight: '1.2' }
};
