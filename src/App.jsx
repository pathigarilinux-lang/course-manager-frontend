import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com"; // Ensure this is your live URL
const ADMIN_PASSCODE = "1234"; 

// --- CONFIG: USERS & ROLES ---
const USERS = {
  "1234": { name: "Super Admin", role: "ADMIN" },
  "1001": { name: "Arrival Desk", role: "ARRIVAL" },
  "1002": { name: "Briefing/Teacher", role: "PROCESS" },
  "1003": { name: "Onboarding", role: "ONBOARDING" }
};

const PERMISSIONS = {
  ADMIN:      ['dashboard', 'flow', 'arrival', 'process', 'onboarding', 'room-view', 'participants', 'expenses', 'course-admin'],
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
// Truncated room list for brevity, your app will handle the full list if array provided
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","DF1","DF2","DF3"]); 

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
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-male-only .female-section { display: none; } .print-female-only .male-section { display: none; } }`}</style>
      <nav className="no-print" style={{marginBottom:'20px', background:'white', padding:'15px', borderRadius:'8px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
         <span style={{marginRight:'10px', fontWeight:'bold', borderRight:'2px solid #eee', paddingRight:'10px'}}>👤 {user.name}</span>
         {can('dashboard') && <button onClick={()=>setView('dashboard')} style={btnStyle(view==='dashboard')}>📊 Dashboard</button>}
         {can('flow') && <button onClick={()=>setView('flow')} style={btnStyle(view==='flow')}>🌊 Live Flow</button>}
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
      {view === 'flow' && <ProcessFlowDashboard courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={()=>setPreSelectedRoom('')} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'participants' && <ParticipantList courses={courses} />}
      {view === 'expenses' && <ExpenseTracker />}
      {view === 'course-admin' && <CourseAdmin />}
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
    const handleArrival = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as Arrived?`)) return;
        const res = await fetch(`${API_URL}/process/arrival`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, courseId }) });
        const data = await res.json();
        if (data.token_number) { alert(`✅ Token Generated: #${data.token_number}`); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }
    };
    const filtered = participants.filter(p => !p.token_number && p.full_name.toLowerCase().includes(search.toLowerCase()));
    return ( <div style={cardStyle}> <h2>1️⃣ Arrival Desk</h2> <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search Name / Conf No..." value={search} onChange={e=>setSearch(e.target.value)} /> </div> <div style={{maxHeight:'400px', overflowY:'auto'}}><table style={{width:'100%'}}><tbody>{filtered.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}> <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td> <td style={{textAlign:'right'}}><button onClick={()=>handleArrival(p)} style={{...quickBtnStyle(true), background:'#2196f3', color:'white'}}>🖨️ Issue Token</button></td> </tr> ))}</tbody></table></div> </div> );
}

function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [tokenInput, setTokenInput] = useState('');
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);
    const handleProcess = async (p, nextStage) => { await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) }); refresh(); setTokenInput(''); };
    const activeStudent = participants.find(p => p.token_number == tokenInput);
    return ( <div style={cardStyle}> <h2>2️⃣ 3️⃣ Process Desk</h2> <div style={{marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}> <input autoFocus style={{...inputStyle, fontSize:'30px', textAlign:'center', width:'200px', fontWeight:'bold'}} placeholder="Token #" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} /> {activeStudent ? ( <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px'}}> <h1>#{activeStudent.token_number}</h1> <h3>{activeStudent.full_name}</h3> <p>Stage: {activeStudent.process_stage}</p> <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}> {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800'}}>Mark Briefing Done</button>} {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0'}}>Mark Interview Done</button>} </div> </div> ) : <p style={{color:'#888'}}>Scan Token...</p>} </div> </div> );
}
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
    const handleSeatSwapSave = async () => { if (!swappingSeat || !swappingSeat.p) return; await fetch(`${API_URL}/participants/${swappingSeat.p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...swappingSeat.p, dhamma_hall_seat_no: newSeatNo }) }); setSwappingSeat(null); fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };

    const handleAutoAssign = () => {
        if(!window.confirm("Overwrite Seats?")) return;
        setTimeout(async () => {
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const all = await res.json();
            let males = all.filter(p => p.gender==='Male' && !p.conf_no.startsWith('SM') && p.status!=='Cancelled').sort((a,b) => (a.conf_no.startsWith('O') ? -1 : 1));
            let females = all.filter(p => p.gender==='Female' && !p.conf_no.startsWith('SF') && p.status!=='Cancelled').sort((a,b) => (a.conf_no.startsWith('O') ? -1 : 1));
            
            const updates = [];
            // MALE: A1 (Right) -> J1 (Left) -> A2 (Right). 
            // Col 0 = J, Col 9 = A. Fill Right-to-Left: Start at Col 9 (A)
            males.forEach((p, i) => {
                if (i < 80) {
                    const r = Math.floor(i / 10) + 1; 
                    const cIdx = i % 10; // 0,1,2
                    // Map 0 -> 9 (A), 1 -> 8 (B)
                    const colChar = String.fromCharCode(65 + (9 - cIdx)); // A=65.
                    // Wait, user said J...A (Left-Right). J is Col 0. A is Col 9.
                    // "Fills A1, B1... J1". So A1 is First.
                    // So A1 is Col 9.
                    updates.push({...p, dhamma_hall_seat_no: `${colChar}${r}`});
                }
            });
            // FEMALE: A1 -> G1 (Standard Left-Right)
            females.forEach((p, i) => { if(i < 49) { const r = Math.floor(i/7)+1; const c = i%7; updates.push({...p, dhamma_hall_seat_no: `${String.fromCharCode(65+c)}${r}`}); } });
            
            await Promise.all(updates.map(u => fetch(`${API_URL}/participants/${u.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)})));
            alert("Assigned!");
        }, 50);
    };

    const SeatBox = ({ p, label }) => (
        <div draggable={!!p} onDragStart={()=>setDraggedStudent(p)} onDragOver={e=>e.preventDefault()} onDrop={()=>handleDrop(label, p)} onClick={()=>setSwappingSeat({p, label})}
             style={{border:'1px solid #ccc', background: p ? (p.conf_no.startsWith('O')?'#fff9c4':'white') : '#f0f0f0', height:'50px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:p?'grab':'pointer'}}>
             {p ? <><b style={{color:'blue'}}>{p.dhamma_hall_seat_no}</b><div>{p.full_name.substring(0,8)}..</div></> : <span style={{color:'#ccc'}}>{label}</span>}
        </div>
    );

    if (viewMode === 'seating') {
        const maleMap={}; const femaleMap={}; participants.forEach(p => { if(p.gender==='Male') maleMap[p.dhamma_hall_seat_no]=p; else femaleMap[p.dhamma_hall_seat_no]=p; });
        const selectedCourse = courses.find(c => c.course_id == courseId);
        const printClass = printMode === 'male' ? 'print-male-only' : printMode === 'female' ? 'print-female-only' : '';
        return ( <div style={cardStyle} className={printClass}> <div className="no-print" style={{marginBottom:'10px', display:'flex', gap:'10px'}}> <button onClick={()=>setViewMode('list')} style={btnStyle(false)}>Back</button> <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800'}}>⚡ Auto Assign</button> <button onClick={()=>setPrintMode('male')} style={quickBtnStyle(printMode==='male')}>Print Male</button> <button onClick={()=>setPrintMode('female')} style={quickBtnStyle(printMode==='female')}>Print Female</button> <button onClick={()=>{setPrintMode(''); setTimeout(()=>window.print(),100);}} style={btnStyle(true)}>Print All</button> </div>
        <div className="print-area"> <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:'10px', marginBottom:'20px'}}> <h1>DHAMMA HALL SEATING</h1> <h3>{selectedCourse?.course_name}</h3> <p>Teacher: {selectedCourse?.teacher_name}</p> </div> <div style={{display:'flex', gap:'20px'}}>
        <div className="male-section" style={{flex:1.2}}> <h3 style={{textAlign:'center', background:'#e3f2fd'}}>MALE (J ← A)</h3>
        {/* Male Grid: J..A. Columns 0..9. J is Col 0. A is Col 9 */}
        <div style={{display:'grid', gridTemplateColumns:'20px repeat(10, 1fr)', gap:'2px'}}> <div></div> {['J','I','H','G','F','E','D','C','B','A'].map(c=><div key={c} style={{textAlign:'center',fontWeight:'bold'}}>{c}</div>)} </div>
        {[1,2,3,4,5,6,7,8].map(r => ( <div key={r} style={{display:'grid', gridTemplateColumns:'20px repeat(10, 1fr)', gap:'2px', marginBottom:'2px'}}> <div><b>{r}</b></div> {[74,73,72,71,70,69,68,67,66,65].map(code => { const label = `${String.fromCharCode(code)}${r}`; return <SeatBox key={label} label={label} p={maleMap[label]} />; })} </div> ))}
        <div style={{marginTop:'15px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}> <h4 style={{textAlign:'center'}}>Special</h4> <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px', marginBottom:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`K${i+1}`} label={`K${i+1}`} p={maleMap[`K${i+1}`]} />)}</div> <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'5px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`L${i+1}`} label={`L${i+1}`} p={maleMap[`L${i+1}`]} />)}</div> </div> </div>
        <div style={{width:'30px', borderLeft:'1px dashed #999'}}></div> <div className="female-section" style={{flex:0.8}}> <h3 style={{textAlign:'center', background:'#fce4ec'}}>FEMALE (A → G)</h3> <div style={{display:'grid', gridTemplateColumns:'20px repeat(7, 1fr)', gap:'2px'}}> <div></div> {['A','B','C','D','E','F','G'].map(c=><div key={c} style={{textAlign:'center',fontWeight:'bold'}}>{c}</div>)} </div> {[1,2,3,4,5,6,7].map(r => ( <div key={r} style={{display:'grid', gridTemplateColumns:'20px repeat(7, 1fr)', gap:'2px', marginBottom:'2px'}}> <div><b>{r}</b></div> {[65,66,67,68,69,70,71].map(code => { const label = `${String.fromCharCode(code)}${r}`; return <SeatBox key={label} label={label} p={femaleMap[label]} />; })} </div> ))} </div> </div> </div> 
        {swappingSeat && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}><h3>💺 Seat Manager</h3>{swappingSeat.p ? (<div><p><strong>Student:</strong> {swappingSeat.p.full_name}</p><p><strong>Current Seat:</strong> {swappingSeat.label}</p></div>) : <p><strong>Empty Seat:</strong> {swappingSeat.label}</p>}<div style={{marginTop:'15px'}}><label style={labelStyle}>Assign/Change to Seat No:</label><input style={inputStyle} value={newSeatNo} onChange={e=>setNewSeatNo(e.target.value)} placeholder="e.g. C5" /></div><div style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={handleSeatSwapSave} disabled={!swappingSeat.p} style={{...btnStyle(true), background: swappingSeat.p ? '#28a745' : '#ccc', color:'white', flex:1}}>Update</button><button onClick={() => {setSwappingSeat(null); setNewSeatNo('');}} style={{...btnStyle(false), flex:1}}>Close</button></div></div></div>)} </div> );
    }

    return <div style={cardStyle}> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={()=>setViewMode('seating')} style={btnStyle(true)}>🧘 Dhamma Plan</button> </div> <table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left'}}><th>Name</th><th>Conf</th><th>Seat</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td>{p.full_name}</td><td>{p.conf_no}</td><td>{p.dhamma_hall_seat_no}</td></tr>))}</tbody></table> </div>;
}

function GlobalAccommodationManager({ courses, onRoomClick }) { return <div style={cardStyle}><h3>Accommodation Manager</h3></div>; }
function StudentForm({ courses, preSelectedRoom, clearRoom }) { return <div style={cardStyle}><h3>Student Form</h3></div>; }
function ExpenseTracker() { return <div style={cardStyle}><h3>Store</h3></div>; }
function CourseAdmin() { return <div style={cardStyle}><h3>Admin</h3></div>; }
