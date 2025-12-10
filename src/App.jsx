import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-staging.onrender.com"; // Ensure this matches your Staging Backend URL
const ADMIN_PASSCODE = "11111"; 

// --- UTILS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"]);

const getShortCourseName = (name) => {
  if (!name) return 'Unknown';
  if (name.includes('45-Day')) return '45D';
  if (name.includes('30-Day')) return '30D';
  if (name.includes('20-Day')) return '20D';
  if (name.includes('10-Day')) return '10D';
  if (name.includes('Satipatthana')) return 'ST';
  if (name.includes('Gratitude')) return 'GT';
  if (name.includes('Service')) return 'SVC';
  if (name.includes('Children')) return 'CHILD';
  if (name.includes('Teen')) return 'TEEN';
  return 'OTH';
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);
    fetchCourses();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      setLoginError('❌ Incorrect Passcode');
      setPinInput('');
    }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('admin_auth'); setView('dashboard'); };
  
  const fetchCourses = () => { 
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => { console.error(err); setError("Connection Error: Could not load courses."); }); 
  };

  const handleRoomClick = (roomNo) => {
    setPreSelectedRoom(roomNo);
    setView('onboarding');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Center Admin</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Enter Passcode" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', textAlign: 'center' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Unlock</button>
          </form>
          {loginError && <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold' }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-hide { display: none; } }`}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Zero Day Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>AT Panel</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Global Accommodation</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Student Onboarding</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- 0. AT PANEL (Fixed: Allow Editing) ---
function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleLocalChange = (field, value) => {
    setEditingStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent)
    });
    setEditingStudent(null);
  };

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  const filtered = participants
    .filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        const valA = a.conf_no || '';
        const valB = b.conf_no || '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  return (
    <div style={cardStyle}>
      <h2>AT Panel</h2>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <input style={inputStyle} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
      </div>
      {courseId && (
        <div style={{maxHeight:'500px', overflowY:'auto'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}>
               <th style={{padding:'10px'}}>Name</th>
               <th style={{padding:'10px', cursor:'pointer', userSelect:'none'}} onClick={toggleSort}>Conf {sortOrder==='asc'?'▲':'▼'}</th>
               <th style={{padding:'10px'}}>Special SEAT</th><th style={{padding:'10px'}}>Evening Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>
               {filtered.map(p => (
                 <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                   <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td>
                   <td style={{padding:'10px'}}>{p.conf_no}</td>
                   <td style={{padding:'10px'}}>{p.special_seating || '-'}</td>
                   <td style={{padding:'10px', color: p.evening_food ? '#e65100' : '#ccc'}}>{p.evening_food || '-'}</td>
                   <td style={{padding:'10px', color: p.medical_info ? '#c62828' : '#ccc'}}>{p.medical_info || '-'}</td>
                   <td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={quickBtnStyle(true)}>✏️ Detail</button></td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
      {editingStudent && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
          <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}>
            <h3>Update Details: {editingStudent.full_name}</h3>
            <form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
               <div><label style={labelStyle}>Special Seating</label><select style={inputStyle} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
               <div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option><option value="Other">Other</option></select></div>
               <div><label style={labelStyle}>Medical Info</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleLocalChange('medical_info', e.target.value)} /></div>
               <div><label style={labelStyle}>Teacher Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} /></div>
               <div style={{marginTop:'10px', textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false)}}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Done & Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 1. ZERO DAY DASHBOARD ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); }, [selectedCourse]);

  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }, { name: 'Cancelled', Male: stats.cancelled_m, Female: stats.cancelled_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }, { name: 'Server', Male: stats.sm, Female: stats.sf }] : [];
  const attendanceString = courses.map(c => { const total = (c.arrived || 0) + (c.pending || 0); const pct = total > 0 ? Math.round((c.arrived || 0) / total * 100) : 0; return `${getShortCourseName(c.course_name)}: ${c.arrived}/${total} (${pct}%)`; }).join("  ✦  ");

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2>
        <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      </div>
      <div style={{background:'#e3f2fd', color:'#333', padding:'8px', marginBottom:'20px', overflow:'hidden', whiteSpace:'nowrap', borderRadius:'4px', border:'1px solid #90caf9', fontWeight:'bold', fontSize:'14px'}}><marquee>{attendanceString || "Loading Course Data..."}</marquee></div>
      {stats && selectedCourse ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Discourse Count</h3>{stats.languages && stats.languages.length > 0 ? (<div style={{maxHeight:'250px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Lang</th><th style={{width:'30px'}}>M</th><th style={{width:'30px'}}>F</th><th style={{textAlign:'right'}}>Tot</th></tr></thead><tbody>{stats.languages.map((l, i) => (<tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}><td style={{padding:'4px 0'}}>{l.discourse_language}</td><td style={{padding:'4px 0', color:'#007bff'}}>{l.male_count}</td><td style={{padding:'4px 0', color:'#e91e63'}}>{l.female_count}</td><td style={{padding:'4px 0', textAlign:'right'}}>{l.total}</td></tr>))}</tbody></table></div>) : <p style={{color:'#888'}}>No data.</p>}</div>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Live Counts</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course to view stats.</p>}
    </div>
  );
}

// --- 2. GLOBAL ACCOMMODATION MANAGER (Fixed: Failsafe Swap & ID) ---
function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [editingRoom, setEditingRoom] = useState(null);
  const [filterCourseId, setFilterCourseId] = useState('');

  const loadData = () => { 
    setLoading(true); 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => { setOccupancy(Array.isArray(data) ? data : []); setLoading(false); }); 
  };
  
  useEffect(loadData, []);

  const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); setNewRoom({ ...newRoom, roomNo: '' }); loadData(); };
  const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) return alert("🚫 Cannot delete original room!"); if(window.confirm("Delete this room?")) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };

  // --- SMART SWAP LOGIC ---
  const updateParticipantRoom = async (student, roomNo) => {
      const id = student.participant_id || student.id;
      if (!id) throw new Error("Missing Participant ID. Cannot update.");
      await fetch(`${API_URL}/participants/${id}`, { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...student, room_no: roomNo || null }) 
      });
  };

  const handleSwapSave = async () => { 
      if (!editingRoom || !editingRoom.p) return;
      const targetRoomNo = editingRoom.newRoomNo.trim();
      if(!targetRoomNo) return alert("Please enter the Target Room Number.");
      
      const normalize = (s) => s ? s.replace(/[\s-]+/g, '').toUpperCase() : '';
      const targetNorm = normalize(targetRoomNo);
      const currentNorm = normalize(editingRoom.p.room_no);

      if (targetNorm === currentNorm) { alert("Target room is the same as current room!"); return; }

      const targetOccupant = occupancy.find(p => p.room_no && normalize(p.room_no) === targetNorm);
      const currentStudent = editingRoom.p;
      const currentId = currentStudent.participant_id || currentStudent.id;
      
      if(targetOccupant) {
          const targetId = targetOccupant.participant_id || targetOccupant.id;
          if (String(targetId) === String(currentId)) { setEditingRoom(null); return; }
      }

      try {
          if (targetOccupant) {
              if(!window.confirm(`⚠️ Room ${targetRoomNo} is occupied by ${targetOccupant.full_name}.\n\nConfirm SWAP between:\n1. ${currentStudent.full_name}\n2. ${targetOccupant.full_name}?`)) return;
              await updateParticipantRoom(currentStudent, null);
              await new Promise(r => setTimeout(r, 500)); 
              await updateParticipantRoom(targetOccupant, currentStudent.room_no);
              await new Promise(r => setTimeout(r, 500)); 
              await updateParticipantRoom(currentStudent, targetRoomNo);
          } else {
              await updateParticipantRoom(currentStudent, targetRoomNo);
          }
          setEditingRoom(null); 
          loadData();
      } catch (err) { console.error(err); alert("Error processing request: " + err.message); loadData(); }
  };

  const normalize = (str) => str ? str.replace(/[\s-]+/g, '').toUpperCase() : '';
  const occupiedMap = {}; 
  const safeRooms = rooms || []; 
  (occupancy || []).forEach(p => { if(p.room_no) occupiedMap[normalize(p.room_no)] = p; });

  const maleRooms = safeRooms.filter(r => r.gender_type === 'Male'); 
  const femaleRooms = safeRooms.filter(r => r.gender_type === 'Female');
  let maleFree = 0, maleOcc = 0, maleOther = 0;
  let femaleFree = 0, femaleOcc = 0, femaleOther = 0;
  
  safeRooms.forEach(r => { 
      const occupant = occupiedMap[normalize(r.room_no)];
      const isMale = r.gender_type === 'Male';
      if (!occupant) { if(isMale) maleFree++; else femaleFree++; } 
      else {
          const isMatch = !filterCourseId || (String(occupant.course_id) === String(filterCourseId));
          if (isMatch) { if(isMale) maleOcc++; else femaleOcc++; } else { if(isMale) maleOther++; else femaleOther++; }
      }
  });

  const toggleMaintenance = async (room, e) => {
    e.stopPropagation(); 
    const newIsMaintenance = !room.is_maintenance;
    if(!window.confirm(`Mark room ${room.room_no} as ${newIsMaintenance ? "Maintenance" : "Available"}?`)) return;
    try { await fetch(`${API_URL}/rooms/${room.room_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_maintenance: newIsMaintenance }) }); loadData(); } catch (err) { console.error(err); }
  };

  const renderRoom = (room, gender) => {
    const occupant = occupiedMap[normalize(room.room_no)];
    const isOccupied = !!occupant;
    const isMaintenance = room.is_maintenance === true;
    let isDimmed = false;
    if (filterCourseId && isOccupied) { if (String(occupant.course_id) !== String(filterCourseId)) isDimmed = true; }
    let bgColor = gender === 'Male' ? '#e3f2fd' : '#fce4ec'; 
    let borderColor = gender === 'Male' ? '#90caf9' : '#f48fb1';
    if (isMaintenance) { bgColor = '#e0e0e0'; borderColor = '#9e9e9e'; } 
    else if (isOccupied) {
        const isArrived = occupant.status === 'Arrived';
        const isOld = occupant.conf_no && (occupant.conf_no.startsWith('O') || occupant.conf_no.startsWith('S'));
        bgColor = isOld ? '#e1bee7' : '#c8e6c9'; borderColor = isOld ? '#8e24aa' : '#2e7d32';
        if (!isArrived) { bgColor = '#fff3e0'; borderColor = '#ffb74d'; }
        if (isDimmed) { bgColor = '#f5f5f5'; borderColor = '#ddd'; }
    }
    const boxStyle = { border: `1px solid ${borderColor}`, background: bgColor, borderRadius: '6px', padding: '8px', textAlign: 'center', minHeight: '80px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: (isOccupied || !isMaintenance) ? 'pointer' : 'not-allowed', position: 'relative', opacity: isMaintenance || isDimmed ? 0.6 : 1 };
    return ( 
      <div key={room.room_id} onClick={() => !isMaintenance && (isOccupied ? setEditingRoom({ p: occupant, newRoomNo: '' }) : onRoomClick(room.room_no))} style={boxStyle}> 
           <div style={{fontWeight:'bold', fontSize:'13px', color: isDimmed ? '#999' : '#333'}}> {room.room_no} {isMaintenance && <span style={{display:'block', fontSize:'9px', color:'red'}}>🛠️ MAINT</span>} </div>
           {isOccupied && !isMaintenance && ( <div style={{fontSize:'11px', color: isDimmed ? '#999' : '#333', marginTop:'4px'}}> <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px'}}>{(occupant.full_name || '').split(' ')[0]}</div> <div style={{fontWeight:'bold', fontSize:'9px'}}>({occupant.conf_no})</div> </div> )}
           {!isOccupied && !isMaintenance && <div style={{fontSize:'9px', color: gender==='Male'?'#1565c0':'#ad1457', marginTop:'4px'}}>FREE</div>}
           <button onClick={(e) => toggleMaintenance(room, e)} style={{position:'absolute', bottom:'2px', right:'2px', fontSize:'10px', background:'none', border:'none', cursor:'pointer', opacity:0.5}}>🛠️</button>
           {!isOccupied && !PROTECTED_ROOMS.has(room.room_no) && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(room.room_id, room.room_no)}} style={{position:'absolute', top:'2px', right:'2px', color:'#ccc', border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>x</button>} 
      </div> 
    );
  };

  return ( 
    <div style={cardStyle}> 
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}> 
        <h2 style={{margin:0}}>🛏️ Global Accommodation</h2> 
        <select style={{width:'200px', padding:'10px', borderRadius:'6px', border:'2px solid #007bff', fontWeight:'bold'}} value={filterCourseId} onChange={e => setFilterCourseId(e.target.value)}><option value="">-- SHOW ALL COURSES --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}> <div style={{display:'flex', gap:'5px', alignItems:'center', background:'#f9f9f9', padding:'5px', borderRadius:'5px', border:'1px solid #eee'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'70px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px', fontSize:'11px'}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> </div> 
      </div> 
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'20px'}}> 
        <div style={{padding:'12px', background:'#e3f2fd', borderRadius:'8px', borderLeft:'5px solid #1565c0'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#1565c0', marginBottom:'5px'}}>MALE WING</div> <div style={{fontSize:'12px'}}>Free: <b>{maleFree}</b> | Occupied: <b>{maleOcc}</b> {maleOther > 0 && <span style={{color:'#888'}}>(+ {maleOther} other)</span>}</div> </div> 
        <div style={{padding:'12px', background:'#fce4ec', borderRadius:'8px', borderLeft:'5px solid #ad1457'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#ad1457', marginBottom:'5px'}}>FEMALE WING</div> <div style={{fontSize:'12px'}}>Free: <b>{femaleFree}</b> | Occupied: <b>{femaleOcc}</b> {femaleOther > 0 && <span style={{color:'#888'}}>(+ {femaleOther} other)</span>}</div> </div> 
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> 
        <div style={{border:'1px solid #90caf9', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#e3f2fd', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> 
        <div style={{border:'1px solid #f48fb1', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#fce4ec', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> 
      </div>
      {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter target room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update / Swap</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} 
    </div> 
  );
}
// --- 4. MANAGE STUDENTS (Crash-Proof: Safe Data Handling) ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewingStudent, setViewingStudent] = useState(null); 
  const [viewAllMode, setViewAllMode] = useState(false); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [swappingSeat, setSwappingSeat] = useState(null); 
  const [newSeatNo, setNewSeatNo] = useState('');
  const [assignProgress, setAssignProgress] = useState(''); 
  const [selectedSeat, setSelectedSeat] = useState(null);

  // --- HELPERS (Safe String Handling) ---
  const getCategory = (seatNo) => { if (!seatNo) return '-'; const s = String(seatNo).toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF')) return 'Old'; if (s.startsWith('NM') || s.startsWith('NF')) return 'New'; if (s.startsWith('SM') || s.startsWith('SF')) return 'DS'; return 'New'; };
  const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = String(confNo).toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 0; if (s.startsWith('N')) return 1; return 2; };
  const parseCourses = (str) => { if (!str) return { s: 0, l: 0 }; const s = str.match(/S\s*[:=-]?\s*(\d+)/i); const l = str.match(/L\s*[:=-]?\s*(\d+)/i); return { s: sMatch ? parseInt(sMatch[1]) : 0, l: lMatch ? parseInt(lMatch[1]) : 0 }; };
  const getSeniorityScore = (p) => { const c = parseCourses(p.courses_info || ''); return (c.l * 10000) + (c.s * 10); };

  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);
  
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  
  const downloadCSV = (headers, rows, filename) => {
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
  };
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Age", "Gender", "Dining", "Room", "Dhamma Seat", "Status"]; const rows = participants.map(p => [`"${p.full_name || ''}"`, p.conf_no || '', p.age || '', p.gender || '', p.dining_seat_no || '', p.room_no || '', p.dhamma_hall_seat_no || '', p.status || '']); downloadCSV(headers, rows, `master_${courseId}.csv`); };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Arrived'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.discourse_language || '']); downloadCSV(headers, rows, `dining_${courseId}.csv`); };
  const handleSeatingExport = () => { const seated = participants.filter(p => p.dhamma_hall_seat_no); if (seated.length === 0) return alert("No seats."); const headers = ["Seat", "Name", "Gender", "Conf No", "Status"]; const rows = seated.map(p => [p.dhamma_hall_seat_no, `"${p.full_name || ''}"`, p.gender || '', p.conf_no || '', p.status || '']); downloadCSV(headers, rows, `hall_${courseId}.csv`); };

  const sortedList = React.useMemo(() => { 
      let sortableItems = [...participants].filter(p => p); // Filter nulls
      if (sortConfig.key) { 
          sortableItems.sort((a, b) => { 
              const valA = (a[sortConfig.key] || '').toString().toLowerCase(); 
              const valB = (b[sortConfig.key] || '').toString().toLowerCase(); 
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; 
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; 
              return 0; 
          }); 
      } 
      return sortableItems.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); 
  }, [participants, sortConfig, search]);

  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleCancelStudent = async (student) => { if (!window.confirm("Cancel Student?")) return; const updatedData = { ...student, status: 'Cancelled', room_no: null, dining_seat_no: null, dhamma_hall_seat_no: null }; await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) }); loadStudents(); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleSeatSwapSave = async () => { if (!swappingSeat || !swappingSeat.p) return; await fetch(`${API_URL}/participants/${swappingSeat.p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...swappingSeat.p, dhamma_hall_seat_no: newSeatNo }) }); setSwappingSeat(null); loadStudents(); };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };

  // --- AUTO-ASSIGN ---
  const handleAutoAssign = async () => {
    if (!window.confirm("⚡ Auto-Assign Seats?\n(Overwriting existing assignments)")) return;
    setAssignProgress('Preparing...');
    const M_COLS=10, M_ROWS=8; const F_COLS=7, F_ROWS=7;
    const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
    const allP = await res.json();
    
    // STRICT Filter: Must have Conf No
    const cleanP = allP.filter(p => p.status !== 'Cancelled' && p.conf_no && p.conf_no.trim() !== '' && !p.conf_no.toUpperCase().startsWith('S') && !(p.full_name || '').includes('(AT)'));
    
    const males = cleanP.filter(p => (p.gender || '').toLowerCase().startsWith('m'));
    const females = cleanP.filter(p => (p.gender || '').toLowerCase().startsWith('f'));
    
    const sortStrategy = (list) => {
        const oldS = list.filter(p => getCategoryRank(p.conf_no) === 0).sort((a,b) => getSeniorityScore(b) - getSeniorityScore(a));
        const newS = list.filter(p => getCategoryRank(p.conf_no) !== 0).sort((a,b) => (parseInt(b.age)||0) - (parseInt(a.age)||0)); 
        return [...oldS, ...newS];
    };
    const sortedMales = sortStrategy(males); const sortedFemales = sortStrategy(females); const updates = [];
    
    sortedMales.forEach((p, i) => { if (i < M_COLS * M_ROWS) { const row = Math.floor(i / M_COLS) + 1; const col = i % M_COLS; updates.push({ ...p, dhamma_hall_seat_no: `${String.fromCharCode(74 - col)}${row}` }); } });
    sortedFemales.forEach((p, i) => { if (i < F_COLS * F_ROWS) { const row = Math.floor(i / F_COLS) + 1; const col = i % F_COLS; updates.push({ ...p, dhamma_hall_seat_no: `${String.fromCharCode(65 + col)}${row}` }); } });
    
    setAssignProgress(`Assigning 0 / ${updates.length}...`);
    const BATCH_SIZE = 5;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })));
        setAssignProgress(`Assigning ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length}...`);
        await new Promise(r => setTimeout(r, 50)); 
    }
    setAssignProgress(''); alert(`✅ Assignment Complete! Assigned ${updates.length} students.\n(Ignored students with missing Conf No)`); loadStudents();
  };

  // --- CLICK-TO-MOVE ---
  const handleSeatClick = async (seatLabel, student) => {
      if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); } 
      else {
          const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null); 
          if (source.label === target.label) return; 
          const isSourceMale = source.p && (source.p.gender || '').toLowerCase().startsWith('m');
          if (!source.p) return; 
          if (target.p) { const isTargetMale = (target.p.gender || '').toLowerCase().startsWith('m'); if (isSourceMale !== isTargetMale) return alert(`⛔ Action Blocked: Gender mismatch.`); }
          if (!target.p) {
              if (!window.confirm(`Move ${source.p.full_name} to ${target.label}?`)) return;
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label}) });
          } else {
              if (!window.confirm(`Swap Seats?\n1. ${source.p.full_name}\n2. ${target.p.full_name}`)) return;
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP'}) });
              await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label}) });
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label}) });
          }
          loadStudents();
      }
  };

  const printSection = (sectionId) => { const style = document.createElement('style'); style.innerHTML = `@media print { @page { size: A3 landscape; margin: 5mm; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`; document.head.appendChild(style); window.print(); document.head.removeChild(style); };

  if (viewAllMode) { return ( <div style={{background:'white', padding:'20px'}}> <div className="no-print" style={{marginBottom:'20px'}}><button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button><button onClick={handleExport} style={{...quickBtnStyle(true), marginLeft:'10px'}}>Export CSV</button></div> <h2>Master List</h2> <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Seat</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.dhamma_hall_seat_no}</td></tr>))}</tbody></table> </div> ); }
  
  if (viewMode === 'dining') { 
      const arrived = participants.filter(p => p.status==='Arrived');
      const sorter = (a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return String(a.dining_seat_no || '0').localeCompare(String(b.dining_seat_no || '0'), undefined, { numeric: true }); };
      const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={handleDiningExport} style={quickBtnStyle(true)}>CSV</button> <button onClick={() => printSection(sectionId)} style={{...quickBtnStyle(true), background: color, color:'white'}}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Dining</h2> <table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr><th style={thPrint}>Seat</th><th style={thPrint}>Name</th><th style={thPrint}>Cat</th><th style={thPrint}>Room</th></tr></thead><tbody>{list.map(p=>(<tr key={p.participant_id}><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{getCategory(p.conf_no)}</td><td style={tdStyle}>{p.room_no}</td></tr>))}</tbody></table> </div> );
      return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-m")} {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-f")} </div> );
  }

  if (viewMode === 'seating') { 
    const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.dhamma_hall_seat_no && p.status!=='Cancelled'); const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.dhamma_hall_seat_no && p.status!=='Cancelled'); const maleMap = {}; males.forEach(p => maleMap[p.dhamma_hall_seat_no] = p); const femaleMap = {}; females.forEach(p => femaleMap[p.dhamma_hall_seat_no] = p);
    
    // SAFE SEATBOX: Handles missing/null data without crashing
    const SeatBox = ({ p, label }) => { const isSelected = selectedSeat && selectedSeat.label === label; const isOld = p && getCategoryRank(p.conf_no) === 0; return ( <div onClick={() => handleSeatClick(label, p)} style={{border: isSelected ? '3px solid gold' : '1px solid #ccc', background: p ? (isOld ? '#fff9c4' : 'white') : '#f0f0f0', height:'60px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:'pointer', position:'relative'}}> {p ? (<><div style={{fontWeight:'bold', fontSize:'13px', color: '#007bff'}}>{p.dhamma_hall_seat_no}</div><div style={{overflow:'hidden', textOverflow:'ellipsis', width:'90%', whiteSpace:'nowrap'}}>{(p.full_name||'Unknown').split(' ')[0]}</div><div style={{fontSize:'9px'}}>{p.conf_no}</div></>) : <span style={{color:'#ccc'}}>{label}</span>} </div> ); };
    
    const renderGrid = (map, cols, rows, reverseX) => { let grid = []; for (let r = 0; r < rows; r++) { let cells = []; for (let c = 0; c < cols; c++) { const colChar = reverseX ? String.fromCharCode(74 - c) : String.fromCharCode(65 + c); const label = `${colChar}${r+1}`; cells.push(<SeatBox key={label} p={map[label]} label={label} />); } grid.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'4px', marginBottom:'4px'}}>{cells}</div>); } return grid; };
    const renderSpecial = (map, r1, r2) => ( <div style={{marginTop:'15px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}> <h4 style={{textAlign:'center', margin:'5px', color:'#666'}}>Chowky / Chair</h4> <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'4px', marginBottom:'4px'}}>{Array.from({length:8}, (_,i)=><SeatBox key={`${r1}${i+1}`} p={map[`${r1}${i+1}`]} label={`${r1}${i+1}`} />)}</div> <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'4px', marginBottom:'4px'}}>{Array.from({length:8}, (_,i)=><SeatBox key={`${r2}${i+1}`} p={map[`${r2}${i+1}`]} label={`${r2}${i+1}`} />)}</div> </div> );
    return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}> <button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> {assignProgress && <span style={{color:'green', fontWeight:'bold'}}>{assignProgress}</span>} <div style={{fontSize:'12px', background:'#fff3cd', padding:'5px 10px', borderRadius:'4px'}}>💡 Click a seat to Move/Swap</div> <button onClick={handleSeatingExport} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>CSV</button> <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800', color:'white'}}>⚡ Auto-Assign</button> </div> </div> <div className="print-area" style={{display:'flex', gap:'20px'}}> <div id="print-male" style={{flex:1}}> <div className="no-print" style={{textAlign:'right'}}><button onClick={()=>printSection("print-male")} style={{...quickBtnStyle(true), background:'#007bff', color:'white'}}>Print Male</button></div> <h3 style={{textAlign:'center', background:'#e3f2fd', borderBottom:'3px solid #007bff'}}>MALE (J ← A)</h3> {renderGrid(maleMap, 10, 8, true)} {renderSpecial(maleMap, 'K', 'L')} </div> <div id="print-female" style={{flex:1}}> <div className="no-print" style={{textAlign:'right'}}><button onClick={()=>printSection("print-female")} style={{...quickBtnStyle(true), background:'#e91e63', color:'white'}}>Print Female</button></div> <h3 style={{textAlign:'center', background:'#fce4ec', borderBottom:'3px solid #e91e63'}}>FEMALE (A → G)</h3> {renderGrid(femaleMap, 7, 7, false)} {renderSpecial(femaleMap, 'H', 'I')} </div> </div> </div> );
  }

  // --- DEFAULT TABLE VIEW ---
  return ( <div style={cardStyle}> 
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
          <div style={{display:'flex', gap:'10px'}}>
              <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
              <input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} />
          </div>
          <div style={{display:'flex', gap:'5px'}}>
              <button onClick={handleAutoNoShow} disabled={!courseId} style={{...quickBtnStyle(true), background:'#d32f2f', color:'white'}}>🚫 No-Shows</button>
              <button onClick={handleSendReminders} disabled={!courseId} style={{...quickBtnStyle(true), background:'#ff9800', color:'white'}}>📢 Reminders</button>
              <button onClick={() => setViewAllMode(true)} disabled={!courseId} style={{...quickBtnStyle(true), background:'#6c757d', color:'white'}}>👁️ View All</button>
              <button onClick={handleExport} disabled={!courseId} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>📥 Export</button>
              <button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining</button>
              <button onClick={() => setViewMode('seating')} disabled={!courseId} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🧘 Dhamma Hall</button>
          </div>
      </div>
      
      {courseId && (<div style={{background:'#fff5f5', border:'1px solid #feb2b2', padding:'10px', borderRadius:'5px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{color:'#c53030', fontWeight:'bold', fontSize:'13px'}}>⚠️ Admin Zone:</span><div><button onClick={handleResetCourse} style={{background:'#e53e3e', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', marginRight:'10px', fontSize:'12px'}}>Reset Data</button><button onClick={handleDeleteCourse} style={{background:'red', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Delete Course</button></div></div>)}
      
      {/* SAFE TABLE RENDER */}
      <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}>{['full_name','conf_no','courses_info','age','gender','dining_seat_no','dining_seat_type','room_no','pagoda_cell_no','status'].map(k=><th key={k} style={{...tdStyle, cursor:'pointer'}} onClick={()=>handleSort(k)}>{k.replace('_',' ').toUpperCase()}{sortConfig.key===k?(sortConfig.direction==='asc'?'▲':'▼'):''}</th>)}<th style={tdStyle}>ACTIONS</th></tr></thead><tbody>{sortedList.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{['F','Floor'].includes(p.dining_seat_type) ? 'Floor' : 'Chair'}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.pagoda_cell_no}</td><td style={{...tdStyle, color: p.status==='Arrived'?'green':'orange'}}>{p.status}</td><td style={tdStyle}><button onClick={() => setBadgeStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>🪪</button><button onClick={() => setViewingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>👁️</button><button onClick={() => setEditingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={() => handleCancelStudent(p)} style={{marginRight:'5px', cursor:'pointer', color:'orange'}}>🚫</button><button onClick={() => handleDelete(p.participant_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div>
      
      {viewingStudent && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px'}}> <h3>👤 Student Details</h3> <p><strong>Name:</strong> {viewingStudent.full_name}</p> <p><strong>Conf No:</strong> {viewingStudent.conf_no}</p> <p><strong>Status:</strong> {viewingStudent.status}</p> <p><strong>Room:</strong> {viewingStudent.room_no}</p> <p><strong>Dining:</strong> {viewingStudent.dining_seat_no} ({viewingStudent.dining_seat_type})</p> <button onClick={()=>setViewingStudent(null)} style={{marginTop:'20px', width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none', borderRadius:'5px'}}>Close</button> </div> </div> )}
      {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}><label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e => setEditingStudent({...editingStudent, conf_no: e.target.value})} /></div><div><label>Lang</label><input style={inputStyle} value={editingStudent.discourse_language||''} onChange={e => setEditingStudent({...editingStudent, discourse_language: e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Dining Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} /></div><div><label>Dining Type</label><select style={inputStyle} value={editingStudent.dining_seat_type||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_type: e.target.value})}><option value="F">Floor</option><option value="C">Chair</option></select></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Room</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e => setEditingStudent({...editingStudent, room_no: e.target.value})} /></div><div><label>Pagoda</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e => setEditingStudent({...editingStudent, pagoda_cell_no: e.target.value})} /></div></div><label>Seating Type</label><select style={inputStyle} value={editingStudent.special_seating||''} onChange={e => setEditingStudent({...editingStudent, special_seating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="submit" style={{...btnStyle(true), flex:1, background:'#28a745', color:'white'}}>Save</button><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button></div></form></div></div>)}
      {badgeStudent && <BadgeModal student={badgeStudent} onClose={() => setBadgeStudent(null)} />}
  </div> );
}
// --- 5. STORE & FINANCE (Unchanged) ---
function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [studentToken, setStudentToken] = useState(''); const [expenseType, setExpenseType] = useState('Laundry Token'); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [status, setStatus] = useState(''); const [showInvoice, setShowInvoice] = useState(false); const [reportMode, setReportMode] = useState(''); const [financialData, setFinancialData] = useState([]); const [editingId, setEditingId] = useState(null);
  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(console.error); }, [courseId]);
  useEffect(() => { if (selectedStudentId) { const student = participants.find(p => p.participant_id == selectedStudentId); setStudentToken(student ? student.laundry_token_no : ''); fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error); } else { setHistory([]); setStudentToken(''); } }, [selectedStudentId]);
  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); };
  const handleLaundryClick = () => { const label = studentToken ? `Laundry Token ${studentToken}` : `Laundry Token`; setExpenseType(label); setAmount('50'); };
  const handleEditClick = (item) => { setEditingId(item.expense_id); setExpenseType(item.expense_type); setAmount(item.amount); setStatus('✏️ Editing Mode...'); };
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`; const method = editingId ? 'PUT' : 'POST'; const body = editingId ? { expense_type: expenseType, amount } : { courseId, participantId: selectedStudentId, type: expenseType, amount }; try { const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed"); setStatus(editingId ? '✅ Updated!' : '✅ Saved!'); setAmount(''); setEditingId(null); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); } catch (err) { setStatus('❌ Error'); } };
  const handleDeleteExpense = async (id) => { if (!window.confirm("Delete?")) return; await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); };
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0); const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || ''; const currentStudent = participants.find(p => p.participant_id == selectedStudentId);
  if (reportMode === 'invoice' && currentStudent) { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Invoice</button> </div> <div className="print-area" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px'}}> <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}> <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div> <div style={{textAlign: 'right'}}><h3>{currentStudent.full_name}</h3><p>Room: {currentStudent.room_no}</p><p>{selectedCourseName}</p></div> </div> <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}> <thead><tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}><th style={{textAlign: 'left', padding: '10px'}}>Description</th><th style={{textAlign: 'left', padding: '10px'}}>Date</th><th style={{textAlign: 'right', padding: '10px'}}>Amount</th></tr></thead> <tbody> {history.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}> <td style={{padding: '10px'}}>{ex.expense_type}</td> <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td> <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td> </tr> ))} </tbody> </table> <div style={{textAlign: 'right', marginTop: '20px'}}><h3>Total Due: ₹{totalDue}</h3></div> <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div> </div> </div> ); }
  if (reportMode === 'summary') { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Report</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary Report</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Total Due (₹)</th></tr></thead><tbody>{financialData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px'}}><td colSpan={3} style={{padding:'15px', textAlign:'right'}}>GRAND TOTAL:</td><td style={{padding:'15px', textAlign:'right'}}>₹{financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0)}</td></tr> </tbody></table> </div> </div> ); }
  return (
    <div style={cardStyle}>
      <h2>🛒 Store</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select>
        <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)} </select>
        <div style={{background:'#f0f2f5', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}> <label style={{fontSize:'12px', color:'#666', fontWeight:'bold'}}>ASSIGNED LAUNDRY TOKEN:</label> <div style={{fontSize:'18px', fontWeight:'bold', color:'#007bff'}}>{studentToken || '-'}</div> </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}>
          <div><label>Item / Type</label><input list="expense-types" style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} required /><datalist id="expense-types"><option value="Laundry Token" /><option value="Medicine" /><option value="Store Item" /><option value="Donation" /></datalist></div>
          <div><label>Amount (₹)</label><input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        </div>
        <div style={{display:'flex', gap:'5px'}}> <button type="button" onClick={handleLaundryClick} style={quickBtnStyle(false)}>🧺 Laundry (50)</button> <button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={quickBtnStyle(false)}>🧼 Soap (30)</button> </div>
        <div style={{display:'flex', gap:'10px'}}> <button type="submit" style={{...btnStyle(true), flex:1, background: editingId ? '#ffc107' : '#28a745', color: editingId ? 'black' : 'white'}}> {editingId ? 'Update Record' : 'Save Record'} </button> {editingId && <button type="button" onClick={() => {setEditingId(null); setAmount(''); setExpenseType('Laundry Token');}} style={{...btnStyle(false), background:'#6c757d', color:'white'}}>Cancel</button>} </div> {status && <p>{status}</p>}
      </form>
      
      {/* --- BUTTONS ARE HERE (Always visible, disabled if no data) --- */}
      <div style={{marginTop:'30px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
        <h3 style={{marginTop:0, color:'#555'}}>Tools & Reports</h3>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} style={{...quickBtnStyle(!!selectedStudentId), background: selectedStudentId ? '#17a2b8' : '#e2e6ea', color: selectedStudentId ? 'white' : '#999', cursor: selectedStudentId ? 'pointer' : 'not-allowed'}}>🖨️ Print Invoice</button>
          <button onClick={loadFinancialReport} disabled={!courseId} style={{...quickBtnStyle(!!courseId), background: courseId ? '#28a745' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>💰 Course Summary</button>
        </div>
      </div>
      
      {/* History Table */}
      <div style={{marginTop:'20px'}}>
         <h4 style={{marginBottom:'10px'}}>Recent Transactions</h4>
         {history.length === 0 ? ( <p style={{color:'#888', fontSize:'13px'}}>No history found.</p> ) : ( <div style={{maxHeight:'200px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Item</th><th>Date</th><th>₹</th><th></th></tr></thead><tbody>{history.map(h => (<tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'5px'}}>{h.expense_type}</td><td style={{padding:'5px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td><td style={{padding:'5px', fontWeight:'bold'}}>₹{h.amount}</td><td style={{textAlign:'right'}}><button onClick={()=>handleEditClick(h)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={()=>handleDeleteExpense(h.expense_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div> )}
      </div>
    </div>
  );
}
// --- 6. COURSE ADMIN (Update: Smart Upload - Auto-Clean Data) ---
function UploadParticipants({ courses, setView }) { 
  const [courseId, setCourseId] = useState(''); 
  const [csvFile, setCsvFile] = useState(null); 
  const [preview, setPreview] = useState([]); 
  const [status, setStatus] = useState(''); 
  
  const handleFileChange = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    setCsvFile(file); 
    setStatus(''); 
    setPreview([]); 
    
    const reader = new FileReader(); 
    reader.onload = (event) => { 
      const text = event.target.result; 
      if (!text.trim()) { return setStatus("⚠️ Error: Empty CSV file."); }

      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); 
      let headerIndex = -1; let headers = []; 
      
      // 1. Find Header Row (Look for 'name' or 'student')
      for (let i = 0; i < Math.min(lines.length, 20); i++) { 
        const lowerLine = lines[i].toLowerCase();
        if (lowerLine.includes('name') || lowerLine.includes('student')) { 
          headerIndex = i; 
          headers = lines[i].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); 
          break; 
        } 
      } 
      
      if (headerIndex === -1) { setStatus("⚠️ Error: Could not find header row (must contain 'Name' column)."); return; } 
      
      // 2. Map Columns (Fuzzy Match)
      const colMap = {
          name: headers.findIndex(h => h.includes('name') || h.includes('student')),
          conf: headers.findIndex(h => h.includes('conf') || h.includes('id') || h.includes('no')),
          gender: headers.findIndex(h => h.includes('gender') || h.includes('sex')),
          age: headers.findIndex(h => h.includes('age')),
          courses: headers.findIndex(h => h.includes('course') || h.includes('history')),
          phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile')),
          email: headers.findIndex(h => h.includes('email'))
      };

      const dataRows = lines.slice(headerIndex + 1); 
      
      const cleanData = dataRows.map((row, index) => { 
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); 
        if (cols.length <= 1) return null; // Skip empty rows

        // A. Extract Raw Values
        let rawName = colMap.name > -1 ? cols[colMap.name] : 'Unknown';
        let rawConf = colMap.conf > -1 ? cols[colMap.conf] : '';
        let rawGender = colMap.gender > -1 ? cols[colMap.gender] : '';
        let rawAge = colMap.age > -1 ? cols[colMap.age] : '';
        let rawCourses = colMap.courses > -1 ? cols[colMap.courses] : '';
        let rawPhone = colMap.phone > -1 ? cols[colMap.phone] : '';
        let rawEmail = colMap.email > -1 ? cols[colMap.email] : '';

        // B. AUTO-CLEAN LOGIC
        
        // 1. Gender Standardization
        let cleanGender = 'Male'; // Default
        if (rawGender) {
            const g = rawGender.toLowerCase();
            if (g.startsWith('f') || g.includes('girl') || g.includes('woman')) cleanGender = 'Female';
            else if (g.startsWith('m') || g.includes('boy') || g.includes('man')) cleanGender = 'Male';
        }

        // 2. Conf No Generation (The "Crash Preventer")
        // If missing, generate a temp ID based on Gender & Index (e.g. NM-TEMP-1)
        if (!rawConf || rawConf.trim() === '') {
            const prefix = cleanGender === 'Male' ? 'NM-TEMP' : 'NF-TEMP';
            rawConf = `${prefix}-${index + 1}`;
        }

        // 3. Courses Info (Ensure it's not null)
        if (!rawCourses) rawCourses = "S:0 L:0";

        return { 
          name: rawName, 
          confNo: rawConf, 
          gender: cleanGender, 
          age: rawAge, 
          courses: rawCourses, 
          phone: rawPhone, 
          email: rawEmail 
        }; 
      }).filter(r => r && r.name && r.name !== 'Unknown'); 

      setPreview(cleanData); 
      setStatus(`✅ Ready! Processed ${cleanData.length} students.\n(Auto-generated IDs for students missing Conf No)`); 
    }; 
    reader.readAsText(file); 
  };

  const handleUpload = async () => { 
    if (!courseId) return alert("Select course"); 
    setStatus('Uploading...'); 
    try { 
      const res = await fetch(`${API_URL}/courses/${courseId}/import`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ students: preview }) 
      }); 
      if (!res.ok) throw new Error("Failed"); 
      setStatus(`✅ Added ${preview.length} students.`); 
      setTimeout(() => setView('onboarding'), 2000); 
    } catch (err) { setStatus("❌ " + err.message); } 
  };

  return ( 
    <div>
      <h3>Upload CSV (Auto-Cleaning Enabled)</h3>
      <div style={{maxWidth:'500px'}}>
        <div style={{marginBottom:'10px'}}><label>Select Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
        <div style={{marginBottom:'10px'}}><input type="file" accept=".csv" onChange={handleFileChange} /></div>
        {status && <div style={{padding:'15px', background: status.includes('Error') ? '#f8d7da' : '#e3f2fd', color: status.includes('Error') ? '#721c24' : '#0c5460', borderRadius:'4px', marginBottom:'10px', whiteSpace:'pre-wrap', fontWeight: status.includes('Error') ? 'bold' : 'normal'}}>{status}</div>}
        <button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc', cursor: preview.length>0?'pointer':'not-allowed'}}>Upload Cleaned Data</button>
      </div>
    </div> 
  );
}


// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
