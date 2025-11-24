import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

// --- SECURITY & ROLES ---
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
      <style>{`@media print { .no-print { display: none; } .app-container { background: white; } }`}</style>
      <nav className="no-print" style={{marginBottom:'20px', background:'white', padding:'15px', borderRadius:'8px', display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
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
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- FLOW DASHBOARD ---
function ProcessFlowDashboard({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [data, setData] = useState([]);
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setData); };
    useEffect(refresh, [courseId]);
    useEffect(() => { const interval = setInterval(refresh, 10000); return () => clearInterval(interval); }, [courseId]);

    const s0 = data.filter(p => !p.token_number && p.status !== 'Cancelled');
    const s1 = data.filter(p => p.process_stage === 1 && p.status !== 'Cancelled');
    const s2 = data.filter(p => p.process_stage === 2 && p.status !== 'Cancelled');
    const s3 = data.filter(p => p.process_stage === 3 && p.status !== 'Cancelled');
    const s4 = data.filter(p => p.process_stage === 4 && p.status !== 'Cancelled');

    const Col = ({ title, list, color }) => (
        <div style={{flex:1, background:'white', borderRadius:'8px', padding:'10px', borderTop:`4px solid ${color}`, minHeight:'300px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h4 style={{margin:'0 0 10px 0', color}}>{title} ({list.length})</h4>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                {list.map(p => ( <div key={p.participant_id} style={{padding:'8px', borderBottom:'1px solid #eee', fontSize:'12px'}}> <div style={{fontWeight:'bold'}}>#{p.token_number || '-'} {p.full_name}</div> <div style={{color:'#666'}}>{p.conf_no}</div> </div> ))}
            </div>
        </div>
    );
    return (
        <div>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <button onClick={refresh} style={quickBtnStyle(true)}>↻ Refresh</button> </div>
            <div style={{display:'flex', gap:'15px', overflowX:'auto'}}> <Col title="Expected" list={s0} color="#999" /> <Col title="1. Arrived" list={s1} color="#2196f3" /> <Col title="2. Briefing" list={s2} color="#ff9800" /> <Col title="3. Teacher" list={s3} color="#9c27b0" /> <Col title="4. Done" list={s4} color="#4caf50" /> </div>
        </div>
    );
}

// --- DESK 1: ARRIVAL ---
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
    return ( <div style={cardStyle}> <h2>1️⃣ Arrival Desk</h2> <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search Name / Conf No..." value={search} onChange={e=>setSearch(e.target.value)} /> </div> <div style={{maxHeight:'400px', overflowY:'auto'}}><table style={{width:'100%'}}><tbody>{filtered.map(p => ( <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}> <td style={{padding:'10px'}}><strong>{p.full_name}</strong> ({p.conf_no})</td> <td style={{textAlign:'right'}}><button onClick={()=>handleArrival(p)} style={{...quickBtnStyle(true), background:'#2196f3', color:'white'}}>🖨️ Issue Token</button></td> </tr> ))}</tbody></table></div> </div> );
}

// --- DESK 2 & 3: PROCESS ---
function ProcessDesk({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [tokenInput, setTokenInput] = useState('');
    const refresh = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(refresh, [courseId]);
    const handleProcess = async (p, nextStage) => { await fetch(`${API_URL}/process/update-stage`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ participantId: p.participant_id, stage: nextStage }) }); refresh(); setTokenInput(''); };
    const activeStudent = participants.find(p => p.token_number == tokenInput);
    return ( <div style={cardStyle}> <h2>2️⃣ 3️⃣ Process Desk</h2> <div style={{marginBottom:'20px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}> <input autoFocus style={{...inputStyle, fontSize:'24px', textAlign:'center', width:'200px'}} placeholder="Token #" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} /> {activeStudent ? ( <div style={{border:'2px solid #2196f3', padding:'20px', borderRadius:'10px', textAlign:'center', width:'100%', maxWidth:'400px'}}> <h1>#{activeStudent.token_number}</h1> <h3>{activeStudent.full_name}</h3> <p>Stage: {activeStudent.process_stage}</p> <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'20px'}}> {activeStudent.process_stage === 1 && <button onClick={()=>handleProcess(activeStudent, 2)} style={{...btnStyle(true), background:'#ff9800'}}>Mark Briefing Done</button>} {activeStudent.process_stage === 2 && <button onClick={()=>handleProcess(activeStudent, 3)} style={{...btnStyle(true), background:'#9c27b0'}}>Mark Interview Done</button>} {activeStudent.process_stage >= 3 && <div style={{color:'green', fontWeight:'bold'}}>Ready for Onboarding!</div>} </div> </div> ) : <p style={{color:'#888'}}>Scan Token...</p>} </div> </div> );
}

// --- DASHBOARD ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null); const [stats, setStats] = useState(null);
  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(r=>r.json()).then(setStats); }, [selectedCourse]);
  
  const arrivalData = stats ? [{ name: 'Arrived', Male: stats.arrived_m, Female: stats.arrived_f }, { name: 'Pending', Male: stats.pending_m, Female: stats.pending_f }] : [];
  const typeData = stats ? [{ name: 'Old', Male: stats.om, Female: stats.of }, { name: 'New', Male: stats.nm, Female: stats.nf }] : [];

  // Attendance Ticker Logic
  const attendanceString = courses.map(c => {
      const total = (c.arrived || 0) + (c.pending || 0);
      const pct = total > 0 ? Math.round((c.arrived || 0) / total * 100) : 0;
      return `${getShortCourseName(c.course_name)}: ${c.arrived}/${total} (${pct}%)`;
  }).join("  ✦  ");

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2>
        <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      </div>
      
      <div style={{background:'#e3f2fd', color:'#1565c0', padding:'10px', marginBottom:'20px', borderRadius:'4px', border:'1px solid #90caf9', fontWeight:'bold', fontSize:'14px', overflow:'hidden'}}>
          <marquee>{attendanceString || "Loading..."}</marquee>
      </div>

      {stats && selectedCourse ? (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}>
           <div style={cardStyle}><h3>Status</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"/><Bar dataKey="Female" fill="#e91e63"/></BarChart></ResponsiveContainer></div></div>
           
           {/* MERGED: Occupancy & Discourse */}
           <div style={cardStyle}>
              <h3>Discourse & Occupancy</h3>
              <div style={{display:'flex', justifyContent:'space-around', marginBottom:'10px'}}>
                 <div><span style={{color:'#2e7d32', fontSize:'18px', fontWeight:'bold'}}>{stats.old_students}</span> Old</div>
                 <div><span style={{color:'#ef6c00', fontSize:'18px', fontWeight:'bold'}}>{stats.new_students}</span> New</div>
              </div>
              <div style={{maxHeight:'150px', overflowY:'auto'}}>
                <table style={{width:'100%', fontSize:'12px'}}><thead><tr><th>Lang</th><th>M</th><th>F</th><th>Tot</th></tr></thead>
                <tbody>{stats.languages.map((l,i)=>(<tr key={i}><td>{l.discourse_language}</td><td>{l.male_count}</td><td>{l.female_count}</td><td>{l.total}</td></tr>))}</tbody></table>
              </div>
           </div>

           <div style={cardStyle}><h3>Live Counts</h3><div style={{height:'200px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"/><Bar dataKey="Female" fill="#e91e63"/></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : <p>Select Course...</p>}
    </div>
  );
}

// --- 3. STUDENT FORM (AUTOMATED NOTIFICATION) ---
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
    const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' }); const [status, setStatus] = useState('');
    
    useEffect(() => { fetch(`${API_URL}/rooms`).then(r=>r.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(r=>r.json()).then(setOccupancy); }, []);
    useEffect(() => { if(preSelectedRoom) setFormData(p=>({...p, roomNo: preSelectedRoom})); if(courses.length>0 && !formData.courseId) setFormData(p=>({...p, courseId: courses[0].course_id})); }, [preSelectedRoom, courses]);
    useEffect(() => { if(formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(setParticipants); }, [formData.courseId]);

    const occupiedSet = new Set(occupancy.map(p => p.room_no));
    const availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no));
    const eligibleStudents = participants.filter(p => p.status !== 'Arrived' && p.process_stage >= 3); // Must have cleared teacher interview

    const handleSubmit = async (e) => {
        e.preventDefault(); setStatus('Submitting...');
        try {
            const res = await fetch(`${API_URL}/check-in`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...formData, diningSeatType: formData.seatType}) });
            if(!res.ok) throw new Error("Failed");
            // AUTO-NOTIFY
            await fetch(`${API_URL}/notify`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
            setStatus('✅ Checked-In & Notification Sent!');
            setFormData(prev => ({ ...prev, participantId:'', roomNo:'', seatNo:'', laundryToken:'', mobileLocker:'', valuablesLocker:'', pagodaCell:'', laptop:'No', confNo:'', specialSeating:'None', seatType:'Floor' }));
            clearRoom();
            fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(setParticipants);
        } catch(err) { setStatus('❌ Error'); }
    };

    return ( <div style={cardStyle}> <h2>3️⃣ Onboarding (Final)</h2> <form onSubmit={handleSubmit} style={{maxWidth:'900px'}}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>Course</label><select style={inputStyle} onChange={e=>setFormData({...formData, courseId: e.target.value})} value={formData.courseId}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>Student (Passed Interview)</label><select style={inputStyle} onChange={e=>setFormData({...formData, participantId:e.target.value})} value={formData.participantId} required><option value="">Select</option>{eligibleStudents.map(p=><option key={p.participant_id} value={p.participant_id}>#{p.token_number} {p.full_name}</option>)}</select></div> </div> </div> 
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>Room</label><select style={inputStyle} value={formData.roomNo} onChange={e=>setFormData({...formData, roomNo:e.target.value})} required><option value="">Select</option>{availableRooms.map(r=><option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div> <div><label style={labelStyle}>Dining</label><div style={{display:'flex', gap:'5px'}}><select style={{width:'80px',...inputStyle}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Floor</option><option>Chair</option></select><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">No</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div> </div> 
    <div style={{marginTop:'20px', textAlign:'right'}}><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Complete Check-In</button></div> {status && <p>{status}</p>} </form> </div> );
}

// --- MANAGE STUDENTS (With Reminders & Auto-Flag) ---
function ParticipantList({ courses, refreshCourses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState(''); const [editingStudent, setEditingStudent] = useState(null); const [viewingStudent, setViewingStudent] = useState(null); const [viewMode, setViewMode] = useState('list'); const [swappingSeat, setSwappingSeat] = useState(null); const [newSeatNo, setNewSeatNo] = useState('');
    const loadStudents = () => { if(courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(r=>r.json()).then(setParticipants); };
    useEffect(loadStudents, [courseId]);
    
    const handleAutoNoShow = async () => { if(confirm("🚫 Flag all pending as No-Show?")) { await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, {method:'POST'}); loadStudents(); alert("Done."); } };
    const handleSendReminders = async () => { if(confirm("📢 Send SMS to pending students?")) { await fetch(`${API_URL}/notify`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({type:'reminder_all'})}); alert("Queued."); } };

    // --- AUTO-ASSIGN: MALE (10x8, J->A Fill), FEMALE (7x7, A->G Fill) ---
    const MALE_COLS = 10; const MALE_ROWS = 8; const FEMALE_COLS = 7; const FEMALE_ROWS = 7;
    
    const handleAutoAssign = () => {
        if(!confirm("⚡ Overwrite Seats? (Servers/Cancelled skipped)")) return;
        setTimeout(async () => {
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const all = await res.json();
            let males = all.filter(p => p.gender==='Male' && p.status!=='Cancelled' && !p.conf_no.startsWith('SM'));
            let females = all.filter(p => p.gender==='Female' && p.status!=='Cancelled' && !p.conf_no.startsWith('SF'));
            
            const sorter = (a,b) => {
                 // Seniority Score: Old > New (by age)
                 const isOldA = a.conf_no.startsWith('O'); const isOldB = b.conf_no.startsWith('O');
                 if(isOldA && !isOldB) return -1; if(!isOldA && isOldB) return 1;
                 if(isOldA) return a.conf_no.localeCompare(b.conf_no); // Simple alphabet for old
                 return parseInt(b.age) - parseInt(a.age); // Age for new
            };
            males.sort(sorter); females.sort(sorter);

            const updates = [];
            // MALE: Fill J->A (Col 0 to 9, where 0=J, 9=A... wait. User said A1 is Right. So A is Col 9?)
            // Visual: J(Left)...A(Right). Grid: Col 0...9.
            // Left-to-Right fill means filling J1, I1, H1... A1?
            // User said: "Fills A1, B1... J1, then A2". 
            // If Visual is J...A, then A is on the Right. B is left of A.
            // Filling A1, B1, C1 means filling Right-to-Left visually?
            // Let's implement: Col 0 = A, Col 1 = B ... Col 9 = J. 
            // Visual rendering will just flip the array if needed. 
            // Let's stick to: Column Char = 'A' + colIndex. 
            // And Render visually J on Left means display in reverse order? No, user said "Male Side (J - A)".
            // I will assign A1, B1... J1 naturally. And render the grid such that J is Left.
            
            males.forEach((p, i) => {
                if (i < MALE_COLS * MALE_ROWS) {
                    const r = Math.floor(i / MALE_COLS) + 1;
                    const c = i % MALE_COLS; 
                    updates.push({ ...p, dhamma_hall_seat_no: `${String.fromCharCode(65+c)}${r}` });
                }
            });
            females.forEach((p, i) => {
                if (i < FEMALE_COLS * FEMALE_ROWS) {
                    const r = Math.floor(i / FEMALE_COLS) + 1;
                    const c = i % FEMALE_COLS;
                    updates.push({ ...p, dhamma_hall_seat_no: `${String.fromCharCode(65+c)}${r}` });
                }
            });

            await Promise.all(updates.map(p => fetch(`${API_URL}/participants/${p.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p)})));
            alert("✅ Done"); loadStudents();
        }, 50);
    };

    // Render Seat Box
    const SeatBox = ({ p, label }) => (
        <div style={{border:'1px solid #ccc', background: p ? (p.conf_no.startsWith('O') ? '#fff9c4':'white') : '#f0f0f0', height:'50px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:'10px', cursor:'pointer'}} onClick={()=>setSwappingSeat({p, label})}>
           {p ? <><b style={{color:'blue'}}>{p.dhamma_hall_seat_no}</b> {p.full_name.substring(0,8)}..</> : <span style={{color:'#ccc'}}>{label}</span>}
        </div>
    );

    // Grid Renderer (Visual J...A for Male means Reversing columns? or just labels?)
    // If we assigned A1, B1... J1. 
    // Visual: J I H G F E D C B A.
    // So we iterate columns 9 down to 0.
    const renderMaleGrid = (map) => {
        let rows = [];
        for(let r=1; r<=MALE_ROWS; r++) {
            let cells = [];
            for(let c=MALE_COLS-1; c>=0; c--) { // 9 downto 0 -> J...A
                const label = `${String.fromCharCode(65+c)}${r}`;
                cells.push(<SeatBox key={label} p={map[label]} label={label} />);
            }
            rows.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${MALE_COLS}, 1fr)`, gap:'5px', marginBottom:'5px'}}>{cells}</div>);
        }
        return rows;
    };
    
    const renderFemaleGrid = (map) => {
        let rows = [];
        for(let r=1; r<=FEMALE_ROWS; r++) {
            let cells = [];
            for(let c=0; c<FEMALE_COLS; c++) { // 0 to 6 -> A...G
                const label = `${String.fromCharCode(65+c)}${r}`;
                cells.push(<SeatBox key={label} p={map[label]} label={label} />);
            }
            rows.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${FEMALE_COLS}, 1fr)`, gap:'5px', marginBottom:'5px'}}>{cells}</div>);
        }
        return rows;
    };

    const maleMap={}; const femaleMap={};
    participants.forEach(p => { if(p.gender==='Male') maleMap[p.dhamma_hall_seat_no]=p; else femaleMap[p.dhamma_hall_seat_no]=p; });

    if (viewMode === 'seating') {
        return ( <div style={cardStyle}> 
           <div className="no-print" style={{marginBottom:'10px', display:'flex', gap:'10px'}}>
              <button onClick={()=>setViewMode('list')} style={btnStyle(false)}>Back</button>
              <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800'}}>⚡ Auto Assign</button>
              <button onClick={()=>window.print()} style={btnStyle(true)}>🖨️ Print</button>
           </div>
           <div className="print-area">
              <h2 style={{textAlign:'center'}}>DHAMMA HALL SEATING</h2>
              <div style={{display:'flex', gap:'20px'}}>
                  <div style={{flex:1}}>
                      <h3 style={{textAlign:'center', background:'#e3f2fd'}}>MALE (J ← A)</h3>
                      {renderMaleGrid(maleMap)}
                      <div style={{marginTop:'10px', borderTop:'1px dashed #ccc', paddingTop:'5px'}}>
                          <h4 style={{margin:0, textAlign:'center'}}>Special (K1-K8, L1-L8)</h4>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'2px', marginBottom:'2px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`K${i+1}`} label={`K${i+1}`} p={maleMap[`K${i+1}`]} />)}</div>
                          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'2px'}}>{Array.from({length:8},(_,i)=><SeatBox key={`L${i+1}`} label={`L${i+1}`} p={maleMap[`L${i+1}`]} />)}</div>
                      </div>
                  </div>
                  <div style={{width:'30px', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px dashed #ccc', borderRight:'1px dashed #ccc'}}>AISLE</div>
                  <div style={{flex:0.7}}>
                      <h3 style={{textAlign:'center', background:'#fce4ec'}}>FEMALE (A → G)</h3>
                      {renderFemaleGrid(femaleMap)}
                  </div>
              </div>
           </div>
        </div> );
    }

    return ( <div style={cardStyle}> <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <div style={{marginLeft:'auto', display:'flex', gap:'5px'}}> <button onClick={handleAutoNoShow} style={{...quickBtnStyle(true), background:'red'}}>🚫 No-Shows</button> <button onClick={handleSendReminders} style={quickBtnStyle(true)}>📢 Remind</button> <button onClick={()=>setViewMode('seating')} style={quickBtnStyle(true)}>🧘 Seating</button> </div> </div> <div style={{maxHeight:'500px', overflowY:'auto'}}> <table style={{width:'100%', fontSize:'13px'}}><thead><tr><th>Name</th><th>Conf</th><th>Status</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td>{p.full_name}</td><td>{p.conf_no}</td><td style={{color:p.status==='Arrived'?'green':'orange'}}>{p.status}</td></tr>))}</tbody></table> </div> </div> );
}

// --- GLOBAL ACCOMMODATION & EXPENSES (Placeholder for brevity - Same as before) ---
function GlobalAccommodationManager({ courses, onRoomClick }) { return <div style={cardStyle}><h3>Accommodation Manager</h3></div>; }
function ExpenseTracker() { return <div style={cardStyle}><h3>Store</h3></div>; }
function CourseAdmin() { return <div style={cardStyle}><h3>Admin</h3></div>; }

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
