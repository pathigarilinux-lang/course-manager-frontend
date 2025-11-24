import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

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
  ADMIN:      ['dashboard', 'flow', 'arrival', 'process', 'onboarding', 'room-view', 'participants', 'expenses', 'course-admin'],
  ARRIVAL:    ['arrival', 'flow'],
  PROCESS:    ['process', 'flow'],
  ONBOARDING: ['onboarding', 'room-view', 'flow']
};

const DEFAULT_VIEWS = { ADMIN: 'dashboard', ARRIVAL: 'arrival', PROCESS: 'process', ONBOARDING: 'onboarding' };

// --- UTILS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI"]); // (Add full list here)

export default function App() {
  const [user, setUser] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('course_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchCourses();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const u = USERS[pinInput];
    if (u) { setUser(u); localStorage.setItem('course_user', JSON.stringify(u)); setView(DEFAULT_VIEWS[u.role]); }
    else alert("❌ Invalid Passcode");
  };
  const handleLogout = () => { setUser(null); localStorage.removeItem('course_user'); setPinInput(''); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res=>res.json()).then(setCourses).catch(console.error); };
  const can = (f) => user && PERMISSIONS[user.role]?.includes(f);
  const handleRoomClick = (r) => { setPreSelectedRoom(r); setView('onboarding'); };

  if (!user) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f4f7f6'}}><div style={{background:'white', padding:'40px', borderRadius:'10px', textAlign:'center', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}><h1>Course Manager</h1><input type="password" placeholder="Passcode" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={inputStyle} /><br/><br/><button onClick={handleLogin} style={{...btnStyle(true), width:'100%'}}>Login</button></div></div>;

  return (
    <div className="app-container" style={{fontFamily:'Segoe UI', padding:'20px', background:'#f4f7f6', minHeight:'100vh'}}>
      <style>{`@media print { .no-print { display: none; } }`}</style>
      <nav className="no-print" style={{marginBottom:'20px', background:'white', padding:'15px', borderRadius:'8px', display:'flex', gap:'10px', flexWrap:'wrap'}}>
         <span style={{marginRight:'10px', fontWeight:'bold', borderRight:'2px solid #eee', paddingRight:'10px'}}>👤 {user.name}</span>
         {can('dashboard') && <button onClick={()=>setView('dashboard')} style={btnStyle(view==='dashboard')}>📊 Dashboard</button>}
         {can('flow') && <button onClick={()=>setView('flow')} style={btnStyle(view==='flow')}>🌊 Live Flow</button>}
         {can('arrival') && <button onClick={()=>setView('arrival')} style={btnStyle(view==='arrival')}>1️⃣ Arrival</button>}
         {can('process') && <button onClick={()=>setView('process')} style={btnStyle(view==='process')}>2️⃣ Briefing/Teacher</button>}
         {can('onboarding') && <button onClick={()=>setView('onboarding')} style={btnStyle(view==='onboarding')}>3️⃣ Onboarding</button>}
         {can('room-view') && <button onClick={()=>setView('room-view')} style={btnStyle(view==='room-view')}>🛏️ Rooms</button>}
         {can('participants') && <button onClick={()=>setView('participants')} style={btnStyle(view==='participants')}>👥 Students</button>}
         <button onClick={handleLogout} style={{...btnStyle(false), color:'red', marginLeft:'auto'}}>🔒 Logout</button>
      </nav>

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'flow' && <ProcessFlowDashboard courses={courses} />}
      {view === 'arrival' && <ArrivalDesk courses={courses} />}
      {view === 'process' && <ProcessDesk courses={courses} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={()=>setPreSelectedRoom('')} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'participants' && <ParticipantList courses={courses} />}
    </div>
  );
}

// --- NEW: LIVE FLOW DASHBOARD (KANBAN) ---
function ProcessFlowDashboard({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [data, setData] = useState([]);
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setData); };
    useEffect(refresh, [courseId]); // Auto-fetch
    useEffect(() => { const interval = setInterval(refresh, 10000); return () => clearInterval(interval); }, [courseId]); // Live Polling

    const s0 = data.filter(p => !p.token_number); // Not Arrived
    const s1 = data.filter(p => p.process_stage === 1); // Arrived (Waiting Briefing)
    const s2 = data.filter(p => p.process_stage === 2); // Briefing Done (Waiting Teacher)
    const s3 = data.filter(p => p.process_stage === 3); // Interview Done (Waiting Onboard)
    const s4 = data.filter(p => p.process_stage === 4); // Completed

    const Col = ({ title, list, color }) => (
        <div style={{flex:1, background:'white', borderRadius:'8px', padding:'10px', borderTop:`4px solid ${color}`, minHeight:'300px'}}>
            <h3 style={{margin:'0 0 10px 0', color}}>{title} ({list.length})</h3>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                {list.map(p => (
                    <div key={p.participant_id} style={{padding:'8px', borderBottom:'1px solid #eee', fontSize:'13px'}}>
                        <div style={{fontWeight:'bold'}}>#{p.token_number || '-'} {p.full_name}</div>
                        <div style={{fontSize:'11px', color:'#666'}}>{p.conf_no}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <button onClick={refresh} style={quickBtnStyle(true)}>↻ Refresh</button>
            </div>
            <div style={{display:'flex', gap:'15px', overflowX:'auto'}}>
                <Col title="Expected" list={s0} color="#999" />
                <Col title="Step 1: Arrived" list={s1} color="#2196f3" />
                <Col title="Step 2: Briefing" list={s2} color="#ff9800" />
                <Col title="Step 3: Teacher" list={s3} color="#9c27b0" />
                <Col title="Step 4: Onboarded" list={s4} color="#4caf50" />
            </div>
        </div>
    );
}

// --- NEW: STEP 1 - ARRIVAL DESK ---
function ArrivalDesk({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    
    useEffect(() => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [courseId]);
    
    const handleArrival = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as Arrived & Generate Token?`)) return;
        const res = await fetch(`${API_URL}/process/arrival`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, courseId }) });
        const data = await res.json();
        if (data.token_number) {
            alert(`✅ Token Generated: #${data.token_number}`);
            // In a real app, here you would trigger window.print() for a token slip
            fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants);
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
                <table style={{width:'100%', borderCollapse:'collapse'}}>
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

// --- NEW: STEP 2 & 3 - PROCESS DESK ---
function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [tokenInput, setTokenInput] = useState('');
    
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);

    const handleProcess = async (p, nextStage) => {
        await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) });
        refresh();
        setTokenInput(''); // Clear for next scan
    };

    // Find student by Token Number
    const activeStudent = participants.find(p => p.token_number == tokenInput);

    return (
        <div style={cardStyle}>
            <h2>2️⃣ 3️⃣ Process Desk (Scan Token)</h2>
            <div style={{marginBottom:'20px'}}>
                <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
            </div>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}>
                <input 
                    autoFocus 
                    style={{...inputStyle, fontSize:'24px', textAlign:'center', width:'200px'}} 
                    placeholder="Token #" 
                    value={tokenInput} 
                    onChange={e=>setTokenInput(e.target.value)} 
                />
                {activeStudent ? (
                    <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px'}}>
                        <h1>Token #{activeStudent.token_number}</h1>
                        <h3>{activeStudent.full_name}</h3>
                        <p>Current Stage: <strong>{activeStudent.process_stage === 1 ? 'Arrived' : activeStudent.process_stage === 2 ? 'Briefing Done' : 'Interview Done'}</strong></p>
                        
                        <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}>
                            {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800'}}>✅ Mark Briefing Done</button>}
                            {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0'}}>✅ Mark Interview Done</button>}
                            {activeStudent.process_stage >= 3 && <div style={{color:'green', fontWeight:'bold'}}>Ready for Onboarding!</div>}
                        </div>
                    </div>
                ) : <p style={{color:'#888'}}>Enter or Scan Token Number...</p>}
            </div>
        </div>
    );
}

// --- STUDENT FORM (MODIFIED TO CHECK STAGE) ---
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
    const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Chair' }); const [status, setStatus] = useState('');
    useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(data => setRooms(Array.isArray(data)?data:[])); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(Array.isArray(data)?data:[])); }, []);
    useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
    useEffect(() => { if (formData.courseId) { fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); } }, [formData.courseId]);
    
    // Filter Rooms
    const occupiedSet = new Set(occupancy.map(p => p.room_no ? p.room_no.replace(/[\s-]+/g, '').toUpperCase() : ''));
    let availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no.replace(/[\s-]+/g, '').toUpperCase()));

    // Filter Students: ONLY SHOW THOSE WHO COMPLETED STEP 3 (INTERVIEW)
    // Users with process_stage >= 3 are eligible.
    const eligibleStudents = participants.filter(p => p.status !== 'Arrived' && p.process_stage >= 3);

    const handleSubmit = async (e) => { e.preventDefault(); setStatus('Submitting...'); const payload = { ...formData, diningSeatType: formData.seatType }; try { const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unknown Error"); setStatus('✅ Success! Onboarded.'); setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' })); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); } catch (err) { setStatus(`❌ ${err.message}`); } };

    return ( <div style={cardStyle}> <h2>3️⃣ Onboarding (Final)</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> 
    <div><label style={labelStyle}>2. Select Student (Interviewed Only)</label><select style={inputStyle} onChange={e => setFormData({...formData, participantId: e.target.value})} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{eligibleStudents.map(p => <option key={p.participant_id} value={p.participant_id}>#{p.token_number} - {p.full_name}</option>)}</select></div> </div> </div> 
    {/* Remainder of the form is standard */}
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}><div><label style={labelStyle}>Room</label><select style={inputStyle} value={formData.roomNo} onChange={e=>setFormData({...formData, roomNo:e.target.value})} required><option value="">Select</option>{availableRooms.map(r=><option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div><div><label style={labelStyle}>Seat</label><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">Select</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div>
    <div style={{marginTop:'20px', textAlign:'right'}}><button type="submit" style={{...btnStyle(true), background:'#4caf50', color:'white'}}>Complete Onboarding</button></div>
    {status && <p>{status}</p>}
    </form> </div> );
}

// --- REST OF COMPONENTS (Dashboard, Accommodation, etc.) REMAIN SAME ---
// (For brevity, assume Dashboard, GlobalAccommodationManager, ParticipantList, ExpenseTracker, CourseAdmin are here exactly as before)
function Dashboard({ courses }) { return <div style={cardStyle}>Dashboard (See full code)</div>; }
function GlobalAccommodationManager({ courses, onRoomClick }) { return <div style={cardStyle}>Accommodation Manager (See full code)</div>; }
function ExpenseTracker() { return <div style={cardStyle}>Expense Tracker</div>; }
function ParticipantList() { return <div style={cardStyle}>Participant List</div>; }
function CourseAdmin() { return <div style={cardStyle}>Course Admin</div>; }

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
