import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewAllMode, setViewAllMode] = useState(false); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [assignProgress, setAssignProgress] = useState(''); 
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [printTokenData, setPrintTokenData] = useState(null);
  const [printBulkData, setPrintBulkData] = useState(null);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [seatingConfig, setSeatingConfig] = useState({ mCols: 10, mRows: 8, mChowky: 2, fCols: 7, fRows: 8, fChowky: 2 });

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); }, [courseId]);

  const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
  const getCategoryRank = (conf) => { if (!conf) return 2; const s = conf.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 0; if (s.startsWith('N')) return 1; return 2; };
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const sortedList = useMemo(() => { let items = [...participants]; if (sortConfig.key) { items.sort((a, b) => { let valA = a[sortConfig.key]||'', valB = b[sortConfig.key]||''; if (['age','dining_seat_no'].includes(sortConfig.key)) { valA=parseInt(valA)||0; valB=parseInt(valB)||0; } return valA < valB ? (sortConfig.direction==='asc'?-1:1) : (valA > valB ? (sortConfig.direction==='asc'?1:-1) : 0); }); } return items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); }, [participants, sortConfig, search]);

  const generateColLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse(); };
  const generateChowkyLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse().map(l => `CW-${l}`); };
  const handleAutoAssign = async () => { setShowAutoAssignModal(false); setAssignProgress('Calculating...'); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const allP = await res.json(); const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre))); const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m')); const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f')); const genSeats = (cols, rows) => { let s=[]; for(let r=1; r<=rows; r++) cols.forEach(c=>s.push(c+r)); return s; }; const mReg = genSeats(generateColLabels(seatingConfig.mCols), seatingConfig.mRows); const mSpec = genSeats(generateChowkyLabels(seatingConfig.mChowky), seatingConfig.mRows); const fReg = genSeats(generateColLabels(seatingConfig.fCols), seatingConfig.fRows); const fSpec = genSeats(generateChowkyLabels(seatingConfig.fChowky), seatingConfig.fRows); const assign = (list, regSeats, specSeats) => { const updates = []; const locked = new Set(); list.forEach(p => { if(p.is_seat_locked && p.dhamma_hall_seat_no) locked.add(p.dhamma_hall_seat_no); }); const availReg = regSeats.filter(s => !locked.has(s)); const availSpec = specSeats.filter(s => !locked.has(s)); const toAssign = list.filter(p => !p.is_seat_locked).sort((a,b) => { const rA = getCategoryRank(a.conf_no), rB = getCategoryRank(b.conf_no); if (rA !== rB) return rA - rB; return (parseInt(b.age)||0) - (parseInt(a.age)||0); }); const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating)); const regGroup = toAssign.filter(p => !specGroup.includes(p)); specGroup.forEach(p => { if(availSpec.length) updates.push({...p, dhamma_hall_seat_no: availSpec.shift()}); else regGroup.unshift(p); }); regGroup.forEach(p => { if(availReg.length) updates.push({...p, dhamma_hall_seat_no: availReg.shift()}); }); return updates; }; const updates = [...assign(males, mReg, mSpec), ...assign(females, fReg, fSpec)]; if(updates.length === 0) { setAssignProgress(''); return alert("No assignments needed."); } setAssignProgress(`Saving ${updates.length}...`); const BATCH = 5; for(let i=0; i<updates.length; i+=BATCH) await Promise.all(updates.slice(i, i+BATCH).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) }))); setAssignProgress(''); alert("Done!"); loadStudents(); };

  // ... (Abbreviated common handlers: handleEditSave, handleDelete, handleExport, etc.) ...
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const prepareReceipt = (student) => { const courseObj = courses.find(c => c.course_id == student.course_id) || courses.find(c => c.course_id == courseId); setPrintReceiptData({ courseName: courseObj?.course_name, studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, seatNo: student.dining_seat_no, lockers: student.mobile_locker_no }); setTimeout(() => window.print(), 500); };
  const prepareToken = (student) => { if (!student.dhamma_hall_seat_no) return alert("No Dhamma Seat assigned."); setPrintTokenData({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no }); setTimeout(() => window.print(), 500); };
  const prepareBulkTokens = () => { const valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no); if(valid.length === 0) return alert("No seats assigned"); setPrintBulkData(valid.sort((a,b)=>a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true})).map(student=>({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no }))); setTimeout(()=>window.print(), 500); };

  // ... (Include logic for handleSeatClick, renderGrid, SeatingSheet from previous full code) ...
  const handleSeatClick = async (seatLabel, student) => { if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; } const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null); if (source.label === target.label) return; if (window.confirm(`Swap/Move?`)) { if (!target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } else { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } loadStudents(); } };
  const renderGrid = (map, cols, rows) => { let g=[]; for(let r=rows; r>=1; r--) { let cells=[]; cols.forEach(c => cells.push(<div key={c+r} onClick={()=>handleSeatClick(c+r, map[c+r])} style={{border: '1px solid black', background: map[c+r]?'#e3f2fd':'white', width:'60px', height:'40px', fontSize:'10px', overflow:'hidden', cursor:'pointer'}}>{c+r}<br/>{map[c+r]?.full_name?.split(' ')[0]}</div>)); g.push(<div key={r} style={{display:'flex'}}>{cells}</div>); } return g; };

  // Render logic...
  if (viewMode === 'seating') {
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled');
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled');
      const mM = {}, fM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); females.forEach(p=>fM[p.dhamma_hall_seat_no]=p);
      const mCols = [...generateChowkyLabels(seatingConfig.mChowky), ...generateColLabels(seatingConfig.mCols)];
      const fCols = [...generateChowkyLabels(seatingConfig.fChowky), ...generateColLabels(seatingConfig.fCols)];
      return <div style={styles.card}><button onClick={() => setViewMode('list')}>Back</button><h3>Dhamma Hall</h3><div style={{display:'flex', gap:'20px'}}><div><h4>Male</h4>{renderGrid(mM, mCols, seatingConfig.mRows)}</div><div><h4>Female</h4>{renderGrid(fM, fCols, seatingConfig.fRows)}</div></div></div>;
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
         <select style={styles.input} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         <div style={{display:'flex', gap:'5px'}}><button onClick={prepareBulkTokens} style={styles.toolBtn('#17a2b8')}>🎫 Bulk</button><button onClick={()=>setViewMode('seating')} style={styles.toolBtn('#28a745')}>🧘 DH</button></div>
      </div>
      {/* ... Table implementation ... */}
      <table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr style={{background:'#f8f9fa'}}><th>Name</th><th>Conf</th><th>Room</th><th>Dining</th><th>Status</th></tr></thead><tbody>{sortedList.map(p=>(<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td>{p.full_name}</td><td>{p.conf_no}</td><td>{p.room_no}</td><td>{p.dining_seat_no}</td><td>{p.status}</td></tr>))}</tbody></table>
    </div>
  );
}
