import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle, Filter, Save, Plus, Minus, User, Tag, Download, Database } from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { API_URL, styles } from '../config';
import DhammaHallLayout from './DhammaHallLayout'; 
// We use generator ONLY for A4 lists. Tokens are handled LOCALLY below.
import { printList, printCombinedList, printArrivalPass } from '../utils/printGenerator';

// --- DATA HELPERS ---
const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
const getStatusColor = (s) => { if (s === 'Attending') return '#28a745'; if (s === 'Gate Check-In') return '#ffc107'; if (s === 'Cancelled' || s === 'No-Show') return '#dc3545'; return '#6c757d'; };
const getStudentStats = (p) => { if (!p) return { cat: '', s: 0, l: 0, age: '' }; const conf = (p.conf_no || '').toUpperCase(); const isOld = conf.startsWith('O') || conf.startsWith('S'); const cat = isOld ? '(O)' : '(N)'; const sMatch = (p.courses_info || '').match(/S\s*[:=-]?\s*(\d+)/i); const lMatch = (p.courses_info || '').match(/L\s*[:=-]?\s*(\d+)/i); const s = sMatch ? sMatch[1] : '0'; const l = lMatch ? lMatch[1] : '0'; return { cat, s, l, age: p.age || '?' }; };
const calculatePriorityScore = (p) => { const stats = getStudentStats(p); let score = 0; if (stats.cat === '(O)') score += 10000; score += (parseInt(stats.s) * 100); score += (parseInt(stats.l) * 500); score += (parseInt(stats.age) || 0); return score; };
const getAlphabetRange = (startIdx, count) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(startIdx, startIdx + count);
const generateChowkyLabels = (startIdx, count) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(startIdx, startIdx + count).map(l => `CW-${l}`);

// --- SUB-COMPONENTS (RenderCell & SeatingSheet) ---
const renderCell = (id, p, gender, selectedSeat, handleSeatClick) => {
    const shouldShow = p && (p.gender||'').toLowerCase().startsWith(gender.toLowerCase().charAt(0));
    const displayP = shouldShow ? p : null;
    const stats = getStudentStats(displayP); 
    const isSel = selectedSeat?.label === id;
    return (
        <div key={id} onClick={()=>handleSeatClick(id, displayP, gender)} className="seat-box" style={{ border: '2px solid black', background: displayP ? (isSel ? '#ffeb3b' : 'white') : 'white', width: '130px', height: '95px', fontSize: '10px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxSizing: 'border-box' }}>
            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'14px', padding:'2px 5px', background: isSel?'#fdd835':'white', borderBottom:'1px solid black'}}>
                <span>{id}</span><span style={{fontSize:'12px'}}>{displayP?.room_no || ''}</span>
            </div>
            {displayP && (
                <div style={{textAlign:'center', padding:'0 2px'}}>
                    <div style={{fontSize:'10px', fontWeight:'bold', textAlign:'right', marginBottom:'2px', color:'#0d47a1'}}>P:{displayP.pagoda_cell_no || '-'}</div>
                    <div style={{fontWeight:'900', fontSize:'12px', lineHeight:'1.1', textTransform:'uppercase'}}>{displayP.full_name}</div>
                </div>
            )}
            {displayP ? (
                <div style={{fontSize:'10px', padding:'2px 5px', fontWeight:'bold', whiteSpace:'nowrap', display:'flex', justifyContent:'space-between', borderTop:'1px solid black', background:'white'}}>
                    <span>{stats.cat}</span><span>S:{stats.s} L:{stats.l}</span><span>Age:({stats.age})</span>
                </div>
            ) : ( <div style={{flex:1}}></div> )}
            {displayP && displayP.is_seat_locked && <div style={{position:'absolute', bottom:'25px', left:'2px', fontSize:'10px'}}>🔒</div>}
        </div>
    );
};

const SeatingSheet = ({ id, title, map, orderedCols, rows, setRows, setRegCols, setSpecCols, gender, selectedSeat, handleSeatClick, courseId, courses, participants, seatingConfig }) => {
    const courseObj = courses.find(c=>c.course_id==courseId);
    const courseName = courseObj ? courseObj.course_name : 'COURSE';
    const dateRange = courseObj ? `${new Date(courseObj.start_date).toLocaleDateString()} to ${new Date(courseObj.end_date).toLocaleDateString()}` : '';
    const genderKey = gender.toLowerCase().charAt(0);
    const studentsOnSide = participants.filter(p => p.status === 'Attending' && (p.gender||'').toLowerCase().startsWith(genderKey));
    const oldCnt = studentsOnSide.filter(p => getCategory(p.conf_no)==='OLD').length;
    const newCnt = studentsOnSide.filter(p => getCategory(p.conf_no)==='NEW').length;

    const renderGrid = () => { 
        let g=[]; 
        for(let r=rows; r>=1; r--) { 
            let cells = orderedCols.map((c, idx) => {
               if(c === 'GAP') return <div key={`gap-${r}-${idx}`} style={{width:'30px', writingMode:'vertical-rl', fontSize:'9px', color:'#ccc', display:'flex', alignItems:'center', justifyContent:'center'}}>{r===Math.ceil(rows/2) && "PATHWAY"}</div>;
               return renderCell(c+r, map[c+r], gender, selectedSeat, handleSeatClick);
            });
            g.push(<div key={r} style={{display:'flex', alignItems:'center'}}>{cells}</div>); 
        } 
        return g; 
    };

    const printVisualGrid = () => {
        const css = `@media print { @page { size: A3 landscape; margin: 5mm; } html, body { height: 100%; margin: 0; padding: 0; } body * { visibility: hidden; } #${id}, #${id} * { visibility: visible; } #${id} { position: fixed; left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; transform: scale(0.9); transform-origin: center top; } .no-print { display: none !important; } .seat-grid { border-top: 2px solid black; border-left: 2px solid black; } .seat-box { border-right: 2px solid black; border-bottom: 2px solid black; } }`;
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    return (
        <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto', fontFamily:'Arial, sans-serif'}}> 
            <div className="no-print" style={{textAlign:'right', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fa', padding:'10px', borderRadius:'8px'}}> 
                <div style={{display:'flex', gap:'5px', alignItems:'center'}}> 
                    <button onClick={()=>setRows(rows+1)} style={styles.quickBtn(false)}><Plus size={12}/> Row</button>
                    <button onClick={()=>setRows(Math.max(1, rows-1))} style={styles.quickBtn(false)}><Minus size={12}/> Row</button>
                    <span style={{margin:'0 10px', color:'#ccc'}}>|</span>
                    <span style={{fontSize:'12px', fontWeight:'bold'}}>Std:</span>
                    <button onClick={()=>setRegCols(gender==='Male'?seatingConfig.mCols+1:seatingConfig.fCols+1)} style={styles.quickBtn(false)}><Plus size={12}/></button>
                    <button onClick={()=>setRegCols(Math.max(1, gender==='Male'?seatingConfig.mCols-1:seatingConfig.fCols-1))} style={styles.quickBtn(false)}><Minus size={12}/></button>
                    <span style={{margin:'0 10px', color:'#ccc'}}>|</span>
                    <span style={{fontSize:'12px', fontWeight:'bold'}}>Chowky:</span>
                    <button onClick={()=>setSpecCols(gender==='Male'?seatingConfig.mChowky+1:seatingConfig.fChowky+1)} style={styles.quickBtn(false)}><Plus size={12}/></button>
                    <button onClick={()=>setSpecCols(Math.max(1, gender==='Male'?seatingConfig.mChowky-1:seatingConfig.fChowky-1))} style={styles.quickBtn(false)}><Minus size={12}/></button>
                </div> 
                <div style={{display:'flex', gap:'10px'}}> 
                    <button onClick={printVisualGrid} style={styles.quickBtn(true)}>🖨️ Print</button> 
                </div> 
            </div> 
            <div style={{textAlign:'center', marginBottom:'20px'}}> 
                <h1 style={{margin:'0 0 5px 0', fontSize:'28px', fontWeight:'bold', textTransform:'uppercase'}}>SEATING PLAN - {title}</h1> 
                <div style={{fontSize:'16px', fontWeight:'bold', color:'#333', marginBottom:'5px'}}>Old: {oldCnt} + New: {newCnt} = Total: {oldCnt + newCnt}</div>
                <h3 style={{margin:0, fontSize:'16px', fontWeight:'bold'}}>{courseName} / {dateRange}</h3> 
            </div> 
            <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content', borderTop:'2px solid black', borderLeft:'2px solid black'}}> {renderGrid()} </div> </div> 
            <div style={{display:'flex', justifyContent:'center', marginTop:'40px'}}> <div style={{textAlign:'center', width:'100%'}}> <div style={{border:'2px dashed black', padding:'15px', fontWeight:'900', fontSize:'32px', letterSpacing:'2px', textTransform:'uppercase', margin:'0 auto', maxWidth:'600px', background:'white'}}>{gender.toUpperCase()} TEACHER</div></div> </div> 
        </div> 
    );
};

export default function ParticipantList({ courses, refreshCourses, userRole }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [filterType, setFilterType] = useState('ALL'); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const [diningSort, setDiningSort] = useState({ key: 'dining_seat_no', direction: 'asc' });
  const [pagodaSort, setPagodaSort] = useState({ key: 'pagoda_cell_no', direction: 'asc' });
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false); 
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [showVisualHall, setShowVisualHall] = useState(false); 
  
  const defaultConfig = { mCols: 10, mRows: 10, mChowky: 2, fCols: 7, fRows: 10, fChowky: 2 };
  const [seatingConfig, setSeatingConfig] = useState(defaultConfig);
  const [printConfig, setPrintConfig] = useState({ scale: 0.9, orientation: 'landscape', paper: 'A3' });

  useEffect(() => { 
      if (courseId) {
          fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : []));
          try {
              const savedLayout = localStorage.getItem(`layout_${courseId}`);
              if(savedLayout) {
                  const parsed = JSON.parse(savedLayout);
                  setSeatingConfig({
                      mCols: parseInt(parsed.mCols || defaultConfig.mCols), mRows: parseInt(parsed.mRows || defaultConfig.mRows), mChowky: parseInt(parsed.mChowky || defaultConfig.mChowky),
                      fCols: parseInt(parsed.fCols || defaultConfig.fCols), fRows: parseInt(parsed.fRows || defaultConfig.fRows), fChowky: parseInt(parsed.fChowky || defaultConfig.fChowky),
                  });
              } else { setSeatingConfig(defaultConfig); }
          } catch(e) { setSeatingConfig(defaultConfig); }
      } 
  }, [courseId]);

  const processedList = useMemo(() => { 
      let items = [...participants]; 
      if (filterType !== 'ALL') { items = items.filter(p => { const cat = getCategory(p.conf_no); if (filterType === 'OLD') return cat === 'OLD'; if (filterType === 'NEW') return cat === 'NEW'; if (filterType === 'MED') return (p.medical_info && p.medical_info.trim() !== ''); if (filterType === 'MALE') return (p.gender||'').toLowerCase().startsWith('m'); if (filterType === 'FEMALE') return (p.gender||'').toLowerCase().startsWith('f'); return true; }); }
      if (search) items = items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase()) || (p.conf_no || '').toLowerCase().includes(search.toLowerCase()));
      if (sortConfig.key) { items.sort((a, b) => { let valA = a[sortConfig.key] || '', valB = b[sortConfig.key] || ''; if (['age', 'dining_seat_no', 'pagoda_cell_no', 'laundry_token_no'].includes(sortConfig.key)) { valA = parseInt(valA) || 0; valB = parseInt(valB) || 0; } else { valA = valA.toString().toLowerCase(); valB = valB.toString().toLowerCase(); } if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } return items; 
  }, [participants, sortConfig, search, filterType]);

  const seatingStats = useMemo(() => {
      const stats = { m: { chowky: 0, std: 0 }, f: { chowky: 0, std: 0 } };
      participants.forEach(p => {
          if(p.status !== 'Attending') return;
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          const type = p.special_seating || 'None';
          const isSpecial = ['Chowky', 'Chair', 'BackRest'].includes(type);
          if(isMale) { isSpecial ? stats.m.chowky++ : stats.m.std++; }
          else { isSpecial ? stats.f.chowky++ : stats.f.std++; }
      });
      return stats;
  }, [participants]);

  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const sortParticipants = (list, key, dir) => { return [...list].sort((a, b) => { let valA = a[key] || ''; let valB = b[key] || ''; if (key === 'category') { valA = getCategory(a.conf_no); valB = getCategory(b.conf_no); } if (key === 'dining_seat_no' || key === 'pagoda_cell_no') { return dir === 'asc' ? String(valA).localeCompare(String(valB), undefined, { numeric: true }) : String(valB).localeCompare(String(valA), undefined, { numeric: true }); } if (valA < valB) return dir === 'asc' ? -1 : 1; if (valA > valB) return dir === 'asc' ? 1 : -1; return 0; }); };

  const getCourseName = () => { return courses.find(c => String(c.course_id) === String(courseId))?.course_name || 'Dhamma Course'; };

  // =========================================================
  // ✅ 1. SINGLE TOKEN PRINT (INLINE LOGIC RESTORED)
  // =========================================================
  const handleSingleToken = (student) => {
      if (!student.dhamma_hall_seat_no) return alert("No seat assigned. Assign a seat in the column first.");
      
      const cat = getCategory(student.conf_no) === 'OLD' ? 'OLD' : 'NEW';
      
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      
      // ✅ CSS IS IDENTICAL TO YOUR REFERENCE FILE
      // ✅ CONTENT IS UPDATED TO 'DHAMMA SEAT' AS REQUESTED
      doc.open();
      doc.write(`
          <html>
          <head>
              <title>Token-${student.conf_no}</title>
              <style>
                  @page { size: 58mm 40mm; margin: 0; }
                  body { margin: 0; padding: 5px; font-family: Arial, sans-serif; text-align: center; }
                  .token-box { 
                      border: 2px solid black; 
                      padding: 5px; 
                      border-radius: 8px; 
                      height: 38mm; 
                      box-sizing: border-box; 
                      display: flex; 
                      flex-direction: column; 
                      justify-content: space-between; 
                  }
                  h2 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900; }
                  .seat { font-size: 36px; font-weight: 900; margin: 2px 0; }
                  .name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                  .details { font-size: 10px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
              </style>
          </head>
          <body>
              <div class="token-box">
                  <div>
                      <h2>DHAMMA SEAT</h2>
                      <div style="border-bottom: 2px solid black; margin: 2px 0;"></div>
                  </div>
                  <div class="seat">${student.dhamma_hall_seat_no || '-'}</div>
                  <div>
                      <div class="name">${student.full_name}</div>
                      <div class="details">
                          <span>${student.pagoda_cell_no ? `P:${student.pagoda_cell_no}` : ''}</span>
                          <span>${cat}</span>
                          <span>Age:${student.age}</span>
                          <span>Rm:${student.room_no || '-'}</span>
                      </div>
                  </div>
              </div>
          </body>
          </html>
      `);
      doc.close();
      iframe.contentWindow.focus();
      setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
  };

  const handlePrintPass = (student) => {
      const courseObj = courses.find(c => String(c.course_id) === String(courseId));
      let rawName = courseObj?.course_name || 'Unknown';
      let shortName = rawName.match(/(\d+)\s*-?\s*Day/i) ? `${rawName.match(/(\d+)\s*-?\s*Day/i)[1]}-Day Course` : rawName;
      const data = { 
          courseName: shortName, teacherName: courseObj?.teacher_name || 'Teacher', 
          from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', 
          to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', 
          studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, 
          seatNo: student.dining_seat_no, mobile: student.mobile_locker_no || '-', 
          valuables: student.valuables_locker_no || '-', laundry: student.laundry_token_no, 
          language: student.discourse_language, pagoda: (student.pagoda_cell_no && student.pagoda_cell_no !== 'None') ? student.pagoda_cell_no : null
      };
      printArrivalPass(data);
  };

  // =========================================================
  // ✅ 2. BULK TOKEN PRINT (INLINE LOGIC RESTORED)
  // =========================================================
  const handleBulkPrint = (filter) => { 
      let valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no); 
      if (filter === 'Male') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('m')); 
      if (filter === 'Female') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('f')); 
      if (valid.length === 0) return alert("No students found."); 
      
      const sortedStudents = valid.sort((a,b) => a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true}));
      
      if(window.confirm(`🖨️ Ready to print ${sortedStudents.length} tokens?`)) { 
          
          const tokensHtml = sortedStudents.map(student => {
              const cat = getCategory(student.conf_no) === 'OLD' ? 'OLD' : 'NEW';
              return `
              <div class="token-wrapper">
                  <div class="token-box">
                      <div>
                          <h2>DHAMMA SEAT</h2>
                          <div style="border-bottom: 2px solid black; margin: 2px 0;"></div>
                      </div>
                      <div class="seat">${student.dhamma_hall_seat_no || '-'}</div>
                      <div>
                          <div class="name">${student.full_name}</div>
                          <div class="details">
                              <span>${student.pagoda_cell_no ? `P:${student.pagoda_cell_no}` : ''}</span>
                              <span>${cat}</span>
                              <span>Age:${student.age}</span>
                              <span>Rm:${student.room_no || '-'}</span>
                          </div>
                      </div>
                  </div>
              </div>
              `;
          }).join('');

          const iframe = document.createElement('iframe');
          iframe.style.position = 'absolute';
          iframe.style.width = '0px';
          iframe.style.height = '0px';
          iframe.style.border = 'none';
          document.body.appendChild(iframe);
          const doc = iframe.contentWindow.document;
          doc.open();
          // ✅ STRICT REFERENCE CSS + PAGE BREAK LOGIC
          doc.write(`
              <html>
              <head>
                  <title>Bulk Tokens</title>
                  <style>
                      @page { size: 58mm 40mm; margin: 0; }
                      body { margin: 0; padding: 0; font-family: Arial, sans-serif; text-align: center; }
                      .token-wrapper { padding: 5px; page-break-after: always; }
                      .token-wrapper:last-child { page-break-after: avoid; }
                      .token-box { 
                          border: 2px solid black; 
                          padding: 5px; 
                          border-radius: 8px; 
                          height: 38mm; 
                          box-sizing: border-box; 
                          display: flex; 
                          flex-direction: column; 
                          justify-content: space-between; 
                      }
                      h2 { margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase; }
                      .seat { font-size: 36px; font-weight: 900; margin: 2px 0; }
                      .name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                      .details { font-size: 10px; display: flex; justify-content: space-between; margin-top: 5px; font-weight: bold; }
                  </style>
              </head>
              <body>${tokensHtml}</body>
              </html>
          `);
          doc.close();
          iframe.contentWindow.focus();
          setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 3000); }, 1000);
      }
  };

  const handlePrintList = (list, title) => { printList(title, list, getCourseName()); };
  
  const handlePrintCombined = (type) => {
      const active = participants.filter(p => p.status === 'Attending');
      let males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
      let females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f'));
      if (type === 'PAGODA') {
          males = males.filter(p => p.pagoda_cell_no); females = females.filter(p => p.pagoda_cell_no);
          const sorter = (a,b) => String(a.pagoda_cell_no).localeCompare(String(b.pagoda_cell_no), undefined, {numeric:true});
          males.sort(sorter); females.sort(sorter);
      } else {
          const sorter = (a,b) => String(a.dining_seat_no).localeCompare(String(b.dining_seat_no), undefined, {numeric:true});
          males.sort(sorter); females.sort(sorter);
      }
      printCombinedList(type, males, females, getCourseName());
  };

  const saveLayoutConfig = () => { localStorage.setItem(`layout_${courseId}`, JSON.stringify(seatingConfig)); alert("✅ Layout Configuration Saved for this course!"); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };
  
  // ✅ EXACT EXPORT LOGIC FROM YOUR SNIPPET
  const handleExport = () => { 
      if (participants.length === 0) return alert("No data to export.");
      const courseObj = courses.find(c => String(c.course_id) === String(courseId));
      let courseName = courseObj ? courseObj.course_name.split('/')[0].trim().replace(/\s+/g, '-') : `Course-${courseId}`;
      const fileName = `${courseName}_Master-Data.xlsx`;
      const headers = ["Name", "Conf No", "Courses Info", "Age", "Gender", "Room", "Dining Seat", "Pagoda", "Dhamma Seat", "Status", "Mobile Locker", "Valuables Locker", "Laundry Token", "Language"];
      const getRows = (list) => list.map(p => [p.full_name, p.conf_no, p.courses_info, p.age, p.gender, p.room_no, p.dining_seat_no, p.pagoda_cell_no, p.dhamma_hall_seat_no, p.status, p.mobile_locker_no, p.valuables_locker_no, p.laundry_token_no, p.discourse_language]);
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f'));
      const wb = XLSX.utils.book_new();
      if (males.length > 0) { const ws = XLSX.utils.aoa_to_sheet([headers, ...getRows(males)]); XLSX.utils.book_append_sheet(wb, ws, "Male"); }
      if (females.length > 0) { const ws = XLSX.utils.aoa_to_sheet([headers, ...getRows(females)]); XLSX.utils.book_append_sheet(wb, ws, "Female"); }
      XLSX.writeFile(wb, fileName);
  };

  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Pagoda Cell", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.pagoda_cell_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `dining_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handlePagodaExport = () => { const assigned = participants.filter(p => p.status === 'Attending' && p.pagoda_cell_no); if (assigned.length === 0) return alert("No pagoda assignments found."); const headers = ["Cell", "Name", "Conf", "Gender", "Room", "Dining Seat"]; const rows = assigned.sort((a,b) => String(a.pagoda_cell_no).localeCompare(String(b.pagoda_cell_no), undefined, {numeric:true})).map(p => [p.pagoda_cell_no, `"${p.full_name || ''}"`, p.conf_no, p.gender, p.room_no, p.dining_seat_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `pagoda_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleSeatingExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Name", "Conf", "Gender", "Pagoda", "Room"]; const rows = arrived.map(p => [p.dhamma_hall_seat_no || '', `"${p.full_name || ''}"`, p.conf_no || '', p.gender || '', p.pagoda_cell_no || '', p.room_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `seating_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  
  const handleSeatClick = async (seatLabel, student, genderContext) => { 
      if (!selectedSeat) { 
          if(student) {
              const studentGender = (student.gender || '').toLowerCase();
              if(genderContext && !studentGender.startsWith(genderContext.toLowerCase().charAt(0))) {
                  return alert(`⛔ Cannot pick a ${student.gender} student from the ${genderContext} seating plan.`);
              }
          }
          setSelectedSeat({ label: seatLabel, p: student, gender: genderContext }); 
          return; 
      } 
      const source = selectedSeat; 
      const target = { label: seatLabel, p: student }; 
      setSelectedSeat(null); 
      if(genderContext && source.gender && genderContext !== source.gender) {
          return alert("⛔ Invalid Swap: Cannot move student between Male and Female sides.");
      }
      if (source.label === target.label) return; 
      if (window.confirm(`Swap ${source.label} ↔️ ${target.label}?`)) { 
          if (source.p && !target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } 
          else if (!source.p && target.p) { await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); }
          else if (source.p && target.p) { 
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); 
              await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); 
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
          } 
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`); 
          setParticipants(await res.json()); 
      } 
  };

  const handleAutoAssign = async () => {
      if (!window.confirm("⚠️ This will overwrite unlocked seats based on Seniority Logic. Continue?")) return;
      setIsAssigning(true);
      setShowAutoAssignModal(false);
      localStorage.setItem(`layout_${courseId}`, JSON.stringify(seatingConfig));
      try {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const allP = await res.json();
          const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre)));
          const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
          const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f'));
          const genSeats = (cols, rows) => { let s = []; if(!cols || !Array.isArray(cols)) return []; for(let r=1; r<=rows; r++) { cols.forEach(c => s.push(c + r)); } return s; };
          const mRegSeats = genSeats(getAlphabetRange(0, seatingConfig.mCols), seatingConfig.mRows);
          const mSpecSeats = genSeats(generateChowkyLabels(seatingConfig.mCols, seatingConfig.mChowky), seatingConfig.mRows);
          const fRegSeats = genSeats(getAlphabetRange(0, seatingConfig.fCols), seatingConfig.fRows);
          const fSpecSeats = genSeats(generateChowkyLabels(seatingConfig.fCols, seatingConfig.fChowky), seatingConfig.fRows);
          const assignGroup = (students, regSeats, specSeats) => {
              const updates = [];
              const lockedSeats = new Set();
              students.forEach(p => { if (p.is_seat_locked && p.dhamma_hall_seat_no) lockedSeats.add(p.dhamma_hall_seat_no); });
              const availReg = regSeats.filter(s => !lockedSeats.has(s));
              const availSpec = specSeats.filter(s => !lockedSeats.has(s));
              const toAssign = students.filter(p => !p.is_seat_locked).sort((a,b) => calculatePriorityScore(b) - calculatePriorityScore(a));
              const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating));
              const normalGroup = toAssign.filter(p => !specGroup.includes(p));
              specGroup.forEach(p => { if (availSpec.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availSpec.shift() }); else if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); });
              normalGroup.forEach(p => { if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); });
              return updates;
          };
          const allUpdates = [...assignGroup(males, mRegSeats, mSpecSeats), ...assignGroup(females, fRegSeats, fSpecSeats)];
          if (allUpdates.length === 0) { alert("✅ No new assignments needed."); setIsAssigning(false); return; }
          const BATCH_SIZE = 5;
          for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) { await Promise.all(allUpdates.slice(i, i + BATCH_SIZE).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }))); }
          alert(`✅ Assigned seats to ${allUpdates.length} students.\nConfig Auto-Saved.`);
          const finalRes = await fetch(`${API_URL}/courses/${courseId}/participants`);
          setParticipants(await finalRes.json());
      } catch (err) { console.error(err); alert("❌ Error during auto-assign."); }
      setIsAssigning(false);
  };

  const mReg = getAlphabetRange(0, seatingConfig.mCols);
  const mSpec = generateChowkyLabels(seatingConfig.mCols, seatingConfig.mChowky);
  const mOrdered = [...mReg, 'GAP', ...mSpec];
  const fReg = getAlphabetRange(0, seatingConfig.fCols);
  const fSpec = generateChowkyLabels(seatingConfig.fCols, seatingConfig.fChowky);
  const fOrdered = [...fSpec.reverse(), 'GAP', ...fReg.reverse()];

  // ... (Keep existing view modes) ...
  if (viewMode === 'dining') { 
      const arrived = participants.filter(p => p.status==='Attending'); 
      const renderDiningTable = (list, title, color) => {
        const sortedList = sortParticipants(list, diningSort.key, diningSort.direction);
        const handleSortClick = (key) => { const dir = (diningSort.key === key && diningSort.direction === 'asc') ? 'desc' : 'asc'; setDiningSort({ key, direction: dir }); };
        return ( <div style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={() => handlePrintList(list, `${title} DINING`)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>🖨️ Print {title} List (A4)</button> </div> <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Dining List</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}> <thead> <tr style={{background:'#f0f0f0'}}> <th style={{padding:'10px', border:'1px solid black'}}>S.N.</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('dining_seat_no')}>SEAT {diningSort.key==='dining_seat_no' && (diningSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Name</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('category')}>CAT {diningSort.key==='category' && (diningSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Room</th> <th style={{padding:'10px', border:'1px solid black'}}>Pagoda</th> </tr> </thead> <tbody> {sortedList.map((p,i)=>( <tr key={p.participant_id}> <td style={{padding:'10px', border:'1px solid black'}}>{i+1}</td> <td style={{padding:'10px', border:'1px solid black', fontWeight:'bold'}}>{p.dining_seat_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.full_name}</td> <td style={{padding:'10px', border:'1px solid black'}}>{getCategory(p.conf_no)}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.room_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.pagoda_cell_no}</td> </tr> ))} </tbody> </table> </div> );
      };
      return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}> <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> <div style={{display:'flex', gap:'10px'}}><button onClick={() => handlePrintCombined('DINING')} style={{...styles.quickBtn(true), background:'#6610f2', color:'white'}}>🖨️ Print Complete List (Male & Female)</button><button onClick={handleDiningExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Dining CSV</button></div> </div> {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff")} {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63")} </div> ); 
  }
  
  if (viewMode === 'pagoda') { 
      const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); 
      const renderPagodaTable = (list, title, color) => {
        const sortedList = sortParticipants(list, pagodaSort.key, pagodaSort.direction);
        const handleSortClick = (key) => { const dir = (pagodaSort.key === key && pagodaSort.direction === 'asc') ? 'desc' : 'asc'; setPagodaSort({ key, direction: dir }); };
        return ( <div style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={() => handlePrintList(list, `${title} PAGODA`)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>🖨️ Print {title} List (A4)</button> </div> <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Pagoda Cell List</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}> <thead> <tr style={{background:'#f0f0f0'}}> <th style={{padding:'10px', border:'1px solid black'}}>S.N.</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('pagoda_cell_no')}>CELL {pagodaSort.key==='pagoda_cell_no' && (pagodaSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Name</th> <th style={{padding:'10px', border:'1px solid black'}}>Cat</th> <th style={{padding:'10px', border:'1px solid black'}}>Room</th> <th style={{padding:'10px', border:'1px solid black'}}>Dining</th> </tr> </thead> <tbody> {sortedList.map((p,i)=>( <tr key={p.participant_id}> <td style={{padding:'10px', border:'1px solid black'}}>{i+1}</td> <td style={{padding:'10px', border:'1px solid black', fontWeight:'bold'}}>{p.pagoda_cell_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.full_name}</td> <td style={{padding:'10px', border:'1px solid black'}}>{getCategory(p.conf_no)}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.room_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.dining_seat_no}</td> </tr> ))} </tbody> </table> </div> );
      };
      return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}> <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> <div style={{display:'flex', gap:'10px'}}><button onClick={() => handlePrintCombined('PAGODA')} style={{...styles.quickBtn(true), background:'#6610f2', color:'white'}}>🖨️ Print Complete List (Male & Female)</button><button onClick={handlePagodaExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Pagoda CSV</button></div> </div> {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff")} {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63")} </div> ); 
  }
  
  if (viewMode === 'seating') { 
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled'); 
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled'); 
      const mM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); 
      const fM = {}; females.forEach(p=>fM[p.dhamma_hall_seat_no]=p); 
      
      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', alignItems:'center'}}> 
                  <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> 
                  <div style={{display:'flex', gap:'10px', alignItems:'center'}}> 
                      <button onClick={saveLayoutConfig} style={styles.toolBtn('#17a2b8')}><Save size={16}/> Store Seat Changes</button> 
                      <button onClick={() => setShowPrintSettings(true)} style={styles.toolBtn('#6c757d')}><Settings size={16}/> Settings</button> 
                      <button onClick={handleSeatingExport} style={{...styles.quickBtn(true), background:'#6c757d', color:'white'}}>CSV</button> 
                      <button onClick={()=>setShowAutoAssignModal(true)} style={{...styles.btn(true), background:'#ff9800', color:'white'}}><Settings size={16}/> Auto-Assign</button> 
                  </div> 
              </div> 
              <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}> 
                  <SeatingSheet id="print-male" title="MALE" map={mM} orderedCols={mOrdered} rows={seatingConfig.mRows} 
                      setRows={(v)=>setSeatingConfig({...seatingConfig, mRows:v})} 
                      setRegCols={(v)=>setSeatingConfig({...seatingConfig, mCols:v})}
                      setSpecCols={(v)=>setSeatingConfig({...seatingConfig, mChowky:v})}
                      gender="Male"
                      selectedSeat={selectedSeat}
                      handleSeatClick={handleSeatClick}
                      courseId={courseId}
                      courses={courses}
                      participants={participants}
                      seatingConfig={seatingConfig}
                  /> 
                  <SeatingSheet id="print-female" title="FEMALE" map={fM} orderedCols={fOrdered} rows={seatingConfig.fRows} 
                      setRows={(v)=>setSeatingConfig({...seatingConfig, fRows:v})} 
                      setRegCols={(v)=>setSeatingConfig({...seatingConfig, fCols:v})}
                      setSpecCols={(v)=>setSeatingConfig({...seatingConfig, fChowky:v})}
                      gender="Female"
                      selectedSeat={selectedSeat}
                      handleSeatClick={handleSeatClick}
                      courseId={courseId}
                      courses={courses}
                      participants={participants}
                      seatingConfig={seatingConfig}
                  /> 
              </div> 
              {showPrintSettings && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px'}}><h3>🖨️ Print Settings</h3><div style={{marginBottom:'15px'}}><label style={styles.label}>Paper Size</label><select style={styles.input} value={printConfig.paper} onChange={e=>setPrintConfig({...printConfig, paper:e.target.value})}><option>A4</option><option>A3</option><option>Letter</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Orientation</label><select style={styles.input} value={printConfig.orientation} onChange={e=>setPrintConfig({...printConfig, orientation:e.target.value})}><option>landscape</option><option>portrait</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Scale (Zoom)</label><input type="range" min="0.5" max="1.5" step="0.1" value={printConfig.scale} onChange={e=>setPrintConfig({...printConfig, scale:e.target.value})} style={{width:'100%'}}/><div style={{textAlign:'center', fontSize:'12px'}}>{Math.round(printConfig.scale*100)}%</div></div><div style={{textAlign:'right'}}><button onClick={()=>setShowPrintSettings(false)} style={styles.btn(true)}>Done</button></div></div></div>)} 
              {showAutoAssignModal && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'600px', maxHeight:'90vh', overflowY:'auto'}}><h3>🛠️ Auto-Assign Configuration</h3>
                  <div style={{marginBottom:'15px', color:'#555', fontSize:'14px', fontStyle:'italic'}}>
                      Configuring for: <strong>{courses.find(c=>c.course_id == courseId)?.course_name || 'Selected Course'}</strong>
                  </div>
                  <div style={{background:'#f0f8ff', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #cce5ff'}}>
                      <h4 style={{margin:'0 0 10px 0', fontSize:'14px', color:'#0056b3'}}>Requirements Overview (Live)</h4>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                          <div>
                              <div style={{fontWeight:'bold', color:'#007bff'}}>MALE</div>
                              <div style={{fontSize:'12px'}}>Chowky Need: <strong>{seatingStats.m.chowky}</strong></div>
                              <div style={{fontSize:'12px'}}>Cushion Need: <strong>{seatingStats.m.std}</strong></div>
                          </div>
                          <div>
                              <div style={{fontWeight:'bold', color:'#e91e63'}}>FEMALE</div>
                              <div style={{fontSize:'12px'}}>Chowky Need: <strong>{seatingStats.f.chowky}</strong></div>
                              <div style={{fontSize:'12px'}}>Cushion Need: <strong>{seatingStats.f.std}</strong></div>
                          </div>
                      </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}><div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}><h4 style={{marginTop:0, color:'#007bff'}}>Male Side</h4><label style={styles.label}>Standard Cols</label><input type="number" style={styles.input} value={seatingConfig.mCols} onChange={e=>setSeatingConfig({...seatingConfig, mCols: parseInt(e.target.value)||0})} /><label style={styles.label}>Chowky Cols</label><input type="number" style={styles.input} value={seatingConfig.mChowky} onChange={e=>setSeatingConfig({...seatingConfig, mChowky: parseInt(e.target.value)||0})} /><label style={styles.label}>Total Rows</label><input type="number" style={styles.input} value={seatingConfig.mRows} onChange={e=>setSeatingConfig({...seatingConfig, mRows: parseInt(e.target.value)||0})} /></div><div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}><h4 style={{marginTop:0, color:'#e91e63'}}>Female Side</h4><label style={styles.label}>Standard Cols</label><input type="number" style={styles.input} value={seatingConfig.fCols} onChange={e=>setSeatingConfig({...seatingConfig, fCols: parseInt(e.target.value)||0})} /><label style={styles.label}>Chowky Cols</label><input type="number" style={styles.input} value={seatingConfig.fChowky} onChange={e=>setSeatingConfig({...seatingConfig, fChowky: parseInt(e.target.value)||0})} /><label style={styles.label}>Total Rows</label><input type="number" style={styles.input} value={seatingConfig.fRows} onChange={e=>setSeatingConfig({...seatingConfig, fRows: parseInt(e.target.value)||0})} /></div></div><div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}><button onClick={()=>setShowAutoAssignModal(false)} style={styles.btn(false)}>Cancel</button><button onClick={handleAutoAssign} style={isAssigning ? styles.btn(false) : {...styles.btn(true), background:'#28a745', color:'white'}} disabled={isAssigning}>{isAssigning ? 'Processing...' : 'RUN ASSIGNMENT'}</button></div></div></div>)} 
          </div> 
      ); 
  }

  // --- DEFAULT LIST VIEW ---
  return (
    <div style={styles.card}>
      {/* ... (Header, Filters, Table - Keep existing) ... */}
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
         <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
             <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><User size={24}/> Students</h2>
             <select style={{...styles.input, maxWidth:'250px'}} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         </div>
         {/* QUICK ACTION TOOLBAR */}
         <div style={{display:'flex', gap:'8px', background:'#f8f9fa', padding:'5px', borderRadius:'10px', border:'1px solid #eee'}}>
             <button onClick={()=>setShowVisualHall(true)} disabled={!courseId} style={{...styles.toolBtn('#6610f2'), background:'#5a32a3', color:'white'}}>🧘 Visual Hall</button>
             <button onClick={()=>setViewMode('dining')} disabled={!courseId} style={styles.toolBtn('#007bff')}>🍽️ Dining List</button>
             <button onClick={()=>setViewMode('seating')} disabled={!courseId} style={styles.toolBtn('#6610f2')}>🧘 Seating Plan</button>
             <button onClick={()=>setViewMode('pagoda')} disabled={!courseId} style={styles.toolBtn('#e91e63')}>🛖 Pagoda List</button>
             <button onClick={()=>setShowBulkModal(true)} disabled={!courseId} style={styles.toolBtn('#17a2b8')}>🎫 Bulk Tokens</button>
             <button onClick={() => setShowSummaryReport(true)} disabled={!courseId} style={styles.toolBtn('#28a745')}>📈 Summary</button>
         </div>
      </div>
      <div style={{background:'white', padding:'15px', borderRadius:'12px', marginBottom:'20px', border:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <span style={{fontSize:'12px', fontWeight:'bold', color:'#666', marginRight:'5px'}}>FILTER:</span>
              {['ALL', 'OLD', 'NEW', 'MALE', 'FEMALE', 'MED'].map(type => (
                  <button key={type} onClick={()=>setFilterType(type)} style={{...styles.quickBtn(filterType===type), fontSize:'11px', padding:'6px 12px', borderRadius:'20px', border: filterType===type ? 'none' : '1px solid #ddd', background: filterType===type ? '#333' : 'white', color: filterType===type ? 'white' : '#555'}}>{type}</button>
              ))}
          </div>
          <div style={{position:'relative', width:'300px'}}>
              <input style={{...styles.input, width:'100%', paddingLeft:'10px', height:'38px', borderRadius:'8px', border:'1px solid #ccc'}} placeholder="🔍 Search name, ID or phone..." onChange={e=>setSearch(e.target.value)} disabled={!courseId} />
          </div>
      </div>
      <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'12px', maxHeight:'650px', overflowY:'auto', background:'white'}}>
        <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
          <thead style={{position:'sticky', top:0, zIndex:10}}>
            <tr style={{background:'#f8f9fa', textAlign:'left', borderBottom:'2px solid #e0e0e0', color:'#555', textTransform:'uppercase', fontSize:'11px'}}>
              {['S.N.', 'FULL_NAME','CONF_NO','AGE','GENDER','ROOM','DINING','PAGODA','DH_SEAT', 'LAUNDRY', 'STATUS'].map(k=><th key={k} style={{padding:'15px', fontWeight:'bold', cursor:'pointer', whiteSpace:'nowrap'}} onClick={()=>handleSort(k.toLowerCase())}>{k.replace(/_/g,' ')}</th>)}
              <th style={{padding:'15px', fontWeight:'bold'}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {processedList.map((p, i) => {
                const isMed = p.medical_info && p.medical_info.trim() !== '';
                const cat = getCategory(p.conf_no);
                return (
                  <tr key={p.participant_id} style={{borderBottom:'1px solid #f0f0f0', background: p.status === 'Attending' ? 'white' : '#fff5f5', transition:'background 0.2s', ':hover':{background:'#f9f9f9'}}}>
                    <td style={{padding:'15px', color:'#999'}}>{i+1}</td>
                    <td style={{padding:'15px'}}>
                        <div style={{fontWeight:'bold', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px', color:'#333'}}>
                            {p.full_name}
                            {isMed && <AlertTriangle size={14} color="#e65100" fill="#ffecb3"/>}
                        </div>
                        {p.courses_info && <div style={{fontSize:'11px', color:'#888', marginTop:'2px'}}>{p.courses_info}</div>}
                    </td>
                    <td style={{padding:'15px'}}>
                        <span style={{background: cat==='OLD'?'#e3f2fd':'#fff3cd', color: cat==='OLD'?'#0d47a1':'#856404', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'bold', display:'inline-block', minWidth:'40px', textAlign:'center'}}>{p.conf_no}</span>
                    </td>
                    <td style={{padding:'15px', color:'#555'}}>{p.age}</td>
                    <td style={{padding:'15px'}}><span style={{color: (p.gender||'').startsWith('M') ? '#007bff' : '#e91e63', fontWeight:'bold'}}>{p.gender}</span></td>
                    <td style={{padding:'15px', fontWeight:'bold'}}>{p.room_no || '-'}</td>
                    <td style={{padding:'15px'}}>{p.dining_seat_no || '-'}</td>
                    <td style={{padding:'15px'}}>{p.pagoda_cell_no || '-'}</td>
                    <td style={{padding:'15px', fontWeight:'bold', color:'#28a745'}}>{p.dhamma_hall_seat_no || '-'}</td>
                    <td style={{padding:'15px', color:'#555'}}>{p.laundry_token_no || '-'}</td>
                    <td style={{padding:'15px'}}>
                        <span style={{color: getStatusColor(p.status), fontWeight:'bold', fontSize:'11px', background: p.status==='Attending'?'#e8f5e9':'#fff3e0', padding:'4px 10px', borderRadius:'15px'}}>{p.status}</span>
                    </td>
                    <td style={{padding:'15px'}}>
                       <div style={{display:'flex', gap:'8px'}}>
                          <button onClick={() => setEditingStudent(p)} title="Edit" style={{padding:'6px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#555'}}><Edit size={14}/></button>
                          
                          {/* ✅ INDIVIDUAL TOKEN BUTTON */}
                          <button onClick={() => handleSingleToken(p)} title="Print Seat Token" style={{padding:'6px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#e65100'}}><Tag size={14}/></button>
                          
                          <button onClick={() => handlePrintPass(p)} title="Print Pass" style={{padding:'6px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#007bff'}}><Printer size={14}/></button>
                          <button onClick={() => handleDelete(p.participant_id)} title="Delete" style={{padding:'6px', background:'white', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', color:'#d32f2f'}}><Trash2 size={14}/></button>
                       </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
      {/* ... (Keep Visual Hall & Bulk Modal logic) ... */}
      {showVisualHall && (
          <DhammaHallLayout 
              participants={participants}
              maleCols={mOrdered}
              femaleCols={fOrdered}
              rows={seatingConfig.mRows}
              onClose={() => setShowVisualHall(false)}
              onSeatClick={handleSeatClick} 
          />
      )}
      {showBulkModal && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px', textAlign:'center'}}><h2 style={{marginTop:0}}>🖨️ Print Tokens</h2><p style={{color:'#666', marginBottom:'30px'}}>Select which group to print on Thermal Printer.</p><div style={{display:'flex', flexDirection:'column', gap:'15px'}}><button onClick={()=>handleBulkPrint('ALL')} style={{padding:'15px', background:'#28a745', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}}>PRINT ALL</button><div style={{display:'flex', gap:'15px'}}><button onClick={()=>handleBulkPrint('Male')} style={{flex:1, padding:'15px', background:'#007bff', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>MALES ONLY</button><button onClick={()=>handleBulkPrint('Female')} style={{flex:1, padding:'15px', background:'#e91e63', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>FEMALES ONLY</button></div></div><button onClick={()=>setShowBulkModal(false)} style={{marginTop:'30px', background:'none', border:'none', color:'#999', textDecoration:'underline', cursor:'pointer'}}>Cancel</button></div></div>)}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', width:'600px', borderRadius:'10px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Full Name</label><input style={styles.input} value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})} /></div><div><label>Conf No</label><input style={styles.input} value={editingStudent.conf_no||''} onChange={e=>setEditingStudent({...editingStudent, conf_no:e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Room No</label><input style={styles.input} value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} /></div><div><label>Dining Seat</label><input style={styles.input} value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} /></div><div><label>Pagoda Cell</label><input style={styles.input} value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} /></div></div><div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}><h4 style={{marginTop:0}}>Manual Locker Override</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Mobile</label><input style={styles.input} value={editingStudent.mobile_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, mobile_locker_no:e.target.value})} /></div><div><label>Valuables</label><input style={styles.input} value={editingStudent.valuables_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, valuables_locker_no:e.target.value})} /></div><div><label>Laundry</label><input style={styles.input} value={editingStudent.laundry_token_no||''} onChange={e=>setEditingStudent({...editingStudent, laundry_token_no:e.target.value})} /></div><div><label>Dhamma Hall Seat</label><input style={styles.input} value={editingStudent.dhamma_hall_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dhamma_hall_seat_no:e.target.value})} /></div></div></div><div style={{textAlign:'right'}}><button onClick={()=>setEditingStudent(null)} style={{marginRight:'10px', padding:'8px 16px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>Cancel</button><button type="submit" style={{padding:'8px 16px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Save Changes</button></div></form></div></div>)}
    </div>
  );
}
