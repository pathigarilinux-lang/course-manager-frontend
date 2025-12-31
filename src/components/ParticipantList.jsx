import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle, Filter, Save, Plus, Minus, User, Tag, Download, Database, Wand2, X, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { API_URL, styles } from '../config';
import DhammaHallLayout from './DhammaHallLayout'; 

// --- 1. DATA HELPERS ---
const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
const getStatusColor = (s) => { if (s === 'Attending') return '#28a745'; if (s === 'Gate Check-In') return '#ffc107'; if (s === 'Cancelled' || s === 'No-Show') return '#dc3545'; return '#6c757d'; };

// ✅ UPGRADED SCORING ENGINE
const parseCourseScore = (infoStr, isTenDayMode = false) => {
    if (!infoStr) return 0;
    const cleanStr = infoStr.toString().toUpperCase().replace(/[^A-Z0-9\s\-\:]/g, ' '); 

    if (isTenDayMode) {
        if (!isNaN(cleanStr.trim()) && cleanStr.trim().length > 0) return parseInt(cleanStr.trim());
        let totalCount = 0;
        const keywords = ['10D', 'STP', 'SAT', '20D', '30D', '45D', '60D', 'TSC', 'SVC', 'OLD'];
        keywords.forEach(kw => {
            const matchA = cleanStr.match(new RegExp(`${kw}\\s*[:=-]?\\s*(\\d+)`, 'i'));
            const matchB = cleanStr.match(new RegExp(`(\\d+)\\s*[xX]?\\s*${kw}`, 'i'));
            if (matchA) totalCount += parseInt(matchA[1]);
            else if (matchB) totalCount += parseInt(matchB[1]);
        });
        return totalCount;
    }

    const WEIGHTS = { '60D': 1_000_000_000_000, '45D': 10_000_000_000, '30D': 100_000_000, '20D': 1_000_000, 'STP': 10_000, '10D': 100, 'TSC': 1 };
    let score = 0;
    const getCount = (keyword) => {
        const matchA = cleanStr.match(new RegExp(`${keyword}\\s*[:=-]?\\s*(\\d+)`, 'i'));
        if (matchA) return parseInt(matchA[1]);
        const matchB = cleanStr.match(new RegExp(`(\\d+)\\s*[xX]?\\s*${keyword}`, 'i'));
        if (matchB) return parseInt(matchB[1]);
        return 0;
    };
    Object.keys(WEIGHTS).forEach(k => { score += getCount(k) * WEIGHTS[k]; });
    // Catch aliases
    score += (getCount('10-DAY') || getCount('TEN')) * WEIGHTS['10D'];
    score += (getCount('SAT') || getCount('SATI')) * WEIGHTS['STP'];
    score += (getCount('SVC') || getCount('SERV')) * WEIGHTS['TSC'];
    return score;
};

const getStudentStats = (p, isTenDayMode) => { 
    if (!p) return { cat: '', s: 0, l: 0, age: '' }; 
    const conf = (p.conf_no || '').toUpperCase(); 
    const isOld = conf.startsWith('O') || conf.startsWith('S'); 
    const cat = isOld ? '(O)' : '(N)'; 
    const score = parseCourseScore(p.courses_info, isTenDayMode);
    return { cat, s: score, age: p.age || '?' }; 
};

const calculatePriorityScore = (p, isTenDayMode) => { 
    let score = parseCourseScore(p.courses_info, isTenDayMode);
    const cat = getCategory(p.conf_no);
    if (cat === 'OLD') score += 50; 
    score += (parseInt(p.age) || 0) / 100; 
    return score; 
};

// --- 2. PRINTING HELPERS ---
const THERMAL_CSS = `<style>@page { size: 72mm auto; margin: 0; } body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; } .ticket-container { width: 70mm; margin: 0 auto; padding-top: 5mm; padding-bottom: 5mm; page-break-after: always; } .ticket-container:last-child { page-break-after: auto; } .ticket-box { border: 3px solid #000; border-radius: 8px; padding: 10px; width: 64mm; margin: 0 auto; text-align: center; box-sizing: border-box; } .header { font-size: 14px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; } .seat { font-size: 55px; font-weight: 900; line-height: 1; margin: 5px 0; } .name { font-size: 15px; font-weight: bold; margin: 5px 0; word-wrap: break-word; line-height: 1.2; } .conf { font-size: 12px; color: #333; margin-bottom: 10px; } .footer { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; } .stats { font-size: 10px; margin-top: 5px; border-top: 1px dashed #ccc; padding-top: 5px; display: flex; justify-content: space-between; } </style>`;

const getTokenHtml = (student) => {
    const t = { seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no || '-', room: student.room_no || '-' };
    const s = getStudentStats(student);
    return `<div class="ticket-container"><div class="ticket-box"><div class="header">DHAMMA SEAT</div><div class="seat">${t.seat}</div><div class="name">${t.name}</div><div class="conf">${t.conf}</div><div class="footer"><span>Cell: ${t.cell}</span><span>Room: ${t.room}</span></div><div class="stats"><span>${s.cat}</span><span>Age: ${s.age}</span></div></div></div>`;
};

const printViaIframe = (fullHtml) => {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open(); doc.write(fullHtml); doc.close();
    iframe.onload = () => {
        try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch(e) { console.error(e); }
        setTimeout(() => { if(document.body.contains(iframe)) document.body.removeChild(iframe); }, 2000);
    };
};

const printCurrentView = (cssStyles) => {
    const style = document.createElement('style');
    style.innerHTML = cssStyles;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
};

// --- 3. SUB-COMPONENTS ---
const renderCell = (id, p, gender, selectedSeat, handleSeatClick) => {
    const shouldShow = p && (p.gender||'').toLowerCase().startsWith(gender.toLowerCase().charAt(0));
    const displayP = shouldShow ? p : null;
    const isSel = selectedSeat?.label === id;
    const stats = getStudentStats(displayP, false); 
    
    // ✅ 1. HIGHLIGHT OLD STUDENTS LOGIC
    const isOld = displayP && stats.cat === '(O)';
    const bg = displayP ? (isSel ? '#ffeb3b' : (isOld ? '#e1bee7' : 'white')) : 'white'; // Purple Tint for Old
    const border = isOld ? '3px solid #7b1fa2' : '1px solid black'; // Thick Purple Border for Old

    return (
        <div key={id} onClick={()=>handleSeatClick(id, displayP, gender)} className="seat-box" style={{ border: border, background: bg, width: '130px', height: '95px', fontSize: '10px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxSizing: 'border-box' }}>
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
                    <span>{stats.cat}</span><span>Sc:{stats.s}</span><span>Age:({stats.age})</span>
                </div>
            ) : ( <div style={{flex:1}}></div> )}
            {displayP && displayP.is_seat_locked && <div style={{position:'absolute', bottom:'25px', left:'2px', fontSize:'10px'}}>🔒</div>}
        </div>
    );
};

const SeatingSheet = ({ id, title, map, orderedCols, rows, setRows, setRegCols, setSpecCols, gender, selectedSeat, handleSeatClick, courseId, courses, participants, seatingConfig, onOpenSettings }) => {
    const courseObj = courses.find(c=>c.course_id==courseId);
    // ✅ Clean Course Name for Print
    const courseName = courseObj ? courseObj.course_name.split('/')[0].trim() : 'COURSE';
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
                    <button onClick={onOpenSettings} style={styles.quickBtn(false)}>⚙️ Settings</button>
                    <button onClick={()=>printCurrentView(`@media print { @page { size: A3 landscape; margin: 5mm; } html, body { height: 100%; margin: 0; padding: 0; } body * { visibility: hidden; } #${id}, #${id} * { visibility: visible; } #${id} { position: fixed; left: 0; top: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; transform: scale(0.9); transform-origin: center top; } .no-print { display: none !important; } .seat-grid { border-top: 2px solid black; border-left: 2px solid black; } .seat-box { border-right: 2px solid black; border-bottom: 2px solid black; } }`)} style={styles.quickBtn(true)}>🖨️ Print</button> 
                </div> 
            </div> 
            <div style={{textAlign:'center', marginBottom:'20px'}}> 
                <h1 style={{margin:'0 0 5px 0', fontSize:'28px', fontWeight:'bold', textTransform:'uppercase'}}>SEATING PLAN - {gender.toUpperCase()}</h1> 
                <div style={{fontSize:'16px', fontWeight:'bold', color:'#333', marginBottom:'5px'}}>Old: {oldCnt} + New: {newCnt} = Total: {oldCnt + newCnt}</div>
                <h3 style={{margin:0, fontSize:'16px', fontWeight:'bold'}}>{courseName} / {dateRange}</h3> 
            </div> 
            <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content', borderTop:'2px solid black', borderLeft:'2px solid black'}}> {renderGrid()} </div> </div> 
            <div style={{display:'flex', justifyContent:'center', marginTop:'40px'}}> <div style={{textAlign:'center', width:'100%'}}> <div style={{border:'2px dashed black', padding:'15px', fontWeight:'900', fontSize:'32px', letterSpacing:'2px', textTransform:'uppercase', margin:'0 auto', maxWidth:'600px', background:'white'}}>{gender.toUpperCase()} TEACHER</div></div> </div> 
        </div> 
    );
};
const getAlphabetRange = (startIdx, count) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(startIdx, startIdx + count);
const generateChowkyLabels = (startIdx, count) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(startIdx, startIdx + count).map(l => `CW-${l}`);

// --- MAIN COMPONENT ---
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
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false); 
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [showVisualHall, setShowVisualHall] = useState(false); 
  
  // ✅ 2. AUTO-ASSIGN FILTER STATE
  const [assignFilter, setAssignFilter] = useState('BOTH'); // 'BOTH', 'MALE', 'FEMALE'

  const [isSyncing, setIsSyncing] = useState(false);

  const defaultConfig = { mCols: 10, mRows: 10, mChowky: 2, fCols: 7, fRows: 10, fChowky: 2 };
  const [seatingConfig, setSeatingConfig] = useState(defaultConfig);
  const [printConfig, setPrintConfig] = useState({ scale: 0.9, orientation: 'landscape', paper: 'A3' });
  const [draftConfig, setDraftConfig] = useState(null);

  // --- DERIVE 10-DAY MODE ---
  const selectedCourse = courses.find(c => String(c.course_id) === String(courseId));
  const isTenDayCourse = useMemo(() => {
      if (!selectedCourse) return false;
      const name = (selectedCourse.course_name || '').toUpperCase();
      return name.includes('10-DAY') || name.includes('10 DAY') || name.includes('10D');
  }, [selectedCourse]);

  // --- LOADING & AUTO-SYNC ---
  useEffect(() => { 
      if (courseId) {
          const fetchP = async (background = false) => {
              if(!background) setIsSyncing(true);
              try {
                  const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
                  const data = await res.json();
                  setParticipants(Array.isArray(data) ? data : []);
              } catch(e) { console.error(e); }
              if(!background) setIsSyncing(false);
          };
          fetchP(); 
          const interval = setInterval(() => fetchP(true), 5000);
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
          return () => clearInterval(interval);
      } 
  }, [courseId]);

  const openAutoAssignModal = () => {
      setDraftConfig({ ...seatingConfig }); 
      setAssignFilter('BOTH'); // Reset filter on open
      setShowAutoAssignModal(true);
  };

  const processedList = useMemo(() => { 
      let items = [...participants]; 
      if (filterType !== 'ALL') { items = items.filter(p => { 
          const cat = getCategory(p.conf_no); 
          if (filterType === 'OLD') return cat === 'OLD'; 
          if (filterType === 'NEW') return cat === 'NEW'; 
          if (filterType === 'MED') return (p.medical_info && p.medical_info.trim() !== ''); 
          if (filterType === 'MALE') return (p.gender||'').toLowerCase().startsWith('m'); 
          if (filterType === 'FEMALE') return (p.gender||'').toLowerCase().startsWith('f'); 
          if (filterType === 'COURSE') return (p.courses_info && p.courses_info.trim() !== '');
          return true; 
      }); }
      if (search) items = items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase()) || (p.conf_no || '').toLowerCase().includes(search.toLowerCase()));
      if (sortConfig.key) { 
          items.sort((a, b) => { 
              let valA, valB;
              if (['age', 'dining_seat_no', 'pagoda_cell_no', 'laundry_token_no'].includes(sortConfig.key)) { 
                  valA = parseInt(a[sortConfig.key]) || 0; 
                  valB = parseInt(b[sortConfig.key]) || 0; 
              } 
              else if (sortConfig.key === 'courses_info') {
                  valA = parseCourseScore(a.courses_info, isTenDayCourse);
                  valB = parseCourseScore(b.courses_info, isTenDayCourse);
                  if (sortConfig.direction === 'asc') return valA - valB; 
                  else return valB - valA;
              }
              else { 
                  valA = (a[sortConfig.key] || '').toString().toLowerCase(); 
                  valB = (b[sortConfig.key] || '').toString().toLowerCase(); 
              } 
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; 
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; 
              return 0; 
          }); 
      } 
      return items; 
  }, [participants, sortConfig, search, filterType, isTenDayCourse]);

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

  const handleSort = (key) => { 
      let direction = 'asc'; 
      if(key === 'courses_info') direction = 'desc'; 
      if (sortConfig.key === key && sortConfig.direction === direction) {
          direction = direction === 'asc' ? 'desc' : 'asc';
      }
      setSortConfig({ key, direction }); 
  };

  const handleBulkPrint = (filter) => { 
      let valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no); 
      if (filter === 'Male') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('m')); 
      if (filter === 'Female') valid = valid.filter(p => (p.gender||'').toLowerCase().startsWith('f')); 
      if (valid.length === 0) return alert("No students found."); 
      const sortedStudents = valid.sort((a,b) => a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true}));
      const fullHtml = `<html><head><title>Tokens</title>${THERMAL_CSS}</head><body>${sortedStudents.map(getTokenHtml).join('')}</body></html>`;
      printViaIframe(fullHtml);
  };
  
  const handleSingleToken = (student) => { 
      if (!student.dhamma_hall_seat_no) return alert("No seat assigned. Assign a seat in the column first."); 
      const fullHtml = `<html><head><title>Tokens</title>${THERMAL_CSS}</head><body>${getTokenHtml(student)}</body></html>`;
      printViaIframe(fullHtml);
  };

  const printA4List = (sectionId) => { 
      const css = `@media print { @page { size: A4 portrait; margin: 10mm; } html, body { margin: 0; padding: 0; background: white; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: absolute; left: 0; top: 0; width: 100%; box-sizing: border-box; border: 2px solid black !important; padding: 10px !important; margin: 0; } .no-print { display: none !important; } table { width: 100%; border-collapse: collapse; font-family: 'Helvetica', sans-serif; font-size: 10pt; margin-top: 10px; table-layout: fixed; } th, td { border: 1px solid black !important; padding: 6px; text-align: left; word-wrap: break-word; } th { background-color: #f0f0f0 !important; font-weight: bold; text-transform: uppercase; -webkit-print-color-adjust: exact; } h2, h3 { text-align: center; color: black !important; margin: 5px 0; } }`;
      printCurrentView(css);
  };

  const saveLayoutConfig = () => { localStorage.setItem(`layout_${courseId}`, JSON.stringify(seatingConfig)); alert("✅ Layout Configuration Saved!"); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };
  const handleExport = () => { if (participants.length === 0) return alert("No data to export."); const courseObj = courses.find(c => String(c.course_id) === String(courseId)); let courseName = courseObj ? courseObj.course_name.split('/')[0].trim().replace(/\s+/g, '-') : `Course-${courseId}`; const fileName = `${courseName}_Master-Data.xlsx`; const headers = ["Name", "Conf No", "Courses Info", "Age", "Gender", "Room", "Dining Seat", "Pagoda", "Dhamma Seat", "Status", "Mobile Locker", "Valuables Locker", "Laundry Token", "Language"]; const getRows = (list) => list.map(p => [p.full_name, p.conf_no, p.courses_info, p.age, p.gender, p.room_no, p.dining_seat_no, p.pagoda_cell_no, p.dhamma_hall_seat_no, p.status, p.mobile_locker_no, p.valuables_locker_no, p.laundry_token_no, p.discourse_language]); const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m')); const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f')); const wb = XLSX.utils.book_new(); if (males.length > 0) { const ws = XLSX.utils.aoa_to_sheet([headers, ...getRows(males)]); XLSX.utils.book_append_sheet(wb, ws, "Male"); } if (females.length > 0) { const ws = XLSX.utils.aoa_to_sheet([headers, ...getRows(females)]); XLSX.utils.book_append_sheet(wb, ws, "Female"); } XLSX.writeFile(wb, fileName); };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Pagoda Cell", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.pagoda_cell_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `dining_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handlePagodaExport = () => { const assigned = participants.filter(p => p.status === 'Attending' && p.pagoda_cell_no); if (assigned.length === 0) return alert("No pagoda assignments found."); const headers = ["Cell", "Name", "Conf", "Gender", "Room", "Dining Seat"]; const rows = assigned.sort((a,b) => String(a.pagoda_cell_no).localeCompare(String(b.pagoda_cell_no), undefined, {numeric:true})).map(p => [p.pagoda_cell_no, `"${p.full_name || ''}"`, p.conf_no, p.gender, p.room_no, p.dining_seat_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `pagoda_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleSeatingExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Name", "Conf", "Gender", "Pagoda", "Room"]; const rows = arrived.map(p => [p.dhamma_hall_seat_no || '', `"${p.full_name || ''}"`, p.conf_no || '', p.gender || '', p.pagoda_cell_no || '', p.room_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `seating_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const prepareReceipt = (student) => { const courseObj = courses.find(c => c.course_id == student.course_id) || courses.find(c => c.course_id == courseId); setPrintReceiptData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Teacher', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, seatNo: student.dining_seat_no, lockers: student.mobile_locker_no || student.dining_seat_no, language: student.discourse_language, pagoda: student.pagoda_cell_no && student.pagoda_cell_no !== 'None' ? student.pagoda_cell_no : null, special: student.special_seating && student.special_seating !== 'None' ? student.special_seating : null }); setTimeout(() => window.print(), 500); };
  const handleSeatClick = async (seatLabel, student, genderContext) => { if (!selectedSeat) { if(student) { const studentGender = (student.gender || '').toLowerCase(); if(genderContext && !studentGender.startsWith(genderContext.toLowerCase().charAt(0))) { return alert(`⛔ Cannot pick a ${student.gender} student from the ${genderContext} seating plan.`); } } setSelectedSeat({ label: seatLabel, p: student, gender: genderContext }); return; } const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null); if(genderContext && source.gender && genderContext !== source.gender) { return alert("⛔ Invalid Swap: Cannot move student between Male and Female sides."); } if (source.label === target.label) return; if (window.confirm(`Swap ${source.label} ↔️ ${target.label}?`)) { if (source.p && !target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } else if (!source.p && target.p) { await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); } else if (source.p && target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); } };

  const handleAutoScaleGrid = () => {
      const { m, f } = seatingStats; 
      const maxStudents = Math.max(m.chowky + m.std, f.chowky + f.std);
      let calculatedRows = Math.ceil(maxStudents / 8); 
      if (calculatedRows < 8) calculatedRows = 8;      
      if (calculatedRows > 14) calculatedRows = 14;    

      const calcCols = (need) => Math.ceil(need / calculatedRows);
      const mChowkyCols = calcCols(m.chowky) || 1; 
      const mStdCols = calcCols(m.std) + 1;        
      const fChowkyCols = calcCols(f.chowky) || 1;
      const fStdCols = calcCols(f.std) + 1;

      setDraftConfig({
          ...draftConfig,
          mRows: calculatedRows, mChowky: mChowkyCols, mCols: mStdCols,
          fRows: calculatedRows, fChowky: fChowkyCols, fCols: fStdCols
      });
  };

  const handleAutoAssign = async () => {
      const modeText = isTenDayCourse ? "10-DAY MODE (Score Sum)" : "LONG COURSE MODE (Hierarchy)";
      // ✅ Show Filter Info in Alert
      const filterText = assignFilter === 'BOTH' ? 'ALL Students' : `${assignFilter} Students ONLY`;
      if (!window.confirm(`⚠️ Auto-Assigning in ${modeText} for ${filterText}. This will overwrite unlocked seats. Continue?`)) return;
      
      setSeatingConfig(draftConfig);
      localStorage.setItem(`layout_${courseId}`, JSON.stringify(draftConfig));

      setIsAssigning(true);
      setShowAutoAssignModal(false);
      try {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const allP = await res.json();
          const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre)));
          const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m'));
          const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f'));
          
          const cfg = draftConfig; 

          const genSeats = (cols, rows) => { let s = []; if(!cols || !Array.isArray(cols)) return []; for(let r=1; r<=rows; r++) { cols.forEach(c => s.push(c + r)); } return s; };
          const mRegSeats = genSeats(getAlphabetRange(0, cfg.mCols), cfg.mRows);
          const mSpecSeats = genSeats(generateChowkyLabels(cfg.mCols, cfg.mChowky), cfg.mRows);
          const fRegSeats = genSeats(getAlphabetRange(0, cfg.fCols), cfg.fRows);
          const fSpecSeats = genSeats(generateChowkyLabels(cfg.fCols, cfg.fChowky), cfg.fRows);
          
          const assignGroup = (students, regSeats, specSeats) => {
              const updates = [];
              const lockedSeats = new Set();
              students.forEach(p => { if (p.is_seat_locked && p.dhamma_hall_seat_no) lockedSeats.add(p.dhamma_hall_seat_no); });
              let availReg = regSeats.filter(s => !lockedSeats.has(s));
              let availSpec = specSeats.filter(s => !lockedSeats.has(s));
              
              const toAssign = students.filter(p => !p.is_seat_locked)
                 .sort((a,b) => calculatePriorityScore(b, isTenDayCourse) - calculatePriorityScore(a, isTenDayCourse));
              
              const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating));
              const normalGroup = toAssign.filter(p => !specGroup.includes(p));

              specGroup.forEach(p => { 
                  if (availSpec.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availSpec.shift() }); 
                  else if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); 
              });

              const oldStudents = normalGroup.filter(p => getCategory(p.conf_no) === 'OLD');
              const newStudents = normalGroup.filter(p => getCategory(p.conf_no) !== 'OLD');

              oldStudents.forEach(p => { if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); });

              availReg.sort((a, b) => {
                  const colA = a.replace(/[0-9]/g, '');
                  const colB = b.replace(/[0-9]/g, '');
                  const rowA = parseInt(a.replace(/[^\d]/g, ''));
                  const rowB = parseInt(b.replace(/[^\d]/g, ''));
                  if (colA < colB) return -1;
                  if (colA > colB) return 1;
                  return rowA - rowB;
              });

              newStudents.forEach(p => { if (availReg.length > 0) updates.push({ ...p, dhamma_hall_seat_no: availReg.shift() }); });

              return updates;
          };
          
          // ✅ 2. APPLY FILTER LOGIC
          const allUpdates = [];
          if (assignFilter === 'BOTH' || assignFilter === 'MALE') {
              allUpdates.push(...assignGroup(males, mRegSeats, mSpecSeats));
          }
          if (assignFilter === 'BOTH' || assignFilter === 'FEMALE') {
              allUpdates.push(...assignGroup(females, fRegSeats, fSpecSeats));
          }

          if (allUpdates.length === 0) { alert("✅ No new assignments needed."); setIsAssigning(false); return; }
          const BATCH_SIZE = 5;
          for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) { await Promise.all(allUpdates.slice(i, i + BATCH_SIZE).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }))); }
          alert(`✅ Assigned seats to ${allUpdates.length} students.`);
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

  // ... (Summary, Dining, Pagoda sections unchanged for brevity, but full component provided)
  
  // ✅ RENDER RETURN (Truncated for readability, but fully functional logic provided above)
  
  if (showSummaryReport) {
      // ... same code ...
      const arrived = participants.filter(p => p.status === 'Attending');
      const getCount = (gender, type) => arrived.filter(p => { const g = (p.gender || '').toLowerCase().startsWith(gender); const c = (p.conf_no || '').toUpperCase(); if (type === 'OLD') return g && (c.startsWith('O') || c.startsWith('S')); if (type === 'NEW') return g && c.startsWith('N'); return false; }).length;
      return ( <div style={styles.card}> <div className="no-print"><button onClick={() => setShowSummaryReport(false)} style={styles.btn(false)}>← Back</button><button onClick={() => window.print()} style={{...styles.toolBtn('#007bff'), marginLeft:'10px'}}>Print PDF</button></div> <div className="print-area" id="print-summary" style={{padding:'20px'}}> <h2 style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px'}}>COURSE SUMMARY REPORT</h2> <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><div><strong>Centre Name:</strong> Dhamma Nagajjuna 2</div><div><strong>Course Date:</strong> {courses.find(c=>c.course_id==courseId)?.start_date}</div></div> <h3 style={{background:'#eee', padding:'5px'}}>COURSE DETAILS</h3> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'20px'}}><thead><tr style={{background:'#f0f0f0'}}><th rowSpan="2" style={{padding:'10px',border:'1px solid black'}}>Category</th><th colSpan="2" style={{padding:'10px',border:'1px solid black'}}>INDIAN</th><th colSpan="2" style={{padding:'10px',border:'1px solid black'}}>FOREIGNER</th><th rowSpan="2" style={{padding:'10px',border:'1px solid black'}}>TOTAL</th></tr><tr style={{background:'#f0f0f0'}}><th style={{padding:'10px',border:'1px solid black'}}>OLD</th><th style={{padding:'10px',border:'1px solid black'}}>NEW</th><th style={{padding:'10px',border:'1px solid black'}}>OLD</th><th style={{padding:'10px',border:'1px solid black'}}>NEW</th></tr></thead><tbody><tr><td style={{padding:'10px',border:'1px solid black'}}>MALE</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('m', 'OLD')}</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('m', 'NEW')}</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}><strong>{getCount('m', 'OLD') + getCount('m', 'NEW')}</strong></td></tr><tr><td style={{padding:'10px',border:'1px solid black'}}>FEMALE</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('f', 'OLD')}</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('f', 'NEW')}</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}><strong>{getCount('f', 'OLD') + getCount('f', 'NEW')}</strong></td></tr><tr style={{background:'#f0f0f0', fontWeight:'bold'}}><td style={{padding:'10px',border:'1px solid black'}}>TOTAL</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('m', 'OLD') + getCount('f', 'OLD')}</td><td style={{padding:'10px',border:'1px solid black'}}>{getCount('m', 'NEW') + getCount('f', 'NEW')}</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}>0</td><td style={{padding:'10px',border:'1px solid black'}}>{arrived.length}</td></tr></tbody></table> </div> </div> );
  }

  if (viewMode === 'dining') { 
      const arrived = participants.filter(p => p.status==='Attending'); 
      const renderDiningTable = (list, title, color, sectionId) => {
        const sortedList = sortParticipants(list, diningSort.key, diningSort.direction);
        const handleSortClick = (key) => { const dir = (diningSort.key === key && diningSort.direction === 'asc') ? 'desc' : 'asc'; setDiningSort({ key, direction: dir }); };
        return ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={() => printA4List(sectionId)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>Print {title} (A4)</button> </div> <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Dining List</h2> <h3 style={{textAlign:'center', marginTop:0, marginBottom:'20px', color:'#555'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}> <thead> <tr style={{background:'#f0f0f0'}}> <th style={{padding:'10px', border:'1px solid black'}}>S.N.</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('dining_seat_no')}>SEAT {diningSort.key==='dining_seat_no' && (diningSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Name</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('category')}>CAT {diningSort.key==='category' && (diningSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Room</th> <th style={{padding:'10px', border:'1px solid black'}}>Pagoda</th> </tr> </thead> <tbody> {sortedList.map((p,i)=>( <tr key={p.participant_id}> <td style={{padding:'10px', border:'1px solid black'}}>{i+1}</td> <td style={{padding:'10px', border:'1px solid black', fontWeight:'bold'}}>{p.dining_seat_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.full_name}</td> <td style={{padding:'10px', border:'1px solid black'}}>{getCategory(p.conf_no)}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.room_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.pagoda_cell_no}</td> </tr> ))} </tbody> </table> </div> );
      };
      return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}> <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> <button onClick={handleDiningExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Dining CSV</button> </div> {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff", "pd-m")} {renderDiningTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63", "pd-f")} </div> ); 
  }
  
  if (viewMode === 'pagoda') { 
      const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); 
      const renderPagodaTable = (list, title, color, sectionId) => {
        const sortedList = sortParticipants(list, pagodaSort.key, pagodaSort.direction);
        const handleSortClick = (key) => { const dir = (pagodaSort.key === key && pagodaSort.direction === 'asc') ? 'desc' : 'asc'; setPagodaSort({ key, direction: dir }); };
        return ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={() => printA4List(sectionId)} style={{...styles.toolBtn(color), marginLeft:'10px'}}>Print {title} (A4)</button> </div> <h2 style={{color:color, textAlign:'center', marginBottom:'5px'}}>{title} Pagoda Cell List</h2> <h3 style={{textAlign:'center', marginTop:0, marginBottom:'20px', color:'#555'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}> <thead> <tr style={{background:'#f0f0f0'}}> <th style={{padding:'10px', border:'1px solid black'}}>S.N.</th> <th style={{padding:'10px', border:'1px solid black', cursor:'pointer'}} onClick={()=>handleSortClick('pagoda_cell_no')}>CELL {pagodaSort.key==='pagoda_cell_no' && (pagodaSort.direction==='asc' ? '▲' : '▼')}</th> <th style={{padding:'10px', border:'1px solid black'}}>Name</th> <th style={{padding:'10px', border:'1px solid black'}}>Cat</th> <th style={{padding:'10px', border:'1px solid black'}}>Room</th> <th style={{padding:'10px', border:'1px solid black'}}>Dining</th> </tr> </thead> <tbody> {sortedList.map((p,i)=>( <tr key={p.participant_id}> <td style={{padding:'10px', border:'1px solid black'}}>{i+1}</td> <td style={{padding:'10px', border:'1px solid black', fontWeight:'bold'}}>{p.pagoda_cell_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.full_name}</td> <td style={{padding:'10px', border:'1px solid black'}}>{getCategory(p.conf_no)}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.room_no}</td> <td style={{padding:'10px', border:'1px solid black'}}>{p.dining_seat_no}</td> </tr> ))} </tbody> </table> </div> );
      };
      return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}> <button onClick={() => setViewMode('list')} style={styles.btn(false)}>← Back</button> <button onClick={handlePagodaExport} style={{...styles.quickBtn(true), background:'#28a745', color:'white'}}>📥 Export Pagoda CSV</button> </div> {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')), "MALE", "#007bff", "pd-m")} {renderPagodaTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')), "FEMALE", "#e91e63", "pd-pf")} </div> ); 
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
                      <button onClick={handleSeatingExport} style={{...styles.quickBtn(true), background:'#6c757d', color:'white'}}>CSV</button> 
                      <button onClick={openAutoAssignModal} style={{...styles.btn(true), background:'#ff9800', color:'white'}}><Settings size={16}/> Auto-Assign</button> 
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
                      onOpenSettings={()=>setShowPrintSettings(true)}
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
                      onOpenSettings={()=>setShowPrintSettings(true)}
                  /> 
              </div> 
              {showPrintSettings && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'300px'}}><h3>🖨️ Print Settings</h3><div style={{marginBottom:'15px'}}><label style={styles.label}>Paper Size</label><select style={styles.input} value={printConfig.paper} onChange={e=>setPrintConfig({...printConfig, paper:e.target.value})}><option>A4</option><option>A3</option><option>Letter</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Orientation</label><select style={styles.input} value={printConfig.orientation} onChange={e=>setPrintConfig({...printConfig, orientation:e.target.value})}><option>landscape</option><option>portrait</option></select></div><div style={{marginBottom:'15px'}}><label style={styles.label}>Scale (Zoom)</label><input type="range" min="0.5" max="1.5" step="0.1" value={printConfig.scale} onChange={e=>setPrintConfig({...printConfig, scale:e.target.value})} style={{width:'100%'}}/><div style={{textAlign:'center', fontSize:'12px'}}>{Math.round(printConfig.scale*100)}%</div></div><div style={{textAlign:'right'}}><button onClick={()=>setShowPrintSettings(false)} style={styles.btn(true)}>Done</button></div></div></div>)} 
              
              {showAutoAssignModal && draftConfig && (
                  <div style={{position:'fixed', top:'80px', right:'20px', width:'350px', background:'white', boxShadow:'0 10px 30px rgba(0,0,0,0.2)', border:'2px solid #333', borderRadius:'12px', zIndex:5000, padding:'20px', maxHeight:'80vh', overflowY:'auto'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                          <h3 style={{margin:0}}>🛠️ Auto-Assign</h3>
                          <button onClick={()=>setShowAutoAssignModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
                      </div>
                      
                      {/* ✅ 3. ADDED FILTER UI IN MODAL */}
                      <div style={{background:'#e3f2fd', padding:'10px', borderRadius:'8px', marginBottom:'15px', border:'1px solid #90caf9'}}>
                          <label style={{...styles.label, marginBottom:'8px'}}>ASSIGNMENT TARGET:</label>
                          <div style={{display:'flex', gap:'5px'}}>
                              <button onClick={()=>setAssignFilter('BOTH')} style={{...styles.quickBtn(assignFilter==='BOTH'), flex:1}}>Both</button>
                              <button onClick={()=>setAssignFilter('MALE')} style={{...styles.quickBtn(assignFilter==='MALE'), flex:1}}>Male Only</button>
                              <button onClick={()=>setAssignFilter('FEMALE')} style={{...styles.quickBtn(assignFilter==='FEMALE'), flex:1}}>Female Only</button>
                          </div>
                      </div>
                      
                      <div style={{background:'#f0f8ff', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #cce5ff'}}>
                          <h4 style={{margin:'0 0 10px 0', fontSize:'14px', color:'#0056b3'}}>Requirements Overview</h4>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                              <div><div style={{fontWeight:'bold', color:'#007bff', fontSize:'12px'}}>MALE</div><div style={{fontSize:'11px'}}>Chowky: {seatingStats.m.chowky}</div><div style={{fontSize:'11px'}}>Std: {seatingStats.m.std}</div></div>
                              <div><div style={{fontWeight:'bold', color:'#e91e63', fontSize:'12px'}}>FEMALE</div><div style={{fontSize:'11px'}}>Chowky: {seatingStats.f.chowky}</div><div style={{fontSize:'11px'}}>Std: {seatingStats.f.std}</div></div>
                          </div>
                      </div>

                      <div style={{marginBottom:'20px'}}>
                          <div style={{marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px dashed #ddd'}}>
                              <h4 style={{margin:'0 0 5px 0', color:'#007bff'}}>Male Side</h4>
                              <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}><label style={{...styles.label, flex:1}}>Std Cols</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.mCols} onChange={e=>setDraftConfig({...draftConfig, mCols: parseInt(e.target.value)||0})} /></div>
                              <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}><label style={{...styles.label, flex:1}}>Chowky Cols</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.mChowky} onChange={e=>setDraftConfig({...draftConfig, mChowky: parseInt(e.target.value)||0})} /></div>
                              <div style={{display:'flex', gap:'5px'}}><label style={{...styles.label, flex:1}}>Rows</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.mRows} onChange={e=>setDraftConfig({...draftConfig, mRows: parseInt(e.target.value)||0})} /></div>
                          </div>
                          <div>
                              <h4 style={{margin:'0 0 5px 0', color:'#e91e63'}}>Female Side</h4>
                              <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}><label style={{...styles.label, flex:1}}>Std Cols</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.fCols} onChange={e=>setDraftConfig({...draftConfig, fCols: parseInt(e.target.value)||0})} /></div>
                              <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}><label style={{...styles.label, flex:1}}>Chowky Cols</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.fChowky} onChange={e=>setDraftConfig({...draftConfig, fChowky: parseInt(e.target.value)||0})} /></div>
                              <div style={{display:'flex', gap:'5px'}}><label style={{...styles.label, flex:1}}>Rows</label><input type="number" style={{...styles.input, width:'60px'}} value={draftConfig.fRows} onChange={e=>setDraftConfig({...draftConfig, fRows: parseInt(e.target.value)||0})} /></div>
                          </div>
                      </div>

                      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                          <button onClick={handleAutoScaleGrid} style={{background:'#6f42c1', color:'white', border:'none', padding:'10px', borderRadius:'5px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', fontWeight:'bold'}}><Wand2 size={16}/> Auto-Size Grid (Draft)</button>
                          <button onClick={handleAutoAssign} style={isAssigning ? styles.btn(false) : {...styles.btn(true), background:'#28a745', color:'white', justifyContent:'center', padding:'12px'}} disabled={isAssigning}>{isAssigning ? 'Processing...' : 'APPLY & RUN'}</button>
                      </div>
                  </div>
              )}
          </div> 
      ); 
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
         <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
             <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><User size={24}/> Students</h2>
             <select style={{...styles.input, maxWidth:'250px'}} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         </div>
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
              {['ALL', 'OLD', 'NEW', 'MALE', 'FEMALE', 'MED', 'COURSE'].map(type => (
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
              {['S.N.', 'FULL_NAME','CONF_NO','COURSES','AGE','GENDER','ROOM','DINING','PAGODA','DH_SEAT', 'LAUNDRY', 'STATUS'].map(k=><th key={k} style={{padding:'15px', fontWeight:'bold', cursor:'pointer', whiteSpace:'nowrap'}} onClick={()=>handleSort(k.toLowerCase())}>{k.replace(/_/g,' ')}</th>)}
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
                    </td>
                    <td style={{padding:'15px'}}>
                        <span style={{background: cat==='OLD'?'#e3f2fd':'#fff3cd', color: cat==='OLD'?'#0d47a1':'#856404', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'bold', display:'inline-block', minWidth:'40px', textAlign:'center'}}>{p.conf_no}</span>
                    </td>
                    <td style={{padding:'15px', color:'#888', fontSize:'11px', fontWeight:'bold'}}>{p.courses_info || '-'}</td>
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
                          <button onClick={() => handleSingleToken(p)} title="Print Seat Token" style={{padding:'6px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#e65100'}}><Tag size={14}/></button>
                          <button onClick={() => prepareReceipt(p)} title="Print Pass" style={{padding:'6px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#007bff'}}><Printer size={14}/></button>
                          <button onClick={() => handleDelete(p.participant_id)} title="Delete" style={{padding:'6px', background:'white', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', color:'#d32f2f'}}><Trash2 size={14}/></button>
                       </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>
      {courseId && (
          <div style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'20px', display:'flex', gap:'15px', justifyContent:'flex-end'}}>
             <button onClick={handleExport} style={{...styles.quickBtn(false), fontSize:'12px', display:'flex', alignItems:'center', gap:'5px'}}><Download size={14}/> Export Master Data (Excel)</button>
             <button onClick={handleAutoNoShow} style={{...styles.quickBtn(false), fontSize:'12px'}}>🚫 Auto-Flag No-Shows</button>
             <button onClick={handleSendReminders} style={{...styles.quickBtn(false), fontSize:'12px'}}>📢 Send Reminders</button>
             <div style={{width:'1px', background:'#ccc', margin:'0 10px'}}></div>
             {userRole === 'admin' && (
                 <>
                     <button onClick={handleResetCourse} style={{...styles.quickBtn(false), color:'#d32f2f', border:'1px solid #d32f2f', fontSize:'12px'}}>⚠️ Reset Student List</button>
                     <button onClick={handleDeleteCourse} style={{...styles.quickBtn(false), background:'#d32f2f', color:'white', fontSize:'12px'}}>🗑️ Delete Course</button>
                 </>
             )}
          </div>
      )}
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
      {printReceiptData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={()=>setPrintReceiptData(null)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button><div id="receipt-print-area" style={{padding:'15px', border:'4px solid black', fontFamily:'Helvetica, Arial, sans-serif', color:'black', margin:'0 auto', maxWidth:'300px'}}><div style={{textAlign:'center', fontWeight:'bold', marginBottom:'10px'}}><div style={{fontSize:'18px', textTransform:'uppercase'}}>VIPASSANA</div><div style={{fontSize:'11px'}}>International Meditation Center</div><div style={{fontSize:'13px', marginTop:'2px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div><div style={{fontSize:'12px', marginBottom:'10px', lineHeight:'1.4'}}><div><strong>Course:</strong> {printReceiptData.courseName}</div><div><strong>Teacher:</strong> {printReceiptData.teacherName}</div><div><strong>Dates:</strong> {printReceiptData.from} to {printReceiptData.to}</div></div><div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div><div style={{fontSize:'16px', fontWeight:'bold', margin:'10px 0', textTransform:'uppercase'}}><div>{printReceiptData.studentName}</div><div style={{fontSize:'13px', fontWeight:'normal'}}>ID: {printReceiptData.confNo}</div></div><table style={{width:'100%', fontSize:'14px', border:'2px solid black', borderCollapse:'collapse', marginTop:'10px'}}><tbody><tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Room</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center', fontSize:'16px'}}>{printReceiptData.roomNo}</td></tr><tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Dining</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center', fontSize:'16px'}}>{printReceiptData.seatNo}</td></tr><tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Lockers</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.lockers}</td></tr><tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Lang</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.language}</td></tr>{printReceiptData.pagoda && <tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Pagoda</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.pagoda}</td></tr>}{printReceiptData.special && <tr><td style={{border:'2px solid black', padding:'6px', background:'#f0f0f0'}}>Special</td><td style={{border:'2px solid black', padding:'6px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.special}</td></tr>}</tbody></table><div style={{textAlign:'center', fontSize:'10px', fontStyle:'italic', marginTop:'10px'}}>*** Student Copy ***</div></div><div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold'}}>PRINT ID CARD</button></div></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; } @page { size: 80mm auto; margin: 0; } }`}</style></div>}
      {showBulkModal && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px', textAlign:'center'}}><h2 style={{marginTop:0}}>🖨️ Print Tokens</h2><p style={{color:'#666', marginBottom:'30px'}}>Select which group to print on Thermal Printer.</p><div style={{display:'flex', flexDirection:'column', gap:'15px'}}><button onClick={()=>handleBulkPrint('ALL')} style={{padding:'15px', background:'#28a745', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}}>PRINT ALL</button><div style={{display:'flex', gap:'15px'}}><button onClick={()=>handleBulkPrint('Male')} style={{flex:1, padding:'15px', background:'#007bff', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>MALES ONLY</button><button onClick={()=>handleBulkPrint('Female')} style={{flex:1, padding:'15px', background:'#e91e63', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>FEMALES ONLY</button></div></div><button onClick={()=>setShowBulkModal(false)} style={{marginTop:'30px', background:'none', border:'none', color:'#999', textDecoration:'underline', cursor:'pointer'}}>Cancel</button></div></div>)}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', width:'600px', borderRadius:'10px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Full Name</label><input style={styles.input} value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})} /></div><div><label>Conf No</label><input style={styles.input} value={editingStudent.conf_no||''} onChange={e=>setEditingStudent({...editingStudent, conf_no:e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Room No</label><input style={styles.input} value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} /></div><div><label>Dining Seat</label><input style={styles.input} value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} /></div><div><label>Pagoda Cell</label><input style={styles.input} value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} /></div></div><div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}><h4 style={{marginTop:0}}>Manual Locker Override</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Mobile</label><input style={styles.input} value={editingStudent.mobile_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, mobile_locker_no:e.target.value})} /></div><div><label>Valuables</label><input style={styles.input} value={editingStudent.valuables_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, valuables_locker_no:e.target.value})} /></div><div><label>Laundry</label><input style={styles.input} value={editingStudent.laundry_token_no||''} onChange={e=>setEditingStudent({...editingStudent, laundry_token_no:e.target.value})} /></div><div><label>Dhamma Hall Seat</label><input style={styles.input} value={editingStudent.dhamma_hall_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dhamma_hall_seat_no:e.target.value})} /></div></div></div><div style={{textAlign:'right'}}><button onClick={()=>setEditingStudent(null)} style={{marginRight:'10px', padding:'8px 16px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>Cancel</button><button type="submit" style={{padding:'8px 16px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Save Changes</button></div></form></div></div>)}
    </div>
  );
}
