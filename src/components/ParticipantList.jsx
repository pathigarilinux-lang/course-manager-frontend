import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle, Filter, Save, Plus, Minus, User, RefreshCw } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function ParticipantList({ courses, refreshCourses }) {
  // --- STATE ---
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [filterType, setFilterType] = useState('ALL'); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const [diningSort, setDiningSort] = useState({ key: 'dining_seat_no', direction: 'asc' });
  const [pagodaSort, setPagodaSort] = useState({ key: 'pagoda_cell_no', direction: 'asc' });
  
  // Logic State
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Print & Config State
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false); 
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  
  // Advanced Settings
  const [seatingConfig, setSeatingConfig] = useState({ mCols: 10, mRows: 10, mChowky: 2, fCols: 8, fRows: 10, fChowky: 2 });
  const [printConfig, setPrintConfig] = useState({ scale: 0.9, orientation: 'landscape', paper: 'A3' });

  // --- LOADING ---
  useEffect(() => { 
      if (courseId) {
          fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : []));
          const savedLayout = localStorage.getItem(`layout_${courseId}`);
          if(savedLayout) setSeatingConfig(JSON.parse(savedLayout));
      } 
  }, [courseId]);

  // --- HELPERS ---
  const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
  const getCategoryRank = (conf) => { const cat = getCategory(conf); return cat === 'OLD' ? 1 : 2; }; // 1=High Priority (Front)

  const getStudentStats = (p) => {
      if (!p) return { cat: '', s: 0, l: 0, age: '' };
      const conf = (p.conf_no || '').toUpperCase();
      const isOld = conf.startsWith('O') || conf.startsWith('S');
      const cat = isOld ? '(O)' : '(N)';
      const sMatch = (p.courses_info || '').match(/S\s*[:=-]?\s*(\d+)/i);
      const lMatch = (p.courses_info || '').match(/L\s*[:=-]?\s*(\d+)/i);
      const s = sMatch ? sMatch[1] : '0';
      const l = lMatch ? lMatch[1] : '0';
      return { cat, s, l, age: p.age || '?' };
  };

  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  
  const processedList = useMemo(() => { 
      let items = [...participants]; 
      if (filterType !== 'ALL') {
          items = items.filter(p => {
              const cat = getCategory(p.conf_no);
              if (filterType === 'OLD') return cat === 'OLD';
              if (filterType === 'NEW') return cat === 'NEW';
              if (filterType === 'MED') return (p.medical_info && p.medical_info.trim() !== '');
              if (filterType === 'MALE') return (p.gender||'').toLowerCase().startsWith('m');
              if (filterType === 'FEMALE') return (p.gender||'').toLowerCase().startsWith('f');
              return true;
          });
      }
      if (search) items = items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase()) || (p.conf_no || '').toLowerCase().includes(search.toLowerCase()));
      if (sortConfig.key) { 
          items.sort((a, b) => { 
              let valA = a[sortConfig.key] || '', valB = b[sortConfig.key] || '';
              if (['age', 'dining_seat_no', 'pagoda_cell_no', 'laundry_token_no'].includes(sortConfig.key)) { valA = parseInt(valA) || 0; valB = parseInt(valB) || 0; } 
              else { valA = valA.toString().toLowerCase(); valB = valB.toString().toLowerCase(); }
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0;
          }); 
      } 
      return items;
  }, [participants, sortConfig, search, filterType]);

  const generateColLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse(); };
  const generateChowkyLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse().map(l => `CW-${l}`); };

  // --- 🛠️ FIXED AUTO-ASSIGN LOGIC ---
  const handleAutoAssign = async () => {
      if (!window.confirm("⚠️ This will overwrite unlocked seats. Continue?")) return;
      setIsAssigning(true);
      setShowAutoAssignModal(false);

      try {
          // 1. Get Fresh Data
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const allP = await res.json();
          
          // 2. Filter Active Students (Exclude Servers SM/SF)
          const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre)));
          const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
          const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f'));

          // 3. Generate Seat Maps (e.g., A1, A2... or CW-A1...)
          const genSeats = (cols, rows) => {
              let s = [];
              for(let r=1; r<=rows; r++) {
                  // Standard seats: A1, B1...
                  cols.forEach(c => s.push(c + r));
              }
              return s;
          };

          const mRegSeats = genSeats(generateColLabels(seatingConfig.mCols), seatingConfig.mRows);
          const mSpecSeats = genSeats(generateChowkyLabels(seatingConfig.mChowky), seatingConfig.mRows); // Chowky seats

          const fRegSeats = genSeats(generateColLabels(seatingConfig.fCols), seatingConfig.fRows);
          const fSpecSeats = genSeats(generateChowkyLabels(seatingConfig.fChowky), seatingConfig.fRows);

          // 4. Assignment Function
          const assignGroup = (students, regSeats, specSeats) => {
              const updates = [];
              const lockedSeats = new Set();
              
              // Identify Locked Seats
              students.forEach(p => {
                  if (p.is_seat_locked && p.dhamma_hall_seat_no) lockedSeats.add(p.dhamma_hall_seat_no);
              });

              // Filter Available Seats
              const availReg = regSeats.filter(s => !lockedSeats.has(s));
              const availSpec = specSeats.filter(s => !lockedSeats.has(s));

              // Sort Students: Old Students (Rank 1) first, then by Age descending
              const toAssign = students.filter(p => !p.is_seat_locked).sort((a,b) => {
                  const rA = getCategoryRank(a.conf_no);
                  const rB = getCategoryRank(b.conf_no);
                  if (rA !== rB) return rA - rB; // Lower rank = Old Student = Priority
                  return (parseInt(b.age)||0) - (parseInt(a.age)||0); // Elder first
              });

              // Separate Special Needs
              const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating));
              const normalGroup = toAssign.filter(p => !specGroup.includes(p));

              // Assign Special Seats First
              specGroup.forEach(p => {
                  if (availSpec.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availSpec.shift() });
                  else if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); // Fallback
              });

              // Assign Normal Seats
              normalGroup.forEach(p => {
                  if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() });
              });

              return updates;
          };

          // 5. Calculate Updates
          const mUpdates = assignGroup(males, mRegSeats, mSpecSeats);
          const fUpdates = assignGroup(females, fRegSeats, fSpecSeats);
          const allUpdates = [...mUpdates, ...fUpdates];

          if (allUpdates.length === 0) {
              alert("✅ No new assignments needed (all locked or no students).");
              setIsAssigning(false);
              return;
          }

          // 6. Push to Server (Batching to prevent timeouts)
          const BATCH_SIZE = 5;
          for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) {
              await Promise.all(allUpdates.slice(i, i + BATCH_SIZE).map(p => 
                  fetch(`${API_URL}/participants/${p.participant_id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(p)
                  })
              ));
          }

          // 7. Refresh
          alert(`✅ Successfully assigned seats to ${allUpdates.length} students!`);
          const finalRes = await fetch(`${API_URL}/courses/${courseId}/participants`);
          setParticipants(await finalRes.json());

      } catch (err) {
          console.error(err);
          alert("❌ Error during auto-assign.");
      }
      setIsAssigning(false);
  };

  // --- ACTIONS ---
  const saveLayoutConfig = () => { localStorage.setItem(`layout_${courseId}`, JSON.stringify(seatingConfig)); alert("✅ Layout Configuration Saved!"); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };

  // --- PRINT ENGINE (Token Slips) ---
  const printDirectly = (tokens) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      let htmlContent = `<html><head><title>Tokens</title><style>@page { size: 72mm auto; margin: 0; } body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; } .ticket-container { width: 70mm; margin: 0 auto; padding-top: 5mm; padding-bottom: 5mm; page-break-after: always; } .ticket-container:last-child { page-break-after: auto; } .ticket-box { border: 3px solid #000; border-radius: 8px; padding: 10px; width: 64mm; margin: 0 auto; text-align: center; box-sizing: border-box; } .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; } .seat { font-size: 55px; font-weight: 900; line-height: 1; margin: 5px 0; } .name { font-size: 15px; font-weight: bold; margin: 5px 0; word-wrap: break-word; line-height: 1.2; } .conf { font-size: 12px; color: #333; margin-bottom: 10px; } .footer { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; } .stats { font-size: 10px; margin-top: 5px; border-top: 1px dashed #ccc; padding-top: 5px; display: flex; justify-content: space-between; } </style></head><body>`;
      tokens.forEach(t => { htmlContent += `<div class="ticket-container"><div class="ticket-box"><div class="header">DHAMMA SEAT</div><div class="seat">${t.seat}</div><div class="name">${t.name}</div><div class="conf">${t.conf}</div><div class="footer"><span>Cell: ${t.cell}</span><span>Room: ${t.room}</span></div><div class="stats"><span>${t.cat}</span><span>S:${t.sVal} L:${t.lVal}</span><span>Age: ${t.age}</span></div></div></div>`; });
      htmlContent += `</body></html>`;

      const doc = iframe.contentWindow.document;
      doc.open(); doc.write(htmlContent); doc.close();
      iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); };
  };

  const handleBulkPrint = (filter) => {
      let valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no);
      if (filter === 'Male') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
      if (filter === 'Female') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('f'));
      if (valid.length === 0) return alert("No students found.");
      const tokens = valid.sort((a,b) => a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true})).map(s => ({ seat: s.dhamma_hall_seat_no, name: s.full_name, conf: s.conf_no, cell: s.pagoda_cell_no || '-', room: s.room_no || '-', age: s.age, cat: getCategory(s.conf_no), sVal: (s.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (s.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }));
      printDirectly(tokens);
  };

  const handleSingleToken = (student) => {
      if (!student.dhamma_hall_seat_no) return alert("No seat assigned.");
      printDirectly([{ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no || '-', room: student.room_no || '-', age: student.age, cat: getCategory(student.conf_no), sVal: (student.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (student.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }]);
  };

  const prepareReceipt = (student) => { 
      const courseObj = courses.find(c => c.course_id == student.course_id) || courses.find(c => c.course_id == courseId); 
      setPrintReceiptData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Teacher', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, seatNo: student.dining_seat_no, lockers: student.mobile_locker_no || student.dining_seat_no, language: student.discourse_language, pagoda: student.pagoda_cell_no && student.pagoda_cell_no !== 'None' ? student.pagoda_cell_no : null, special: student.special_seating && student.special_seating !== 'None' ? student.special_seating : null }); 
      setTimeout(() => window.print(), 500); 
  };

  // --- EXPORTS ---
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Courses Info", "Age", "Gender", "Room", "Dining Seat", "Pagoda", "Dhamma Seat", "Status", "Mobile Locker", "Valuables Locker", "Laundry Token", "Language"]; const rows = participants.map(p => [`"${p.full_name || ''}"`, p.conf_no || '', `"${p.courses_info || ''}"`, p.age || '', p.gender || '', p.room_no || '', p.dining_seat_no || '', p.pagoda_cell_no || '', p.dhamma_hall_seat_no || '', p.status || '', p.mobile_locker_no || '', p.valuables_locker_no || '', p.laundry_token_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `master_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Pagoda Cell", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.pagoda_cell_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `dining_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  
  const handlePagodaExport = () => {
      const assigned = participants.filter(p => p.status === 'Attending' && p.pagoda_cell_no);
      if (assigned.length === 0) return alert("No pagoda assignments found.");
      const headers = ["Cell", "Name", "Conf", "Gender", "Room", "Dining Seat"];
      const rows = assigned.sort((a,b) => String(a.pagoda_cell_no).localeCompare(String(b.pagoda_cell_no), undefined, {numeric:true}))
          .map(p => [p.pagoda_cell_no, `"${p.full_name || ''}"`, p.conf_no, p.gender, p.room_no, p.dining_seat_no || '']);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pagoda_${courseId}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const handleSeatingExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Name", "Conf", "Gender", "Pagoda", "Room"]; const rows = arrived.map(p => [p.dhamma_hall_seat_no || '', `"${p.full_name || ''}"`, p.conf_no || '', p.gender || '', p.pagoda_cell_no || '', p.room_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `seating_${courseId}.csv`); document.body.appendChild(link); link.click(); };

  const handleSeatClick = async (seatLabel, student) => { if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; } const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null); if (source.label === target.label) return; if (window.confirm(`Swap/Move?`)) { if (!target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } else { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  
  const renderGrid = (map, cols, rows) => { 
      let g=[]; for(let r=rows; r>=1; r--) { let cells=[]; cols.forEach(c => { const p = map[c+r]; const stats = getStudentStats(p); cells.push(<div key={c+r} onClick={()=>handleSeatClick(c+r, p)} style={{ border: '2px solid black', background: p ? (selectedSeat?.label === c+r ? '#ffeb3b' : 'white') : 'white', width: '130px', height: '95px', fontSize: '10px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: '1px', position: 'relative', boxSizing: 'border-box' }}><div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'14px', padding:'2px 5px'}}><span>{c+r}</span><span style={{fontSize:'12px'}}>{p?.room_no || ''}</span></div><div style={{textAlign:'center', fontWeight:'bold', fontSize:'13px', lineHeight:'1.2', flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px'}}>{p ? p.full_name : ''}</div>{p && (<div style={{fontSize:'11px', padding:'3px 5px', fontWeight:'bold', whiteSpace:'nowrap', display:'flex', justifyContent:'space-between'}}><span>{stats.cat}</span><span>s:{stats.s} L:{stats.l}</span><span>Age:({stats.age})</span></div>)}{p && p.pagoda_cell_no && <div style={{position:'absolute', top:'25px', right:'2px', fontSize:'9px', background:'#e3f2fd', border:'1px solid blue', borderRadius:'3px', padding:'0 2px'}}>P:{p.pagoda_cell_no}</div>}{p && p.is_seat_locked && <div style={{position:'absolute', bottom:'20px', left:'2px', fontSize:'8px'}}>🔒</div>}</div>); }); g.push(<div key={r} style={{display:'flex'}}>{cells}</div>); } return g; 
  };

  const printChart = (sectionId) => {
      const style = document.createElement('style'); 
      style.innerHTML = `@media print { @page { size: ${printConfig.paper} ${printConfig.orientation}; margin: 5mm; } html, body { height: 100%; margin: 0; padding: 0; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: fixed; left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: scale(${printConfig.scale}); transform-origin: center top; } .no-print { display: none !important; } .seat-grid { border-top: 2px solid black; border-left: 2px solid black; } h1 { font-size: 24px !important; margin: 0 0 10px 0; } }`; 
      document.head.appendChild(style); window.print(); document.head.removeChild(style); 
  };

  // ✅ FIXED: A4 LIST PRINT STYLING
  const printA4List = (sectionId) => {
      const style = document.createElement('style');
      style.innerHTML = `
          @media print {
              @page { size: A4 portrait; margin: 10mm; }
              html, body { margin: 0; padding: 0; background: white; }
              body * { visibility: hidden; }
              #${sectionId}, #${sectionId} * { visibility: visible; }
              #${sectionId} { position: absolute; left: 0; top: 0; width: 99%; }
              .no-print { display: none !important; }
              table { width: 100%; border-collapse: collapse; font-family: 'Helvetica', sans-serif; font-size: 10pt; }
              th, td { border: 1px solid black !important; padding: 6px; }
              th { background-color: #f2f2f2 !important; font-weight: bold; text-transform: uppercase; }
              h2, h3 { text-align: center; color: black !important; margin: 5px 0; }
          }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
  };

  // ✅ SORTING HELPER
  const sortParticipants = (list, key, dir) => {
      return [...list].sort((a, b) => {
          let valA = a[key] || '';
          let valB = b[key] || '';
          
          if (key === 'category') {
              valA = getCategory(a.conf_no);
              valB = getCategory(b.conf_no);
          }

          if (key === 'dining_seat_no' || key === 'pagoda_cell_no') {
              return dir === 'asc' 
                  ? String(valA).localeCompare(String(valB), undefined, { numeric: true })
                  : String(valB).localeCompare(String(valA), undefined, { numeric: true });
          }
          
          if (valA < valB) return dir === 'asc' ? -1 : 1;
          if (valA > valB) return dir === 'asc' ? 1 : -1;
          return 0;
      });
  };

  const getStatusColor = (s) => { if (s === 'Attending') return '#28a745'; if (s === 'Gate Check-In') return '#ffc107'; if (s === 'Cancelled' || s === 'No-Show') return '#dc3545'; return '#6c757d'; };

  // --- VIEW MODES ---
  if (showSummaryReport) {
      const arrived = participants.filter(p => p.status === 'Attending');
      const getCount = (gender, type) => arrived.filter(p => { const g = (p.gender || '').toLowerCase().startsWith(gender); const c = (p.conf_no || '').toUpperCase(); if (type === 'OLD') return g && (c.startsWith('O') || c.startsWith('S')); if (type === 'NEW') return g && c.startsWith('N'); return false; }).length;
      return ( <div style={styles.card}> <div className="no-print"><button onClick={() => setShowSummaryReport(false)} style={styles.btn(false)}>← Back</button><button onClick={() => window.print()} style={{...styles.toolBtn('#007bff'), marginLeft:'10px'}}>Print PDF</button></div> <div className="print-area" id="print-summary" style={{padding:'20px'}}> <h2 style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px'}}>COURSE SUMMARY REPORT</h2> <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><div><strong>Centre Name:</strong> Dhamma Nagajjuna 2</div><div><strong>Course Date:</strong> {courses.find(c=>c.course_id==courseId)?.start_date}</div></div> <h3 style={{background:'#eee', padding:'5px'}}>COURSE DETAILS</h3> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'20px'}}><thead><tr style={{background:'#f0f0f0'}}><th rowSpan="2" style={styles.th}>Category</th><th colSpan="2" style={styles.th}>INDIAN</th><th colSpan="2" style={styles.th}>FOREIGNER</th><th rowSpan="2" style={styles.th}>TOTAL</th></tr><tr style={{background:'#f0f0f0'}}><th style={styles.th}>OLD</th><th style={styles.th}>NEW</th><th style={styles.th}>OLD</th><th style={styles.th}>NEW</th></tr></thead><tbody><tr><td style={styles.td}>MALE</td><td style={styles.td}>{getCount('m', 'OLD')}</td><td style={styles.td}>{getCount('m', 'NEW')}</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}><strong>{getCount('m', 'OLD') + getCount('m', 'NEW')}</strong></td></tr><tr><td style={styles.td}>FEMALE</td><td style={styles.td}>{getCount('f', 'OLD')}</td><td style={styles.td}>{getCount('f', 'NEW')}</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}><strong>{getCount('f', 'OLD') + getCount('f', 'NEW')}</strong></td></tr><tr style={{background:'#f0f0f0', fontWeight:'bold'}}><td style={styles.td}>TOTAL</td><td style={styles.td}>{getCount('m', 'OLD') + getCount('f', 'OLD')}</td><td style={styles.td}>{getCount('m', 'NEW') + getCount('f', 'NEW')}</td><td style={styles.td}>0</td><td style={styles.td}>0</td><td style={styles.td}>{arrived.length}</td></tr></tbody></table> </div> </div> );
  }

  // ✅ VIEW: DINING
  if (viewMode === 'dining') { 
      const arrived = participants.filter(p => p.status==='Attending'); 
      const renderDiningTable = (list, title, color, sectionId) => {
        const sortedList = sortParticipants(list, diningSort.key, diningSort.direction);
        const handleSortClick = (key) => { const dir = (diningSort.key === key && diningSort.direction === 'asc') ? 'desc' : 'asc'; setDiningSort({ key, direction: dir }); };

        return (
            <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}>
                <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}>
                    <button onClick={() => printA4List(sectionId)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>Print {title} (A4)</button>
                </div>
                <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Dining List</h2>
                <h3 style={{textAlign:'center', marginTop:0, marginBottom:'20px', color:'#555'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3>
                
                <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}>
                    <thead>
                        <tr style={{background:'#f0f0f0'}}>
                            <th style={styles.th}>S.N.</th>
                            <th style={{...styles.th, cursor:'pointer'}} onClick={()=>handleSortClick('dining_seat_no')}>SEAT {diningSort.key==='dining_seat_no' && (diningSort.direction==='asc' ? '▲' : '▼')}</th>
                            <th style={styles.th}>Name</th>
                            <th style={{...styles.th, cursor:'pointer'}} onClick={()=>handleSortClick('category')}>CAT {diningSort.key==='category' && (diningSort.direction==='asc' ? '▲' : '▼')}</th>
                            <th style={styles.th}>Room</th>
                            <th style={styles.th}>Pagoda</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedList.map((p,i)=>(
                            <tr key={p.participant_id}>
                                <td style={styles.td}>{i+1}</td>
                                <td style={{...styles.td, fontWeight:'bold'}}>{p.dining_seat_no}</td>
                                <td style={styles.td}>{p.full_name}</td>
                                <td style={styles.td}>{getCategory(p.conf_no)}</td>
                                <td style={styles.td}>{p.room_no}</td>
                                <td style={styles.td}>{p.pagoda_cell_no}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
      };

      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                  <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button>
                  <button onClick={handleDiningExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Dining CSV</button>
              </div>
              {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff", "pd-m")}
              {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63", "pd-f")}
          </div>
      ); 
  }
  
  // ✅ VIEW: PAGODA
  if (viewMode === 'pagoda') { 
      const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); 
      const renderPagodaTable = (list, title, color, sectionId) => {
        const sortedList = sortParticipants(list, pagodaSort.key, pagodaSort.direction);
        const handleSortClick = (key) => { const dir = (pagodaSort.key === key && pagodaSort.direction === 'asc') ? 'desc' : 'asc'; setPagodaSort({ key, direction: dir }); };

        return (
            <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}>
                <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}>
                    <button onClick={() => printA4List(sectionId)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>Print {title} (A4)</button>
                </div>
                <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Pagoda Cell List</h2>
                <h3 style={{textAlign:'center', marginTop:0, marginBottom:'20px', color:'#555'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3>
                
                <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}>
                    <thead>
                        <tr style={{background:'#f0f0f0'}}>
                            <th style={styles.th}>S.N.</th>
                            <th style={{...styles.th, cursor:'pointer'}} onClick={()=>handleSortClick('pagoda_cell_no')}>CELL {pagodaSort.key==='pagoda_cell_no' && (pagodaSort.direction==='asc' ? '▲' : '▼')}</th>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Cat</th>
                            <th style={styles.th}>Room</th>
                            <th style={styles.th}>Dining</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedList.map((p,i)=>(
                            <tr key={p.participant_id}>
                                <td style={styles.td}>{i+1}</td>
                                <td style={{...styles.td, fontWeight:'bold'}}>{p.pagoda_cell_no}</td>
                                <td style={styles.td}>{p.full_name}</td>
                                <td style={styles.td}>{getCategory(p.conf_no)}</td>
                                <td style={styles.td}>{p.room_no}</td>
                                <td style={styles.td}>{p.dining_seat_no}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
      };

      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                  <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button>
                  <button onClick={handlePagodaExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Pagoda CSV</button>
              </div>
              {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff", "pd-pm")}
              {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63", "pd-pf")}
          </div>
      ); 
  }
  
  if (viewMode === 'seating') { 
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled'); 
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled'); 
      const mM = {}, fM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); females.forEach(p=>fM[p.dhamma_hall_seat_no]=p); 
      const mCols = [...generateChowkyLabels(seatingConfig.mChowky), ...generateColLabels(seatingConfig.mCols)]; 
      const fCols = [...generateChowkyLabels(seatingConfig.fChowky), ...generateColLabels(seatingConfig.fCols)]; 
      
      const SeatingSheet = ({ id, title, map, cols, rows, setRows, setCols }) => ( 
          <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto'}}> 
              <div className="no-print" style={{textAlign:'right', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fa', padding:'10px', borderRadius:'8px'}}> 
                  <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={()=>setRows(rows+1)} style={styles.quickBtn(false)} title="Add Row"><Plus size={12}/> Row</button>
                      <button onClick={()=>setRows(Math.max(1, rows-1))} style={styles.quickBtn(false)} title="Remove Row"><Minus size={12}/> Row</button>
                      <div style={{width:'1px', background:'#ccc', margin:'0 5px'}}></div>
                      <button onClick={()=>setCols(cols+1)} style={styles.quickBtn(false)} title="Add Col"><Plus size={12}/> Col</button>
                      <button onClick={()=>setCols(Math.max(1, cols-1))} style={styles.quickBtn(false)} title="Remove Col"><Minus size={12}/> Col</button>
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={()=>setShowPrintSettings(true)} style={styles.toolBtn('#6c757d')}><Settings size={14}/> Print Settings</button>
                      <button onClick={()=>printChart(id)} style={styles.quickBtn(true)}>🖨️ Print</button> 
                  </div>
              </div> 
              <div style={{textAlign:'center', marginBottom:'20px'}}> <h1 style={{margin:0, fontSize:'24px', textTransform:'uppercase'}}>Seating Plan - {title}</h1> <h3 style={{margin:'5px 0', fontSize:'16px'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> </div> 
              <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content'}}> {renderGrid(map, cols, rows)} </div> </div> 
              <div style={{display:'flex', justifyContent:'center', marginTop:'40px'}}> <div style={{textAlign:'center', width:'100%'}}> <div style={{border:'2px dashed black', padding:'15px', fontWeight:'900', fontSize:'28px', letterSpacing:'2px', textTransform:'uppercase', margin:'0 auto', maxWidth:'600px'}}>TEACHER</div></div> </div> 
          </div> 
      );

      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', alignItems:'center'}}> 
                  <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> 
                  <div style={{display:'flex', gap:'10px', alignItems:'center'}}> 
                      <button onClick={saveLayoutConfig} style={styles.toolBtn('#17a2b8')}><Save size={16}/> Store Seat Changes</button>
                      <button onClick={handleSeatingExport} style={{...styles.quickBtn(true), background:'#6c757d', color:'white'}}>CSV</button> 
                      <button onClick={()=>setShowAutoAssignModal(true)} style={{...styles.btn(true), background:'#ff9800', color:'white'}}><Settings size={16}/> Auto-Assign</button> 
                  </div> 
              </div> 
              <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}> 
                  <SeatingSheet id="print-male" title="MALE" map={mM} cols={mCols} rows={seatingConfig.mRows} setRows={(v)=>setSeatingConfig({...seatingConfig, mRows:v})} setCols={(v)=>setSeatingConfig({...seatingConfig, mCols:v})} /> 
                  <SeatingSheet id="print-female" title="FEMALE" map={fM} cols={fCols} rows={seatingConfig.fRows} setRows={(v)=>setSeatingConfig({...seatingConfig, fRows:v})} setCols={(v)=>setSeatingConfig({...seatingConfig, fCols:v})} /> 
              </div> 
              
              {showPrintSettings && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px'}}><h3>🖨️ Print Settings</h3><div style={{marginBottom:'15px'}}><label style={styles.label}>Paper Size</label><select style={styles.input} value={printConfig.paper} onChange={e=>setPrintConfig({...printConfig, paper:e.target.value})}><option>A4</option><option>A3</option><option>Letter</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Orientation</label><select style={styles.input} value={printConfig.orientation} onChange={e=>setPrintConfig({...printConfig, orientation:e.target.value})}><option>landscape</option><option>portrait</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Scale (Zoom)</label><input type="range" min="0.5" max="1.5" step="0.1" value={printConfig.scale} onChange={e=>setPrintConfig({...printConfig, scale:e.target.value})} style={{width:'100%'}}/><div style={{textAlign:'center', fontSize:'12px'}}>{Math.round(printConfig.scale*100)}%</div></div><div style={{textAlign:'right'}}><button onClick={()=>setShowPrintSettings(false)} style={styles.btn(true)}>Done</button></div></div></div>)}
              {showAutoAssignModal && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'600px', maxHeight:'90vh', overflowY:'auto'}}><h3>🛠️ Auto-Assign Configuration</h3><div style={{background:'#f0f8ff', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #cce5ff'}}><h4 style={{margin:'0 0 10px 0', fontSize:'14px', color:'#0056b3'}}>Student Breakdown (Arrived)</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}><div><div style={{fontWeight:'bold', color:'#007bff'}}>MALE: {males.length}</div></div><div><div style={{fontWeight:'bold', color:'#e91e63'}}>FEMALE: {females.length}</div></div></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}><div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}><h4 style={{marginTop:0, color:'#007bff'}}>Male Side</h4><label style={styles.label}>Standard Cols</label><input type="number" style={styles.input} value={seatingConfig.mCols} onChange={e=>setSeatingConfig({...seatingConfig, mCols: parseInt(e.target.value)||0})} /><label style={styles.label}>Chowky Cols</label><input type="number" style={styles.input} value={seatingConfig.mChowky} onChange={e=>setSeatingConfig({...seatingConfig, mChowky: parseInt(e.target.value)||0})} /><label style={styles.label}>Total Rows</label><input type="number" style={styles.input} value={seatingConfig.mRows} onChange={e=>setSeatingConfig({...seatingConfig, mRows: parseInt(e.target.value)||0})} /></div><div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}><h4 style={{marginTop:0, color:'#e91e63'}}>Female Side</h4><label style={styles.label}>Standard Cols</label><input type="number" style={styles.input} value={seatingConfig.fCols} onChange={e=>setSeatingConfig({...seatingConfig, fCols: parseInt(e.target.value)||0})} /><label style={styles.label}>Chowky Cols</label><input type="number" style={styles.input} value={seatingConfig.fChowky} onChange={e=>setSeatingConfig({...seatingConfig, fChowky: parseInt(e.target.value)||0})} /><label style={styles.label}>Total Rows</label><input type="number" style={styles.input} value={seatingConfig.fRows} onChange={e=>setSeatingConfig({...seatingConfig, fRows: parseInt(e.target.value)||0})} /></div></div><div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}><button onClick={()=>setShowAutoAssignModal(false)} style={styles.btn(false)}>Cancel</button><button onClick={handleAutoAssign} style={isAssigning ? styles.btn(false) : {...styles.btn(true), background:'#28a745', color:'white'}} disabled={isAssigning}>{isAssigning ? 'Processing...' : 'RUN ASSIGNMENT'}</button></div></div></div>)}
          </div>
      ); 
  }

  // --- DEFAULT LIST VIEW ---
  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
         <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
             <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><User size={24}/> Students</h2>
             <select style={styles.input} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         </div>
         <div style={{display:'flex', gap:'8px'}}>
             <button onClick={()=>setViewMode('dining')} disabled={!courseId} style={styles.toolBtn('#007bff')}>🍽️ Dining</button>
             <button onClick={()=>setViewMode('seating')} disabled={!courseId} style={styles.toolBtn('#6610f2')}>🧘 DH</button>
             <button onClick={()=>setViewMode('pagoda')} disabled={!courseId} style={styles.toolBtn('#e91e63')}>🛖 Pagoda</button>
             <button onClick={()=>setShowBulkModal(true)} disabled={!courseId} style={styles.toolBtn('#17a2b8')}>🎫 Bulk Tokens</button>
             <button onClick={() => setShowSummaryReport(true)} disabled={!courseId} style={styles.toolBtn('#28a745')}>📈 Summary</button>
         </div>
      </div>
      
      {/* ADMIN ACTIONS */}
      {courseId && (
          <div style={{marginBottom:'15px', display:'flex', gap:'10px', justifyContent:'flex-end'}}>
             <button onClick={handleAutoNoShow} style={styles.quickBtn(false)}>🚫 Auto-Flag No-Shows</button>
             <button onClick={handleSendReminders} style={styles.quickBtn(false)}>📢 Send Reminders</button>
             <button onClick={handleExport} style={styles.quickBtn(false)}>📥 Export CSV</button>
             <button onClick={handleResetCourse} style={{...styles.quickBtn(false), color:'#d32f2f', border:'1px solid #d32f2f'}}>⚠️ Reset Course</button>
             <button onClick={handleDeleteCourse} style={{...styles.quickBtn(false), background:'#d32f2f', color:'white'}}>🗑️ Delete Course</button>
          </div>
      )}

      {/* FILTERS */}
      <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'20px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
              <Filter size={16} color="#666"/>
              {['ALL', 'OLD', 'NEW', 'MALE', 'FEMALE', 'MED'].map(type => (
                  <button key={type} onClick={()=>setFilterType(type)} style={{...styles.quickBtn(filterType===type), fontSize:'11px', padding:'5px 10px'}}>{type}</button>
              ))}
          </div>
          <div style={{position:'relative'}}>
              <input style={{...styles.input, width:'250px', paddingLeft:'10px', height:'35px'}} placeholder="🔍 Search student..." onChange={e=>setSearch(e.target.value)} disabled={!courseId} />
          </div>
      </div>

      <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'8px', maxHeight:'600px', overflowY:'auto'}}>
        <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
          <thead style={{position:'sticky', top:0, zIndex:10}}>
            <tr style={{background:'#e9ecef', textAlign:'left', borderBottom:'2px solid #ccc'}}>
              {['S.N.', 'FULL_NAME','CONF_NO','AGE','GENDER','ROOM','DINING','PAGODA','DH_SEAT', 'LAUNDRY', 'STATUS'].map(k=><th key={k} style={{padding:'12px', fontWeight:'bold', cursor:'pointer', whiteSpace:'nowrap'}} onClick={()=>handleSort(k.toLowerCase())}>{k.replace(/_/g,' ')}</th>)}
              <th style={{padding:'12px', fontWeight:'bold'}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {processedList.map((p, i) => {
                const isMed = p.medical_info && p.medical_info.trim() !== '';
                const cat = getCategory(p.conf_no);
                return (
                  <tr key={p.participant_id} style={{borderBottom:'1px solid #eee', background: p.status === 'Attending' ? 'white' : '#fff5f5'}}>
                    <td style={{padding:'10px', color:'#777'}}>{i+1}</td>
                    <td style={{padding:'10px'}}>
                        <div style={{fontWeight:'bold', fontSize:'13px', display:'flex', alignItems:'center', gap:'5px'}}>
                            {p.full_name}
                            {isMed && <AlertTriangle size={14} color="red" fill="#ffeeba"/>}
                        </div>
                        <div style={{fontSize:'10px', color:'#666'}}>{p.courses_info}</div>
                    </td>
                    <td style={{padding:'10px'}}>
                        <span style={{background: cat==='OLD'?'#e3f2fd':'#fff3cd', color: cat==='OLD'?'#0d47a1':'#856404', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold'}}>{p.conf_no}</span>
                    </td>
                    <td style={{padding:'10px'}}>{p.age}</td>
                    <td style={{padding:'10px'}}>{p.gender}</td>
                    <td style={{padding:'10px'}}>{p.room_no}</td>
                    <td style={{padding:'10px'}}>{p.dining_seat_no}</td>
                    <td style={{padding:'10px'}}>{p.pagoda_cell_no}</td>
                    <td style={{padding:'10px', fontWeight:'bold', color:'#28a745'}}>{p.dhamma_hall_seat_no}</td>
                    <td style={{padding:'10px'}}>{p.laundry_token_no}</td>
                    <td style={{padding:'10px'}}>
                        <span style={{color: getStatusColor(p.status), fontWeight:'bold', fontSize:'11px', border:`1px solid ${getStatusColor(p.status)}`, padding:'2px 6px', borderRadius:'10px'}}>{p.status}</span>
                    </td>
                    <td style={{padding:'10px'}}>
                       <div style={{display:'flex', gap:'5px'}}>
                          <button onClick={() => prepareReceipt(p)} title="Receipt" style={{padding:'5px', background:'#e3f2fd', border:'1px solid #90caf9', borderRadius:'4px', cursor:'pointer'}}><Printer size={14} color="#0d47a1"/></button>
                          <button onClick={() => handleSingleToken(p)} title="Token" style={{padding:'5px', background:'#fff3cd', border:'1px solid #ffeeba', borderRadius:'4px', cursor:'pointer'}}><Settings size={14} color="#856404"/></button>
                          <button onClick={() => setEditingStudent(p)} title="Edit" style={{padding:'5px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', cursor:'pointer'}}><Edit size={14} color="#555"/></button>
                          <button onClick={() => handleDelete(p.participant_id)} title="Delete" style={{padding:'5px', background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:'4px', cursor:'pointer'}}><Trash2 size={14} color="#d32f2f"/></button>
                       </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      {/* RECEIPT MODAL */}
      {printReceiptData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={()=>setPrintReceiptData(null)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button><div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}><div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div><div style={{fontSize:'12px', marginBottom:'10px'}}><div><strong>Course:</strong> {printReceiptData.courseName}</div><div><strong>Teacher:</strong> {printReceiptData.teacherName}</div><div><strong>Dates:</strong> {printReceiptData.from} to {printReceiptData.to}</div></div><div style={{borderBottom:'1px solid black', margin:'10px 0'}}></div><div style={{fontSize:'16px', fontWeight:'bold', margin:'10px 0'}}><div>{printReceiptData.studentName}</div><div style={{fontSize:'14px'}}>Conf: {printReceiptData.confNo}</div></div><table style={{width:'100%', fontSize:'14px', border:'1px solid black', borderCollapse:'collapse'}}><tbody><tr><td style={{border:'1px solid black', padding:'5px'}}>Room</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.roomNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Dining</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.seatNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lockers</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.lockers}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lang</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.language}</td></tr>{printReceiptData.pagoda && <tr><td style={{border:'1px solid black', padding:'5px'}}>Pagoda</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.pagoda}</td></tr>}{printReceiptData.special && <tr><td style={{border:'1px solid black', padding:'5px'}}>Special</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printReceiptData.special}</td></tr>}</tbody></table><div style={{textAlign:'center', fontSize:'10px', fontStyle:'italic', marginTop:'10px'}}>*** Student Copy ***</div></div><div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button></div></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; } @page { size: 72mm auto; margin: 0; } }`}</style></div>}

      {/* BULK TOKEN UI MODAL */}
      {showBulkModal && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px', textAlign:'center'}}>
                  <h2 style={{marginTop:0}}>🖨️ Print Tokens</h2>
                  <p style={{color:'#666', marginBottom:'30px'}}>Select which group to print on Thermal Printer.</p>
                  
                  <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                      <button onClick={()=>handleBulkPrint('ALL')} style={{padding:'15px', background:'#28a745', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}}>PRINT ALL</button>
                      <div style={{display:'flex', gap:'15px'}}>
                          <button onClick={()=>handleBulkPrint('Male')} style={{flex:1, padding:'15px', background:'#007bff', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>MALES ONLY</button>
                          <button onClick={()=>handleBulkPrint('Female')} style={{flex:1, padding:'15px', background:'#e91e63', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>FEMALES ONLY</button>
                      </div>
                  </div>
                  
                  <button onClick={()=>setShowBulkModal(false)} style={{marginTop:'30px', background:'none', border:'none', color:'#999', textDecoration:'underline', cursor:'pointer'}}>Cancel</button>
              </div>
          </div>
      )}

      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', width:'600px', borderRadius:'10px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Full Name</label><input style={styles.input} value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})} /></div><div><label>Conf No</label><input style={styles.input} value={editingStudent.conf_no||''} onChange={e=>setEditingStudent({...editingStudent, conf_no:e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Room No</label><input style={styles.input} value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} /></div><div><label>Dining Seat</label><input style={styles.input} value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} /></div><div><label>Pagoda Cell</label><input style={styles.input} value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} /></div></div>
      <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}><h4 style={{marginTop:0}}>Manual Locker Override</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Mobile</label><input style={styles.input} value={editingStudent.mobile_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, mobile_locker_no:e.target.value})} /></div><div><label>Valuables</label><input style={styles.input} value={editingStudent.valuables_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, valuables_locker_no:e.target.value})} /></div><div><label>Laundry</label><input style={styles.input} value={editingStudent.laundry_token_no||''} onChange={e=>setEditingStudent({...editingStudent, laundry_token_no:e.target.value})} /></div><div><label>Dhamma Hall Seat</label><input style={styles.input} value={editingStudent.dhamma_hall_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dhamma_hall_seat_no:e.target.value})} /></div></div></div>
      <div style={{textAlign:'right'}}><button onClick={()=>setEditingStudent(null)} style={{marginRight:'10px', padding:'8px 16px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>Cancel</button><button type="submit" style={{padding:'8px 16px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Save Changes</button></div></form></div></div>)}
    </div>
  );
}
