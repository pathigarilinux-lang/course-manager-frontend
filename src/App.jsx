import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

// --- UTILS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"]);

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
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } }`}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Zero Day Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>🩺 Teacher Assistant</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Global Accommodation</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Student Onboarding</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store & Finance</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <TeacherAssistantPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- 1. ZERO DAY DASHBOARD (WITH ALERT FEED & NO-SHOW TOOLS) ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { 
    if (selectedCourse) {
        fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error);
        fetch(`${API_URL}/alerts`).then(res => res.json()).then(setAlerts).catch(console.error);
    } 
  }, [selectedCourse]);

  const handleAutoNoShow = async () => {
     if (!window.confirm("⚠️ Are you sure? This will mark ALL pending students as 'No-Show'. This cannot be undone easily.")) return;
     await fetch(`${API_URL}/courses/${selectedCourse}/auto-noshow`, { method: 'POST' });
     alert("✅ Process Complete.");
     window.location.reload();
  };

  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }, { name: 'Cancelled', Male: stats.cancelled_m, Female: stats.cancelled_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }, { name: 'Server', Male: stats.sm, Female: stats.sf }] : [];
  const occData = stats ? [{ name: 'Old', value: stats.old_students, color: '#2e7d32' }, { name: 'New', value: stats.new_students, color: '#ef6c00' }, { name: 'Servers', value: stats.servers, color: '#1565c0' }] : [];

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={handleAutoNoShow} style={{background:'#d32f2f', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}>🚫 Auto-Flag No-Shows</button>
            <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px'}}>
         
         {/* LEFT: CHARTS */}
         {stats && selectedCourse ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}>
              <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top"/></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top"/></Bar></BarChart></ResponsiveContainer></div></div>
              <div style={cardStyle}><h3 style={{marginTop:0}}>Applicant Types</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top"/></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top"/></Bar></BarChart></ResponsiveContainer></div></div>
              <div style={{gridColumn: 'span 2', ...cardStyle}}>
                 <h3 style={{marginTop:0}}>Live Occupancy</h3>
                 <div style={{display:'flex', justifyContent:'space-around', textAlign:'center'}}>
                    <div><div style={{fontSize:'24px', color:'#2e7d32', fontWeight:'bold'}}>{stats.old_students}</div><div style={{fontSize:'12px'}}>Old</div></div>
                    <div><div style={{fontSize:'24px', color:'#ef6c00', fontWeight:'bold'}}>{stats.new_students}</div><div style={{fontSize:'12px'}}>New</div></div>
                    <div><div style={{fontSize:'24px', color:'#1565c0', fontWeight:'bold'}}>{stats.servers}</div><div style={{fontSize:'12px'}}>Servers</div></div>
                 </div>
              </div>
            </div>
         ) : <p>Loading Stats...</p>}

         {/* RIGHT: PRIORITY ALERT FEED */}
         <div style={{...cardStyle, height:'fit-content', border:'2px solid #ffb74d'}}>
            <h3 style={{marginTop:0, color:'#e65100'}}>⚠️ Priority Alerts</h3>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
               {alerts.length === 0 ? <p style={{color:'#888'}}>No active alerts.</p> : (
                  <ul style={{listStyle:'none', padding:0}}>
                     {alerts.map((a, i) => (
                        <li key={i} style={{background:'#fff3e0', padding:'10px', borderRadius:'5px', marginBottom:'8px', borderLeft:'4px solid #e65100'}}>
                           <div style={{fontWeight:'bold'}}>{a.full_name} ({a.conf_no})</div>
                           {a.medical_info && <div style={{fontSize:'11px', color:'#c62828'}}>🏥 {a.medical_info}</div>}
                           {a.evening_food && <div style={{fontSize:'11px', color:'#ef6c00'}}>🍛 {a.evening_food}</div>}
                           {a.teacher_notes && <div style={{fontSize:'11px', color:'#1565c0'}}>📝 {a.teacher_notes}</div>}
                        </li>
                     ))}
                  </ul>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

// --- 2. TEACHER ASSISTANT PANEL ---
function TeacherAssistantPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleSaveInputs = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent)
    });
    setEditingStudent(null);
    fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants);
  };

  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={cardStyle}>
      <h2>🩺 Teacher Assistant Panel</h2>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <input style={inputStyle} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
      </div>

      {courseId && (
        <div style={{maxHeight:'500px', overflowY:'auto'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}>
               <th style={{padding:'10px'}}>Name</th><th style={{padding:'10px'}}>Conf</th><th style={{padding:'10px'}}>Evening Food</th><th style={{padding:'10px'}}>Medical Info</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>
               {filtered.map(p => (
                 <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                   <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td>
                   <td style={{padding:'10px'}}>{p.conf_no}</td>
                   <td style={{padding:'10px', color: p.evening_food ? '#e65100' : '#ccc', fontWeight: p.evening_food ? 'bold' : 'normal'}}>{p.evening_food || '-'}</td>
                   <td style={{padding:'10px', color: p.medical_info ? '#c62828' : '#ccc', fontWeight: p.medical_info ? 'bold' : 'normal'}}>{p.medical_info || '-'}</td>
                   <td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={quickBtnStyle(true)}>✏️ Edit Inputs</button></td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {editingStudent && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
          <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}>
            <h3>Update Student Inputs</h3>
            <p>Student: <strong>{editingStudent.full_name}</strong></p>
            <form onSubmit={handleSaveInputs} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
               <div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e=>setEditingStudent({...editingStudent, evening_food: e.target.value})}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option><option value="Other">Other</option></select></div>
               <div><label style={labelStyle}>Medical Info</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e=>setEditingStudent({...editingStudent, medical_info: e.target.value})} placeholder="Allergies, back pain, etc." /></div>
               <div><label style={labelStyle}>Teacher Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e=>setEditingStudent({...editingStudent, teacher_notes: e.target.value})} placeholder="Internal notes" /></div>
               <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                 <button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Save</button>
                 <button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. GLOBAL ACCOMMODATION MANAGER ---
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

  (occupancy || []).forEach(p => { if(p.room_no) { const n = normalize(p.room_no); const rObj = safeRooms.find(r => normalize(r.room_no)===n); if (rObj) { occupiedMap[n] = p; const c = p.course_name || 'Unknown'; courseBreakdown[c] = (courseBreakdown[c] || 0) + 1; if(rObj.gender_type==='Male') maleBreakdown[c]=(maleBreakdown[c]||0)+1; else femaleBreakdown[c]=(femaleBreakdown[c]||0)+1; } else unmappedParticipants.push(p); } });
  const maleRooms = safeRooms.filter(r => r.gender_type === 'Male'); const femaleRooms = safeRooms.filter(r => r.gender_type === 'Female');
  let maleFree = 0, maleOcc = 0, femaleFree = 0, femaleOcc = 0;
  safeRooms.forEach(r => { const p = occupiedMap[normalize(r.room_no)]; const isMale = r.gender_type === 'Male'; if (p) { if(isMale) maleOcc++; else femaleOcc++; } else { if(isMale) maleFree++; else femaleFree++; } });

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
    return ( <div key={room.room_id} onClick={() => isOccupied ? setEditingRoom({ p: occupant, newRoomNo: room.room_no }) : onRoomClick(room.room_no)} style={{ border: `1px solid ${borderColor}`, background: bgColor, borderRadius: '6px', padding: '8px', textAlign: 'center', minHeight: '80px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', justifyContent:'center', cursor: isOccupied ? 'pointer' : 'default', position: 'relative' }}> <div style={{fontWeight:'bold', fontSize:'13px', color:'#333'}}>{room.room_no}</div> {isOccupied ? ( <div style={{fontSize:'11px', color: '#333', marginTop:'4px'}}> <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px'}}>{(occupant.full_name || '').split(' ')[0]}</div> <div style={{fontWeight:'bold', fontSize:'9px'}}>({occupant.conf_no})</div> <div style={{fontSize:'9px', color:'#555'}}>{occupant.course_name ? occupant.course_name.substring(0,10)+'..' : ''}</div> </div> ) : <div style={{fontSize:'9px', color: gender==='Male'?'#1565c0':'#ad1457', marginTop:'4px'}}>FREE <button onClick={(e)=>{e.stopPropagation(); onRoomClick(room.room_no)}} style={{marginTop:'2px', fontSize:'9px', display:'block', margin:'2px auto', background:'white', color:'#333', border:'1px solid #ccc', borderRadius:'2px', cursor:'pointer', width:'100%'}}>Assign</button></div>} {!isOccupied && !PROTECTED_ROOMS.has(room.room_no) && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(room.room_id, room.room_no)}} style={{position:'absolute', top:'2px', right:'2px', color:'#ccc', border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>x</button>} </div> );
  };

  return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}> <h2 style={{margin:0}}>🛏️ Global Accommodation Manager</h2> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> <div style={{display:'flex', gap:'5px', alignItems:'center', background:'#f9f9f9', padding:'5px', borderRadius:'5px', border:'1px solid #eee'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'70px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px', fontSize:'11px'}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> <button onClick={() => window.print()} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Status</button> </div> </div> 
  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'20px'}}> <div style={{padding:'12px', background:'#e3f2fd', borderRadius:'8px', borderLeft:'5px solid #1565c0'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#1565c0', marginBottom:'5px'}}>MALE WING (Free: {maleFree})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(maleBreakdown).length > 0 ? Object.entries(maleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name.substring(0,10)}: <b>{count}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#fce4ec', borderRadius:'8px', borderLeft:'5px solid #ad1457'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#ad1457', marginBottom:'5px'}}>FEMALE WING (Free: {femaleFree})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(femaleBreakdown).length > 0 ? Object.entries(femaleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name.substring(0,10)}: <b>{count}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#e8f5e9', borderRadius:'8px', borderLeft:'5px solid #2e7d32'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#2e7d32', marginBottom:'5px'}}>TOTAL SUMMARY</div> <div>Total Occupied: <strong>{maleOcc + femaleOcc}</strong></div> <div>Total Free: <strong>{maleFree + femaleFree}</strong></div> </div> </div>
  {unmappedParticipants.length > 0 && (<div style={{marginBottom:'20px', padding:'15px', background:'#fff3e0', borderRadius:'8px', border:'1px solid #ffcc80'}}><h3 style={{margin:'0 0 10px 0', color:'#ef6c00'}}>⚠️ {unmappedParticipants.length} Students with Invalid Room Numbers</h3><div style={{maxHeight:'100px', overflowY:'auto', fontSize:'12px'}}><table style={{width:'100%'}}><thead><tr style={{textAlign:'left'}}><th>Name</th><th>Bad Room No</th><th>Action</th></tr></thead><tbody>{unmappedParticipants.map((p, i) => (<tr key={i}><td>{p.full_name}</td><td style={{fontWeight:'bold', color:'red'}}>{p.room_no}</td><td><button onClick={() => setEditingRoom({ p, newRoomNo: '' })} style={{cursor:'pointer'}}>Fix</button></td></tr>))}</tbody></table></div></div>)}
  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div style={{border:'1px solid #90caf9', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#e3f2fd', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> <div style={{border:'1px solid #f48fb1', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#fce4ec', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> </div>
  {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} </div> );
}

// --- 3. STUDENT FORM (ONBOARDING WITH TA ALERTS + SMS) ---
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [selectedStudent, setSelectedStudent] = useState(null); const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', dhammaSeat: '', specialSeating: 'None', seatType: 'Floor' }); const [status, setStatus] = useState('');
  const [notify, setNotify] = useState(true); // Send Email/SMS?

  useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(data => setRooms(Array.isArray(data)?data:[])); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(Array.isArray(data)?data:[])); }, []);
  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) { fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); } }, [formData.courseId]);
  const occupiedSet = new Set(occupancy.map(p => p.room_no ? p.room_no.replace(/[\s-]+/g, '').toUpperCase() : ''));
  let availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no.replace(/[\s-]+/g, '').toUpperCase()));
  if (selectedStudent && selectedStudent.gender) { const g = selectedStudent.gender.toLowerCase(); if (g === 'male') availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); else if (g === 'female') availableRooms = availableRooms.filter(r => r.gender_type === 'Female'); }
  const studentsPending = participants.filter(p => p.status !== 'Arrived');
  const handleStudentChange = (e) => { const selectedId = e.target.value; const student = participants.find(p => p.participant_id == selectedId); setSelectedStudent(student); setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); };
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); setStatus('Submitting...'); 
    const payload = { ...formData, diningSeatType: formData.seatType }; 
    try { 
        const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
        const data = await res.json(); 
        if (!res.ok) throw new Error(data.error || "Unknown Error");
        
        // TRIGGER NOTIFICATION
        if (notify) {
            fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
        }

        setStatus('✅ Success! Welcome Email Sent.'); 
        setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', dhammaSeat: '', specialSeating: 'None', seatType: 'Floor' })); 
        setSelectedStudent(null); clearRoom(); 
        fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); 
    } catch (err) { setStatus(`❌ ${err.message}`); } 
  };
  
  const sectionHeader = (title) => <div style={{fontSize:'14px', fontWeight:'bold', color:'#007bff', borderBottom:'1px solid #eee', paddingBottom:'5px', marginTop:'15px', marginBottom:'10px'}}>{title}</div>;

  return ( <div style={cardStyle}> <h2>📝 Student Onboarding Form</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>2. Select Student</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{studentsPending.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div> </div> 
  {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ SPECIAL ATTENTION:</strong> {selectedStudent.evening_food && <div>🍛 Food: {selectedStudent.evening_food}</div>} {selectedStudent.medical_info && <div>🏥 Medical: {selectedStudent.medical_info}</div>}</div>)} </div> 
  {sectionHeader("📍 Allocation Details")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle, background:'#f0f0f0'}} value={formData.confNo} readOnly /></div> <div><label style={labelStyle}>🛏️ Room No</label><select style={{...inputStyle, background: preSelectedRoom ? '#e8f5e9' : 'white'}} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required><option value="">-- Select Free Room --</option>{preSelectedRoom && <option value={preSelectedRoom}>{preSelectedRoom} (Selected)</option>}{availableRooms.map(r => <option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div> <div><label style={labelStyle}>🍽️ Dining Seat</label><div style={{display:'flex', gap:'5px'}}><select style={{...inputStyle, width:'80px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Floor</option><option>Chair</option></select><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">No</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div> </div> {sectionHeader("🧘 Hall & Meditation")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🗣️ Discourse Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Malayalam</option><option>Gujarati</option><option>Odia</option><option>Bengali</option><option>Mandarin Chinese</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Vietnamese</option><option>Thai</option><option>Japanese</option></select></div> <div><label style={labelStyle}>🛖 Pagoda Cell</label><select style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> </div> {sectionHeader("🔐 Lockers & Other")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>📱 Mobile Locker</label><select style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💍 Val Locker</label><select style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>🧺 Laundry Token</label><select style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💻 Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> <div><label style={labelStyle}>💺 Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> </div> <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'15px', alignItems:'center'}}> <label style={{fontSize:'12px'}}><input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} /> Send Welcome SMS/Email</label> <button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 6px rgba(0,123,255,0.2)'}}>Confirm & Save</button> </div> {status && <div style={{marginTop:'15px', padding:'10px', borderRadius:'6px', background: status.includes('Success') ? '#d4edda' : '#f8d7da', color: status.includes('Success') ? '#155724' : '#721c24', textAlign:'center', fontWeight:'bold'}}>{status}</div>} </form> </div> );
}

// --- 4. MANAGE STUDENTS ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState(''); const [editingStudent, setEditingStudent] = useState(null); const [viewingStudent, setViewingStudent] = useState(null); const [viewAllMode, setViewAllMode] = useState(false); const [viewMode, setViewMode] = useState('list'); const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [swappingSeat, setSwappingSeat] = useState(null); const [newSeatNo, setNewSeatNo] = useState('');
  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Courses", "Age", "Gender", "Dining Seat", "Dining Type", "Room", "Pagoda", "Language", "Status"]; const rows = participants.map(p => [`"${p.full_name}"`, p.conf_no, `"${p.courses_info}"`, p.age, p.gender, p.dining_seat_no, p.dining_seat_type, p.room_no, p.pagoda_cell_no, p.discourse_language, p.status]); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `students_course_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const sortedList = React.useMemo(() => { let sortableItems = [...participants]; if (sortConfig.key) { sortableItems.sort((a, b) => { const valA = (a[sortConfig.key] || '').toString().toLowerCase(); const valB = (b[sortConfig.key] || '').toString().toLowerCase(); if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } return sortableItems.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())); }, [participants, sortConfig, search]);
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students/expenses?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE COMPLETELY?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleCancelStudent = async (student) => { if (!window.confirm(`Mark ${student.full_name} as Cancelled?`)) return; const updatedData = { ...student, status: 'Cancelled', room_no: null, dining_seat_no: null, pagoda_cell_no: null, laundry_token_no: null }; await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) }); loadStudents(); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleSeatSwapSave = async () => { if (!swappingSeat || !swappingSeat.p) return; await fetch(`${API_URL}/participants/${swappingSeat.p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...swappingSeat.p, dhamma_hall_seat_no: newSeatNo }) }); setSwappingSeat(null); loadStudents(); };
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || 'Course';
  const getCategory = (seatNo) => { if (!seatNo) return '-'; const s = seatNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF')) return 'Old'; if (s.startsWith('NM') || s.startsWith('NF')) return 'New'; if (s.startsWith('SM') || s.startsWith('SF')) return 'DS'; return 'New'; };
  const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = confNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 1; return 2; };
  const parseCourses = (str) => { if (!str) return { s: 0, l: 0, seva: 0 }; const s = str.match(/S:\s*(\d+)/); const l = str.match(/L:\s*(\d+)/); const sv = str.match(/Seva:\s*(\d+)/); return { s: s ? parseInt(s[1]) : 0, l: l ? parseInt(l[1]) : 0, seva: sv ? parseInt(sv[1]) : 0 }; };
  const getSeniorityScore = (p) => { const c = parseCourses(p.courses_info); return (c.l * 10000) + (c.s * 10) + (c.seva * 0.1); };
  const FEMALE_COLS = 7; const FEMALE_ROWS = 7; const MALE_COLS = 10; const MALE_ROWS = 8;
  const handleAutoAssign = async () => { if (!window.confirm("⚡ Overwrite Dhamma Hall Seats?")) return; let males = participants.filter(p => p.gender && p.gender.toLowerCase() === 'male' && p.status === 'Arrived'); let females = participants.filter(p => p.gender && p.gender.toLowerCase() === 'female' && p.status === 'Arrived'); const sortGroup = (group) => { const oldS = group.filter(p => p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'))).sort((a,b) => getSeniorityScore(b) - getSeniorityScore(a)); const newS = group.filter(p => !p.conf_no || p.conf_no.startsWith('N')).sort((a,b) => (parseInt(b.age)||0) - (parseInt(a.age)||0)); return [...oldS, ...newS]; }; males = sortGroup(males); females = sortGroup(females); const updates = []; males.forEach((p, i) => { if (i < MALE_COLS * MALE_ROWS) { const row = String.fromCharCode(65 + Math.floor(i/MALE_COLS)); const col = (i % MALE_COLS) + 1; updates.push({ ...p, dhamma_hall_seat_no: `${row}${col}` }); } }); females.forEach((p, i) => { if (i < FEMALE_COLS * FEMALE_ROWS) { const row = String.fromCharCode(65 + Math.floor(i/FEMALE_COLS)); const col = (i % FEMALE_COLS) + 1; updates.push({ ...p, dhamma_hall_seat_no: `${row}${col}` }); } }); for (const p of updates) { await fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); } alert("✅ Seats Assigned!"); loadStudents(); };
  if (viewAllMode) { return ( <div style={{background:'white', padding:'20px', height:'100vh', overflow:'auto'}}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Master List</button> </div> <h2 style={{textAlign:'center'}}>Master Student List - {selectedCourseName}</h2> <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}> <thead><tr style={{background:'#f0f0f0', borderBottom:'2px solid #000'}}><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Phone</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th><th style={thPrint}>Pagoda</th><th style={thPrint}>Dhamma</th><th style={thPrint}>Status</th></tr></thead> <tbody> {participants.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #ddd'}}> <td style={{padding:'8px'}}>{p.full_name}</td> <td style={{padding:'8px'}}>{p.conf_no}</td> <td style={{padding:'8px'}}>{p.age}</td> <td style={{padding:'8px'}}>{p.gender}</td> <td style={{padding:'8px'}}>{p.phone_number}</td> <td style={{padding:'8px'}}>{p.room_no}</td> <td style={{padding:'8px'}}>{p.dining_seat_no} ({p.dining_seat_type})</td> <td style={{padding:'8px'}}>{p.pagoda_cell_no}</td> <td style={{padding:'8px'}}>{p.dhamma_hall_seat_no}</td> <td style={{padding:'8px'}}>{p.status}</td> </tr> ))} </tbody> </table> </div> ); }
  if (viewMode === 'dining') { const sorted = participants.filter(p => p.status==='Arrived').sort((a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return (a.dining_seat_no || 'Z').localeCompare(b.dining_seat_no || 'Z'); }); return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Sheet</button></div><div style={{textAlign:'center'}}><h1>Dining Seating Chart</h1><h3>{selectedCourseName}</h3></div><table style={{width:'100%', borderCollapse:'collapse', fontSize:'16px'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Seat</th><th style={thPrint}>Type</th><th style={thPrint}>Cat</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Pagoda</th><th style={thPrint}>Lang</th></tr></thead><tbody>{sorted.map(p=>(<tr key={p.participant_id} style={{borderBottom:'1px solid #ddd'}}><td style={{padding:'12px', fontWeight:'bold'}}>{p.dining_seat_no}</td><td style={{padding:'12px'}}>{p.dining_seat_type === 'F' ? 'Floor' : 'Chair'}</td><td style={{padding:'12px'}}>{getCategory(p.conf_no)}</td><td style={{padding:'12px'}}>{p.full_name}</td><td style={{padding:'12px'}}>{p.room_no}</td><td style={{padding:'12px'}}>{p.pagoda_cell_no}</td><td style={{padding:'12px'}}>{p.discourse_language}</td></tr>))}</tbody></table></div> ); }
  if (viewMode === 'seating') { 
    const males = participants.filter(p => p.gender==='Male' && p.dhamma_hall_seat_no && p.status==='Arrived');
    const females = participants.filter(p => p.gender==='Female' && p.dhamma_hall_seat_no && p.status==='Arrived');
    const maleMap = {}; males.forEach(p => maleMap[p.dhamma_hall_seat_no] = p);
    const femaleMap = {}; females.forEach(p => femaleMap[p.dhamma_hall_seat_no] = p);
    const SeatBox = ({ p, label }) => { const isOld = p && p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S')); return ( <div onClick={() => setSwappingSeat({ p, label })} style={{border:'1px solid #ccc', background: p ? (isOld ? '#fff9c4' : 'white') : '#f0f0f0', height:'60px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', textAlign:'center', cursor:'pointer'}}> {p ? (<><div style={{fontWeight:'bold', fontSize:'13px', color:'#007bff'}}>{p.dhamma_hall_seat_no}</div><div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'90%'}}>{(p.full_name || '').substring(0, 10)}</div><div style={{fontSize:'9px'}}>{p.conf_no}</div><div style={{fontSize:'8px', color:'#666'}}>P:{p.pagoda_cell_no} D:{p.dining_seat_no}</div></>) : <span style={{color:'#ccc'}}>{label}</span>} </div> ); };
    const renderGrid = (map, cols, rows) => { let grid = []; for (let r = 0; r < rows; r++) { let rowCells = []; const rowChar = String.fromCharCode(65 + r); for (let c = 0; c < cols; c++) { const seatLabel = `${rowChar}${c+1}`; const student = map[seatLabel]; rowCells.push(<SeatBox key={seatLabel} p={student} label={seatLabel} />); } grid.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'5px', marginBottom:'5px'}}>{rowCells}</div>); } return grid; };
    return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><div style={{display:'flex', gap:'10px'}}><button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800', color:'white'}}>⚡ Auto-Assign Seats</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Plan (A3)</button></div></div><div className="print-area"><div style={{textAlign:'center', marginBottom:'20px', borderBottom:'2px solid #333', paddingBottom:'10px'}}><h1>DHAMMA HALL SEATING</h1><h3>{selectedCourseName}</h3></div><div style={{display:'flex', gap:'40px'}}><div style={{flex:'0 0 55%'}}><h3 style={{textAlign:'center', background:'#e3f2fd', padding:'5px', margin:'0 0 10px 0'}}>MALE SIDE</h3>{renderGrid(maleMap, MALE_COLS, MALE_ROWS)}<div style={{marginTop:'15px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}><h4 style={{textAlign:'center', margin:'5px'}}>Chowky/Chair (Special)</h4>{renderGrid(maleMap, 6, 2)}</div></div><div style={{flex:'0 0 5%', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px dashed #ccc', borderRight:'1px dashed #ccc'}}><div style={{writingMode:'vertical-rl', textOrientation:'upright', letterSpacing:'5px', color:'#ccc', fontWeight:'bold'}}>AISLE</div></div><div style={{flex:'0 0 40%'}}><h3 style={{textAlign:'center', background:'#fce4ec', padding:'5px', margin:'0 0 10px 0'}}>FEMALE SIDE</h3>{renderGrid(femaleMap, FEMALE_COLS, FEMALE_ROWS)}</div></div></div>{swappingSeat && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}><h3>💺 Seat Manager</h3>{swappingSeat.p ? (<div><p><strong>Student:</strong> {swappingSeat.p.full_name}</p><p><strong>Current Seat:</strong> {swappingSeat.label}</p></div>) : <p><strong>Empty Seat:</strong> {swappingSeat.label}</p>}<div style={{marginTop:'15px'}}><label style={labelStyle}>Assign/Change to Seat No:</label><input style={inputStyle} value={newSeatNo} onChange={e=>setNewSeatNo(e.target.value)} placeholder="e.g. C5" /></div><div style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={handleSeatSwapSave} disabled={!swappingSeat.p} style={{...btnStyle(true), background: swappingSeat.p ? '#28a745' : '#ccc', color:'white', flex:1}}>Update</button><button onClick={() => {setSwappingSeat(null); setNewSeatNo('');}} style={{...btnStyle(false), flex:1}}>Close</button></div></div></div>)}</div> );
  }

  return ( <div style={cardStyle}> <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} /></div><div style={{display:'flex', gap:'5px'}}><button onClick={() => setViewAllMode(true)} disabled={!courseId} style={{...quickBtnStyle(true), background:'#6c757d', color:'white'}}>👁️ View All</button><button onClick={handleExport} disabled={!courseId} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>📥 Export CSV</button><button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining Sheet</button><button onClick={() => setViewMode('seating')} disabled={!courseId} style={quickBtnStyle(true)}>🧘 Dhamma Plan</button></div></div>
  {courseId && (<div style={{background:'#fff5f5', border:'1px solid #feb2b2', padding:'10px', borderRadius:'5px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{color:'#c53030', fontWeight:'bold', fontSize:'13px'}}>⚠️ Admin Zone:</span><div><button onClick={handleResetCourse} style={{background:'#e53e3e', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', marginRight:'10px', fontSize:'12px'}}>Reset Data</button><button onClick={handleDeleteCourse} style={{background:'red', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Delete Course</button></div></div>)}
  <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}>{['full_name','conf_no','courses_info','age','gender','dining_seat_no','dining_seat_type','room_no','pagoda_cell_no','status'].map(k=><th key={k} style={{...tdStyle, cursor:'pointer'}} onClick={()=>handleSort(k)}>{k.replace('_',' ').toUpperCase()}{sortConfig.key===k?(sortConfig.direction==='asc'?'▲':'▼'):''}</th>)}<th style={tdStyle}>ACTIONS</th></tr></thead><tbody>{sortedList.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.conf_no||'-'}</td><td style={{...tdStyle, fontSize:'11px'}}>{p.courses_info||'-'}</td><td style={tdStyle}>{p.age||'-'}</td><td style={tdStyle}>{p.gender||'-'}</td><td style={tdStyle}>{p.dining_seat_no||'-'}</td><td style={tdStyle}>{p.dining_seat_type}</td><td style={tdStyle}>{p.room_no||'-'}</td><td style={tdStyle}>{p.pagoda_cell_no||'-'}</td><td style={{...tdStyle, color: p.status==='Arrived'?'green':'orange'}}>{p.status}</td><td style={tdStyle}><button onClick={() => setViewingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>👁️</button><button onClick={() => setEditingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={() => handleCancelStudent(p)} style={{marginRight:'5px', cursor:'pointer', color:'orange'}}>🚫</button><button onClick={() => handleDelete(p.participant_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div>
  {viewingStudent && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px'}}> <h3>👤 Student Details</h3> <p><strong>Name:</strong> {viewingStudent.full_name}</p> <p><strong>Conf No:</strong> {viewingStudent.conf_no}</p> <p><strong>Status:</strong> {viewingStudent.status}</p> <p><strong>Room:</strong> {viewingStudent.room_no}</p> <p><strong>Dining:</strong> {viewingStudent.dining_seat_no} ({viewingStudent.dining_seat_type})</p> <button onClick={()=>setViewingStudent(null)} style={{marginTop:'20px', width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none', borderRadius:'5px'}}>Close</button> </div> </div> )}
  {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}><label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e => setEditingStudent({...editingStudent, conf_no: e.target.value})} /></div><div><label>Lang</label><input style={inputStyle} value={editingStudent.discourse_language||''} onChange={e => setEditingStudent({...editingStudent, discourse_language: e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Dining Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} /></div><div><label>Dining Type</label><select style={inputStyle} value={editingStudent.dining_seat_type||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_type: e.target.value})}><option value="F">Floor</option><option value="C">Chair</option></select></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Room</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e => setEditingStudent({...editingStudent, room_no: e.target.value})} /></div><div><label>Pagoda</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e => setEditingStudent({...editingStudent, pagoda_cell_no: e.target.value})} /></div></div><label>Seating Type</label><select style={inputStyle} value={editingStudent.special_seating||''} onChange={e => setEditingStudent({...editingStudent, special_seating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="submit" style={{...btnStyle(true), flex:1, background:'#28a745', color:'white'}}>Save</button><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button></div></form></div></div>)}</div> );
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
      <h2>🛒 Store & Finance</h2>
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
         <option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
       </select>
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
