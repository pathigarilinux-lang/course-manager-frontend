import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

// --- CONFIG & UTILS ---
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

const DEFAULT_VIEWS = { ADMIN: 'dashboard', ARRIVAL: 'arrival', PROCESS: 'process', ONBOARDING: 'onboarding' };

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };

export default function App() {
  const [user, setUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
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
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-male-only .female-section { display: none; } .print-female-only .male-section { display: none; } }`}</style>
      <nav className="no-print" style={{marginBottom:'20px', background:'white', padding:'15px', borderRadius:'8px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
         <span style={{marginRight:'10px', fontWeight:'bold', borderRight:'2px solid #eee', paddingRight:'10px'}}>👤 {user.name}</span>
         {can('dashboard') && <button onClick={()=>setView('dashboard')} style={btnStyle(view==='dashboard')}>📊 Dashboard</button>}
         {can('flow') && <button onClick={()=>setView('flow')} style={btnStyle(view==='flow')}>🌊 Live Flow</button>}
         {can('ta-panel') && <button onClick={()=>setView('ta-panel')} style={btnStyle(view==='ta-panel')}>🩺 AT Panel</button>}
         {can('arrival') && <button onClick={()=>setView('arrival')} style={btnStyle(view==='arrival')}>1️⃣ Arrival</button>}
         {can('process') && <button onClick={()=>setView('process')} style={btnStyle(view==='process')}>2️⃣ Briefing</button>}
         {can('onboarding') && <button onClick={()=>setView('onboarding')} style={btnStyle(view==='onboarding')}>3️⃣ Onboarding</button>}
         {can('room-view') && <button onClick={()=>setView('room-view')} style={btnStyle(view==='room-view')}>🛏️ Rooms</button>}
         {can('participants') && <button onClick={()=>setView('participants')} style={btnStyle(view==='participants')}>👥 Students</button>}
         {can('expenses') && <button onClick={()=>setView('expenses')} style={btnStyle(view==='expenses')}>🛒 Store</button>}
         {can('course-admin') && <button onClick={()=>setView('course-admin')} style={btnStyle(view==='course-admin')}>⚙️ Admin</button>}
         <button onClick={handleLogout} style={{...btnStyle(false), color:'red', marginLeft:'auto'}}>🔒 Logout</button>
      </nav>
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={()=>setPreSelectedRoom('')} />}
      {/* PART 2 COMPONENTS WILL BE RENDERED HERE */}
      {view === 'flow' && <ProcessFlowDashboard courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null); const [stats, setStats] = useState(null);
  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]); useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(r=>r.json()).then(setStats).catch(console.error); }, [selectedCourse]);
  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }] : [];
  const attendanceString = courses.map(c => `${getShortCourseName(c.course_name)}: ${c.arrived}/${(c.arrived||0)+(c.pending||0)}`).join("  ✦  ");
  return ( <div> <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}> <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2> <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> </div> <div style={{background:'#e3f2fd', color:'#1565c0', padding:'10px', marginBottom:'20px', overflow:'hidden', whiteSpace:'nowrap', borderRadius:'4px', fontWeight:'bold'}}><marquee>{attendanceString}</marquee></div> {stats && selectedCourse ? ( <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}> <div style={cardStyle}><h3 style={{marginTop:0}}>Status</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"/><Bar dataKey="Female" fill="#e91e63"/></BarChart></ResponsiveContainer></div></div> <div style={cardStyle}><h3>Discourse</h3><div style={{maxHeight:'150px',overflowY:'auto'}}><table style={{width:'100%',fontSize:'12px'}}><thead><tr><th>Lang</th><th>M</th><th>F</th><th>Tot</th></tr></thead><tbody>{stats.languages.map((l,i)=>(<tr key={i}><td>{l.discourse_language}</td><td>{l.male_count}</td><td>{l.female_count}</td><td>{l.total}</td></tr>))}</tbody></table></div></div> <div style={cardStyle}><h3>Live Counts</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"/><Bar dataKey="Female" fill="#e91e63"/></BarChart></ResponsiveContainer></div></div> </div> ) : <p>Loading...</p>} </div> );
}

function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [searchTerm, setSearchTerm] = useState(''); const [editingStudent, setEditingStudent] = useState(null);
  useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
  const handleUpdate = async (p, field, val) => { const updated = { ...p, [field]: val }; setParticipants(participants.map(s => s.participant_id === p.participant_id ? updated : s)); await fetch(`${API_URL}/participants/${p.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updated) }); };
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => (b.conf_no||'').localeCompare(a.conf_no||''));
  return ( <div style={cardStyle}> <h2>AT Panel</h2> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search..." value={searchTerm} onChange={e=>setSearch(e.target.value)} /></div> <div style={{maxHeight:'500px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'14px'}}><thead><tr style={{textAlign:'left', background:'#f9f9f9'}}><th style={{padding:'10px'}}>Name</th><th>Conf ▼</th><th>Special SEAT</th><th>Food</th><th>Medical</th><th>Action</th></tr></thead><tbody>{filtered.map(p=>(<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px'}}><strong>{p.full_name}</strong></td><td>{p.conf_no}</td><td><select value={p.special_seating||''} onChange={e=>handleUpdate(p,'special_seating',e.target.value)} style={{padding:'5px'}}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></td><td>{p.evening_food}</td><td>{p.medical_info}</td><td><button onClick={()=>setEditingStudent(p)} style={quickBtnStyle(true)}>Edit</button></td></tr>))}</tbody></table></div> {editingStudent && <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000}}><div style={{background:'white',padding:'20px',width:'400px'}}><h3>Edit {editingStudent.full_name}</h3><textarea style={{...inputStyle,height:'100px'}} value={editingStudent.medical_info||''} onChange={e=>handleUpdate(editingStudent,'medical_info',e.target.value)} placeholder="Medical Info"/><button onClick={()=>setEditingStudent(null)} style={{...btnStyle(true),marginTop:'10px'}}>Close</button></div></div>} </div> );
}

function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [loading, setLoading] = useState(false); const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); const [editingRoom, setEditingRoom] = useState(null);
  const ACCOM_THEMES = { light: { bg: 'white', text: '#333', maleBg: '#e3f2fd', femBg: '#fce4ec', maleBord: '#90caf9', femBord: '#f48fb1' }, dark: { bg: '#2c3e50', text: '#ecf0f1', maleBg: '#34495e', femBg: '#2c3e50', maleBord: '#5d6d7e', femBord: '#5d6d7e' } };
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
  return ( <div style={{...cardStyle, background: th.bg, color: th.text}}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}> <h2 style={{margin:0}}>🛏️ Global Accommodation Manager</h2> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> <select style={inputStyle} value={theme} onChange={e=>setTheme(e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select> <div style={{display:'flex', gap:'5px', alignItems:'center', background:'#f9f9f9', padding:'5px', borderRadius:'5px', border:'1px solid #eee'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'70px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px', fontSize:'11px'}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> <button onClick={() => window.print()} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Status</button> </div> </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}> <div style={{padding:'12px', background: th.maleBg, borderRadius:'8px', borderLeft:`5px solid ${th.maleBord}`}}> <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>MALE WING</div> <div style={{fontSize:'11px', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(maleBreakdown).map(([n, c]) => <span key={n} style={{background:'white', padding:'2px 5px', borderRadius:'3px', color:'black'}}>{n}: <b>{c}</b></span>)} </div> </div> <div style={{padding:'12px', background: th.femBg, borderRadius:'8px', borderLeft:`5px solid ${th.femBord}`}}> <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>FEMALE WING</div> <div style={{fontSize:'11px', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(femaleBreakdown).map(([n, c]) => <span key={n} style={{background:'white', padding:'2px 5px', borderRadius:'3px', color:'black'}}>{n}: <b>{c}</b></span>)} </div> </div> <div style={{padding:'12px', background:'#e8f5e9', borderRadius:'8px', borderLeft:'5px solid #2e7d32'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#2e7d32', marginBottom:'5px'}}>TOTAL</div> <div>Total Occupied: <strong>{maleOcc + femaleOcc}</strong></div> <div>Total Free: <strong>{rooms.length - (maleOcc + femaleOcc)}</strong></div> </div> </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div style={{border:`1px solid ${th.maleBord}`, borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background: th.maleBg, margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> <div style={{border:`1px solid ${th.femBord}`, borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background: th.femBg, margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> </div> {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px', color:'black'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} </div> );
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
// --- FLOW & DESK COMPONENTS ---
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

// --- PARTICIPANT LIST ---
function ParticipantList({ courses, refreshCourses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState(''); const [viewAllMode, setViewAllMode] = useState(false); const [viewMode, setViewMode] = useState('list'); const [printMode, setPrintMode] = useState(''); const [swappingSeat, setSwappingSeat] = useState(null); const [newSeatNo, setNewSeatNo] = useState(''); const [draggedStudent, setDraggedStudent] = useState(null);
    useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
    
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

    const handleSeatSwapSave = async () => { if (!swappingSeat || !swappingSeat.p) return; await fetch(`${API_URL}/participants/${swappingSeat.p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...swappingSeat.p, dhamma_hall_seat_no: newSeatNo }) }); setSwappingSeat(null); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };

    const MALE_COLS = 10; const MALE_ROWS = 8; const FEMALE_COLS = 7; const FEMALE_ROWS = 7;
    const handleAutoAssign = () => {
        if(!window.confirm("Overwrite Seats?")) return;
        setTimeout(async () => {
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const all = await res.json();
            let males = all.filter(p => p.gender==='Male' && !p.conf_no.startsWith('SM') && p.status!=='Cancelled');
            let females = all.filter(p => p.gender==='Female' && !p.conf_no.startsWith('SF') && p.status!=='Cancelled');
            
            const sorter = (a,b) => {
               // Seniority
               const oldA = a.conf_no.startsWith('O'); const oldB = b.conf_no.startsWith('O');
               if(oldA && !oldB) return -1; if(!oldA && oldB) return 1;
               // Tie breaker: Age
               return parseInt(b.age||0) - parseInt(a.age||0);
            };
            males.sort(sorter); females.sort(sorter);

            const updates = [];
            // MALE: A1...J1. Visual is J(Left)..A(Right).
            // A1 = Col 9. B1 = Col 8... J1 = Col 0.
            males.forEach((p, i) => {
                if (i < MALE_COLS * MALE_ROWS) {
                    const r = Math.floor(i / MALE_COLS) + 1; 
                    const c = i % MALE_COLS; 
                    const char = String.fromCharCode(65 + c); // A, B...
                    updates.push({...p, dhamma_hall_seat_no: `${char}${r}`});
                }
            });
            females.forEach((p, i) => {
                if (i < FEMALE_COLS * FEMALE_ROWS) {
                    const r = Math.floor(i / FEMALE_COLS) + 1; 
                    const c = i % FEMALE_COLS;
                    const char = String.fromCharCode(65 + c);
                    updates.push({...p, dhamma_hall_seat_no: `${char}${r}`});
                }
            });
            await Promise.all(updates.map(u => fetch(`${API_URL}/participants/${u.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)})));
            alert("Assigned!");
        }, 50);
    };

    const SeatBox = ({ p, label }) => (
        <div draggable={!!p} onDragStart={()=>setDraggedStudent(p)} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(label, p)} onClick={()=>setSwappingSeat({p, label})}
             style={{border:'1px solid #ccc', background: p ? (p.conf_no.startsWith('O')?'#fff9c4':'white') : '#f0f0f0', height:'55px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:p?'grab':'pointer'}}>
             {p ? <><b style={{color:'blue'}}>{p.dhamma_hall_seat_no}</b><div>{p.full_name.substring(0,8)}..</div></> : <span style={{color:'#ccc'}}>{label}</span>}
        </div>
    );

    const selectedCourse = courses.find(c=>c.course_id==courseId);
    const maleMap={}; const femaleMap={}; participants.forEach(p => { if(p.gender==='Male') maleMap[p.dhamma_hall_seat_no]=p; else femaleMap[p.dhamma_hall_seat_no]=p; });
    const printClass = printMode === 'male' ? 'print-male-only' : printMode === 'female' ? 'print-female-only' : '';

    if (viewMode === 'seating') {
        const renderMaleGrid = () => {
            let rows = [];
            // Header A...J (Right to Left visual = A is Right. Wait, standard grid: Col 0 Left.)
            // User wants J...A. J is Left.
            let headerCells = [<div key="e"></div>]; for(let c=MALE_COLS-1; c>=0; c--) headerCells.push(<div key={c} style={{textAlign:'center', fontWeight:'bold'}}>{String.fromCharCode(65+c)}</div>);
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
              <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800'}}>⚡ Auto Assign</button>
              <button onClick={()=>setPrintMode('male')} style={quickBtnStyle(printMode==='male')}>Print Male</button>
              <button onClick={()=>setPrintMode('female')} style={quickBtnStyle(printMode==='female')}>Print Female</button>
              <button onClick={()=>{setPrintMode(''); setTimeout(()=>window.print(),100);}} style={btnStyle(true)}>Print All</button>
           </div>
           <div className="print-area">
              <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:'10px', marginBottom:'20px'}}>
                  <h1>DHAMMA HALL SEATING</h1>
                  <h3>{selectedCourse?.course_name}</h3>
                  <p>Teacher: {selectedCourse?.teacher_name}</p>
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
                  <div style={{width:'30px', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px dashed #999', borderRight:'1px dashed #999'}}>AISLE</div>
                  <div className="female-section" style={{flex:0.8}}>
                      <h3 style={{textAlign:'center', background:'#fce4ec'}}>FEMALE (A → G)</h3>
                      {renderFemaleGrid()}
                  </div>
              </div>
           </div>
           {swappingSeat && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}><h3>💺 Seat Manager</h3>{swappingSeat.p ? (<div><p><strong>Student:</strong> {swappingSeat.p.full_name}</p><p><strong>Current Seat:</strong> {swappingSeat.label}</p></div>) : <p><strong>Empty Seat:</strong> {swappingSeat.label}</p>}<div style={{marginTop:'15px'}}><label style={labelStyle}>Assign/Change to Seat No:</label><input style={inputStyle} value={newSeatNo} onChange={e=>setNewSeatNo(e.target.value)} placeholder="e.g. C5" /></div><div style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={handleSeatSwapSave} disabled={!swappingSeat.p} style={{...btnStyle(true), background: swappingSeat.p ? '#28a745' : '#ccc', color:'white', flex:1}}>Update</button><button onClick={() => {setSwappingSeat(null); setNewSeatNo('');}} style={{...btnStyle(false), flex:1}}>Close</button></div></div></div>)}
        </div> );
    }

    return <div style={cardStyle}> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={()=>setViewMode('seating')} style={btnStyle(true)}>🧘 Dhamma Plan</button> <button onClick={()=>setViewAllMode(true)} style={btnStyle(false)}>View All</button> </div> <div style={{textAlign:'center', color:'#888'}}>Select course to manage seats</div> </div>;
}

// --- PLACEHOLDER COMPONENTS (For brevity) ---
function ExpenseTracker() { return <div style={cardStyle}><h3>Store</h3></div>; }
function CourseAdmin() { return <div style={cardStyle}><h3>Admin</h3></div>; }
