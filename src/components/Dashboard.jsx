import React, { useState, useEffect, useMemo } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle, Activity, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';

// Color Palette
const COLORS = {
  male: '#007bff',
  female: '#e91e63',
  arrived: '#28a745',
  pending: '#ffc107',
  cancelled: '#dc3545',
  old: '#6f42c1',
  new: '#20c997'
};

export default function CourseDashboard({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- AUTO SELECT ACTIVE COURSE ---
  useEffect(() => {
      if (courses.length > 0 && !courseId) {
          // Find the most relevant course (Active or Upcoming)
          const active = courses.find(c => new Date(c.end_date) >= new Date());
          if (active) setCourseId(active.course_id);
      }
  }, [courses]);

  // --- DATA FETCH ---
  useEffect(() => {
      if (courseId) {
          setLoading(true);
          fetch(`${API_URL}/courses/${courseId}/participants`)
              .then(res => res.json())
              .then(data => {
                  setParticipants(Array.isArray(data) ? data : []);
                  setLoading(false);
              });
      }
  }, [courseId]);

  // --- ANALYTICS ENGINE ---
  const stats = useMemo(() => {
      if (!participants.length) return null;

      const total = participants.length;
      const valid = participants.filter(p => p.status !== 'Cancelled');
      const arrived = valid.filter(p => p.status === 'Attending');
      const pending = valid.filter(p => p.status !== 'Attending');
      
      // 1. Arrival Speed
      const arrivalRate = Math.round((arrived.length / valid.length) * 100) || 0;

      // 2. Age Distribution Logic (Expected Students)
      const ageGroups = { '18-29': {m:0, f:0}, '30-49': {m:0, f:0}, '50-64': {m:0, f:0}, '65+': {m:0, f:0} };
      valid.forEach(p => {
          const age = parseInt(p.age) || 0;
          const gender = (p.gender || '').toLowerCase().startsWith('m') ? 'm' : 'f';
          let group = '18-29';
          if (age >= 65) group = '65+';
          else if (age >= 50) group = '50-64';
          else if (age >= 30) group = '30-49';
          
          ageGroups[group][gender]++;
      });

      const ageData = Object.keys(ageGroups).map(key => ({
          name: key,
          Male: ageGroups[key].m,
          Female: ageGroups[key].f
      }));

      // 3. Category Split (Old vs New)
      let oldS = 0, newS = 0;
      valid.forEach(p => {
          const conf = (p.conf_no || '').toUpperCase();
          if (conf.startsWith('O') || conf.startsWith('S')) oldS++;
          else newS++;
      });
      const catData = [
          { name: 'Old Student', value: oldS },
          { name: 'New Student', value: newS }
      ];

      // 4. Critical Pending (Medical/Elderly who haven't arrived)
      const criticalPending = pending.filter(p => 
          (parseInt(p.age) >= 65) || (p.medical_info && p.medical_info.length > 2)
      );

      return { total: valid.length, arrived: arrived.length, pending: pending.length, arrivalRate, ageData, catData, criticalPending, arrivedList: arrived.reverse().slice(0, 5) }; // Last 5 arrivals
  }, [participants]);

  const selectedCourse = courses.find(c => c.course_id == courseId);

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#2c3e50'}}>
                  <Activity size={28} color="#e91e63"/> Zero-Day-Course-Dashboard
              </h2>
              <div style={{color:'#666', marginTop:'5px', fontSize:'14px'}}>
                  Real-time Operational Metrics • {selectedCourse?.course_name || 'Select Course'}
              </div>
          </div>
          <select style={{...styles.input, padding:'10px', fontSize:'14px'}} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
          </select>
      </div>

      {loading && <div style={{textAlign:'center', padding:'50px'}}>Loading Data...</div>}

      {stats && !loading && (
          <>
              {/* TOP KPI CARDS */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'30px'}}>
                  <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.male}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#0d47a1', textTransform:'uppercase'}}>Expected Total</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.total}</div>
                      <div style={{fontSize:'11px', color:'#666'}}>Valid Registrations</div>
                  </div>
                  <div style={{background:'#e8f5e9', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.arrived}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#1b5e20', textTransform:'uppercase'}}>Checked-In</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.arrived}</div>
                      <div style={{fontSize:'11px', color:'#666'}}>{stats.arrivalRate}% Completion</div>
                  </div>
                  <div style={{background:'#fff3e0', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.pending}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#e65100', textTransform:'uppercase'}}>Pending Arrival</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.pending}</div>
                      <div style={{fontSize:'11px', color:'#666'}}>Remaining</div>
                  </div>
                  <div style={{background:'#fce4ec', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.female}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#880e4f', textTransform:'uppercase'}}>Critical Pending</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#c2185b'}}>{stats.criticalPending.length}</div>
                      <div style={{fontSize:'11px', color:'#666'}}>Medical / Elderly (65+)</div>
                  </div>
              </div>

              {/* CHARTS ROW */}
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'30px'}}>
                  
                  {/* AGE DISTRIBUTION CHART (REQUESTED) */}
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                      <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}>
                          <Users size={18}/> Expected Age Distribution
                      </h4>
                      <div style={{height:'300px', width:'100%'}}>
                          <ResponsiveContainer>
                              <BarChart data={stats.ageData} margin={{top: 20, right: 30, left: 0, bottom: 5}}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip cursor={{fill: 'transparent'}} />
                                  <Legend />
                                  <Bar dataKey="Male" fill={COLORS.male} radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="Female" fill={COLORS.female} radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <div style={{textAlign:'center', fontSize:'11px', color:'#999', marginTop:'10px'}}>
                          * Helps plan ground-floor room allocation for 65+
                      </div>
                  </div>

                  {/* STUDENT MIX PIE CHART */}
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                      <h4 style={{marginTop:0, color:'#555'}}>Student Mix</h4>
                      <div style={{height:'250px', width:'100%'}}>
                          <ResponsiveContainer>
                              <PieChart>
                                  <Pie
                                      data={stats.catData}
                                      cx="50%" cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      <Cell fill={COLORS.old} />
                                      <Cell fill={COLORS.new} />
                                  </Pie>
                                  <Tooltip />
                                  <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div style={{textAlign:'center', marginTop:'10px'}}>
                          <span style={{fontSize:'12px', color: COLORS.old, fontWeight:'bold', marginRight:'10px'}}>Old: {stats.catData[0].value}</span>
                          <span style={{fontSize:'12px', color: COLORS.new, fontWeight:'bold'}}>New: {stats.catData[1].value}</span>
                      </div>
                  </div>
              </div>

              {/* BOTTOM ROW: CRITICAL PENDING LIST */}
              {stats.criticalPending.length > 0 && (
                  <div style={{marginBottom:'30px', border:'1px solid #ffcdd2', borderRadius:'10px', overflow:'hidden'}}>
                      <div style={{background:'#ffebee', padding:'10px 15px', color:'#c62828', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}>
                          <AlertTriangle size={18}/> Critical Pending Arrivals (Priority Check-In)
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'1px', background:'#ffebee'}}>
                          {stats.criticalPending.map(p => (
                              <div key={p.participant_id} style={{background:'white', padding:'10px', fontSize:'13px'}}>
                                  <div style={{fontWeight:'bold'}}>{p.full_name}</div>
                                  <div style={{color:'#666', fontSize:'11px'}}>Age: {p.age} • {p.gender}</div>
                                  {p.medical_info && <div style={{color:'red', fontSize:'10px', marginTop:'2px'}}>⚠️ {p.medical_info}</div>}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* LIVE FEED */}
              <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'12px'}}>
                  <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}>
                      <CheckCircle size={18} color="green"/> Recent Check-Ins
                  </h4>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                      {stats.arrivedList.length > 0 ? stats.arrivedList.map((p, i) => (
                          <div key={p.participant_id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${p.gender.toLowerCase().startsWith('m')?COLORS.male:COLORS.female}`}}>
                              <div>
                                  <span style={{fontWeight:'bold'}}>{p.full_name}</span>
                                  <span style={{fontSize:'12px', color:'#777', marginLeft:'10px'}}>{p.room_no ? `📍 Room ${p.room_no}` : 'No Room'}</span>
                              </div>
                              <span style={{fontSize:'11px', background:'#e8f5e9', color:'#2e7d32', padding:'2px 8px', borderRadius:'10px'}}>Just Arrived</span>
                          </div>
                      )) : <div style={{color:'#999', fontStyle:'italic'}}>No arrivals yet today.</div>}
                  </div>
              </div>
          </>
      )}
    </div>
  );
}
