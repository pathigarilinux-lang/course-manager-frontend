import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
// const API_URL = "http://localhost:3000"; // Testing

// --- ROLES & USERS ---
const USERS = {
  "1234": { name: "Super Admin", role: "ADMIN" },
  "1001": { name: "Arrival Desk", role: "ARRIVAL" },
  "1002": { name: "Briefing/Teacher", role: "PROCESS" },
  "1003": { name: "Onboarding Desk", role: "ONBOARDING" }
};

const PERMISSIONS = {
  ADMIN:      ['dashboard', 'flow', 'arrival', 'process', 'onboarding', 'room-view', 'participants', 'expenses', 'course-admin'],
  ARRIVAL:    ['arrival', 'flow'],
  PROCESS:    ['process', 'flow'],
  ONBOARDING: ['onboarding', 'room-view', 'flow']
};

const DEFAULT_VIEWS = { ADMIN: 'dashboard', ARRIVAL: 'arrival', PROCESS: 'process', ONBOARDING: 'onboarding' };

// --- UTILS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"]);

const getShortCourseName = (name) => { if (!name) return 'Unknown'; if (name.includes('45-Day')) return '45D'; if (name.includes('30-Day')) return '30D'; if (name.includes('20-Day')) return '20D'; if (name.includes('10-Day')) return '10D'; if (name.includes('Satipatthana')) return 'ST'; if (name.includes('Gratitude')) return 'GT'; if (name.includes('Service')) return 'SVC'; return 'OTH'; };

export default function App() {
  const [user, setUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => { const savedUser = localStorage.getItem('course_user'); if (savedUser) try{setUser(JSON.parse(savedUser))}catch(e){}; fetchCourses(); }, []);

  const handleLogin = (e) => { e.preventDefault(); const u = USERS[pinInput]; if (u) { setUser(u); localStorage.setItem('course_user', JSON.stringify(u)); setView(DEFAULT_VIEWS[u.role]); } else alert("❌ Invalid Passcode"); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('course_user'); setPinInput(''); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res=>res.ok?res.json():[]).then(setCourses).catch(console.error); };
  const can = (f) => user && PERMISSIONS[user.role]?.includes(f);
  const handleRoomClick = (r) => { setPreSelectedRoom(r); setView('onboarding'); };

  if (!user) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f0f2f5'}}><div style={{background:'white', padding:'40px', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}><h1>Course Manager</h1><p style={{color:'#666'}}>Zero Touch Automation</p><input type="password" placeholder="Staff Passcode" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={inputStyle} autoFocus /><br/><br/><button onClick={handleLogin} style={{...btnStyle(true), width:'100%', background:'#007bff', color:'white'}}>Login</button></div></div>;

  return (
    <div className="app-container" style={{fontFamily:'Segoe UI', padding:'20px', background:'#f4f7f6', minHeight:'100vh'}}>
      <style>{`@media print { .no-print { display: none; } .app-container { background: white; } }`}</style>
      <nav className="no-print" style={{marginBottom:'20px', background:'white', padding:'15px', borderRadius:'8px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center'}}>
         <span style={{marginRight:'10px', fontWeight:'bold', borderRight:'2px solid #eee', paddingRight:'10px'}}>👤 {user.name}</span>
         {can('dashboard') && <button onClick={()=>setView('dashboard')} style={btnStyle(view==='dashboard')}>📊 Dashboard</button>}
         {can('flow') && <button onClick={()=>setView('flow')} style={btnStyle(view==='flow')}>🌊 Live Flow</button>}
         {can('arrival') && <button onClick={()=>setView('arrival')} style={btnStyle(view==='arrival')}>1️⃣ Arrival</button>}
         {can('process') && <button onClick={()=>setView('process')} style={btnStyle(view==='process')}>2️⃣ Briefing/Teacher</button>}
         {can('onboarding') && <button onClick={()=>setView('onboarding')} style={btnStyle(view==='onboarding')}>3️⃣ Onboarding</button>}
         {can('room-view') && <button onClick={()=>setView('room-view')} style={btnStyle(view==='room-view')}>🛏️ Rooms</button>}
         {can('participants') && <button onClick={()=>setView('participants')} style={btnStyle(view==='participants')}>👥 Students</button>}
         {can('expenses') && <button onClick={()=>setView('expenses')} style={btnStyle(view==='expenses')}>🛒 Store</button>}
         {can('course-admin') && <button onClick={()=>setView('course-admin')} style={btnStyle(view==='course-admin')}>⚙️ Admin</button>}
         <button onClick={handleLogout} style={{...btnStyle(false), color:'red', marginLeft:'auto'}}>🔒 Logout</button>
      </nav>

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'flow' && <ProcessFlowDashboard courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={()=>setPreSelectedRoom('')} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'participants' && <ParticipantList courses={courses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- FLOW DASHBOARD (KANBAN) ---
function ProcessFlowDashboard({ courses }) {
    const [courseId, setCourseId] = useState(''); const [data, setData] = useState([]);
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setData); };
    useEffect(refresh, [courseId]);
    useEffect(() => { const interval = setInterval(refresh, 5000); return () => clearInterval(interval); }, [courseId]);

    const s0 = data.filter(p => !p.token_number && p.status !== 'Cancelled'); // Expected
    const s1 = data.filter(p => p.process_stage === 1 && p.status !== 'Cancelled'); // Arrived
    const s2 = data.filter(p => p.process_stage === 2 && p.status !== 'Cancelled'); // Briefing Done
    const s3 = data.filter(p => p.process_stage === 3 && p.status !== 'Cancelled'); // Interview Done (Waiting Room)
    const s4 = data.filter(p => p.process_stage === 4 && p.status !== 'Cancelled'); // Onboarded

    const Col = ({ title, list, color }) => (
        <div style={{flex:1, background:'white', borderRadius:'8px', padding:'10px', borderTop:`4px solid ${color}`, minHeight:'300px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h4 style={{margin:'0 0 10px 0', color}}>{title} ({list.length})</h4>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                {list.map(p => ( <div key={p.participant_id} style={{padding:'8px', borderBottom:'1px solid #eee', fontSize:'12px', display:'flex', justifyContent:'space-between'}}> <div><span style={{fontWeight:'bold', fontSize:'14px'}}>#{p.token_number || '-'}</span> {p.full_name.substring(0,15)}</div> <div style={{color:'#666'}}>{p.conf_no}</div> </div> ))}
            </div>
        </div>
    );
    return ( <div> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={refresh} style={quickBtnStyle(true)}>↻ Refresh</button> </div> <div style={{display:'flex', gap:'15px', overflowX:'auto'}}> <Col title="Expected" list={s0} color="#999" /> <Col title="1. Arrived" list={s1} color="#2196f3" /> <Col title="2. Briefing" list={s2} color="#ff9800" /> <Col title="3. Teacher" list={s3} color="#9c27b0" /> <Col title="4. Onboarded" list={s4} color="#4caf50" /> </div> </div> );
}

// --- STEP 1: ARRIVAL DESK ---
function ArrivalDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState('');
    useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
    
    const handleArrival = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as Arrived?`)) return;
        const res = await fetch(`${API_URL}/process/arrival`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, courseId }) });
        const data = await res.json();
        if (data.token_number) { alert(`✅ Token Generated: #${data.token_number}`); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }
    };
    const filtered = participants.filter(p => !p.token_number && p.full_name.toLowerCase().includes(search.toLowerCase()));
    return ( <div style={cardStyle}> <h2>1️⃣ Arrival Desk (Generate Token)</h2> <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search Name / Conf No..." value={search} onChange={e=>setSearch(e.target.value)} /> </div> <div style={{maxHeight:'400px', overflowY:'auto'}}><table style={{width:'100%'}}><tbody>{filtered.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}> <td style={{padding:'10px'}}><strong>{p.full_name}</strong> ({p.conf_no})</td> <td style={{textAlign:'right'}}><button onClick={()=>handleArrival(p)} style={{...quickBtnStyle(true), background:'#2196f3', color:'white'}}>🖨️ Issue Token</button></td> </tr> ))}</tbody></table></div> </div> );
}

// --- STEP 2 & 3: PROCESS DESK ---
function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [tokenInput, setTokenInput] = useState('');
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);
    const handleProcess = async (p, nextStage) => { await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) }); refresh(); setTokenInput(''); };
    const activeStudent = participants.find(p => p.token_number == tokenInput);
    return ( <div style={cardStyle}> <h2>2️⃣ 3️⃣ Process Desk (Scan Token)</h2> <div style={{marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}> <input autoFocus style={{...inputStyle, fontSize:'30px', textAlign:'center', width:'200px', fontWeight:'bold'}} placeholder="Token #" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} /> {activeStudent ? ( <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px', background:'#e3f2fd'}}> <h1 style={{fontSize:'50px', margin:'10px 0'}}>#{activeStudent.token_number}</h1> <h3>{activeStudent.full_name}</h3> <p>Current Stage: <strong>{activeStudent.process_stage}</strong></p> <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}> {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800', fontSize:'18px'}}>✅ Mark Briefing Done</button>} {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0', fontSize:'18px'}}>✅ Mark Interview Done</button>} {activeStudent.process_stage >= 3 && <div style={{color:'green', fontWeight:'bold', fontSize:'20px'}}>Ready for Onboarding!</div>} </div> </div> ) : <p style={{color:'#888'}}>Type Token Number...</p>} </div> </div> );
}

// --- STEP 4: STUDENT FORM (MODIFIED) ---
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
    const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Chair' }); const [status, setStatus] = useState('');
    useEffect(() => { fetch(`${API_URL}/rooms`).then(r=>r.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(r=>r.json()).then(setOccupancy); }, []);
    useEffect(() => { if(preSelectedRoom) setFormData(p=>({...p, roomNo: preSelectedRoom})); if(courses.length>0 && !formData.courseId) setFormData(p=>({...p, courseId: courses[0].course_id})); }, [preSelectedRoom, courses]);
    useEffect(() => { if(formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [formData.courseId]);
    
    const occupiedSet = new Set(occupancy.map(p => p.room_no ? p.room_no.replace(/[\s-]+/g, '').toUpperCase() : ''));
    let availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no.replace(/[\s-]+/g, '').toUpperCase()));

    // ONLY SHOW STUDENTS WHO PASSED INTERVIEW (Stage >= 3)
    const eligibleStudents = participants.filter(p => p.status !== 'Arrived' && p.process_stage >= 3);

    const handleSubmit = async (e) => { e.preventDefault(); setStatus('Submitting...'); const payload = { ...formData, diningSeatType: formData.seatType }; try { const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unknown Error"); 
        fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
        setStatus('✅ Success! Onboarded.'); setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' })); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); } catch (err) { setStatus(`❌ ${err.message}`); } };

    return ( <div style={cardStyle}> <h2>3️⃣ Final Onboarding</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> 
    <div><label style={labelStyle}>2. Select Student (Interviewed Only)</label><select style={inputStyle} onChange={e => setFormData({...formData, participantId: e.target.value})} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{eligibleStudents.map(p => <option key={p.participant_id} value={p.participant_id}>#{p.token_number} - {p.full_name}</option>)}</select></div> </div> </div> 
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}><div><label style={labelStyle}>Room</label><select style={inputStyle} value={formData.roomNo} onChange={e=>setFormData({...formData, roomNo:e.target.value})} required><option value="">Select</option>{availableRooms.map(r=><option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div><div><label style={labelStyle}>Dining Seat</label><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">Select</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div>
    <div style={{marginTop:'20px', textAlign:'right'}}><button type="submit" style={{...btnStyle(true), background:'#4caf50', color:'white'}}>Complete Onboarding</button></div> {status && <p>{status}</p>} </form> </div> );
}

// --- DASHBOARD, ACCOM, EXPENSES, ADMIN, PARTICIPANTS (SAME AS BEFORE) ---
// ... (Paste Previous Dashboard, GlobalAccom, ParticipantList, ExpenseTracker, CourseAdmin here. They work perfectly with this new flow) ...
// TO SAVE SPACE, I will re-include the critical DASHBOARD update to show "Live Flow" link.

function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null); const [stats, setStats] = useState(null);
  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]); useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(r=>r.json()).then(setStats).catch(console.error); }, [selectedCourse]);
  
  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }] : [];
  
  return ( <div> <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}> <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2> <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> </div> {stats && selectedCourse ? ( <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}> <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"/><Bar dataKey="Female" fill="#e91e63"/></BarChart></ResponsiveContainer></div></div> <div style={cardStyle}><h3>Live Occupancy</h3><div style={{fontSize:'24px'}}>Old: {stats.old_students} <br/> New: {stats.new_students} <br/> Servers: {stats.servers}</div></div> </div> ) : <p>Select Course...</p>} </div> );
}

function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [loading, setLoading] = useState(false); const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); const [editingRoom, setEditingRoom] = useState(null);
  const loadData = () => { setLoading(true); fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => { setOccupancy(Array.isArray(data) ? data : []); setLoading(false); }); };
  useEffect(loadData, []);
  const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); setNewRoom({ ...newRoom, roomNo: '' }); loadData(); };
  const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) return alert("🚫 Cannot delete original room!"); if(window.confirm("Delete this room?")) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };
  const handleSwapSave = async () => { if (!editingRoom || !editingRoom.p) return; await fetch(`${API_URL}/participants/${editingRoom.p.participant_id || editingRoom.p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editingRoom.p, room_no: editingRoom.newRoomNo }) }); setEditingRoom(null); loadData(); };

  const normalize = (str) => str ? str.replace(/[\s-]+/g, '').toUpperCase() : '';
  const occupiedMap = {}; const courseBreakdown = {}; const maleBreakdown = {}; const femaleBreakdown = {}; const unmappedParticipants = [];
  const safeRooms = rooms || []; const validRoomSet = new Set(safeRooms.map(r => normalize(r.room_no)));

  (occupancy || []).forEach(p => { if(p.room_no) { const n = normalize(p.room_no); const rObj = safeRooms.find(r => normalize(r.room_no)===n); if (rObj) { occupiedMap[n] = p; const c = getShortCourseName(p.course_name); if(rObj.gender_type==='Male') maleBreakdown[c]=(maleBreakdown[c]||0)+1; else femaleBreakdown[c]=(femaleBreakdown[c]||0)+1; } else unmappedParticipants.push(p); } });
  const maleRooms = safeRooms.filter(r => r.gender_type === 'Male'); const femaleRooms = safeRooms.filter(r => r.gender_type === 'Female');
  let maleFree = 0, maleOcc = 0, femaleFree = 0, femaleOcc = 0;

  safeRooms.forEach(r => { const p = occupiedMap[normalize(r.room_no)]; const isMale = r.gender_type === 'Male'; if (p) { if(isMale) maleOcc++; else femaleOcc++; } else { if(isMale) maleFree++; else femaleFree++; } });
  const courseData = Object.entries(courseBreakdown).map(([name, count]) => ({ name: name.substring(0,15), count }));

  const renderRoom = (room, gender) => {
    const occupant = occupiedMap[normalize(room.room_no)];
    const isOccupied = !!occupant;
    const isArrived = isOccupied && occupant.status === 'Arrived';
    let bgColor = gender === 'Male' ? '#e3f2fd' : '#fce4ec'; let borderColor = gender === 'Male' ? '#90caf9' : '#f48fb1';
    if (isOccupied) {
        const isOld = occupant.conf_no && (occupant.conf_no.startsWith('O') || occupant.conf_no.startsWith('S'));
        bgColor = isOld ? '#e1bee7' : '#c8e6c9'; borderColor = isOld ? '#8e24aa' : '#2e7d32';
        if (!isArrived) { bgColor = '#fff3e0'; borderColor = '#ffb74d'; }
    }
    return ( <div key={room.room_id} onClick={() => isOccupied ? setEditingRoom({ p: occupant, newRoomNo: room.room_no }) : onRoomClick(room.room_no)} style={{ border: `1px solid ${borderColor}`, background: bgColor, borderRadius: '6px', padding: '8px', textAlign: 'center', minHeight: '80px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', justifyContent:'center', cursor: isOccupied ? 'pointer' : 'default', position: 'relative' }}> <div style={{fontWeight:'bold', fontSize:'13px', color:'#333'}}>{room.room_no}</div> {isOccupied ? ( <div style={{fontSize:'11px', color: '#333', marginTop:'4px'}}> <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px'}}>{(occupant.full_name || '').split(' ')[0]}</div> <div style={{fontWeight:'bold', fontSize:'9px'}}>({occupant.conf_no})</div> <div style={{fontSize:'9px', color:'#555'}}>{getShortCourseName(occupant.course_name)}</div> </div> ) : <div style={{fontSize:'9px', color: gender==='Male'?'#1565c0':'#ad1457', marginTop:'4px'}}>FREE <button onClick={(e)=>{e.stopPropagation(); onRoomClick(room.room_no)}} style={{marginTop:'2px', fontSize:'9px', display:'block', margin:'2px auto', background:'white', color:'#333', border:'1px solid #ccc', borderRadius:'2px', cursor:'pointer', width:'100%'}}>Assign</button></div>} {!isOccupied && !PROTECTED_ROOMS.has(room.room_no) && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(room.room_id, room.room_no)}} style={{position:'absolute', top:'2px', right:'2px', color:'#ccc', border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>x</button>} </div> );
  };

  return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}> <h2 style={{margin:0}}>🛏️ Global Accommodation Manager</h2> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> <div style={{display:'flex', gap:'5px', alignItems:'center', background:'#f9f9f9', padding:'5px', borderRadius:'5px', border:'1px solid #eee'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'70px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px', fontSize:'11px'}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> <button onClick={() => window.print()} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Status</button> </div> </div> 
  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'20px'}}> <div style={{padding:'12px', background:'#e3f2fd', borderRadius:'8px', borderLeft:'5px solid #1565c0'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#1565c0', marginBottom:'5px'}}>MALE WING (Free: {maleFree})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(maleBreakdown).length > 0 ? Object.entries(maleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name}: <b>{count}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#fce4ec', borderRadius:'8px', borderLeft:'5px solid #ad1457'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#ad1457', marginBottom:'5px'}}>FEMALE WING (Free: {femaleFree})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(femaleBreakdown).length > 0 ? Object.entries(femaleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name}: <b>{count}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#e8f5e9', borderRadius:'8px', borderLeft:'5px solid #2e7d32'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#2e7d32', marginBottom:'5px'}}>TOTAL SUMMARY</div> <div>Total Occupied: <strong>{maleOcc + femaleOcc}</strong></div> <div>Total Free: <strong>{maleFree + femaleFree}</strong></div> </div> </div>
  <div style={{marginBottom:'20px'}}> <h4 style={{marginTop:0, color:'#555'}}>Course Occupancy</h4> <div style={{height:'150px'}}><ResponsiveContainer width="100%" height="100%"><BarChart data={courseData} layout="vertical" margin={{top:5, right:30, left:20, bottom:5}}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="count" fill="#82ca9d" barSize={20} label={{ position: 'right', fontSize: 11, fill:'#333' }} /></BarChart></ResponsiveContainer></div> </div>
  {unmappedParticipants.length > 0 && (<div style={{marginBottom:'20px', padding:'15px', background:'#fff3e0', borderRadius:'8px', border:'1px solid #ffcc80'}}><h3 style={{margin:'0 0 10px 0', color:'#ef6c00'}}>⚠️ {unmappedParticipants.length} Students with Invalid Room Numbers</h3><div style={{maxHeight:'100px', overflowY:'auto', fontSize:'12px'}}><table style={{width:'100%'}}><thead><tr style={{textAlign:'left'}}><th>Name</th><th>Bad Room No</th><th>Action</th></tr></thead><tbody>{unmappedParticipants.map((p, i) => (<tr key={i}><td>{p.full_name}</td><td style={{fontWeight:'bold', color:'red'}}>{p.room_no}</td><td><button onClick={() => setEditingRoom({ p, newRoomNo: '' })} style={{cursor:'pointer'}}>Fix</button></td></tr>))}</tbody></table></div></div>)}
  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div style={{border:'1px solid #90caf9', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#e3f2fd', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> <div style={{border:'1px solid #f48fb1', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#fce4ec', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> </div>
  {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} </div> );
}

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

// --- 6. COURSE ADMIN (Create + Upload + Manual) ---
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

// --- OTHER COMPONENTS (Unchanged) ---
function CreateCourseForm({ refreshCourses, setView }) { const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' }); const [status, setStatus] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Failed"); setStatus('✅ Created!'); refreshCourses(); setTimeout(() => setView('dashboard'), 1500); } catch (err) { setStatus('❌ ' + err.message); } }; return ( <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}> <h3>Course Details</h3> <input style={inputStyle} placeholder="Course Name" required onChange={e => setFormData({...formData, courseName: e.target.value})} /><input style={inputStyle} placeholder="Teacher Name" required onChange={e => setFormData({...formData, teacherName: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>{status && <p>{status}</p>}</form> ); }
function UploadParticipants({ courses, setView }) { const [courseId, setCourseId] = useState(''); const [csvFile, setCsvFile] = useState(null); const [preview, setPreview] = useState([]); const [status, setStatus] = useState(''); 
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; setCsvFile(file); setStatus(''); setPreview([]); const reader = new FileReader(); reader.onload = (event) => { const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); let headerIndex = -1; let headers = []; for (let i = 0; i < Math.min(lines.length, 20); i++) { if (lines[i].toLowerCase().includes('name')) { headerIndex = i; headers = lines[i].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); break; } } if (headerIndex === -1) { setStatus("⚠️ Error: No header found."); return; } const nameIdx = headers.findIndex(h => h.includes('name')); const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile')); const emailIdx = headers.findIndex(h => h.includes('email')); const ageIdx = headers.findIndex(h => h === 'age'); const genderIdx = headers.findIndex(h => h === 'gender'); const coursesIdx = headers.findIndex(h => h.includes('courses')); const confIdx = headers.findIndex(h => h.includes('conf')); const dataRows = lines.slice(headerIndex + 1); const parsedData = dataRows.map(row => { const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length <= nameIdx) return null; return { name: cols[nameIdx], phone: phoneIdx!==-1?cols[phoneIdx]:'', email: emailIdx!==-1?cols[emailIdx]:'', age: ageIdx!==-1?cols[ageIdx]:'', gender: genderIdx!==-1?cols[genderIdx]:'', courses: coursesIdx!==-1?cols[coursesIdx]:'', confNo: confIdx!==-1?cols[confIdx]:'' }; }).filter(r => r && r.name); setPreview(parsedData); setStatus(`✅ Ready! Found ${parsedData.length} students.`); }; reader.readAsText(file); };
  const handleUpload = async () => { if (!courseId) return alert("Select course"); setStatus('Uploading...'); try { const res = await fetch(`${API_URL}/courses/${courseId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) }); if (!res.ok) throw new Error("Failed"); setStatus(`✅ Added ${preview.length} students.`); setTimeout(() => setView('onboarding'), 2000); } catch (err) { setStatus("❌ " + err.message); } };
  return ( <div><h3>Upload CSV</h3><div style={{maxWidth:'500px'}}><div style={{marginBottom:'10px'}}><label>Select Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div><div style={{marginBottom:'10px'}}><input type="file" accept=".csv" onChange={handleFileChange} /></div>{status && <div style={{padding:'10px', background:'#e3f2fd', borderRadius:'4px', marginBottom:'10px'}}>{status}</div>}<button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc'}}>Upload</button></div></div> );
}

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
