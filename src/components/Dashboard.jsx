import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, AlertTriangle, MapPin, UserCheck } from 'lucide-react';
import { API_URL, styles } from '../config';

// Universal Dashboard: Works Standalone OR Embedded
export default function Dashboard({ courses, externalData, role = 'admin' }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);

  // 1. Initialize Course Selection
  useEffect(() => { 
      if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); 
  }, [courses]);
  
  // 2. Data Loading Logic (Smart Switch)
  useEffect(() => { 
      // If parent component (Gatekeeper/Teacher) passes data, use it directly!
      if (externalData) {
          setParticipants(externalData.participants || []);
          // Auto-calculate stats from participants if strictly needed, 
          // but for now we derive visual stats from the 'participants' array below.
          // If externalData has specific stats object, use it:
          if (externalData.stats) setStats(externalData.stats);
      } 
      // Otherwise, fetch it ourselves (Standalone Admin Mode)
      else if (selectedCourse) {
          fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); 
          fetch(`${API_URL}/courses/${selectedCourse}/participants`).then(res => res.json()).then(setParticipants).catch(console.error); 
      }
  }, [selectedCourse, externalData]);

  // --- DATA PROCESSING ---
  const all = participants.filter(p => p.status !== 'Cancelled');
  const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
  const pending = all.filter(p => p.status === 'No Response');
  
  // A. NEW: Stacked Age Distribution (Male/Female)
  const ageGroups = { '18-29': {m:0, f:0}, '30-39': {m:0, f:0}, '40-49': {m:0, f:0}, '50-59': {m:0, f:0}, '60-69': {m:0, f:0}, '70+': {m:0, f:0} };
  arrived.forEach(p => {
      const age = parseInt(p.age) || 0;
      const isMale = (p.gender || '').toLowerCase().startsWith('m');
      const target = isMale ? 'm' : 'f';
      let key = '70+';
      if (age >= 18 && age <= 29) key = '18-29';
      else if (age >= 30 && age <= 39) key = '30-39';
      else if (age >= 40 && age <= 49) key = '40-49';
      else if (age >= 50 && age <= 59) key = '50-59';
      else if (age >= 60 && age <= 69) key = '60-69';
      
      if(ageGroups[key]) ageGroups[key][target]++;
  });
  const ageData = Object.keys(ageGroups).map(key => ({ name: key, Male: ageGroups[key].m, Female: ageGroups[key].f }));

  // B. Category Data (Old vs New)
  let osCount = 0, nsCount = 0;
  arrived.forEach(p => { const conf = (p.conf_no || '').toUpperCase(); if (conf.startsWith('O') || conf.startsWith('S')) osCount++; else if (conf.startsWith('N')) nsCount++; });
  const categoryData = [{ name: 'Old (OS)', value: osCount }, { name: 'New (NS)', value: nsCount }];
  const PIE_COLORS = ['#0088FE', '#FFBB28'];

  // C. Language Data
  const langCounts = {}; arrived.forEach(p => { const l = p.discourse_language || 'Unknown'; langCounts[l] = (langCounts[l] || 0) + 1; });
  const langData = Object.keys(langCounts).map(k => ({ name: k, count: langCounts[k] })).sort((a,b) => b.count - a.count);

  // D. Derived Stats (If API stats missing in embedded mode)
  const getBreakdown = (list, filterFn) => list.filter(filterFn).length;
  const isMale = (p) => (p.gender||'').toLowerCase().startsWith('m');
  const isFemale = (p) => (p.gender||'').toLowerCase().startsWith('f');
  
  // Use API stats if available, otherwise calculate from list
  const displayStats = stats || {
      attending: arrived.length,
      gate_checkin: participants.filter(p=>p.status==='Gate Check-In').length,
      no_response: pending.length,
      attending_m: getBreakdown(arrived, isMale),
      gate_m: getBreakdown(participants.filter(p=>p.status==='Gate Check-In'), isMale),
      pending_m: getBreakdown(pending, isMale),
      attending_f: getBreakdown(arrived, isFemale),
      gate_f: getBreakdown(participants.filter(p=>p.status==='Gate Check-In'), isFemale),
      pending_f: getBreakdown(pending, isFemale),
  };

  const detailedStats = {
      m: { tot: getBreakdown(all, isMale), arr: displayStats.attending_m + displayStats.gate_m, pend: displayStats.pending_m },
      f: { tot: getBreakdown(all, isFemale), arr: displayStats.attending_f + displayStats.gate_f, pend: displayStats.pending_f },
  };

  const StatBox = ({ label, v1, v2, v3, color }) => (
      <div style={{background:'white', padding:'15px', borderRadius:'8px', borderTop:`4px solid ${color}`, textAlign:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:'12px', color:'#777', fontWeight:'bold', textTransform:'uppercase', marginBottom:'10px'}}>{label}</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
              <span title="Total">Exp: <b>{v1}</b></span>
              <span title="Arrived">Arr: <b>{v2}</b></span>
              <span title="Pending" style={{color:'#aaa'}}>Pen: <b>{v3}</b></span>
          </div>
      </div>
  );

  const ActionCard = ({ title, count, color, icon, desc }) => (
      <div style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid ${color}`}}>
          <div style={{background: color, borderRadius:'50%', padding:'8px', color:'white', marginRight:'12px'}}>{icon}</div>
          <div><div style={{fontSize:'11px', color:'#777', textTransform:'uppercase', fontWeight:'bold'}}>{title}</div><div style={{fontSize:'20px', fontWeight:'bold', color:'#333'}}>{count}</div><div style={{fontSize:'10px', color:'#999'}}>{desc}</div></div>
      </div>
  );

  return (
    <div>
      {/* HEADER: Only show selector if Standalone Admin Mode */}
      {!externalData && (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h2 style={{margin:0, color:'#333'}}>📊 Course Dashboard</h2>
            <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        </div>
      )}

      {participants.length > 0 ? (
        <>
            {/* ROW 1: KEY METRICS (Visible to ALL) */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'15px', marginBottom:'20px'}}>
                <ActionCard title="Expected" count={all.length} color="#6c757d" icon={<Users size={18}/>} desc="Total Confirmed" />
                <ActionCard title="At Gate" count={displayStats.gate_checkin + displayStats.gate_m + displayStats.gate_f} color="#ff9800" icon={<MapPin size={18}/>} desc="Waiting Entry" />
                <ActionCard title="Arrived" count={arrived.length} color="#28a745" icon={<UserCheck size={18}/>} desc="Inside Campus" />
                <ActionCard title="Pending" count={displayStats.no_response} color="#dc3545" icon={<AlertTriangle size={18}/>} desc="Not yet arrived" />
            </div>

            {/* ROW 2: DETAILED STATS BOXES */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                <StatBox label="Male Statistics" v1={detailedStats.m.tot} v2={detailedStats.m.arr} v3={detailedStats.m.pend} color="#007bff" />
                <StatBox label="Female Statistics" v1={detailedStats.f.tot} v2={detailedStats.f.arr} v3={detailedStats.f.pend} color="#e91e63" />
            </div>

            {/* ROW 3: GRAPHS */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                {/* 1. ARRIVAL FLOW (Stacked by Status) */}
                <div style={styles.card}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Arrival Flow</h3>
                    <div style={{height:'250px'}}>
                        <ResponsiveContainer>
                            <BarChart data={[
                                { name: 'Male', Arrived: displayStats.attending_m + displayStats.gate_m, Pending: displayStats.pending_m }, 
                                { name: 'Female', Arrived: displayStats.attending_f + displayStats.gate_f, Pending: displayStats.pending_f }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/>
                                <Bar dataKey="Arrived" stackId="a" fill="#28a745" />
                                <Bar dataKey="Pending" stackId="a" fill="#e0e0e0" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. STUDENT COMPOSITION (Old/New) */}
                <div style={styles.card}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Old vs New</h3>
                    <div style={{height:'200px'}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip /><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{textAlign:'center', fontSize:'12px', color:'#666', marginTop:'10px'}}>Based on {arrived.length} Arrived</div>
                </div>
            </div>

            {/* ROW 4: DEMOGRAPHICS (Visible to ALL, but maybe Gatekeeper ignores language) */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'20px'}}>
                
                {/* 3. NEW: AGE DISTRIBUTION (Male/Female Stacked) */}
                <div style={styles.card}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Age Distribution (Arrived)</h3>
                    <div style={{height:'250px'}}>
                        <ResponsiveContainer>
                            <BarChart data={ageData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Male" stackId="a" fill="#007bff" />
                                <Bar dataKey="Female" stackId="a" fill="#e91e63" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. LANGUAGE (Teacher/Admin mostly) */}
                <div style={styles.card}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Language Preference</h3>
                    <div style={{maxHeight:'250px', overflowY:'auto'}}>
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                            <tbody>
                                {langData.map((l, i) => (
                                    <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                                        <td style={{padding:'8px', fontSize:'13px', color:'#333'}}>{l.name}</td>
                                        <td style={{padding:'8px', textAlign:'right'}}>
                                            <span style={{background:'#e3f2fd', color:'#0d47a1', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold'}}>{l.count}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
      ) : <div style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course or wait for data...</div>}
    </div>
  );
}
