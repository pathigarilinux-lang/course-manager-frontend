import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

// --- CONFIGURATION ---
const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

// --- USERS & ROLES ---
const USERS = {
  "1234": { name: "Super Admin", role: "ADMIN" },
  "1001": { name: "Arrival Desk", role: "ARRIVAL" },
  "1002": { name: "Briefing/Teacher", role: "PROCESS" },
  "1003": { name: "Onboarding", role: "ONBOARDING" }
};

const PERMISSIONS = {
  ADMIN:      ['dashboard', 'flow', 'arrival', 'process', 'onboarding', 'room-view', 'participants', 'expenses', 'course-admin', 'ta-panel'],
  ARRIVAL:    ['arrival', 'flow'],
  PROCESS:    ['process', 'flow', 'ta-panel'],
  ONBOARDING: ['onboarding', 'room-view', 'flow']
};

const DEFAULT_VIEWS = { 
  ADMIN: 'dashboard', 
  ARRIVAL: 'arrival', 
  PROCESS: 'process', 
  ONBOARDING: 'onboarding' 
};

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
  return 'OTH';
};

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('course_user');
    if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch(e) {} }
    fetchCourses();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const u = USERS[pinInput];
    if (u) { setUser(u); localStorage.setItem('course_user', JSON.stringify(u)); setView(DEFAULT_VIEWS[u.role]); }
    else alert("❌ Invalid Passcode");
  };
  const handleLogout = () => { setUser(null); localStorage.removeItem('course_user'); setPinInput(''); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res=>res.ok?res.json():[]).then(setCourses).catch(console.error); };
  const can = (f) => user && PERMISSIONS[user.role]?.includes(f);
  const handleRoomClick = (r) => { setPreSelectedRoom(r); setView('onboarding'); };

  if (!user) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5'}}><div style={{background:'white', padding:'40px', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}><h1>Course Manager</h1><input type="password" placeholder="Passcode" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={inputStyle} /><br/><br/><button onClick={handleLogin} style={{...btnStyle(true), width:'100%', background:'#007bff', color:'white'}}>Login</button></div></div>;

  return (
    <div className="app-container" style={{fontFamily:'Segoe UI', padding:'20px', background:'#f4f7f6', minHeight:'100vh'}}>
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-hide { display: none; } .print-male-only .female-section { display: none; } .print-female-only .male-section { display: none; } }`}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{marginRight:'10px', fontWeight:'bold', borderRight:'2px solid #eee', paddingRight:'10px'}}>👤 {user.name}</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {can('dashboard') && <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>}
          {can('ta-panel') && <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>AT Panel</button>}
          {can('flow') && <button onClick={() => setView('flow')} style={btnStyle(view === 'flow')}>🌊 Live Flow</button>}
          {can('arrival') && <button onClick={() => setView('arrival')} style={btnStyle(view === 'arrival')}>1️⃣ Arrival</button>}
          {can('process') && <button onClick={() => setView('process')} style={btnStyle(view === 'process')}>2️⃣ Briefing</button>}
          {can('onboarding') && <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>3️⃣ Onboarding</button>}
          {can('room-view') && <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Rooms</button>}
          {can('participants') && <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Students</button>}
          {can('expenses') && <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>}
          {can('course-admin') && <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Admin</button>}
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'flow' && <ProcessFlowDashboard courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleUpdate = async (student, field, value) => {
    const updated = { ...student, [field]: value };
    setParticipants(participants.map(p => p.participant_id === student.participant_id ? updated : p));
    await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  };

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  const filtered = participants
    .filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
        const valA = a.conf_no || '';
        const valB = b.conf_no || '';
        return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
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
               <th style={{padding:'10px'}}>Special SEAT</th>
               <th style={{padding:'10px'}}>Evening Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>
               {filtered.map(p => (
                 <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                   <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td>
                   <td style={{padding:'10px'}}>{p.conf_no}</td>
                   <td style={{padding:'10px'}}>
                       <select value={p.special_seating || ''} onChange={(e) => handleUpdate(p, 'special_seating', e.target.value)} style={{padding:'5px', borderRadius:'4px', border:'1px solid #ddd'}}>
                           <option value="">None</option>
                           <option value="Chowky">Chowky</option>
                           <option value="Chair">Chair</option>
                           <option value="BackRest">BackRest</option>
                       </select>
                   </td>
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
            <h3>Update Details</h3>
            <form onSubmit={(e) => { e.preventDefault(); setEditingStudent(null); }} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
               <div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => handleUpdate(editingStudent, 'evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option><option value="Other">Other</option></select></div>
               <div><label style={labelStyle}>Medical Info</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleUpdate(editingStudent, 'medical_info', e.target.value)} /></div>
               <div><label style={labelStyle}>Teacher Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e => handleUpdate(editingStudent, 'teacher_notes', e.target.value)} /></div>
               <div style={{marginTop:'10px', textAlign:'right'}}><button style={{...btnStyle(true), background:'#28a745', color:'white'}}>Done</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); }, [selectedCourse]);
  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }, { name: 'Cancelled', Male: stats.cancelled_m, Female: stats.cancelled_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }, { name: 'Server', Male: stats.sm, Female: stats.sf }] : [];
  const attendanceString = courses.map(c => {
      const total = (c.arrived || 0) + (c.pending || 0);
      const pct = total > 0 ? Math.round((c.arrived || 0) / total * 100) : 0;
      return `${getShortCourseName(c.course_name)}: ${c.arrived}/${total} (${pct}%)`;
  }).join("  ✦  ");
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2>
        <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      </div>
      <div style={{background:'#e3f2fd', color:'#1565c0', padding:'10px', marginBottom:'20px', overflow:'hidden', whiteSpace:'nowrap', borderRadius:'4px', border:'1px solid #90caf9', fontWeight:'bold', fontSize:'14px'}}><marquee>{attendanceString}</marquee></div>
      {stats && selectedCourse ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
          <div style={cardStyle}>
                <h3 style={{marginTop:0}}>Discourse & Occupancy</h3>
                <div style={{display:'flex', justifyContent:'space-around', marginBottom:'15px', paddingBottom:'10px', borderBottom:'1px solid #eee'}}>
                    <div style={{textAlign:'center'}}><div style={{fontSize:'18px', fontWeight:'bold', color:'#2e7d32'}}>{stats.old_students}</div><div style={{fontSize:'12px'}}>Old</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:'18px', fontWeight:'bold', color:'#ef6c00'}}>{stats.new_students}</div><div style={{fontSize:'12px'}}>New</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:'18px', fontWeight:'bold', color:'#1565c0'}}>{stats.servers}</div><div style={{fontSize:'12px'}}>Servers</div></div>
                </div>
                {stats.languages && stats.languages.length > 0 ? (
                  <div style={{maxHeight:'200px', overflowY:'auto'}}>
                  <table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Lang</th><th style={{width:'30px'}}>M</th><th style={{width:'30px'}}>F</th><th style={{textAlign:'right'}}>Tot</th></tr></thead>
                    <tbody>{stats.languages.map((l, i) => (<tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}><td style={{padding:'4px 0'}}>{l.discourse_language}</td><td style={{color:'#007bff'}}>{l.male_count}</td><td style={{color:'#e91e63'}}>{l.female_count}</td><td style={{textAlign:'right'}}>{l.total}</td></tr>))}</tbody></table></div>) : <p style={{color:'#888'}}>No data.</p>}
          </div>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Live Counts</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course to view stats.</p>}
    </div>
  );
}

function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [loading, setLoading] = useState(false); const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); const [editingRoom, setEditingRoom] = useState(null);
  const ACCOM_THEMES = { light: { bg: 'white', text: '#333', maleBg: '#e3f2fd', femBg: '#fce4ec', maleBord: '#90caf9', femBord: '#f48fb1' }, dark: { bg: '#2c3e50', text: '#ecf0f1', maleBg: '#34495e', femBg: '#2c3e50', maleBord: '#5d6d7e', femBord: '#5d6d7e' }, nature: { bg: '#f1f8e9', text: '#1b5e20', maleBg: '#c8e6c9', femBg: '#dcedc8', maleBord: '#81c784', femBord: '#aed581' }, ocean: { bg: '#e0f7fa', text: '#006064', maleBg: '#b2ebf2', femBg: '#e0f2f1', maleBord: '#4dd0e1', femBord: '#80cbc4' } };
  const [theme, setTheme] = useState('light'); const th = ACCOM_THEMES[theme];
  const loadData = () => { setLoading(true); fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => { setOccupancy(Array.isArray(data) ? data : []); setLoading(false); }); };
  useEffect(loadData, []);
  const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); setNewRoom({ ...newRoom, roomNo: '' }); loadData(); };
  const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) return alert("🚫 Cannot delete original room!"); if(window.confirm("Delete this room?")) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };
  const handleSwapSave = async () => { if (!editingRoom || !editingRoom.p) return; await fetch(`${API_URL}/participants/${editingRoom.p.participant_id || editingRoom.p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editingRoom.p, room_no: editingRoom.newRoomNo }) }); setEditingRoom(null); loadData(); };
  const normalize = (str) => str ? str.replace(/[\s-]+/g, '').toUpperCase() : '';
  const occupiedMap = {}; const maleBreakdown = {}; const femaleBreakdown = {};
  const safeRooms = rooms || []; const validRoomSet = new Set(safeRooms.map(r => normalize(r.room_no)));
  (occupancy || []).forEach(p => { if(p.room_no) { const n = normalize(p.room_no); if (validRoomSet.has(n)) { occupiedMap[n] = p; const c = getShortCourseName(p.course_name); const r = safeRooms.find(x=>normalize(x.room_no)===n); if(r?.gender_type==='Male') maleBreakdown[c]=(maleBreakdown[c]||0)+1; else femaleBreakdown[c]=(femaleBreakdown[c]||0)+1; } } });
  const maleRooms = safeRooms.filter(r => r.gender_type === 'Male'); const femaleRooms = safeRooms.filter(r => r.gender_type === 'Female');
  let maleOcc = 0, femaleOcc = 0;
  safeRooms.forEach(r => { if(occupiedMap[normalize(r.room_no)]) { if(r.gender_type==='Male') maleOcc++; else femaleOcc++; } });
  const renderRoom = (room, gender) => {
    const occupant = occupiedMap[normalize(room.room_no)];
    const isOccupied = !!occupant;
    const isArrived = isOccupied && occupant.status === 'Arrived';
    let bgColor = gender === 'Male' ? th.maleBg : th.femBg; let borderColor = gender === 'Male' ? th.maleBord : th.femBord;
    if (isOccupied) { const isOld = occupant.conf_no && (occupant.conf_no.startsWith('O') || occupant.conf_no.startsWith('S')); bgColor = isOld ? '#e1bee7' : '#c8e6c9'; borderColor = isOld ? '#8e24aa' : '#2e7d32'; if (!isArrived) { bgColor = '#fff3e0'; borderColor = '#ffb74d'; } }
    return ( <div key={room.room_id} onClick={() => isOccupied ? setEditingRoom({ p: occupant, newRoomNo: room.room_no }) : onRoomClick(room.room_no)} style={{ border: `1px solid ${borderColor}`, background: bgColor, borderRadius: '6px', padding: '8px', textAlign: 'center', minHeight: '80px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', justifyContent:'center', cursor: isOccupied ? 'pointer' : 'default', position: 'relative', color: th.text }}> <div style={{fontWeight:'bold', fontSize:'13px', color:'#333'}}>{room.room_no}</div> {isOccupied ? ( <div style={{fontSize:'11px', color: '#333', marginTop:'4px'}}> <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px'}}>{(occupant.full_name || '').split(' ')[0]}</div> <div style={{fontWeight:'bold', fontSize:'9px'}}>({occupant.conf_no})</div> <div style={{fontSize:'9px', color:'#555'}}>{getShortCourseName(occupant.course_name)}</div> </div> ) : <div style={{fontSize:'9px', color: gender==='Male'?'#1565c0':'#ad1457', marginTop:'4px'}}>FREE <button onClick={(e)=>{e.stopPropagation(); onRoomClick(room.room_no)}} style={{marginTop:'2px', fontSize:'9px', display:'block', margin:'2px auto', background:'white', color:'#333', border:'1px solid #ccc', borderRadius:'2px', cursor:'pointer', width:'100%'}}>Assign</button></div>} {!isOccupied && !PROTECTED_ROOMS.has(room.room_no) && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(room.room_id, room.room_no)}} style={{position:'absolute', top:'2px', right:'2px', color:'#ccc', border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>x</button>} </div> );
  };
  return ( <div style={{...cardStyle, background: th.bg, color: th.text}}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}> <h2 style={{margin:0}}>🛏️ Global Accommodation Manager</h2> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> <select style={inputStyle} value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option><option value="nature">Nature</option><option value="ocean">Ocean</option></select> <div style={{display:'flex', gap:'5px', alignItems:'center', background:'#f9f9f9', padding:'5px', borderRadius:'5px', border:'1px solid #eee'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'70px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px', fontSize:'11px'}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> <button onClick={() => window.print()} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Status</button> </div> </div> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'20px'}}> <div style={{padding:'12px', background: th.maleBg, borderRadius:'8px', borderLeft:`5px solid ${th.maleBord}`}}> <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>MALE WING (Free: {maleRooms.length - maleOcc})</div> <div style={{fontSize:'11px', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(maleBreakdown).map(([n, c]) => <span key={n} style={{background:'white', padding:'2px 5px', borderRadius:'3px', color:'black'}}>{n}: <b>{c}</b></span>)} </div> </div> <div style={{padding:'12px', background: th.femBg, borderRadius:'8px', borderLeft:`5px solid ${th.femBord}`}}> <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>FEMALE WING (Free: {femaleRooms.length - femaleOcc})</div> <div style={{fontSize:'11px', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(femaleBreakdown).length > 0 ? Object.entries(femaleBreakdown).map(([n, c]) => <span key={n} style={{background:'white', padding:'2px 5px', borderRadius:'3px', color:'black'}}>{n}: <b>{c}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#e8f5e9', borderRadius:'8px', borderLeft:'5px solid #2e7d32'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#2e7d32', marginBottom:'5px'}}>TOTAL</div> <div>Total Occupied: <strong>{maleOcc + femaleOcc}</strong></div> <div>Total Free: <strong>{rooms.length - (maleOcc + femaleOcc)}</strong></div> </div> </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div style={{border:`1px solid ${th.maleBord}`, borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background: th.maleBg, margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> <div style={{border:`1px solid ${th.femBord}`, borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background: th.femBg, margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> </div> {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px', color:'black'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} </div> );
}

function ProcessFlowDashboard({ courses }) {
    const [courseId, setCourseId] = useState(''); const [data, setData] = useState([]);
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setData); };
    useEffect(refresh, [courseId]); useEffect(() => { const interval = setInterval(refresh, 10000); return () => clearInterval(interval); }, [courseId]);
    const Col = ({ title, list, color }) => ( <div style={{flex:1, background:'white', borderRadius:'8px', padding:'10px', borderTop:`4px solid ${color}`, minHeight:'300px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}> <h4 style={{margin:'0 0 10px 0', color}}>{title} ({list.length})</h4> <div style={{maxHeight:'400px', overflowY:'auto'}}> {list.map(p => ( <div key={p.participant_id} style={{padding:'8px', borderBottom:'1px solid #eee', fontSize:'12px', display:'flex', justifyContent:'space-between'}}> <div><span style={{fontWeight:'bold', fontSize:'14px'}}>#{p.token_number || '-'}</span> {p.full_name.substring(0,15)}</div> <div style={{color:'#666'}}>{p.conf_no}</div> </div> ))} </div> </div> );
    return ( <div> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={refresh} style={quickBtnStyle(true)}>↻ Refresh</button> </div> <div style={{display:'flex', gap:'15px', overflowX:'auto'}}> <Col title="Expected" list={data.filter(p=>!p.token_number)} color="#999" /> <Col title="1. Arrived" list={data.filter(p=>p.process_stage===1)} color="#2196f3" /> <Col title="2. Briefing" list={data.filter(p=>p.process_stage===2)} color="#ff9800" /> <Col title="3. Teacher" list={data.filter(p=>p.process_stage===3)} color="#9c27b0" /> <Col title="4. Onboarded" list={data.filter(p=>p.process_stage===4)} color="#4caf50" /> </div> </div> );
}
function ArrivalDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState('');
    useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
    const handleArrival = async (p) => { if (!window.confirm(`Confirm Arrival: ${p.full_name}?`)) return; await fetch(`${API_URL}/process/arrival`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, courseId }) }); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    const filtered = participants.filter(p => !p.token_number && p.full_name.toLowerCase().includes(search.toLowerCase()));
    return ( <div style={cardStyle}> <h2>1️⃣ Arrival Desk</h2> <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} /> </div> <div style={{maxHeight:'400px', overflowY:'auto'}}><table style={{width:'100%'}}><tbody>{filtered.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}> <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td> <td style={{textAlign:'right'}}><button onClick={()=>handleArrival(p)} style={{...quickBtnStyle(true), background:'#2196f3', color:'white'}}>🖨️ Issue Token</button></td> </tr> ))}</tbody></table></div> </div> );
}
function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [tokenInput, setTokenInput] = useState('');
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);
    const handleProcess = async (p, nextStage) => { await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) }); refresh(); setTokenInput(''); };
    const activeStudent = participants.find(p => p.token_number == tokenInput);
    return ( <div style={cardStyle}> <h2>2️⃣ 3️⃣ Process Desk</h2> <div style={{marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}> <input autoFocus style={{...inputStyle, fontSize:'30px', textAlign:'center', width:'200px', fontWeight:'bold'}} placeholder="Token #" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} /> {activeStudent ? ( <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px'}}> <h1>#{activeStudent.token_number}</h1> <h3>{activeStudent.full_name}</h3> <p>Stage: {activeStudent.process_stage}</p> <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}> {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800'}}>Mark Briefing Done</button>} {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0'}}>Mark Interview Done</button>} </div> </div> ) : <p style={{color:'#888'}}>Scan Token...</p>} </div> </div> );
}

function StudentForm({ courses, preSelectedRoom, clearRoom }) {
    const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [selectedStudent, setSelectedStudent] = useState(null); const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Chair' }); const [status, setStatus] = useState('');
    useEffect(() => { fetch(`${API_URL}/rooms`).then(r=>r.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(r=>r.json()).then(setOccupancy); }, []);
    useEffect(() => { if(preSelectedRoom) setFormData(p=>({...p, roomNo: preSelectedRoom})); if(courses.length>0 && !formData.courseId) setFormData(p=>({...p, courseId: courses[0].course_id})); }, [preSelectedRoom, courses]);
    useEffect(() => { if(formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [formData.courseId]);
    const occupiedSet = new Set(occupancy.map(p => p.room_no ? p.room_no.replace(/[\s-]+/g, '').toUpperCase() : ''));
    let availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no.replace(/[\s-]+/g, '').toUpperCase()));
    if (selectedStudent && selectedStudent.gender) { const g = selectedStudent.gender.toLowerCase(); if (g === 'male') availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); else if (g === 'female') availableRooms = availableRooms.filter(r => r.gender_type === 'Female'); }
    const eligibleStudents = participants.filter(p => p.status !== 'Arrived' && p.process_stage >= 3);
    const handleStudentChange = (e) => { const selectedId = e.target.value; const student = participants.find(p => p.participant_id == selectedId); setSelectedStudent(student); setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); };
    const handleSubmit = async (e) => { e.preventDefault(); setStatus('Submitting...'); const payload = { ...formData, diningSeatType: formData.seatType }; try { const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unknown Error"); 
      fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
      setStatus('✅ Success! Confirmation Sent.'); setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' })); setSelectedStudent(null); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); } catch (err) { setStatus(`❌ ${err.message}`); } };
    const sectionHeader = (title) => <div style={{fontSize:'14px', fontWeight:'bold', color:'#007bff', borderBottom:'1px solid #eee', paddingBottom:'5px', marginTop:'15px', marginBottom:'10px'}}>{title}</div>;
    return ( <div style={cardStyle}> <h2>📝 Student Onboarding Form</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>2. Select Student (Interviewed Only)</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{eligibleStudents.map(p => <option key={p.participant_id} value={p.participant_id}>#{p.token_number} - {p.full_name}</option>)}</select></div> </div> 
    {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ SPECIAL ATTENTION:</strong> {selectedStudent.evening_food && <div>🍛 Food: {selectedStudent.evening_food}</div>} {selectedStudent.medical_info && <div>🏥 Medical: {selectedStudent.medical_info}</div>}</div>)} </div> 
    {sectionHeader("📍 Allocation Details")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle, background:'#f0f0f0'}} value={formData.confNo} readOnly /></div> <div><label style={labelStyle}>🛏️ Room No</label><select style={{...inputStyle, background: preSelectedRoom ? '#e8f5e9' : 'white'}} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required><option value="">-- Select Free Room --</option>{preSelectedRoom && <option value={preSelectedRoom}>{preSelectedRoom} (Selected)</option>}{availableRooms.map(r => <option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div> <div><label style={labelStyle}>🍽️ Dining Seat</label><div style={{display:'flex', gap:'5px'}}><select style={{...inputStyle, width:'80px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">No</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div> </div> 
    {sectionHeader("🧘 Hall & Meditation")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🗣️ Discourse Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Malayalam</option><option>Gujarati</option><option>Odia</option><option>Bengali</option><option>Mandarin Chinese</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Vietnamese</option><option>Thai</option><option>Japanese</option></select></div> <div><label style={labelStyle}>🛖 Pagoda Cell</label><select style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> </div> {sectionHeader("🔐 Lockers & Other")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>📱 Mobile Locker</label><select style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💍 Val Locker</label><select style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>🧺 Laundry Token</label><select style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💻 Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> <div><label style={labelStyle}>💺 Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> </div> <div style={{marginTop:'30px', textAlign:'right'}}><button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 6px rgba(0,123,255,0.2)'}}>Confirm & Save</button></div> {status && <div style={{marginTop:'15px', padding:'10px', borderRadius:'6px', background: status.includes('Success') ? '#d4edda' : '#f8d7da', color: status.includes('Success') ? '#155724' : '#721c24', textAlign:'center', fontWeight:'bold'}}>{status}</div>} </form> </div> );
}

function ParticipantList({ courses, refreshCourses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [viewAllMode, setViewAllMode] = useState(false); const [viewMode, setViewMode] = useState('list'); const [printMode, setPrintMode] = useState('');
    const [swappingSeat, setSwappingSeat] = useState(null); const [newSeatNo, setNewSeatNo] = useState(''); const [draggedStudent, setDraggedStudent] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
    useEffect(loadStudents, [courseId]);
    const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
    const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Seat"]; const rows = participants.map(p => [`"${p.full_name}"`, p.conf_no, p.dhamma_hall_seat_no]); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `students_course_${courseId}.csv`); document.body.appendChild(link); link.click(); };

    const sortedList = React.useMemo(() => { let sortableItems = [...participants]; if (sortConfig.key) { sortableItems.sort((a, b) => { const valA = (a[sortConfig.key] || '').toString().toLowerCase(); const valB = (b[sortConfig.key] || '').toString().toLowerCase(); if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } return sortableItems.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())); }, [participants, sortConfig, search]);

    const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students/expenses?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
    const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE COMPLETELY?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
    const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
    const handleCancelStudent = async (student) => { if (!window.confirm(`Mark ${student.full_name} as Cancelled?`)) return; const updatedData = { ...student, status: 'Cancelled', room_no: null, dining_seat_no: null, pagoda_cell_no: null, laundry_token_no: null }; await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) }); loadStudents(); };
    const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
    const handleSeatSwapSave = async () => { if (!swappingSeat || !swappingSeat.p) return; await fetch(`${API_URL}/participants/${swappingSeat.p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...swappingSeat.p, dhamma_hall_seat_no: newSeatNo }) }); setSwappingSeat(null); loadStudents(); };
    const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag all pending students as No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); alert("✅ Processed No-Shows."); };
    const handleSendReminders = async () => { if (!window.confirm("📢 Send SMS/Email to all Pending students?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); alert("✅ Reminders Queued!"); };
    
    const handleDrop = async (targetSeat, targetStudent) => {
        if (!draggedStudent) return;
        if (targetStudent) {
            if(!window.confirm(`Swap ${draggedStudent.full_name} with ${targetStudent.full_name}?`)) return;
            const seatA = draggedStudent.dhamma_hall_seat_no; const seatB = targetSeat;
            await fetch(`${API_URL}/participants/${draggedStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...draggedStudent, dhamma_hall_seat_no: seatB}) });
            await fetch(`${API_URL}/participants/${targetStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...targetStudent, dhamma_hall_seat_no: seatA}) });
        } else {
            await fetch(`${API_URL}/participants/${draggedStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...draggedStudent, dhamma_hall_seat_no: targetSeat}) });
        }
        setDraggedStudent(null); 
        fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants);
    };

    const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || 'Course';
    const selectedCourse = courses.find(c => c.course_id == courseId);
    const getCategory = (seatNo) => { if (!seatNo) return '-'; const s = seatNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF')) return 'Old'; if (s.startsWith('NM') || s.startsWith('NF')) return 'New'; if (s.startsWith('SM') || s.startsWith('SF')) return 'DS'; return 'New'; };
    const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = confNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 1; return 2; };
    const parseCourses = (str) => { if (!str) return { s: 0, l: 0, seva: 0 }; const s = str.match(/S:\s*(\d+)/); const l = str.match(/L:\s*(\d+)/); const sv = str.match(/Seva:\s*(\d+)/); return { s: s ? parseInt(s[1]) : 0, l: l ? parseInt(l[1]) : 0, seva: sv ? parseInt(sv[1]) : 0 }; };
    const getSeniorityScore = (p) => { const c = parseCourses(p.courses_info); return (c.l * 10000) + (c.s * 10) + (c.seva * 0.1); };
    const MALE_COLS = 10; const MALE_ROWS = 8; const FEMALE_COLS = 7; const FEMALE_ROWS = 7;
    
    const handleAutoAssign = () => {
        if(!window.confirm("Overwrite Seats?")) return;
        setTimeout(async () => {
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const all = await res.json();
            let males = all.filter(p => p.gender && p.gender.toLowerCase() === 'male' && p.status !== 'Cancelled' && !p.conf_no.toUpperCase().startsWith('SM'));
            let females = all.filter(p => p.gender && p.gender.toLowerCase() === 'female' && p.status !== 'Cancelled' && !p.conf_no.toUpperCase().startsWith('SF'));
            const sortGroup = (group) => { const oldS = group.filter(p => p.conf_no && (p.conf_no.startsWith('O'))).sort((a,b) => getSeniorityScore(b) - getSeniorityScore(a)); const newS = group.filter(p => !p.conf_no || p.conf_no.startsWith('N')).sort((a,b) => (parseInt(b.age)||0) - (parseInt(a.age)||0)); return [...oldS, ...newS]; };
            males = sortGroup(males); females = sortGroup(females);
            const updates = [];
            // MALE: Fill A1...J1 (Right to Left visual). A1 is at Col 9.
            males.forEach((p, i) => {
                if (i < MALE_COLS * MALE_ROWS) {
                    const r = Math.floor(i / MALE_COLS) + 1; 
                    const cIdx = i % MALE_COLS; 
                    const colChar = String.fromCharCode(65 + cIdx); 
                    updates.push({...p, dhamma_hall_seat_no: `${colChar}${r}`});
                }
            });
            // FEMALE: A1 -> G1
            females.forEach((p, i) => { if(i < FEMALE_COLS * FEMALE_ROWS) { const r = Math.floor(i / FEMALE_COLS) + 1; const c = i % FEMALE_COLS; updates.push({...p, dhamma_hall_seat_no: `${String.fromCharCode(65+c)}${r}`}); } });
            await Promise.all(updates.map(u => fetch(`${API_URL}/participants/${u.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)})));
            alert("Assigned!"); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants);
        }, 50);
    };

    const SeatBox = ({ p, label }) => (
        <div draggable={!!p} onDragStart={()=>setDraggedStudent(p)} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(label, p)} onClick={() => setSwappingSeat({ p, label })}
             style={{border:'1px solid #ccc', background: p ? (p.conf_no.startsWith('O')?'#fff9c4':'white') : '#f0f0f0', height:'55px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:p?'grab':'pointer'}}>
             {p ? (
                <>
                 <b style={{color:'blue'}}>{p.dhamma_hall_seat_no}</b>
                 <div style={{overflow:'hidden', whiteSpace:'nowrap', width:'90%'}}>{(p.full_name || '').substring(0, 10)}</div>
                 <div>{p.conf_no}</div>
                 <div style={{fontSize:'8px', color:'#666'}}>P:{p.pagoda_cell_no} D:{p.dining_seat_no}</div>
                </>
             ) : (
                 <span style={{color:'#ccc'}}>{label}</span>
             )}
        </div>
    );

    if (viewMode === 'seating') {
        const maleMap={}; const femaleMap={}; participants.forEach(p => { if(p.gender==='Male') maleMap[p.dhamma_hall_seat_no]=p; else femaleMap[p.dhamma_hall_seat_no]=p; });
        const selectedCourse = courses.find(c => c.course_id == courseId);
        const printClass = printMode === 'male' ? 'print-male-only' : printMode === 'female' ? 'print-female-only' : '';

        const renderMaleGrid = () => {
            let rows = [];
            let headerCells = [<div key="e"></div>]; 
            for(let c=MALE_COLS-1; c>=0; c--) headerCells.push(<div key={c} style={{textAlign:'center', fontWeight:'bold'}}>{String.fromCharCode(65+c)}</div>);
            rows.push(<div key="head" style={{display:'grid', gridTemplateColumns:`20px repeat(${MALE_COLS}, 1fr)`, gap:'2px', marginBottom:'5px'}}>{headerCells}</div>);
            for(let r=1; r<=MALE_ROWS; r++) {
                let cells = []; cells.push(<div key={`r${r}`} style={{display:'flex',alignItems:'center'}}><b>{r}</b></div>);
                for(let c=MALE_COLS-1; c>=0; c--) {
                    const label = `${String.fromCharCode(65+c)}${r}`;
                    cells.push(<SeatBox key={label} label={label} p={maleMap[label]} />);
                }
                rows.push(<div key={r} style={{display:'grid', gridTemplateColumns:`20px repeat(${MALE_COLS}, 1fr)`, gap:'2px', marginBottom:'2px'}}>{cells}</div>);
            }
            return rows;
        };
        
        const renderFemaleGrid = () => {
            let rows = [];
            let headerCells = [<div key="e"></div>]; for(let c=0; c<FEMALE_COLS; c++) headerCells.push(<div key={c} style={{textAlign:'center', fontWeight:'bold'}}>{String.fromCharCode(65+c)}</div>);
            rows.push(<div key="head" style={{display:'grid', gridTemplateColumns:`20px repeat(${FEMALE_COLS}, 1fr)`, gap:'2px', marginBottom:'5px'}}>{headerCells}</div>);
            for(let r=1; r<=FEMALE_ROWS; r++) {
                let cells = []; cells.push(<div key={`r${r}`} style={{display:'flex',alignItems:'center'}}><b>{r}</b></div>);
                for(let c=0; c<FEMALE_COLS; c++) {
                    const label = `${String.fromCharCode(65+c)}${r}`;
                    cells.push(<SeatBox key={label} label={label} p={femaleMap[label]} />);
                }
                rows.push(<div key={r} style={{display:'grid', gridTemplateColumns:`20px repeat(${FEMALE_COLS}, 1fr)`, gap:'2px', marginBottom:'2px'}}>{cells}</div>);
            }
            return rows;
        };

        return ( <div style={cardStyle} className={printClass}> 
           <div className="no-print" style={{marginBottom:'10px', display:'flex', gap:'10px'}}>
              <button onClick={()=>setViewMode('list')} style={btnStyle(false)}>Back</button>
              <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800'}}>⚡ Auto Assign (All)</button>
              <button onClick={()=>setPrintMode('male')} style={quickBtnStyle(printMode==='male')}>Print Male</button>
              <button onClick={()=>setPrintMode('female')} style={quickBtnStyle(printMode==='female')}>Print Female</button>
              <button onClick={()=>{setPrintMode(''); setTimeout(()=>window.print(),100);}} style={btnStyle(true)}>Print All</button>
           </div>
           <div className="print-area">
              <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:'10px', marginBottom:'20px'}}>
                  <h1>DHAMMA HALL SEATING</h1>
                  <h3>{selectedCourse?.course_name} ({selectedCourse?.start_date})</h3>
                  <h4>Teacher: {selectedCourse?.teacher_name}</h4>
              </div>
              <div style={{display:'flex', gap:'20px'}}>
                  <div className="male-section" style={{flex:1.2}}>
                      <h3 style={{textAlign:'center', background:'#e3f2fd'}}>MALE (J ← A)</h3>
                      {renderMaleGrid()}
                      <div style={{marginTop:'15px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}>
                          <h4 style={{margin:'5px 0', textAlign:'center'}}>Chowky/Chair (Special)</h4>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px', marginBottom:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`K${i+1}`} label={`K${i+1}`} p={maleMap[`K${i+1}`]} />)}</div>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`L${i+1}`} label={`L${i+1}`} p={maleMap[`L${i+1}`]} />)}</div>
                      </div>
                  </div>
                  <div style={{width:'40px', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'2px dashed #999', borderRight:'2px dashed #999', writingMode:'vertical-rl', textOrientation:'upright', letterSpacing:'5px', color:'#ccc', fontWeight:'bold'}}>AISLE</div>
                  <div className="female-section" style={{flex:0.8}}>
                      <h3 style={{textAlign:'center', background:'#fce4ec'}}>FEMALE (A → G)</h3>
                      {renderFemaleGrid()}
                  </div>
              </div>
           </div>
           {swappingSeat && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}><h3>💺 Seat Manager</h3>{swappingSeat.p ? (<div><p><strong>Student:</strong> {swappingSeat.p.full_name}</p><p><strong>Current Seat:</strong> {swappingSeat.label}</p></div>) : <p><strong>Empty Seat:</strong> {swappingSeat.label}</p>}<div style={{marginTop:'15px'}}><label style={labelStyle}>Assign/Change to Seat No:</label><input style={inputStyle} value={newSeatNo} onChange={e=>setNewSeatNo(e.target.value)} placeholder="e.g. C5" /></div><div style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={handleSeatSwapSave} disabled={!swappingSeat.p} style={{...btnStyle(true), background: swappingSeat.p ? '#28a745' : '#ccc', color:'white', flex:1}}>Update</button><button onClick={() => {setSwappingSeat(null); setNewSeatNo('');}} style={{...btnStyle(false), flex:1}}>Close</button></div></div></div>)}
        </div> );
    }

    if (viewAllMode) { return ( <div style={{background:'white', padding:'20px', height:'100vh', overflow:'auto'}}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Master List</button> </div> <h2 style={{textAlign:'center'}}>Master Student List - {selectedCourseName}</h2> <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}> <thead><tr style={{background:'#f0f0f0', borderBottom:'2px solid #000'}}><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th><th style={thPrint}>Dhamma</th></tr></thead> <tbody> {sortedList.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #ddd'}}> <td style={{padding:'8px'}}>{p.full_name}</td> <td style={{padding:'8px'}}>{p.conf_no}</td> <td style={{padding:'8px'}}>{p.room_no}</td> <td style={{padding:'8px'}}>{p.dining_seat_no} ({p.dining_seat_type})</td> <td style={{padding:'8px'}}>{p.dhamma_hall_seat_no}</td> </tr> ))} </tbody> </table> </div> ); }

    return <div style={cardStyle}> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <div style={{marginLeft:'auto', display:'flex', gap:'5px'}}> <button onClick={handleAutoNoShow} style={{...quickBtnStyle(true), background:'#d32f2f', color:'white'}}>🚫 No-Shows</button> <button onClick={handleSendReminders} style={{...quickBtnStyle(true), background:'#ff9800', color:'white'}}>📢 Remind</button> <button onClick={() => setViewAllMode(true)} style={quickBtnStyle(true)}>👁️ View All</button><button onClick={handleExport} disabled={!courseId} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>📥 Export CSV</button><button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining Sheet</button><button onClick={() => setViewMode('seating')} disabled={!courseId} style={quickBtnStyle(true)}>🧘 Dhamma Plan</button> </div> </div> <div style={{maxHeight:'500px', overflowY:'auto'}}> <table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left'}}><th>Name</th><th>Conf</th><th>Seat</th><th>Status</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td>{p.full_name}</td><td>{p.conf_no}</td><td>{p.dhamma_hall_seat_no}</td><td style={{color:p.status==='Arrived'?'green':'orange'}}>{p.status}</td></tr>))}</tbody></table> </div> </div>;
}

// --- OTHER COMPONENTS ---
function ExpenseTracker({ courses }) { return <div style={cardStyle}><h3>Store</h3></div>; }
function CourseAdmin({ courses, refreshCourses, setView }) {
  const [activeTab, setActiveTab] = useState('create');
  return (
    <div style={cardStyle}>
      <div style={{display:'flex', borderBottom:'1px solid #ddd', marginBottom:'20px', gap:'10px'}}>
        <button onClick={()=>setActiveTab('create')} style={{padding:'10px', background:activeTab==='create'?'#eee':'white', border:'none', borderBottom:activeTab==='create'?'2px solid #007bff':'none', cursor:'pointer'}}>➕ New Course</button>
        <button onClick={()=>setActiveTab('upload')} style={{padding:'10px', background:activeTab==='upload'?'#eee':'white', border:'none', borderBottom:activeTab==='upload'?'2px solid #007bff':'none', cursor:'pointer'}}>📂 Upload CSV</button>
        <button onClick={()=>setActiveTab('manual')} style={{padding:'10px', background:activeTab==='manual'?'#eee':'white', border:'none', borderBottom:activeTab==='manual'?'2px solid #007bff':'none', cursor:'pointer'}}>✍️ Manual Entry</button>
      </div>
      {activeTab === 'create' && <CreateCourseForm refreshCourses={refreshCourses} setView={setView} />}
      {activeTab === 'upload' && <UploadParticipants courses={courses} setView={setView} />}
      {activeTab === 'manual' && <ManualStudentForm courses={courses} setView={setView} />}
    </div>
  );
}

function CreateCourseForm({ refreshCourses, setView }) { const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' }); const [status, setStatus] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Failed"); setStatus('✅ Created!'); refreshCourses(); setTimeout(() => setView('dashboard'), 1500); } catch (err) { setStatus('❌ ' + err.message); } }; return ( <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}> <h3>Course Details</h3> <input style={inputStyle} placeholder="Course Name" required onChange={e => setFormData({...formData, courseName: e.target.value})} /><input style={inputStyle} placeholder="Teacher Name" required onChange={e => setFormData({...formData, teacherName: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>{status && <p>{status}</p>}</form> ); }
function UploadParticipants({ courses, setView }) { const [courseId, setCourseId] = useState(''); const [csvFile, setCsvFile] = useState(null); const [preview, setPreview] = useState([]); const [status, setStatus] = useState(''); 
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; setCsvFile(file); setStatus(''); setPreview([]); const reader = new FileReader(); reader.onload = (event) => { const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); let headerIndex = -1; let headers = []; for (let i = 0; i < Math.min(lines.length, 20); i++) { if (lines[i].toLowerCase().includes('name')) { headerIndex = i; headers = lines[i].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); break; } } if (headerIndex === -1) { setStatus("⚠️ Error: No header found."); return; } const nameIdx = headers.findIndex(h => h.includes('name')); const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile')); const emailIdx = headers.findIndex(h => h.includes('email')); const ageIdx = headers.findIndex(h => h === 'age'); const genderIdx = headers.findIndex(h => h === 'gender'); const coursesIdx = headers.findIndex(h => h.includes('courses')); const confIdx = headers.findIndex(h => h.includes('conf')); const dataRows = lines.slice(headerIndex + 1); const parsedData = dataRows.map(row => { const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length <= nameIdx) return null; return { name: cols[nameIdx], phone: phoneIdx!==-1?cols[phoneIdx]:'', email: emailIdx!==-1?cols[emailIdx]:'', age: ageIdx!==-1?cols[ageIdx]:'', gender: genderIdx!==-1?cols[genderIdx]:'', courses: coursesIdx!==-1?cols[coursesIdx]:'', confNo: confIdx!==-1?cols[confIdx]:'' }; }).filter(r => r && r.name); setPreview(parsedData); setStatus(`✅ Ready! Found ${parsedData.length} students.`); }; reader.readAsText(file); };
  const handleUpload = async () => { if (!courseId) return alert("Select course"); setStatus('Uploading...'); try { const res = await fetch(`${API_URL}/courses/${courseId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) }); if (!res.ok) throw new Error("Failed"); setStatus(`✅ Added ${preview.length} students.`); setTimeout(() => setView('onboarding'), 2000); } catch (err) { setStatus("❌ " + err.message); } };
  return ( <div><h3>Upload CSV</h3><div style={{maxWidth:'500px'}}><div style={{marginBottom:'10px'}}><label>Select Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div><div style={{marginBottom:'10px'}}><input type="file" accept=".csv" onChange={handleFileChange} /></div>{status && <div style={{padding:'10px', background:'#e3f2fd', borderRadius:'4px', marginBottom:'10px'}}>{status}</div>}<button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc'}}>Upload</button></div></div> );
}
function ManualStudentForm({ courses, setView }) {
  const [formData, setFormData] = useState({ courseId: '', fullName: '', coursesInfo: '', email: '', age: '', gender: '', confNo: '' });
  const [status, setStatus] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus('Saving...');
    try {
      const res = await fetch(`${API_URL}/participants`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)});
      if (!res.ok) throw new Error("Failed. ConfNo/Name might exist.");
      setStatus('✅ Student Added!');
      setFormData({ ...formData, fullName: '', coursesInfo: '', email: '', age: '', gender: '', confNo: '' });
    } catch (err) { setStatus('❌ ' + err.message); }
  };
  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px', maxWidth:'600px'}}>
       <h3>Add Student (Manual)</h3>
       <label>Select Course</label>
       <select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} required>
         <option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
       <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}><div><label>Full Name</label><input style={inputStyle} value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} required /></div><div><label>Conf No</label><input style={inputStyle} value={formData.confNo} onChange={e=>setFormData({...formData, confNo: e.target.value})} placeholder="e.g. NM99" /></div></div>
       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Gender</label><select style={inputStyle} onChange={e=>setFormData({...formData, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div><div><label>Age</label><input style={inputStyle} type="number" value={formData.age} onChange={e=>setFormData({...formData, age: e.target.value})} /></div><div><label>Courses Info</label><input style={inputStyle} value={formData.coursesInfo} onChange={e=>setFormData({...formData, coursesInfo: e.target.value})} placeholder="S:0 L:0" /></div></div>
       <button type="submit" disabled={!formData.courseId} style={{...btnStyle(true), background:'#28a745', color:'white'}}>Add Student</button>{status && <p>{status}</p>}
    </form>
  );
}
