import React, { useState, useEffect, useMemo } from 'react';
import { Users, Home, Utensils, BookOpen, AlertCircle, CheckCircle, Clock, Activity, TrendingUp, UserCheck, Shield, Armchair, Headphones, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';

const COLORS = { male: '#007bff', female: '#e91e63', arrived: '#28a745', pending: '#ffc107', gate: '#ff9800', old: '#6f42c1', new: '#20c997' };
const MIX_COLORS = { OM: '#0d47a1', NM: '#64b5f6', OF: '#880e4f', NF: '#f06292', SM: '#2e7d32', SF: '#69f0ae' };

export default function Dashboard({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- DATA LOADING ---
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

  // --- STATISTICS PROCESSING ---
  const stats = useMemo(() => {
      if (!participants.length) return null;
      
      // 1. ORIGINAL TOTALS (Including Cancelled)
      const totalCount = participants.length;
      const totalMale = participants.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const totalFemale = participants.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
      const cancelledList = participants.filter(p => p.status === 'Cancelled' || p.status === 'No-Show');
      const cancelledCount = cancelledList.length;

      // 2. ACTIVE (VALID) PARTICIPANTS
      const valid = participants.filter(p => p.status !== 'Cancelled' && p.status !== 'No-Show');
      const validCount = valid.length;

      // 3. OPERATIONAL STATUS (Based on Valid only)
      const fullyCheckedIn = valid.filter(p => p.status === 'Attending');
      const atGate = valid.filter(p => p.status === 'Gate Check-In');
      const pendingArrival = valid.filter(p => p.status !== 'Attending' && p.status !== 'Gate Check-In');
      
      // 4. DETAILED MIX BREAKDOWN (Based on TOTAL Original Roster)
      const expectedMix = { om: 0, nm: 0, sm: 0, of: 0, nf: 0, sf: 0 };
      participants.forEach(p => {
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const conf = (p.conf_no || '').toUpperCase();
          if (isMale) {
              if (conf.startsWith('SM')) expectedMix.sm++;
              else if (conf.startsWith('O') || conf.startsWith('S')) expectedMix.om++;
              else expectedMix.nm++;
          } else {
              if (conf.startsWith('SF')) expectedMix.sf++;
              else if (conf.startsWith('O') || conf.startsWith('S')) expectedMix.of++;
              else expectedMix.nf++;
          }
      });

      // Helper for other operational breakdowns
      const getDetailedBreakdown = (list) => {
          const b = { om: 0, nm: 0, sm: 0, of: 0, nf: 0, sf: 0, total: list.length };
          list.forEach(p => {
              const isMale = (p.gender || '').toLowerCase().startsWith('m');
              const conf = (p.conf_no || '').toUpperCase();
              if (isMale) {
                  if (conf.startsWith('SM')) b.sm++;
                  else if (conf.startsWith('O') || conf.startsWith('S')) b.om++;
                  else b.nm++;
              } else {
                  if (conf.startsWith('SF')) b.sf++;
                  else if (conf.startsWith('O') || conf.startsWith('S')) b.of++;
                  else b.nf++;
              }
          });
          return b;
      };

      const arrivedStats = getDetailedBreakdown(fullyCheckedIn);
      const gateStats = getDetailedBreakdown(atGate);
      const pendingStats = getDetailedBreakdown(pendingArrival);

      // Age Stats (Valid Only)
      const ageGroups = { '18-29': {m:0, f:0}, '30-49': {m:0, f:0}, '50-64': {m:0, f:0}, '65+': {m:0, f:0} };
      valid.forEach(p => {
          const age = parseInt(p.age) || 0;
          const gender = (p.gender || '').toLowerCase().startsWith('m') ? 'm' : 'f';
          let group = '18-29';
          if (age >= 65) group = '65+'; else if (age >= 50) group = '50-64'; else if (age >= 30) group = '30-49';
          ageGroups[group][gender]++;
      });
      const ageData = Object.keys(ageGroups).map(key => ({ name: key, Male: ageGroups[key].m, Female: ageGroups[key].f }));

      // Mix Stats for Pie Chart (Valid Only)
      const mixCounts = { OM:0, NM:0, SM:0, OF:0, NF:0, SF:0 };
      valid.forEach(p => {
          const conf = (p.conf_no || '').toUpperCase();
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          if (isMale) {
              if (conf.startsWith('SM')) mixCounts.SM++;
              else if (conf.startsWith('O') || conf.startsWith('S')) mixCounts.OM++;
              else mixCounts.NM++;
          } else {
              if (conf.startsWith('SF')) mixCounts.SF++;
              else if (conf.startsWith('O') || conf.startsWith('S')) mixCounts.OF++;
              else mixCounts.NF++;
          }
      });

      const catData = [
          { name: 'Old Male', value: mixCounts.OM, code: 'OM', color: MIX_COLORS.OM },
          { name: 'New Male', value: mixCounts.NM, code: 'NM', color: MIX_COLORS.NM },
          { name: 'Server M', value: mixCounts.SM, code: 'SM', color: MIX_COLORS.SM },
          { name: 'Old Female', value: mixCounts.OF, code: 'OF', color: MIX_COLORS.OF },
          { name: 'New Female', value: mixCounts.NF, code: 'NF', color: MIX_COLORS.NF },
          { name: 'Server F', value: mixCounts.SF, code: 'SF', color: MIX_COLORS.SF }
      ].filter(item => item.value > 0);

      // Critical Stats (Valid Only)
      const allCritical = valid.filter(p => (parseInt(p.age) >= 65) || (p.medical_info && p.medical_info.length > 2));
      const criticalPendingList = allCritical.filter(p => p.status !== 'Attending'); 
      const criticalStats = { total: allCritical.length, pending: criticalPendingList.length, done: allCritical.length - criticalPendingList.length };

      // Discourse (Valid Only)
      const langMap = {}; 
      fullyCheckedIn.forEach(p => {
          const conf = (p.conf_no || '').toUpperCase();
          if(conf.startsWith('SM') || conf.startsWith('SF')) return; 
          const lang = p.discourse_language || 'Unknown';
          if (!langMap[lang]) langMap[lang] = { om:0, nm:0, of:0, nf:0, tot:0 };
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const isOld = conf.startsWith('O') || conf.startsWith('S');
          if(isMale) { isOld ? langMap[lang].om++ : langMap[lang].nm++; } else { isOld ? langMap[lang].of++ : langMap[lang].nf++; }
          langMap[lang].tot++;
      });
      const discourseData = Object.entries(langMap).map(([lang, counts]) => ({ lang, ...counts })).sort((a,b) => b.tot - a.tot);

      // Seating (Valid Only)
      const seatingStats = { Chowky: {t:0,m:0,f:0}, Chair: {t:0,m:0,f:0}, BackRest: {t:0,m:0,f:0}, Floor: {t:0,m:0,f:0} };
      valid.forEach(p => {
          const type = p.special_seating || 'None';
          const isMale = (p.gender||'').toLowerCase().startsWith('m');
          const k = isMale ? 'm' : 'f';
          let cat = 'Floor';
          if(type === 'Chowky') cat = 'Chowky'; else if(type === 'Chair') cat = 'Chair'; else if(type === 'BackRest') cat = 'BackRest';
          seatingStats[cat].t++; seatingStats[cat][k]++;
      });

      return { total: totalCount, totalMale, totalFemale, cancelledCount, validCount, expectedMix, fullyCheckedIn: fullyCheckedIn.length, gateStats, arrivedStats, pendingStats, ageData, catData, discourseData, criticalPendingList, criticalStats, seatingStats }; 
  }, [participants]);

  const selectedCourse = courses.find(c => c.course_id == courseId);
  const tickerDuration = stats ? Math.max(30, stats.criticalPendingList.length * 8) + 's' : '30s';

  const BreakdownGrid = ({ data }) => (
      <div style={{marginTop:'10px', fontSize:'10px', background:'rgba(255,255,255,0.6)', borderRadius:'6px', padding:'5px', lineHeight:'1.4'}}>
          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #ccc', paddingBottom:'2px', marginBottom:'2px'}}>
              <span style={{color: COLORS.male, fontWeight:'bold'}}>M:</span>
              <span>
                  <span style={{color: MIX_COLORS.OM, fontWeight:'bold'}}>OM:{data.om}</span> | 
                  <span style={{color: MIX_COLORS.NM, fontWeight:'bold'}}> NM:{data.nm}</span> | 
                  <span style={{color: MIX_COLORS.SM, fontWeight:'bold'}}> SM:{data.sm}</span>
              </span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color: COLORS.female, fontWeight:'bold'}}>F:</span>
              <span>
                  <span style={{color: MIX_COLORS.OF, fontWeight:'bold'}}>OF:{data.of}</span> | 
                  <span style={{color: MIX_COLORS.NF, fontWeight:'bold'}}> NF:{data.nf}</span> | 
                  <span style={{color: MIX_COLORS.SF, fontWeight:'bold'}}> SF:{data.sf}</span>
              </span>
          </div>
      </div>
  );

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div><h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#2c3e50'}}><Activity size={28} color="#e91e63"/> Zero-Day-Dashboard</h2><div style={{color:'#666', marginTop:'5px', fontSize:'14px'}}>Real-time Operational Metrics • {selectedCourse?.course_name || 'Select Course'}</div></div>
          <div style={{display:'flex', gap:'10px'}}>
              <select style={{...styles.input, padding:'10px', fontSize:'14px'}} value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
          </div>
      </div>

      {loading && <div style={{textAlign:'center', padding:'50px'}}>Loading Data...</div>}

      {stats && !loading && (
          <>
              {/* PROGRESS BAR (Visualizing Arrival) */}
              <div style={{background:'#e9ecef', height:'8px', borderRadius:'4px', marginBottom:'20px', overflow:'hidden', display:'flex'}}>
                  <div style={{width:`${(stats.fullyCheckedIn / stats.validCount) * 100}%`, background:'#28a745', transition:'width 1s'}}></div>
                  <div style={{width:`${(stats.gateStats.total / stats.validCount) * 100}%`, background:'#ff9800', transition:'width 1s'}}></div>
              </div>
              <div style={{textAlign:'right', fontSize:'11px', color:'#666', marginBottom:'20px'}}>
                  Arrival Progress: <strong>{Math.round(((stats.fullyCheckedIn + stats.gateStats.total) / stats.validCount) * 100)}%</strong> (Green: Done, Orange: Gate)
              </div>

              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px', marginBottom:'30px'}}>
                  {/* ✅ EXPECTED TOTAL (With Granular Mix Breakdown) */}
                  <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.male}`}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#0d47a1', textTransform:'uppercase'}}>Expected Total</div>
                      <div style={{fontSize:'32px', fontWeight:'900', color:'#333', display:'flex', alignItems:'baseline', gap:'10px'}}>
                          {stats.total}
                          <span style={{fontSize:'14px', fontWeight:'normal', color:'#555'}}>(M: <span style={{color: COLORS.male, fontWeight:'bold'}}>{stats.totalMale}</span> | F: <span style={{color: COLORS.female, fontWeight:'bold'}}>{stats.totalFemale}</span>)</span>
                      </div>
                      
                      {/* ✅ MIX BREAKDOWN (New Visual Update) */}
                      <div style={{fontSize:'10px', color:'#555', marginTop:'4px', background:'rgba(255,255,255,0.5)', padding:'3px', borderRadius:'4px'}}>
                          <div style={{display:'flex', gap:'8px'}}>
                              <span style={{color:'#007bff', fontWeight:'bold'}}>M:</span> OM:{stats.expectedMix.om} NM:{stats.expectedMix.nm} SM:{stats.expectedMix.sm}
                          </div>
                          <div style={{display:'flex', gap:'8px'}}>
                              <span style={{color:'#e91e63', fontWeight:'bold'}}>F:</span> OF:{stats.expectedMix.of} NF:{stats.expectedMix.nf} SF:{stats.expectedMix.sf}
                          </div>
                      </div>

                      {/* 🚫 CANCELLED / ACTIVE FOOTER */}
                      <div style={{marginTop:'5px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.6)', padding:'4px', borderRadius:'4px'}}>
                          <span style={{fontSize:'11px', color:'#d32f2f', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}><AlertCircle size={12}/> Cancelled: {stats.cancelledCount}</span>
                          <span style={{fontSize:'11px', color:'#1b5e20', fontWeight:'bold'}}>Active: {stats.validCount}</span>
                      </div>
                  </div>

                  <div style={{background:'#fff3e0', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.gate}`}}><div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}><div style={{fontSize:'12px', fontWeight:'bold', color:'#e65100', textTransform:'uppercase'}}>At Gate</div><Shield size={16} color="#ef6c00"/></div><div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.gateStats.total}</div><BreakdownGrid data={stats.gateStats} /></div>
                  <div style={{background:'#e8f5e9', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.arrived}`}}><div style={{fontSize:'12px', fontWeight:'bold', color:'#1b5e20', textTransform:'uppercase'}}>Checked-In (Onboarded)</div><div style={{fontSize:'32px', fontWeight:'900', color:'#333'}}>{stats.fullyCheckedIn}</div><BreakdownGrid data={stats.arrivedStats} /></div>
                  <div style={{background:'#fce4ec', padding:'20px', borderRadius:'12px', borderLeft:`5px solid ${COLORS.female}`}}><div style={{fontSize:'12px', fontWeight:'bold', color:'#880e4f', textTransform:'uppercase'}}>Pending Arrival</div><div style={{fontSize:'32px', fontWeight:'900', color:'#c2185b'}}>{stats.pendingStats.total}</div><BreakdownGrid data={stats.pendingStats} /></div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'30px'}}>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}><h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Users size={18}/> Expected Age Distribution</h4><div style={{height:'250px', width:'100%'}}><ResponsiveContainer><BarChart data={stats.ageData} margin={{top: 20, right: 30, left: 0, bottom: 5}}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip cursor={{fill: 'transparent'}} /><Legend /><Bar dataKey="Male" fill={COLORS.male} radius={[4, 4, 0, 0]} /><Bar dataKey="Female" fill={COLORS.female} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}><h4 style={{marginTop:0, color:'#555'}}>Student Mix</h4><div style={{height:'200px', width:'100%'}}><ResponsiveContainer><PieChart><Pie data={stats.catData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">{stats.catData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px', marginTop:'5px'}}>{stats.catData.map(d => (<div key={d.name} style={{fontSize:'10px', display:'flex', alignItems:'center', gap:'4px'}}><div style={{width:'8px', height:'8px', borderRadius:'50%', background:d.color}}></div><span style={{color:'#555', fontWeight:'bold'}}>{d.code}: {d.value}</span></div>))}</div></div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', maxHeight:'300px', overflowY:'auto'}}><h4 style={{marginTop:0, marginBottom:'15px', color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Headphones size={18}/> Live Discourse Req. (Checked-In)</h4><table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}><thead style={{background:'#f8f9fa', position:'sticky', top:0}}><tr><th style={{textAlign:'left', padding:'8px', borderBottom:'2px solid #ddd'}}>Lang</th><th style={{textAlign:'center', padding:'8px', borderBottom:'2px solid #ddd', color:COLORS.male}}>Male</th><th style={{textAlign:'center', padding:'8px', borderBottom:'2px solid #ddd', color:COLORS.female}}>Female</th><th style={{textAlign:'right', padding:'8px', borderBottom:'2px solid #ddd'}}>Total</th></tr></thead><tbody>{stats.discourseData.length > 0 ? stats.discourseData.map((row, i) => (<tr key={row.lang} style={{borderBottom:'1px solid #f0f0f0'}}><td style={{padding:'8px', fontWeight:'bold'}}>{row.lang}</td><td style={{padding:'8px', textAlign:'center'}}><span style={{color:COLORS.old, fontWeight:'bold'}}>{row.om} O</span> <span style={{color:'#ccc'}}>|</span> <span style={{color:COLORS.new, fontWeight:'bold'}}>{row.nm} N</span></td><td style={{padding:'8px', textAlign:'center'}}><span style={{color:COLORS.old, fontWeight:'bold'}}>{row.of} O</span> <span style={{color:'#ccc'}}>|</span> <span style={{color:COLORS.new, fontWeight:'bold'}}>{row.nf} N</span></td><td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>{row.tot}</td></tr>)) : <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#999'}}>No check-ins yet.</td></tr>}</tbody></table><div style={{fontSize:'10px', color:'#999', marginTop:'5px', textAlign:'center'}}>* Excludes Servers (SM/SF)</div></div>
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                      <h4 style={{marginTop:0, marginBottom:'20px', color:'#555', display:'flex', alignItems:'center', gap:'8px'}}><Armchair size={18}/> Seating Plan (Total)</h4>
                      <div style={{display:'flex', justifyContent:'space-around', alignItems:'center'}}>
                          {['Chowky','Chair','BackRest','Floor'].map(type => (
                              <div key={type} style={{textAlign:'center'}}>
                                  <div style={{fontSize:'11px', textTransform:'uppercase', color:'#999', fontWeight:'bold', marginBottom:'5px'}}>{type}</div>
                                  <div style={{fontSize:'28px', fontWeight:'900', color: type==='Floor'?'#28a745':'#e91e63'}}>{stats.seatingStats[type].t}</div>
                                  <div style={{fontSize:'11px', color:'#777', fontWeight:'500'}}>M:<span style={{color:COLORS.male}}>{stats.seatingStats[type].m}</span> F:<span style={{color:COLORS.female}}>{stats.seatingStats[type].f}</span></div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div style={{background:'#ffebee', borderTop:'2px solid #ef5350', padding:'10px 0', marginTop:'20px', overflow:'hidden', whiteSpace:'nowrap', display:'flex', alignItems:'center', position:'sticky', bottom:0}}>
                  <div style={{padding:'0 20px', borderRight:'2px solid #ef5350', color:'#c62828', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', zIndex:10, background:'#ffebee'}}>
                      <AlertTriangle size={18}/> <span>Critical Pending: {stats.criticalStats.pending}</span>
                  </div>
                  <div className="ticker-wrapper" style={{flex:1, overflow:'hidden', position:'relative'}}>
                      <div className="ticker-content" style={{display:'inline-block', paddingLeft:'100%', animation: `ticker ${tickerDuration} linear infinite`}}>
                          {stats.criticalPendingList.length > 0 ? stats.criticalPendingList.map((p, i) => (
                              <span key={p.participant_id} style={{display:'inline-block', marginRight:'50px', color:'#333', fontSize:'15px'}}>
                                  <strong style={{color:'#c62828'}}>{p.full_name}</strong> ({p.age} Yrs) <span style={{margin:'0 5px'}}>•</span> <span style={{color:'#d32f2f', fontWeight:'bold', background:'white', padding:'2px 6px', borderRadius:'4px', border:'1px solid #ffcdd2'}}>{p.medical_info || 'Elderly'}</span>
                              </span>
                          )) : <span style={{color:'#2e7d32', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}><CheckCircle size={16}/> All critical cases cleared!</span>}
                      </div>
                  </div>
              </div>
              <style>{`
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
                .ticker-content:hover { animation-play-state: paused; }
              `}</style>
          </>
      )}
    </div>
  );
}
