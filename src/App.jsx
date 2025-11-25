import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
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
      alert('❌ Incorrect Passcode');
      setPinInput('');
    }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('admin_auth'); setView('dashboard'); };
  
  const fetchCourses = () => { 
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => console.error(err)); 
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
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-hide { display: none; } }`}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>🩺 AT Panel</button>
          <button onClick={() => setView('arrival')} style={btnStyle(view === 'arrival')}>1️⃣ Arrival</button>
          <button onClick={() => setView('process')} style={btnStyle(view === 'process')}>2️⃣ Briefing</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>3️⃣ Onboarding</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Accommodation</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- 1. ARRIVAL DESK (DEBUG MODE) ---
function ArrivalDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); 
    const [participants, setParticipants] = useState([]); 
    const [search, setSearch] = useState('');
    
    useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
    
    const handleArrival = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as Arrived & Generate Token?`)) return;
        
        try {
            const res = await fetch(`${API_URL}/process/arrival`, { 
                method:'POST', 
                headers:{'Content-Type':'application/json'}, 
                body:JSON.stringify({ participantId: p.participant_id, courseId }) 
            });

            if (!res.ok) {
                const txt = await res.text();
                alert(`❌ SERVER ERROR: ${txt}\n\n(Did you update backend code?)`);
                return;
            }

            const data = await res.json();
            if (data.token_number) {
                alert(`✅ Token Generated: #${data.token_number}`);
                fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants);
            }
        } catch (err) {
            alert(`❌ CRASH: ${err.message}\n\nCheck if Backend is Live.`);
        }
    };

    const filtered = participants.filter(p => !p.token_number && p.full_name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={cardStyle}>
            <h2>1️⃣ Arrival Desk (Generate Tokens)</h2>
            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <input style={inputStyle} placeholder="Search Name / Conf No..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                <table style={{width:'100%'}}>
                    <tbody>{filtered.map(p => (
                        <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:'10px'}}><strong>{p.full_name}</strong> ({p.conf_no})</td>
                            <td style={{textAlign:'right'}}><button onClick={()=>handleArrival(p)} style={{...quickBtnStyle(true), background:'#2196f3', color:'white'}}>🖨️ Issue Token</button></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- 2. PROCESS DESK (Scan Token) ---
function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [tokenInput, setTokenInput] = useState('');
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);
    const handleProcess = async (p, nextStage) => { await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) }); refresh(); setTokenInput(''); };
    const activeStudent = participants.find(p => p.token_number == tokenInput);
    return ( <div style={cardStyle}> <h2>2️⃣ 3️⃣ Process Desk (Scan Token)</h2> <div style={{marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}> <input autoFocus style={{...inputStyle, fontSize:'24px', textAlign:'center', width:'200px'}} placeholder="Token #" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} /> {activeStudent ? ( <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px'}}> <h1>#{activeStudent.token_number}</h1> <h3>{activeStudent.full_name}</h3> <p>Current Stage: <strong>{activeStudent.process_stage === 1 ? 'Arrived' : activeStudent.process_stage === 2 ? 'Briefing Done' : 'Interview Done'}</strong></p> <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}> {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800'}}>✅ Mark Briefing Done</button>} {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0'}}>✅ Mark Interview Done</button>} {activeStudent.process_stage >= 3 && <div style={{color:'green', fontWeight:'bold'}}>Ready for Onboarding!</div>} </div> </div> ) : <p style={{color:'#888'}}>Enter or Scan Token Number...</p>} </div> </div> );
}

// --- 0. AT PANEL ---
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
    await fetch(`${API_URL}/participants/${student.participant_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
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
      <h2>🩺 AT Panel</h2>
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
                   <td style={{padding:'10px'}}>
                       <select value={p.special_seating || ''} onChange={(e) => handleUpdate(p, 'special_seating', e.target.value)} style={{padding:'5px', borderRadius:'4px', border:'1px solid #ddd'}}>
                           <option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option>
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
            <h3>Update Details: {editingStudent.full_name}</h3>
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

// --- DASHBOARD ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); }, [selectedCourse]);

  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }] : [];

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

      <div style={{background:'#e3f2fd', color:'#1565c0', padding:'10px', marginBottom:'20px', overflow:'hidden', whiteSpace:'nowrap', borderRadius:'4px', border:'1px solid #90caf9', fontWeight:'bold', fontSize:'14px'}}>
          <marquee>{attendanceString || "Loading..."}</marquee>
      </div>

      {stats && selectedCourse ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
          
          <div style={cardStyle}>
              <h3 style={{marginTop:0}}>Discourse & Occupancy</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px', textAlign:'center'}}>
                 <div style={{background:'#e8f5e9', padding:'5px', borderRadius:'5px'}}><div style={{fontSize:'18px', fontWeight:'bold', color:'#2e7d32'}}>{stats.old_students}</div><div style={{fontSize:'11px'}}>Old</div></div>
                 <div style={{background:'#fff3e0', padding:'5px', borderRadius:'5px'}}><div style={{fontSize:'18px', fontWeight:'bold', color:'#ef6c00'}}>{stats.new_students}</div><div style={{fontSize:'11px'}}>New</div></div>
              </div>
              {stats.languages && stats.languages.length > 0 ? (
                <div style={{maxHeight:'160px', overflowY:'auto'}}>
                <table style={{width:'100%', fontSize:'13px'}}>
                  <thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Lang</th><th style={{width:'30px'}}>M</th><th style={{width:'30px'}}>F</th><th style={{textAlign:'right'}}>Tot</th></tr></thead>
                  <tbody>
                    {stats.languages.map((l, i) => (
                      <tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}>
                        <td style={{padding:'4px 0'}}>{l.discourse_language}</td><td style={{padding:'4px 0', color:'#007bff'}}>{l.male_count}</td><td style={{padding:'4px 0', color:'#e91e63'}}>{l.female_count}</td><td style={{padding:'4px 0', textAlign:'right'}}>{l.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              ) : <p style={{color:'#888'}}>No data.</p>}
          </div>

          <div style={cardStyle}><h3 style={{marginTop:0}}>Live Counts</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course to view stats.</p>}
    </div>
  );
}

// --- GLOBAL ACCOMMODATION ---
function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); const [editingRoom, setEditingRoom] = useState(null);
  const loadData = () => { fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); };
  useEffect(loadData, []);
  const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); setNewRoom({ ...newRoom, roomNo: '' }); loadData(); };
  const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) return alert("🚫 Cannot delete original room!"); if(window.confirm("Delete this room?")) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };
  const handleSwapSave = async () => { if (!editingRoom || !editingRoom.p) return; await fetch(`${API_URL}/participants/${editingRoom.p.participant_id || editingRoom.p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editingRoom.p, room_no: editingRoom.newRoomNo }) }); setEditingRoom(null); loadData(); };

  const normalize = (str) => str ? str.replace(/[\s-]+/g, '').toUpperCase() : '';
  const occupiedMap = {}; const maleBreakdown = {}; const femaleBreakdown = {};
  const safeRooms = rooms || []; const validRoomSet = new Set(safeRooms.map(r => normalize(r.room_no)));

  (occupancy || []).forEach(p => { if(p.room_no) { const n = normalize(p.room_no); const rObj = safeRooms.find(r => normalize(r.room_no)===n); if (rObj) { occupiedMap[n] = p; const c = getShortCourseName(p.course_name); if(rObj.gender_type==='Male') maleBreakdown[c]=(maleBreakdown[c]||0)+1; else femaleBreakdown[c]=(femaleBreakdown[c]||0)+1; } } });
  const maleRooms = safeRooms.filter(r => r.gender_type === 'Male'); const femaleRooms = safeRooms.filter(r => r.gender_type === 'Female');
  let maleOcc = 0, femaleOcc = 0;
  safeRooms.forEach(r => { if(occupiedMap[normalize(r.room_no)]) { if(r.gender_type==='Male') maleOcc++; else femaleOcc++; } });

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
  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'20px'}}> <div style={{padding:'12px', background:'#e3f2fd', borderRadius:'8px', borderLeft:'5px solid #1565c0'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#1565c0', marginBottom:'5px'}}>MALE WING (Free: {maleRooms.length - maleOcc})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(maleBreakdown).length > 0 ? Object.entries(maleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name}: <b>{count}</b></span>) : "Empty"} </div> </div> <div style={{padding:'12px', background:'#fce4ec', borderRadius:'8px', borderLeft:'5px solid #ad1457'}}> <div style={{fontSize:'14px', fontWeight:'bold', color:'#ad1457', marginBottom:'5px'}}>FEMALE WING (Free: {femaleFree})</div> <div style={{fontSize:'11px', color:'#333', display:'flex', flexWrap:'wrap', gap:'5px'}}> {Object.entries(femaleBreakdown).length > 0 ? Object.entries(femaleBreakdown).map(([name, count]) => <span key={name} style={{background:'white', padding:'2px 5px', borderRadius:'3px'}}>{name}: <b>{count}</b></span>) : "Empty"} </div> </div> </div>
  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div style={{border:'1px solid #90caf9', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#e3f2fd', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {maleRooms.map(r => renderRoom(r, 'Male'))} </div> </div> <div style={{border:'1px solid #f48fb1', borderRadius:'8px', padding:'10px'}}> <h3 style={{textAlign:'center', background:'#fce4ec', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3> <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}> {femaleRooms.map(r => renderRoom(r, 'Female'))} </div> </div> </div>
  {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name || 'Unknown'}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} </div> );
}

// --- STUDENT ONBOARDING ---
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
    const handleSubmit = async (e) => { e.preventDefault(); setStatus('Submitting...'); const payload = { ...formData, diningSeatType: formData.seatType }; try { const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unknown Error"); setStatus('✅ Success!'); setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' })); setSelectedStudent(null); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); } catch (err) { setStatus(`❌ ${err.message}`); } };
    return ( <div style={cardStyle}> <h2>3️⃣ Final Onboarding</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>2. Select Student (Interviewed Only)</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{eligibleStudents.map(p => <option key={p.participant_id} value={p.participant_id}>#{p.token_number} - {p.full_name}</option>)}</select></div> </div> {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ SPECIAL ATTENTION:</strong> {selectedStudent.evening_food && <div>🍛 Food: {selectedStudent.evening_food}</div>} {selectedStudent.medical_info && <div>🏥 Medical: {selectedStudent.medical_info}</div>}</div>)} </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}><div><label style={labelStyle}>Room</label><select style={inputStyle} value={formData.roomNo} onChange={e=>setFormData({...formData, roomNo:e.target.value})} required><option value="">Select</option>{availableRooms.map(r=><option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div><div><label style={labelStyle}>Dining Seat</label><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">Select</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div> <div style={{marginTop:'20px', textAlign:'right'}}><button type="submit" style={{...btnStyle(true), background:'#4caf50', color:'white'}}>Complete Onboarding</button></div> {status && <p>{status}</p>} </form> </div> );
}

// --- MANAGE STUDENTS ---
function ParticipantList({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [viewMode, setViewMode] = useState('list'); const [printMode, setPrintMode] = useState(''); const [swappingSeat, setSwappingSeat] = useState(null); const [newSeatNo, setNewSeatNo] = useState(''); const [draggedStudent, setDraggedStudent] = useState(null);
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

  const MALE_COLS = 10; const MALE_ROWS = 8; const FEMALE_COLS = 7; const FEMALE_ROWS = 7;
  const handleAutoAssign = () => {
      if(!window.confirm("Overwrite Seats?")) return;
      setTimeout(async () => {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const all = await res.json();
          let males = all.filter(p => p.gender==='Male' && !p.conf_no.startsWith('SM') && p.status!=='Cancelled');
          let females = all.filter(p => p.gender==='Female' && !p.conf_no.startsWith('SF') && p.status!=='Cancelled');
          
          const sorter = (a,b) => {
             // Simple logic for now: Old > New (by Conf No for Old, Age for New)
             const oldA = a.conf_no.startsWith('O'); const oldB = b.conf_no.startsWith('O');
             if(oldA && !oldB) return -1; if(!oldA && oldB) return 1;
             return 0; 
          };
          males.sort(sorter); females.sort(sorter);

          const updates = [];
          // MALE: A1...J1 (Right-to-Left fill visually means A is Right, J is Left)
          // So Col 9 = A, Col 8 = B... Col 0 = J
          males.forEach((p, i) => {
              if (i < MALE_COLS * MALE_ROWS) {
                  const r = Math.floor(i / MALE_COLS) + 1; 
                  const c = i % MALE_COLS; 
                  // Map 0 -> A (65), 1 -> B (66)...
                  const char = String.fromCharCode(65 + c); 
                  updates.push({...p, dhamma_hall_seat_no: `${char}${r}`});
              }
          });
          // FEMALE: A1...G1
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
      <div draggable={!!p} onDragStart={()=>setDraggedStudent(p)} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(label, p)}
           style={{border:'1px solid #ccc', background: p ? (p.conf_no.startsWith('O')?'#fff9c4':'white') : '#f0f0f0', height:'50px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:p?'grab':'default'}}>
           {p ? <><b style={{color:'blue'}}>{p.dhamma_hall_seat_no}</b><div>{p.full_name.substring(0,8)}..</div></> : <span style={{color:'#ccc'}}>{label}</span>}
      </div>
  );

  const renderMaleGrid = (map) => {
      let rows = [];
      // Header J...A (Col 9 down to 0 if A is Right, but let's stick to visual order)
      // Visual Left is J. Visual Right is A.
      let headerCells = [<div key="e"></div>]; 
      for(let c=MALE_COLS-1; c>=0; c--) headerCells.push(<div key={c} style={{textAlign:'center', fontWeight:'bold'}}>{String.fromCharCode(65+c)}</div>);
      rows.push(<div key="head" style={{display:'grid', gridTemplateColumns:`20px repeat(${MALE_COLS}, 1fr)`, gap:'2px', marginBottom:'5px'}}>{headerCells}</div>);

      for(let r=1; r<=MALE_ROWS; r++) {
          let cells = [];
          cells.push(<div key={`r${r}`} style={{display:'flex',alignItems:'center'}}><b>{r}</b></div>);
          for(let c=MALE_COLS-1; c>=0; c--) { // J...A
              const label = `${String.fromCharCode(65+c)}${r}`;
              cells.push(<SeatBox key={label} label={label} p={map[label]} />);
          }
          rows.push(<div key={r} style={{display:'grid', gridTemplateColumns:`20px repeat(${MALE_COLS}, 1fr)`, gap:'2px', marginBottom:'2px'}}>{cells}</div>);
      }
      return rows;
  };

  if (viewMode === 'seating') {
      const maleMap={}; const femaleMap={};
      participants.forEach(p => { if(p.gender==='Male') maleMap[p.dhamma_hall_seat_no]=p; else femaleMap[p.dhamma_hall_seat_no]=p; });
      return ( <div style={cardStyle} className={printMode === 'male' ? 'print-male-only' : printMode === 'female' ? 'print-female-only' : ''}> 
         <div className="no-print" style={{marginBottom:'10px', display:'flex', gap:'10px'}}>
            <button onClick={()=>setViewMode('list')} style={btnStyle(false)}>Back</button>
            <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800'}}>⚡ Auto Assign</button>
            <button onClick={()=>setPrintMode('male')} style={quickBtnStyle(printMode==='male')}>Print Male</button>
            <button onClick={()=>setPrintMode('female')} style={quickBtnStyle(printMode==='female')}>Print Female</button>
            <button onClick={()=>{setPrintMode(''); setTimeout(()=>window.print(),100);}} style={btnStyle(true)}>Print All</button>
         </div>
         <div className="print-area">
            <h2 style={{textAlign:'center'}}>DHAMMA HALL SEATING</h2>
            <div style={{display:'flex', gap:'20px'}}>
                <div className="male-section" style={{flex:1.2}}>
                    <h3 style={{textAlign:'center', background:'#e3f2fd'}}>MALE (J ← A)</h3>
                    {renderMaleGrid(maleMap)}
                    <div style={{marginTop:'15px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}>
                        <h4 style={{margin:'5px 0', textAlign:'center'}}>Chowky/Chair (Special)</h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px', marginBottom:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`K${i+1}`} label={`K${i+1}`} p={maleMap[`K${i+1}`]} />)}</div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`L${i+1}`} label={`L${i+1}`} p={maleMap[`L${i+1}`]} />)}</div>
                    </div>
                </div>
                <div style={{width:'40px', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px dashed #999', borderRight:'1px dashed #999'}}>AISLE</div>
                <div className="female-section" style={{flex:0.8}}><h3>FEMALE (A → G)</h3></div>
            </div>
         </div>
      </div> );
  }

  return ( <div style={cardStyle}> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={()=>setViewMode('seating')} style={btnStyle(true)}>🧘 Dhamma Plan</button> </div> <table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left'}}><th>Name</th><th>Conf</th><th>Seat</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td>{p.full_name}</td><td>{p.conf_no}</td><td>{p.dhamma_hall_seat_no}</td></tr>))}</tbody></table> </div> );
}

// --- PLACEHOLDERS ---
function ExpenseTracker() { return <div style={cardStyle}><h3>Store</h3></div>; }
function CourseAdmin() { return <div style={cardStyle}><h3>Admin</h3></div>; }
function ArrivalDesk() { return <div>Arrival</div>; }
function ProcessDesk() { return <div>Process</div>; }
