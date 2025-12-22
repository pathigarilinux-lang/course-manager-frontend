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
  
  // --- DYNAMIC SEATING CONFIGURATION ---
  const [seatingConfig, setSeatingConfig] = useState({ mCols: 10, mRows: 8, mChowky: 2, fCols: 7, fRows: 8, fChowky: 2 });

  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);

  // --- HELPER FUNCTIONS ---
  const getCategoryRank = (conf) => { if (!conf) return 2; const s = conf.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 0; if (s.startsWith('N')) return 1; return 2; };
  const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
  const getLangCode = (lang) => { if(!lang) return 'ENG'; const map = { 'Hindi': 'HIN', 'English': 'ENG', 'Marathi': 'MAR', 'Telugu': 'TEL', 'Tamil': 'TAM', 'Kannada': 'KAN', 'Malayalam': 'MAL', 'Gujarati': 'GUJ' }; return map[lang] || lang.substring(0,3).toUpperCase(); };
  
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const sortedList = React.useMemo(() => { 
      let items = [...participants]; 
      if (sortConfig.key) { 
          items.sort((a, b) => { 
              let valA = a[sortConfig.key];
              let valB = b[sortConfig.key];
              if (valA === null || valA === undefined) valA = '';
              if (valB === null || valB === undefined) valB = '';
              if (['age', 'dining_seat_no', 'pagoda_cell_no', 'laundry_token_no'].includes(sortConfig.key)) {
                  valA = parseInt(valA) || 0;
                  valB = parseInt(valB) || 0;
              } else {
                  valA = valA.toString().toLowerCase();
                  valB = valB.toString().toLowerCase();
              }
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          }); 
      } 
      return items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); 
  }, [participants, sortConfig, search]);

  const getSeniorityScore = (p) => { const sMatch = (p.courses_info||'').match(/S\s*[:=-]?\s*(\d+)/i); const lMatch = (p.courses_info||'').match(/L\s*[:=-]?\s*(\d+)/i); const s = sMatch ? parseInt(sMatch[1]) : 0; const l = lMatch ? parseInt(lMatch[1]) : 0; return (l * 10000) + (s * 10); };
  
  // --- DYNAMIC GRID GENERATOR ---
  const generateColLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse(); };
  const generateChowkyLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse().map(l => `CW-${l}`); };

  const handleAutoAssign = async () => { setShowAutoAssignModal(false); setAssignProgress('Calculating...'); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const allP = await res.json(); const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre))); const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m')); const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f')); const genSeats = (cols, rows) => { let s=[]; for(let r=1; r<=rows; r++) cols.forEach(c=>s.push(c+r)); return s; }; const mReg = genSeats(generateColLabels(seatingConfig.mCols), seatingConfig.mRows); const mSpec = genSeats(generateChowkyLabels(seatingConfig.mChowky), seatingConfig.mRows); const fReg = genSeats(generateColLabels(seatingConfig.fCols), seatingConfig.fRows); const fSpec = genSeats(generateChowkyLabels(seatingConfig.fChowky), seatingConfig.fRows); const assign = (list, regSeats, specSeats) => { const updates = []; const locked = new Set(); list.forEach(p => { if(p.is_seat_locked && p.dhamma_hall_seat_no) locked.add(p.dhamma_hall_seat_no); }); const availReg = regSeats.filter(s => !locked.has(s)); const availSpec = specSeats.filter(s => !locked.has(s)); const toAssign = list.filter(p => !p.is_seat_locked).sort((a,b) => { const rA = getCategoryRank(a.conf_no), rB = getCategoryRank(b.conf_no); if (rA !== rB) return rA - rB; if (rA === 0) return getSeniorityScore(b) - getSeniorityScore(a); return (parseInt(b.age)||0) - (parseInt(a.age)||0); }); const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating)); const regGroup = toAssign.filter(p => !specGroup.includes(p)); specGroup.forEach(p => { if(availSpec.length) updates.push({...p, dhamma_hall_seat_no: availSpec.shift()}); else regGroup.unshift(p); }); regGroup.forEach(p => { if(availReg.length) updates.push({...p, dhamma_hall_seat_no: availReg.shift()}); }); return updates; }; const updates = [...assign(males, mReg, mSpec), ...assign(females, fReg, fSpec)]; if(updates.length === 0) { setAssignProgress(''); return alert("No assignments needed."); } setAssignProgress(`Saving ${updates.length}...`); const BATCH = 5; for(let i=0; i<updates.length; i+=BATCH) await Promise.all(updates.slice(i, i+BATCH).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) }))); setAssignProgress(''); alert("Done!"); loadStudents(); };

  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };

  // --- PRINT PREPARATION FUNCTIONS ---
  const prepareReceipt = (student) => { const courseObj = courses.find(c => c.course_id == student.course_id) || courses.find(c => c.course_id == courseId); setPrintReceiptData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, seatNo: student.dining_seat_no, lockers: student.mobile_locker_no || student.dining_seat_no, language: student.discourse_language, pagoda: student.pagoda_cell_no && student.pagoda_cell_no !== 'None' ? student.pagoda_cell_no : null, special: student.special_seating && student.special_seating !== 'None' ? student.special_seating : null }); setTimeout(() => window.print(), 500); };
  const prepareToken = (student) => { if (!student.dhamma_hall_seat_no) return alert("No Dhamma Seat assigned."); setPrintTokenData({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no||'-', room: student.room_no||'-', age: student.age, cat: getCategory(student.conf_no), sVal: (student.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (student.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }); setTimeout(() => window.print(), 500); };
  const prepareBulkTokens = () => { const valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no); if(valid.length === 0) return alert("No seats assigned"); setPrintBulkData(valid.sort((a,b)=>a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true})).map(student=>({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no||'-', room: student.room_no||'-', age: student.age, cat: getCategory(student.conf_no), sVal: (student.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (student.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }))); setTimeout(()=>window.print(), 500); };
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Courses Info", "Age", "Gender", "Room", "Dining Seat", "Pagoda", "Dhamma Seat", "Status", "Mobile Locker", "Valuables Locker", "Laundry Token", "Language"]; const rows = participants.map(p => [`"${p.full_name || ''}"`, p.conf_no || '', `"${p.courses_info || ''}"`, p.age || '', p.gender || '', p.room_no || '', p.dining_seat_no || '', p.pagoda_cell_no || '', p.dhamma_hall_seat_no || '', p.status || '', p.mobile_locker_no || '', p.valuables_locker_no || '', p.laundry_token_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `master_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `dining_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleSeatingExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Name", "Conf", "Gender", "Pagoda", "Room"]; const rows = arrived.map(p => [p.dhamma_hall_seat_no || '', `"${p.full_name || ''}"`, p.conf_no || '', p.gender || '', p.pagoda_cell_no || '', p.room_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `seating_${courseId}.csv`); document.body.appendChild(link); link.click(); };

  // --- COURSE SUMMARY REPORT COMPONENT ---
  if (showSummaryReport) {
      const arrived = participants.filter(p => p.status === 'Attending');
      const getCount = (gender, type) => arrived.filter(p => {
          const g = (p.gender || '').toLowerCase().startsWith(gender);
          const c = (p.conf_no || '').toUpperCase();
          if (type === 'OLD') return g && (c.startsWith('O') || c.startsWith('S'));
          if (type === 'NEW') return g && c.startsWith('N');
          return false;
      }).length;
      
      return (
          <div style={cardStyle}>
              <div className="no-print"><button onClick={() => setShowSummaryReport(false)} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...toolBtn('#007bff'), marginLeft:'10px'}}>Print PDF</button></div>
              <div className="print-area" id="print-summary" style={{padding:'20px'}}>
                  <h2 style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px'}}>COURSE SUMMARY REPORT</h2>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                      <div><strong>Centre Name:</strong> Dhamma Nagajjuna 2</div>
                      <div><strong>Course Date:</strong> {courses.find(c=>c.course_id==courseId)?.start_date}</div>
                  </div>
                  
                  <h3 style={{background:'#eee', padding:'5px'}}>COURSE DETAILS</h3>
                  <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'20px'}}>
                      <thead>
                          <tr style={{background:'#f0f0f0'}}>
                              <th rowSpan="2" style={thPrint}>Category</th>
                              <th colSpan="2" style={thPrint}>INDIAN</th>
                              <th colSpan="2" style={thPrint}>FOREIGNER</th>
                              <th rowSpan="2" style={thPrint}>TOTAL</th>
                          </tr>
                          <tr style={{background:'#f0f0f0'}}>
                              <th style={thPrint}>OLD</th><th style={thPrint}>NEW</th>
                              <th style={thPrint}>OLD</th><th style={thPrint}>NEW</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td style={tdPrint}>MALE</td>
                              <td style={tdPrint}>{getCount('m', 'OLD')}</td><td style={tdPrint}>{getCount('m', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}><strong>{getCount('m', 'OLD') + getCount('m', 'NEW')}</strong></td>
                          </tr>
                          <tr>
                              <td style={tdPrint}>FEMALE</td>
                              <td style={tdPrint}>{getCount('f', 'OLD')}</td><td style={tdPrint}>{getCount('f', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}><strong>{getCount('f', 'OLD') + getCount('f', 'NEW')}</strong></td>
                          </tr>
                          <tr style={{background:'#f0f0f0', fontWeight:'bold'}}>
                              <td style={tdPrint}>TOTAL</td>
                              <td style={tdPrint}>{getCount('m', 'OLD') + getCount('f', 'OLD')}</td>
                              <td style={tdPrint}>{getCount('m', 'NEW') + getCount('f', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}>{arrived.length}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  // --- STANDARD VIEWS ---
  if (viewAllMode) { return ( <div style={{background:'white', padding:'20px'}}> <div className="no-print" style={{marginBottom:'20px'}}><button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button><button onClick={handleExport} style={{...toolBtn('#17a2b8'), marginLeft:'10px'}}>Export CSV</button></div> <h2>Master List</h2> <div style={{overflowX:'auto'}}><table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Courses</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th><th style={thPrint}>Pagoda</th><th style={thPrint}>DH Seat</th><th style={thPrint}>Status</th><th style={thPrint}>Mobile</th><th style={thPrint}>Val</th><th style={thPrint}>Laundry</th><th style={thPrint}>Lang</th></tr></thead><tbody>{participants.map((p,i)=>(<tr key={p.participant_id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.courses_info}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.pagoda_cell_no}</td><td style={tdStyle}>{p.dhamma_hall_seat_no}</td><td style={tdStyle}>{p.status}</td><td style={tdStyle}>{p.mobile_locker_no}</td><td style={tdStyle}>{p.valuables_locker_no}</td><td style={tdStyle}>{p.laundry_token_no}</td><td style={tdStyle}>{p.discourse_language}</td></tr>))}</tbody></table></div> </div> ); }

  if (viewMode === 'dining') { const currentCourse = courses.find(c=>c.course_id == courseId); const arrived = participants.filter(p => p.status==='Attending'); const sorter = (a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return String(a.dining_seat_no || '0').localeCompare(String(b.dining_seat_no || '0'), undefined, { numeric: true }); }; const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={handleDiningExport} style={toolBtn('#17a2b8')}>CSV</button> <button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={{...toolBtn(color), marginLeft:'10px'}}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Dining Plan - {currentCourse?.course_name}</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint} onClick={()=>handleSort('dining_seat_no')}>Seat ↕</th><th style={thPrint}>Name</th><th style={thPrint}>Cat</th><th style={thPrint}>Room</th><th style={thPrint}>Pagoda</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={tdPrint}><strong>{p.dining_seat_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{getCategory(p.conf_no)}</td><td style={tdPrint}>{p.room_no}</td><td style={tdPrint}>{p.pagoda_cell_no||'-'}</td></tr>))}</tbody></table> </div> ); return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-m")} {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-f")} </div> ); }

  if (viewMode === 'pagoda') { const currentCourse = courses.find(c=>c.course_id == courseId); const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); const sorter = (a,b) => String(a.pagoda_cell_no || '0').localeCompare(String(b.pagoda_cell_no || '0'), undefined, { numeric: true }); const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={toolBtn(color)}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Pagoda Cells - {currentCourse?.course_name}</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint} onClick={()=>handleSort('pagoda_cell_no')}>Cell ↕</th><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={tdPrint}><strong>{p.pagoda_cell_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.conf_no}</td><td style={tdPrint}>{p.room_no}</td><td style={tdPrint}>{p.dining_seat_no||'-'}</td></tr>))}</tbody></table> </div> ); return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-pm")} {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-pf")} </div> ); }

  if (viewMode === 'seating') {
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled');
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled');
      const mM = {}, fM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); females.forEach(p=>fM[p.dhamma_hall_seat_no]=p);
      
      const handleSeatClick = async (seatLabel, student) => {
        if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; }
        const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null);
        if (source.label === target.label) return;
        if (!source.p) return; 
        if (target.p) { const isSourceMale = (source.p.gender || '').toLowerCase().startsWith('m'); const isTargetMale = (target.p.gender || '').toLowerCase().startsWith('m'); if (isSourceMale !== isTargetMale) return alert("⛔ Gender Mismatch!"); }

        if (window.confirm(`Confirm Move/Swap?\nFrom ${source.label} (${source.p.full_name})\nTo ${target.label} ${target.p ? '('+target.p.full_name+')' : '(Empty)'}`)) {
            if (!target.p) { 
                 await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
            } else { 
                 await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); 
                 await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); 
                 await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
            }
            loadStudents();
        }
      };

      const Box = ({p, l}) => {
          let sVal = '-', lVal = '-';
          if (p && p.courses_info) {
             const sMatch = p.courses_info.match(/S\s*[:=-]?\s*(\d+)/i);
             const lMatch = p.courses_info.match(/L\s*[:=-]?\s*(\d+)/i);
             if(sMatch) sVal = sMatch[1];
             if(lMatch) lVal = lMatch[1];
          }

          return (
              <div onClick={() => handleSeatClick(l, p)} style={{border: '2px solid black', background:'white', height:'100%', fontSize:'10px', display:'flex', flexDirection:'column', cursor:'pointer', position:'relative', minHeight:'90px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid black', padding:'2px 4px', fontWeight:'bold', fontSize:'13px', background:'#fff'}}>
                      <span>{l}</span>
                      <span>{p ? (p.room_no || '') : ''}</span>
                  </div>
                  <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2px', textAlign:'center', fontWeight:'bold', fontSize:'11px', lineHeight:'1.2'}}>
                      {p ? p.full_name : ''}
                  </div>
                  {p && (
                      <div style={{borderTop:'1px solid black', padding:'2px 4px', fontSize:'10px', display:'flex', justifyContent:'space-between', background:'#f9f9f9'}}>
                          <span>({getCategory(p.conf_no).charAt(0)})</span>
                          <span>s:{sVal} L:{lVal}</span>
                          <span>Age: ({p.age})</span>
                      </div>
                  )}
              </div>
          );
      };
      
      const renderGrid = (map, cols, rows) => {
          let g=[]; 
          // Reverse loop to ensure top rows (highest number) are printed first
          for(let r=rows; r>=1; r--) { 
              let cells=[]; 
              cols.forEach(c => cells.push(<Box key={c+r} l={c+r} p={map[c+r]} />)); 
              g.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${cols.length}, 130px)`, gridAutoRows:'95px', gap:'-1px'}}>{cells}</div>); 
          } 
          return g;
      };
      
      const printSection = (sectionId) => { const style = document.createElement('style'); style.innerHTML = `@media print { @page { size: A3 landscape; margin: 5mm; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flexDirection: column; alignItems: center; } .no-print { display: none !important; } .seat-grid { page-break-inside: avoid; border-top: 2px solid black; border-left: 2px solid black; } h1 { font-size: 24px !important; margin: 0 0 10px 0; } }`; document.head.appendChild(style); window.print(); document.head.removeChild(style); };
      const SeatingSheet = ({ id, title, map, cols, rows }) => (
        <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto'}}> 
            <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={()=>printSection(id)} style={{...quickBtnStyle(true), background:'#007bff', color:'white'}}>🖨️ Print {title} (A3)</button> </div> 
            
            <div style={{textAlign:'center', marginBottom:'20px'}}> <h1 style={{margin:0, fontSize:'24px', textTransform:'uppercase'}}>Seating Plan - {title}</h1> <h3 style={{margin:'5px 0', fontSize:'16px'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> </div>
            
            <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content'}}> {renderGrid(map, cols, rows)} </div> </div>
            
            <div style={{display:'flex', justifyContent:'center', marginTop:'40px'}}> 
                <div style={{textAlign:'center'}}> 
                    <div style={{border:'2px dashed black', width:'400px', padding:'15px', fontWeight:'900', fontSize:'28px', letterSpacing:'2px', textTransform:'uppercase'}}>TEACHER</div>
                </div> 
            </div>
        </div>
      );

      // Generate Dynamic Columns for Display
      const mCols = [...generateChowkyLabels(seatingConfig.mChowky), ...generateColLabels(seatingConfig.mCols)];
      const fCols = [...generateChowkyLabels(seatingConfig.fChowky), ...generateColLabels(seatingConfig.fCols)];

      return (
          <div style={cardStyle}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}> <button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> {assignProgress && <span style={{color:'green', fontWeight:'bold'}}>{assignProgress}</span>} <div style={{fontSize:'12px', background:'#fff3cd', padding:'5px 10px', borderRadius:'4px'}}>💡 Manual Move = Auto-Lock</div> <button onClick={handleSeatingExport} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>CSV</button> <button onClick={()=>setShowAutoAssignModal(true)} style={{...btnStyle(true), background:'#ff9800', color:'white'}}><Settings size={16}/> Auto-Assign</button> </div> </div>
              <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}>
                  <SeatingSheet id="print-male" title="MALE" map={mM} cols={mCols} rows={seatingConfig.mRows} />
                  <SeatingSheet id="print-female" title="FEMALE" map={fM} cols={fCols} rows={seatingConfig.fRows} />
              </div>

              {showAutoAssignModal && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
                      <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}>
                          <h3>🛠️ Auto-Assign Logic Configuration</h3>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                              <div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}>
                                  <h4 style={{marginTop:0, color:'#007bff'}}>Male Side (Right)</h4>
                                  <label style={labelStyle}>Standard Cols</label><input type="number" style={inputStyle} value={seatingConfig.mCols} onChange={e=>setSeatingConfig({...seatingConfig, mCols: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Chowky Cols</label><input type="number" style={inputStyle} value={seatingConfig.mChowky} onChange={e=>setSeatingConfig({...seatingConfig, mChowky: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Total Rows</label><input type="number" style={inputStyle} value={seatingConfig.mRows} onChange={e=>setSeatingConfig({...seatingConfig, mRows: parseInt(e.target.value)||0})} />
                              </div>
                              <div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}>
                                  <h4 style={{marginTop:0, color:'#e91e63'}}>Female Side (Left)</h4>
                                  <label style={labelStyle}>Standard Cols</label><input type="number" style={inputStyle} value={seatingConfig.fCols} onChange={e=>setSeatingConfig({...seatingConfig, fCols: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Chowky Cols</label><input type="number" style={inputStyle} value={seatingConfig.fChowky} onChange={e=>setSeatingConfig({...seatingConfig, fChowky: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Total Rows</label><input type="number" style={inputStyle} value={seatingConfig.fRows} onChange={e=>setSeatingConfig({...seatingConfig, fRows: parseInt(e.target.value)||0})} />
                              </div>
                          </div>
                          <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                               <button onClick={()=>setShowAutoAssignModal(false)} style={btnStyle(false)}>Cancel</button>
                               <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#28a745', color:'white'}}>RUN ASSIGNMENT</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- DEFAULT LIST VIEW ---
  const getStatusColor = (s) => {
    if (s === 'Attending') return '#28a745'; // Green
    if (s === 'Gate Check-In') return '#ffc107'; // Yellow/Orange
    if (s === 'Cancelled' || s === 'No-Show') return '#dc3545'; // Red
    return '#6c757d'; // Grey (Pending)
  };

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
         <div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e=>setSearch(e.target.value)} disabled={!courseId} /></div>
         <div style={{display:'flex', gap:'8px'}}>
             <button onClick={prepareBulkTokens} disabled={!courseId} style={toolBtn('#17a2b8')}>🎫 Bulk Tokens</button>
             <button onClick={() => setShowSummaryReport(true)} disabled={!courseId} style={toolBtn('#28a745')}>📈 Summary Report</button>
             <button onClick={handleAutoNoShow} disabled={!courseId} style={toolBtn('#d32f2f')}>🚫 No-Shows</button>
             <button onClick={handleSendReminders} disabled={!courseId} style={toolBtn('#ff9800')}>📢 Reminders</button>
             <button onClick={()=>setViewAllMode(true)} disabled={!courseId} style={toolBtn('#6c757d')}>👁️ View All</button>
             <button onClick={handleExport} disabled={!courseId} style={toolBtn('#17a2b8')}>📥 Export</button>
             <button onClick={()=>setViewMode('dining')} disabled={!courseId} style={toolBtn('#007bff')}>🍽️ Dining</button>
             <button onClick={()=>setViewMode('pagoda')} disabled={!courseId} style={toolBtn('#007bff')}>🛖 Pagoda</button>
             <button onClick={()=>setViewMode('seating')} disabled={!courseId} style={toolBtn('#28a745')}>🧘 Dhamma Hall</button>
         </div>
      </div>
      
      {courseId && <div style={{marginBottom:'15px', padding:'15px', background:'#fff0f0', border:'1px solid red', borderRadius:'5px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontWeight:'bold', color:'red', display:'flex', alignItems:'center', gap:'5px'}}><AlertTriangle size={18}/> Admin Zone:</span>
          <div>
              <button onClick={handleResetCourse} style={{padding:'8px 16px', background:'#dc3545', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', marginRight:'10px'}}>Reset Data</button>
              <button onClick={handleDeleteCourse} style={{padding:'8px 16px', background:'red', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Delete Course</button>
          </div>
      </div>}

      <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'8px'}}>
        <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f8f9fa', textAlign:'left'}}>
              {['S.N.', 'FULL_NAME','CONF_NO','COURSES_INFO','AGE','GENDER','ROOM_NO','DINING_SEAT_NO','PAGODA_CELL_NO','DHAMMA_HALL_SEAT_NO', 'LAUNDRY_TOKEN_NO', 'STATUS'].map(k=><th key={k} style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd', cursor:'pointer'}} onClick={()=>handleSort(k.toLowerCase())}>{k.replace(/_/g,' ')}</th>)}
              <th style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd'}}>PRINTS</th>
              <th style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd'}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((p, i) => (
              <tr key={p.participant_id} style={{borderBottom:'1px solid #eee', background: p.status === 'Attending' ? 'white' : '#fff5f5'}}>
                <td style={{...tdStyle, color:'#777'}}>{i+1}</td>
                <td style={{...tdStyle, fontWeight:'bold'}}>{p.full_name}</td>
                <td style={tdStyle}>{p.conf_no}</td>
                <td style={{...tdStyle, fontSize:'11px', color:'#666'}}>{p.courses_info}</td>
                <td style={tdStyle}>{p.age}</td>
                <td style={tdStyle}>{p.gender}</td>
                <td style={tdStyle}>{p.room_no}</td>
                <td style={tdStyle}>{p.dining_seat_no}</td>
                <td style={tdStyle}>{p.pagoda_cell_no}</td>
                <td style={{...tdStyle, fontWeight:'bold', color:'#007bff'}}>{p.dhamma_hall_seat_no}</td>
                <td style={tdStyle}>{p.laundry_token_no}</td>
                <td style={{...tdStyle, color: getStatusColor(p.status), fontWeight:'bold'}}>{p.status}</td>
                <td style={tdStyle}>
                   <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                      <button onClick={() => prepareReceipt(p)} style={{padding:'4px 8px', background:'#e3f2fd', border:'1px solid #90caf9', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:'#0d47a1', display:'flex', alignItems:'center', gap:'3px'}}><Printer size={12}/> Receipt</button>
                      <button onClick={() => prepareToken(p)} style={{padding:'4px 8px', background:'#fff3cd', border:'1px solid #ffeeba', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:'#856404', display:'flex', alignItems:'center', gap:'3px'}}><Printer size={12}/> Token</button>
                   </div>
                </td>
                <td style={tdStyle}>
                   <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={() => setEditingStudent(p)} style={{padding:'5px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', cursor:'pointer'}}><Edit size={16} color="#555"/></button>
                      <button onClick={() => handleDelete(p.participant_id)} style={{padding:'5px', background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:'4px', cursor:'pointer'}}><Trash2 size={16} color="#d32f2f"/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Modals Omitted for Brevity - they are included in state */}
      {printReceiptData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={()=>setPrintReceiptData(null)} style={{float:'right'}}>X</button><div id="receipt-print-area" style={{border:'1px dashed black', padding:'10px'}}><h3>{printReceiptData.courseName}</h3><p>{printReceiptData.studentName}</p></div><button onClick={()=>window.print()} style={{marginTop:'10px', width:'100%'}}>Print</button></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style></div>}
      {printTokenData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'300px'}}><button onClick={()=>setPrintTokenData(null)} style={{float:'right'}}>X</button><div id="token-print-area" style={{border:'2px solid black', padding:'20px', textAlign:'center'}}><h1>{printTokenData.seat}</h1><p>{printTokenData.name}</p></div><button onClick={()=>window.print()} style={{marginTop:'10px', width:'100%'}}>Print</button></div><style>{`@media print { body * { visibility: hidden; } #token-print-area, #token-print-area * { visibility: visible; } #token-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style></div>}
      {/* BULK TOKENS MODAL */}
      {printBulkData && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:'20px', borderRadius:'5px', width:'350px', maxHeight:'80vh', overflowY:'auto', position:'relative'}}>
                  <button onClick={() => setPrintBulkData(null)} style={{position:'absolute', right:'10px', top:'10px', background:'red', color:'white', border:'none', borderRadius:'50%', width:'25px', height:'25px', cursor:'pointer'}}>X</button>
                  <h3 style={{textAlign:'center', margin:'0 0 20px 0'}}>🖨️ Bulk Printing...</h3>
                  
                  <div id="bulk-token-print-area">
                      {printBulkData.map((t, i) => (
                          <div key={i} className="bulk-token-container" style={{fontFamily:'Helvetica, Arial, sans-serif', color:'black', padding:'20px', textAlign:'center', border:'2px solid black', marginBottom:'20px'}}>
                              <div style={{fontSize:'16px', fontWeight:'bold', marginBottom:'10px'}}>DHAMMA SEAT TOKEN</div>
                              <div style={{fontSize:'60px', fontWeight:'900', margin:'10px 0'}}>{t.seat}</div>
                              <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>{t.name}</div>
                              <div style={{fontSize:'12px', color:'#555', marginBottom:'10px'}}>{t.conf}</div>
                              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid black', paddingTop:'10px'}}>
                                  <div style={{textAlign:'left'}}><div style={{fontSize:'10px'}}>Cell</div><div style={{fontWeight:'bold', fontSize:'14px'}}>{t.cell}</div></div>
                                  <div style={{textAlign:'right'}}><div style={{fontSize:'10px'}}>Room</div><div style={{fontWeight:'bold', fontSize:'14px'}}>{t.room}</div></div>
                              </div>
                              <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px dashed #ccc', fontSize:'11px', display:'flex', justifyContent:'space-between'}}>
                                  <span>{t.cat}</span>
                                  <span>S:{t.sVal} L:{t.lVal}</span>
                                  <span>Age: {t.age}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              <style>{`
                  @media print {
                      @page { size: auto; margin: 0; }
                      body * { visibility: hidden; }
                      #bulk-token-print-area, #bulk-token-print-area * { visibility: visible; }
                      #bulk-token-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                      .bulk-token-container { page-break-after: always; display: block; height: auto; border-bottom: 2px dashed black !important; margin-bottom: 5px; padding-bottom: 20px; }
                      .bulk-token-container:last-child { page-break-after: auto; }
                  }
              `}</style>
          </div>
      )}

      {/* Edit Modal with Lockers */}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', width:'600px', borderRadius:'10px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Full Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})} /></div><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e=>setEditingStudent({...editingStudent, conf_no:e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Room No</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} /></div><div><label>Dining Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} /></div><div><label>Pagoda Cell</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} /></div></div>
      <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}><h4 style={{marginTop:0}}>Manual Locker Override</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Mobile</label><input style={inputStyle} value={editingStudent.mobile_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, mobile_locker_no:e.target.value})} /></div><div><label>Valuables</label><input style={inputStyle} value={editingStudent.valuables_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, valuables_locker_no:e.target.value})} /></div><div><label>Laundry</label><input style={inputStyle} value={editingStudent.laundry_token_no||''} onChange={e=>setEditingStudent({...editingStudent, laundry_token_no:e.target.value})} /></div><div><label>Dhamma Hall Seat</label><input style={inputStyle} value={editingStudent.dhamma_hall_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dhamma_hall_seat_no:e.target.value})} /></div></div></div>
      <div style={{textAlign:'right'}}><button onClick={()=>setEditingStudent(null)} style={{marginRight:'10px', padding:'8px 16px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>Cancel</button><button type="submit" style={{padding:'8px 16px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Save Changes</button></div></form></div></div>)}
    </div>
  );
}
