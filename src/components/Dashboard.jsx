import React, { useState, useEffect, useMemo } from 'react';
import { Users, AlertTriangle, CheckCircle, Activity, Headphones, Armchair, UserCheck, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';

const COLORS = { male: '#007bff', female: '#e91e63', arrived: '#28a745', pending: '#ffc107', gate: '#ff9800', old: '#6f42c1', new: '#20c997' };
const MIX_COLORS = { OM: '#0d47a1', NM: '#64b5f6', OF: '#880e4f', NF: '#f06292', SM: '#2e7d32', SF: '#69f0ae' };

export default function CourseDashboard({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (courses.length > 0 && !courseId) {
          const active = courses.find(c => new Date(c.end_date) >= new Date());
          if (active) setCourseId(active.course_id);
      }
  }, [courses]);

  useEffect(() => {
      if (courseId) {
          setLoading(true);
          const fetchP = () => fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => { setParticipants(Array.isArray(data) ? data : []); setLoading(false); });
          fetchP();
          const interval = setInterval(fetchP, 10000); 
          return () => clearInterval(interval);
      }
  }, [courseId]);

  const stats = useMemo(() => {
      if (!participants.length) return null;
      
      const valid = participants.filter(p => p.status !== 'Cancelled');
      const fullyCheckedIn = valid.filter(p => p.status === 'Attending');
      const atGate = valid.filter(p => p.status === 'Gate Check-In');
      const totalArrived = [...fullyCheckedIn, ...atGate]; 
      const pendingArrival = valid.filter(p => p.status !== 'Attending' && p.status !== 'Gate Check-In');

      const expectedMale = valid.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const expectedFemale = valid.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
      
      // --- HELPER: GET BREAKDOWN ---
      const getBreakdown = (list) => {
          const b = { om: 0, nm: 0, of: 0, nf: 0, total: list.length };
          list.forEach(p => {
              const isMale = (p.gender || '').toLowerCase().startsWith('m');
              const conf = (p.conf_no || '').toUpperCase();
              const isOld = conf.startsWith('O') || conf.startsWith('S'); 
              if (isMale) { isOld ? b.om++ : b.nm++; } else { isOld ? b.of++ : b.nf++; }
          });
          return b;
      };

      const arrivedStats = getBreakdown(totalArrived); // On Campus (Gate + Checked In)
      const gateStats = getBreakdown(atGate);          // Specifically at Gate
      const pendingStats = getBreakdown(pendingArrival); // Not yet here

      // --- AGE DISTRIBUTION ---
      const ageGroups = { '18-29': {m:0, f:0}, '30-49': {m:0, f:0}, '50-64': {m:0, f:0}, '65+': {m:0, f:0} };
      valid.forEach(p => {
          const age = parseInt(p.age) || 0;
          const gender = (p.gender || '').toLowerCase().startsWith('m') ? 'm' : 'f';
          let group = '18-29';
          if (age >= 65) group = '65+'; else if (age >= 50) group = '50-64'; else if (age >= 30) group = '30-49';
          ageGroups[group][gender]++;
      });
      const ageData = Object.keys(ageGroups).map(key => ({ name: key, Male: ageGroups[key].m, Female: ageGroups[key].f }));

      // --- STUDENT MIX ---
      const mixCounts = { OM:0, NM:0, OF:0, NF:0, SM:0, SF:0 };
      valid.forEach(p => {
          const conf = (p.conf_no || '').toUpperCase();
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          if (conf.startsWith('S')) { isMale ? mixCounts.SM++ : mixCounts.SF++; } 
          else if (conf.startsWith('O')) { isMale ? mixCounts.OM++ : mixCounts.OF++; } 
          else { isMale ? mixCounts.NM++ : mixCounts.NF++; }
      });
      const catData = [
          { name: 'Old Male', value: mixCounts.OM, code: 'OM', color: MIX_COLORS.OM },
          { name: 'New Male', value: mixCounts.NM, code: 'NM', color: MIX_COLORS.NM },
          { name: 'Old Female', value: mixCounts.OF, code: 'OF', color: MIX_COLORS.OF },
          { name: 'New Female', value: mixCounts.NF, code: 'NF', color: MIX_COLORS.NF },
          { name: 'Server M', value: mixCounts.SM, code: 'SM', color: MIX_COLORS.SM },
          { name: 'Server F', value: mixCounts.SF, code: 'SF', color: MIX_COLORS.SF }
      ].filter(item => item.value > 0);

      // --- CRITICAL PENDING ---
      const allCritical = valid.filter(p => (parseInt(p.age) >= 65) || (p.medical_info && p.medical_info.length > 2));
      const criticalPendingList = allCritical.filter(p => p.status !== 'Attending'); 
      const criticalStats = { total: allCritical.length, pending: criticalPendingList.length, done: allCritical.length - criticalPendingList.length };

      // --- DETAILED DISCOURSE LOGIC ---
      const langMap = {}; 
      // Structure: { "Hindi": { om:0, nm:0, of:0, nf:0, tot:0 } }
      fullyCheckedIn.forEach(p => {
          const lang = p.discourse_language || 'Unknown';
          if (!langMap[lang]) langMap[lang] = { om:0, nm:0, of:0, nf:0, tot:0 };
          
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const conf = (p.conf_no || '').toUpperCase();
          const isOld = conf.startsWith('O') || conf.startsWith('S');

          if(isMale) { isOld ? langMap[lang].om++ : langMap[lang].nm++; }
          else { isOld ? langMap[lang].of++ : langMap[lang].nf++; }
          langMap[lang].tot++;
      });
      // Sort by total count descending
      const discourseData = Object.entries(langMap)
          .map(([lang, counts]) => ({ lang, ...counts }))
          .sort((a,b) => b.tot - a.tot);

      // --- SEATING STATS ---
      const seatingStats = { Chowky: {t:0,m:0,f:0}, Chair: {t:0,m:0,f:0}, BackRest: {t:0,m:0,f:0}, Floor: {t:0,m:0,f:0} };
      valid.forEach(p => {
          const type = p.special_seating || 'None';
          const isMale = (p.gender||'').toLowerCase().startsWith('m');
          const k = isMale ? 'm' : 'f';
          let cat = 'Floor';
          if(type === 'Chowky') cat = 'Chowky'; else if(type === 'Chair') cat = 'Chair'; else if(type === 'BackRest') cat = 'BackRest';
          seatingStats[cat].t++; seatingStats[cat][k]++;
      });

      return { 
          total: valid.length, expectedMale, expectedFemale, 
          totalArrived: totalArrived.length, fullyCheckedIn: fullyCheckedIn.length, 
          gateStats, arrivedStats, pendingStats,
          ageData, catData, discourseData, // Updated Data Structure
          criticalPendingList, criticalStats, 
          seatingStats 
      }; 
  }, [participants]);

  const selectedCourse = courses.find(c => c.course_id == courseId);

  const BreakdownGrid = ({ data }) => (
      <div style={{marginTop:'10px', fontSize:'11px', background:'rgba(255,255,255,0.6)', borderRadius:'6px', padding:'5px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'2px'}}>
              <span style={{color: COLORS.male, fontWeight:'bold'}}>M:</span>
              <span><span style={{color: COLORS.old, fontWeight:'bold'}}>O: {data.om}</span> <span style={{color:'#aaa'}}>|</span> <span style={{color: COLORS.new, fontWeight:'bold'}}>N: {data.nm}</span></span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color: COLORS.female, fontWeight:'bold'}}>F:</span>
              <span><span style={{color: COLORS.old, fontWeight:'bold'}}>O: {data.of}</span> <span style={{color:'#aaa'}}>|</span> <span style={{color: COLORS.new, fontWeight:'bold'}}>N: {data.nf}</span></span>
          </div>
      </div>
  );

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div><h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#2c3e50'}}><Activity size={28} color="#e91e63"/> Zero-Day-Dashboard</h2><div style={{color:'#666', marginTop:'5px', fontSize:'14px'}}>Real-time Operational Metrics • {selectedCourse?.course_name || 'Select Course'}</div></div>
          <select style={{...styles.input, padding:'10px', fontSize:'14px'}} value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      </div>

      {loading && <div style={{textAlign:'center', padding:'50px'}}>Loading Data...</div>}

      {stats && !loading && (
          <>
              {/* TOP KPI CARDS */}
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'30px'}}>
                  
                  {/* CARD 1: EXPECTED */}
                  <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.male}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#0d47a1', textTransform:'uppercase'}}>Expected Total</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333', display:'flex', alignItems:'baseline', gap:'10px'}}>
                          {stats.total}
                          <span style={{fontSize:'14px', fontWeight:'normal', color:'#555'}}>(M: <span style={{color: COLORS.male, fontWeight:'bold'}}>{stats.expectedMale}</span> | F: <span style={{color: COLORS.female, fontWeight:'bold'}}>{stats.expectedFemale}</span>)</span>
                      </div>
                      <div style={{fontSize:'11px', color:'#666'}}>Valid Registrations</div>
                  </div>

                  {/* CARD 2: GATE CHECK-IN (NEW) */}
                  <div style={{background:'#fff3e0', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.gate}`}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                          <div style={{fontSize:'12px', fontWeight:'bold', color:'#e65100', textTransform:'uppercase'}}>At Gate</div>
                          <Shield size={16} color="#ef6c00"/>
                      </div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.gateStats.total}</div>
                      <BreakdownGrid data={stats.gateStats} />
                  </div>

                  {/* CARD 3: FULLY CHECKED IN */}
                  <div style={{background:'#e8f5e9', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.arrived}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#1b5e20', textTransform:'uppercase'}}>Checked-In (Onboarded)</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.fullyCheckedIn}</div>
                      <BreakdownGrid data={stats.arrivedStats} />
                  </div>

                  {/* CARD 4: PENDING ARRIVAL */}
                  <div style={{background:'#fce4ec', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.female}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#880e4f', textTransform:'uppercase'}}>Pending Arrival</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#c2185b'}}>{stats.pendingStats.total}</div>
                      <BreakdownGrid data={stats.pendingStats} />
                  </div>
              </div>

              {/* CHARTS ROW 1 */}
              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'30px'}}>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}><h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Users size={18}/> Expected Age Distribution</h4><div style={{height:'300px', width:'100%'}}><ResponsiveContainer><BarChart data={stats.ageData} margin={{top: 20, right: 30, left: 0, bottom: 5}}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip cursor={{fill: 'transparent'}} /><Legend /><Bar dataKey="Male" fill={COLORS.male} radius={[4, 4, 0, 0]} /><Bar dataKey="Female" fill={COLORS.female} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}><h4 style={{marginTop:0, color:'#555'}}>Student Mix</h4><div style={{height:'220px', width:'100%'}}><ResponsiveContainer><PieChart><Pie data={stats.catData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">{stats.catData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px', marginTop:'5px'}}>{stats.catData.map(d => (<div key={d.name} style={{fontSize:'11px', display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:d.color}}></div><span style={{color:'#555', fontWeight:'bold'}}>{d.code}: {d.value}</span></div>))}</div></div>
              </div>

              {/* SEATING LOGISTICS FOR ADMIN */}
              <div style={{marginBottom:'30px'}}>
                  <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Armchair size={18}/> Dhamma Hall Seating Plan (Admin View)</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px'}}>
                      {['Chowky','Chair','BackRest','Floor'].map(type => (
                          <div key={type} style={{background:'white', padding:'15px', borderRadius:'8px', border:'1px solid #eee', textAlign:'center', borderTop:`3px solid ${type==='Floor'?'#28a745':'#e91e63'}`}}>
                              <div style={{fontSize:'11px', textTransform:'uppercase', color:'#999', fontWeight:'bold'}}>{type}</div>
                              <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.seatingStats[type].t}</div>
                              <div style={{fontSize:'12px', background:'#f8f9fa', padding:'4px', borderRadius:'4px', marginTop:'5px', fontWeight:'500'}}>
                                  M: <span style={{color: COLORS.male}}>{stats.seatingStats[type].m}</span> | F: <span style={{color: COLORS.female}}>{stats.seatingStats[type].f}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* CHARTS ROW 2 - TABLE & CRITICAL LIST */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                  {/* 1. DISCOURSE LANGUAGE TABLE */}
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', maxHeight:'300px', overflowY:'auto'}}>
                      <h4 style={{marginTop:0, marginBottom:'15px', color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Headphones size={18}/> Live Discourse Req. (Checked-In)</h4>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                          <thead style={{background:'#f8f9fa', position:'sticky', top:0}}>
                              <tr>
                                  <th style={{textAlign:'left', padding:'8px', borderBottom:'2px solid #ddd'}}>Lang</th>
                                  <th style={{textAlign:'center', padding:'8px', borderBottom:'2px solid #ddd', color:COLORS.male}}>Male</th>
                                  <th style={{textAlign:'center', padding:'8px', borderBottom:'2px solid #ddd', color:COLORS.female}}>Female</th>
                                  <th style={{textAlign:'right', padding:'8px', borderBottom:'2px solid #ddd'}}>Total</th>
                              </tr>
                          </thead>
                          <tbody>
                              {stats.discourseData.length > 0 ? stats.discourseData.map((row, i) => (
                                  <tr key={row.lang} style={{borderBottom:'1px solid #f0f0f0'}}>
                                      <td style={{padding:'8px', fontWeight:'bold'}}>{row.lang}</td>
                                      <td style={{padding:'8px', textAlign:'center'}}>
                                          <span style={{color:COLORS.old, fontWeight:'bold'}}>{row.om} O</span> <span style={{color:'#ccc'}}>|</span> <span style={{color:COLORS.new, fontWeight:'bold'}}>{row.nm} N</span>
                                      </td>
                                      <td style={{padding:'8px', textAlign:'center'}}>
                                          <span style={{color:COLORS.old, fontWeight:'bold'}}>{row.of} O</span> <span style={{color:'#ccc'}}>|</span> <span style={{color:COLORS.new, fontWeight:'bold'}}>{row.nf} N</span>
                                      </td>
                                      <td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>{row.tot}</td>
                                  </tr>
                              )) : <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#999'}}>No check-ins yet.</td></tr>}
                          </tbody>
                      </table>
                  </div>
                  
                  {/* 2. CRITICAL LIST (With Bottom Summary) */}
                  <div style={{border:'1px solid #ffcdd2', borderRadius:'12px', overflow:'hidden', display:'flex', flexDirection:'column', background:'white'}}>
                      <div style={{background:'#ffebee', padding:'10px 15px', color:'#c62828', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}><AlertTriangle size={18}/> Critical Actions Pending</div>
                      
                      <div style={{flex:1, overflowY:'auto', padding:'0'}}>
                          {stats.criticalPendingList.length > 0 ? (stats.criticalPendingList.map(p => (
                              <div key={p.participant_id} style={{padding:'10px', borderBottom:'1px solid #eee', fontSize:'13px'}}>
                                  <div style={{display:'flex', justifyContent:'space-between'}}>
                                      <span style={{fontWeight:'bold'}}>{p.full_name}</span>
                                      <span style={{fontSize:'11px', background:'#eee', padding:'1px 5px', borderRadius:'4px'}}>{p.conf_no}</span>
                                  </div>
                                  <div style={{color:'#666', fontSize:'11px'}}>Age: {p.age} • {p.gender}</div>
                                  {p.medical_info && <div style={{color:'red', fontSize:'11px', marginTop:'2px'}}>⚠️ {p.medical_info}</div>}
                              </div>
                          ))) : <div style={{padding:'30px', textAlign:'center', color:'#2e7d32'}}><UserCheck size={32} style={{marginBottom:'10px'}}/><br/>All Critical Students Onboarded!</div>}
                      </div>

                      {/* Summary Footer */}
                      <div style={{background:'#fce4ec', padding:'10px', borderTop:'1px solid #f8bbd0', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'12px', fontWeight:'bold', color:'#880e4f'}}>
                          <span>Medical / Elderly (65+)</span>
                          <span style={{background:'white', padding:'2px 8px', borderRadius:'10px', border:'1px solid #f8bbd0'}}>
                              Pending: {stats.criticalStats.pending} / {stats.criticalStats.total}
                          </span>
                      </div>
                  </div>
              </div>
          </>
      )}
    </div>
  );
}
