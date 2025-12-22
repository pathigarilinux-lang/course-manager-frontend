import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, AlertTriangle, MapPin, UserCheck } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  
  useEffect(() => { 
      if (selectedCourse) {
          fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); 
          fetch(`${API_URL}/courses/${selectedCourse}/participants`).then(res => res.json()).then(setParticipants).catch(console.error); 
      }
  }, [selectedCourse]);

  const all = participants.filter(p => p.status !== 'Cancelled');
  const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
  const pending = all.filter(p => p.status === 'No Response');
  
  const ageGroups = { '18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60-69': 0, '70+': 0 };
  arrived.forEach(p => {
      const age = parseInt(p.age) || 0;
      if (age >= 18 && age <= 29) ageGroups['18-29']++;
      else if (age >= 30 && age <= 39) ageGroups['30-39']++;
      else if (age >= 40 && age <= 49) ageGroups['40-49']++;
      else if (age >= 50 && age <= 59) ageGroups['50-59']++;
      else if (age >= 60 && age <= 69) ageGroups['60-69']++;
      else if (age >= 70) ageGroups['70+']++;
  });
  const ageData = Object.keys(ageGroups).map(key => ({ name: key, count: ageGroups[key] }));

  let osCount = 0, nsCount = 0;
  arrived.forEach(p => { const conf = (p.conf_no || '').toUpperCase(); if (conf.startsWith('O') || conf.startsWith('S')) osCount++; else if (conf.startsWith('N')) nsCount++; });
  const categoryData = [{ name: 'Old (OS)', value: osCount }, { name: 'New (NS)', value: nsCount }];
  const PIE_COLORS = ['#0088FE', '#FFBB28'];

  const langCounts = {}; arrived.forEach(p => { const l = p.discourse_language || 'Unknown'; langCounts[l] = (langCounts[l] || 0) + 1; });
  const langData = Object.keys(langCounts).map(k => ({ name: k, count: langCounts[k] })).sort((a,b) => b.count - a.count);

  const getBreakdown = (list, filterFn) => list.filter(filterFn).length;
  const isMale = (p) => (p.gender||'').toLowerCase().startsWith('m');
  const isFemale = (p) => (p.gender||'').toLowerCase().startsWith('f');
  
  const detailedStats = {
      m: { tot: getBreakdown(all, isMale), arr: getBreakdown(arrived, isMale), pend: getBreakdown(pending, isMale) },
      f: { tot: getBreakdown(all, isFemale), arr: getBreakdown(arrived, isFemale), pend: getBreakdown(pending, isFemale) },
  };

  const StatBox = ({ label, v1, v2, v3, color }) => (
      <div style={{background:'white', padding:'15px', borderRadius:'8px', borderTop:`4px solid ${color}`, textAlign:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:'12px', color:'#777', fontWeight:'bold', textTransform:'uppercase', marginBottom:'10px'}}>{label}</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
              <span title="Total">Exp: <b>{v1}</b></span>
              <span title="Arrived" style={{color:'green'}}>Arr: <b>{v2}</b></span>
              <span title="Pending" style={{color:'red'}}>Pen: <b>{v3}</b></span>
          </div>
      </div>
  );

  const ActionCard = ({ title, count, color, icon, desc }) => (
      <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid ${color}`}}>
          <div style={{background: color, borderRadius:'50%', padding:'10px', color:'white', marginRight:'15px'}}>{icon}</div>
          <div><div style={{fontSize:'12px', color:'#777', textTransform:'uppercase', fontWeight:'bold'}}>{title}</div><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{count}</div><div style={{fontSize:'11px', color:'#999'}}>{desc}</div></div>
      </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0, color:'#333'}}>📊 Course Dashboard</h2><select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
      {stats && selectedCourse ? (
        <>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                <ActionCard title="Expected" count={stats.attending + stats.gate_checkin + stats.no_response} color="#6c757d" icon={<Users size={20}/>} desc="Total Confirmed" />
                <ActionCard title="At Gate" count={stats.gate_checkin} color="#ff9800" icon={<MapPin size={20}/>} desc="Arrived at Campus" />
                <ActionCard title="Onboarded" count={stats.attending} color="#28a745" icon={<UserCheck size={20}/>} desc="Room Assigned" />
                <ActionCard title="Pending" count={stats.no_response} color="#dc3545" icon={<AlertTriangle size={20}/>} desc="Not yet arrived" />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                <StatBox label="Male Statistics" v1={detailedStats.m.tot} v2={detailedStats.m.arr} v3={detailedStats.m.pend} color="#007bff" />
                <StatBox label="Female Statistics" v1={detailedStats.f.tot} v2={detailedStats.f.arr} v3={detailedStats.f.pend} color="#e91e63" />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Arrival Flow by Gender</h3>
                    <div style={{height:'300px'}}><ResponsiveContainer><BarChart data={[{ name: 'Male', Onboarded: stats.attending_m, AtGate: stats.gate_m, Pending: stats.pending_m }, { name: 'Female', Onboarded: stats.attending_f, AtGate: stats.gate_f, Pending: stats.pending_f }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Onboarded" stackId="a" fill="#28a745" /><Bar dataKey="AtGate" stackId="a" fill="#ff9800" /><Bar dataKey="Pending" stackId="a" fill="#e0e0e0" /></BarChart></ResponsiveContainer></div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Student Composition</h3>
                    <div style={{height:'200px'}}><ResponsiveContainer><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'20px'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Age Distribution (Arrived)</h3>
                    <div style={{height:'250px'}}><ResponsiveContainer><BarChart data={ageData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#8884d8" /></BarChart></ResponsiveContainer></div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
                    <h3 style={{margin:'0 0 20px 0', fontSize:'16px', color:'#555'}}>Language Preference</h3>
                    <div style={{maxHeight:'250px', overflowY:'auto'}}><table style={{width:'100%', borderCollapse:'collapse'}}><tbody>{langData.map((l, i) => (<tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}><td style={{padding:'10px', fontWeight:'bold', color:'#333'}}>{l.name}</td><td style={{padding:'10px', textAlign:'right'}}><span style={{background:'#e3f2fd', color:'#0d47a1', padding:'4px 8px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>{l.count}</span></td></tr>))}</tbody></table></div>
                </div>
            </div>
        </>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course to view insights.</p>}
    </div>
  );
}
