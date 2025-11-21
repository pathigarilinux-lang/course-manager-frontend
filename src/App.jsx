import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

// YOUR BACKEND URL
const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

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
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 12pt; } }`}</style>

      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Global Accommodation</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Onboarding</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store & Finance</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <OnboardingForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- 1. ZERO DAY DASHBOARD ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);

  useEffect(() => {
    if (selectedCourse) {
      fetch(`${API_URL}/courses/${selectedCourse}/stats`)
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(console.error);
    }
  }, [selectedCourse]);

  const arrivalData = stats ? [
    { name: 'Arrived', Male: stats.arrived_m || 0, Female: stats.arrived_f || 0 },
    { name: 'Pending', Male: stats.pending_m || 0, Female: stats.pending_f || 0 },
    { name: 'Cancelled', Male: stats.cancelled_m || 0, Female: stats.cancelled_f || 0 }
  ] : [];

  const typeData = stats ? [
    { name: 'Old Students', Male: stats.om, Female: stats.of },
    { name: 'New Students', Male: stats.nm, Female: stats.nf },
    { name: 'Servers', Male: stats.sm, Female: stats.sf }
  ] : [];

  return (
    <div>
      <h2 style={{marginBottom: '20px', color: '#333'}}>Zero Day Dashboard</h2>
      {courses.length === 0 ? <p>No courses found.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {courses.map(c => {
             const isSelected = selectedCourse == c.course_id;
             return (
              <div key={c.course_id} onClick={() => setSelectedCourse(c.course_id)} 
                style={{...cardStyle, cursor:'pointer', border: isSelected ? '2px solid #007bff' : '1px solid transparent', background: isSelected ? '#f0f8ff' : 'white', transition: '0.2s'}}>
                <h3 style={{margin: '0 0 5px 0', color: '#007bff', fontSize:'16px'}}>{c.course_name}</h3>
                <p style={{fontSize:'12px', color:'#666', margin:0}}> {new Date(c.start_date).toLocaleDateString()} </p>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', fontSize:'13px'}}>
                  <span>✅ {c.arrived||0} Arrived</span><span>⏳ {c.pending||0} Pend</span>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {stats && selectedCourse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', animation: 'fadeIn 0.5s' }}>
          
          {/* Status Bar Chart */}
          <div style={cardStyle}>
            <h3 style={{marginTop:0}}>Status Overview (M/F)</h3>
            <div style={{height:'250px', width:'100%'}}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={arrivalData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="Male" fill="#007bff" stackId="a" />
                   <Bar dataKey="Female" fill="#e91e63" stackId="a" />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* Applicant Types Bar Chart */}
          <div style={cardStyle}>
            <h3 style={{marginTop:0}}>Applicant Types (M/F)</h3>
            <div style={{height:'250px', width:'100%'}}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={typeData}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="Male" fill="#007bff" stackId="a" />
                   <Bar dataKey="Female" fill="#e91e63" stackId="a" />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{display:'grid', gap:'20px'}}>
             {/* Live Counts Table */}
             <div style={cardStyle}>
                <h3 style={{marginTop:0}}>Live Counts</h3>
                <table style={{width:'100%', fontSize:'14px'}}>
                  <tbody>
                    <tr><td>Old Male (OM)</td><td><strong>{stats.om}</strong></td><td>Old Female (OF)</td><td><strong>{stats.of}</strong></td></tr>
                    <tr><td>New Male (NM)</td><td><strong>{stats.nm}</strong></td><td>New Female (NF)</td><td><strong>{stats.nf}</strong></td></tr>
                    <tr><td>Server Male (SM)</td><td><strong>{stats.sm}</strong></td><td>Server Female (SF)</td><td><strong>{stats.sf}</strong></td></tr>
                    <tr style={{borderTop:'1px solid #ddd'}}><td colSpan={2} style={{paddingTop:'5px'}}>Total Male: <strong>{stats.om+stats.nm+stats.sm}</strong></td><td colSpan={2} style={{paddingTop:'5px'}}>Total Female: <strong>{stats.of+stats.nf+stats.sf}</strong></td></tr>
                  </tbody>
                </table>
             </div>
             
             {/* Discourse Count Table */}
             <div style={cardStyle}>
                <h3 style={{marginTop:0}}>Discourse Count</h3>
                {stats.languages && stats.languages.length > 0 ? (
                  <div style={{maxHeight:'150px', overflowY:'auto'}}>
                  <table style={{width:'100%', fontSize:'13px'}}>
                    <thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Language</th><th>M</th><th>F</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
                    <tbody>
                      {stats.languages.map((l, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}>
                          <td style={{padding:'8px 0'}}>{l.discourse_language || 'Unknown'}</td>
                          <td style={{padding:'8px 0', color:'#007bff'}}>{l.male_count}</td>
                          <td style={{padding:'8px 0', color:'#e91e63'}}>{l.female_count}</td>
                          <td style={{padding:'8px 0', textAlign:'right', fontWeight:'bold'}}>{l.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : <p style={{color:'#888'}}>No data.</p>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. GLOBAL ACCOMMODATION MANAGER ---
function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' });
  const [editingRoom, setEditingRoom] = useState(null);

  const loadData = () => {
    setLoading(true);
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : []));
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => {
      setOccupancy(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const handleAddRoom = async () => {
    if (!newRoom.roomNo) return alert("Enter Room Number");
    await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) });
    setNewRoom({ ...newRoom, roomNo: '' });
    loadData();
  };
  // Protected rooms hardcoded for UI safety
  const PROTECTED = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"]);
  const handleDeleteRoom = async (id, name) => { 
    if (PROTECTED.has(name)) return alert("🚫 Cannot delete original room!");
    if(window.confirm("Delete this room?")) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } 
  };
  const handleSwapSave = async () => {
    if (!editingRoom || !editingRoom.p) return;
    await fetch(`${API_URL}/participants/${editingRoom.p.participant_id || editingRoom.p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingRoom.p, room_no: editingRoom.newRoomNo })
    });
    setEditingRoom(null); loadData();
  };

  const normalize = (str) => str ? str.replace(/[\s-]+/g, '').toUpperCase() : '';
  const occupiedMap = {}; 
  const unmappedParticipants = [];
  const validRoomSet = new Set(rooms.map(r => normalize(r.room_no)));

  occupancy.forEach(p => { 
    if(p.room_no) {
      const normRoom = normalize(p.room_no);
      if (validRoomSet.has(normRoom)) occupiedMap[normRoom] = p; 
      else unmappedParticipants.push(p); 
    }
  });

  let maleFree = 0, maleOcc = 0, maleOld = 0, maleNew = 0;
  let femaleFree = 0, femaleOcc = 0, femaleOld = 0, femaleNew = 0;

  rooms.forEach(r => {
    const p = occupiedMap[normalize(r.room_no)];
    const isMaleRoom = r.gender_type === 'Male';
    if (p) {
      const isOld = p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
      if (isMaleRoom) { maleOcc++; if(isOld) maleOld++; else maleNew++; } 
      else { femaleOcc++; if(isOld) femaleOld++; else femaleNew++; }
    } else {
      if (isMaleRoom) maleFree++; else femaleFree++;
    }
  });

  const renderRoom = (room) => {
    const occupant = occupiedMap[normalize(room.room_no)];
    const isOccupied = !!occupant;
    const isArrived = isOccupied && occupant.status === 'Arrived';

    return (
      <div key={room.room_id} onClick={() => isOccupied && setEditingRoom({ p: occupant, newRoomNo: room.room_no })}
        style={{
          border: isOccupied ? (isArrived ? '1px solid #ef9a9a' : '1px solid #ffcc80') : '1px solid #a5d6a7',
          background: isOccupied ? (isArrived ? '#ffebee' : '#fff3e0') : '#e8f5e9',
          borderRadius: '6px', padding: '8px', textAlign: 'center', minHeight: '80px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', justifyContent:'center',
          cursor: isOccupied ? 'pointer' : 'default', position: 'relative'
        }}
      >
        <div style={{fontWeight:'bold', fontSize:'13px', color:'#333'}}>{room.room_no}</div>
        {isOccupied ? (
          <div style={{fontSize:'11px', color: isArrived ? '#c62828' : '#ef6c00', marginTop:'4px'}}>
            <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'90px'}}>{occupant.full_name.split(' ')[0]}</div>
            <div style={{fontWeight:'bold', fontSize:'9px'}}>({occupant.conf_no || '-'})</div>
            <div style={{fontSize:'9px', color:'#555', marginTop:'2px', fontStyle:'italic'}}>{occupant.course_name ? occupant.course_name.substring(0,12)+'..' : ''}</div>
            <div style={{fontSize:'8px', background: 'rgba(255,255,255,0.5)', borderRadius:'4px', marginTop:'2px'}}>🔄 Swap</div>
          </div>
        ) : (
            <div>
                <div style={{fontSize:'9px', color:'#4caf50', marginTop:'4px'}}>FREE</div>
                <button onClick={(e)=>{e.stopPropagation(); onRoomClick(room.room_no)}} style={{marginTop:'2px', fontSize:'9px', display:'block', margin:'2px auto', background:'#4caf50', color:'white', border:'none', borderRadius:'2px', cursor:'pointer', width:'100%'}}>Assign</button>
            </div>
        )}
        
        {!isOccupied && !PROTECTED.has(room.room_no) && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(room.room_id, room.room_no)}} style={{position:'absolute', top:'2px', right:'2px', color:'#ccc', border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>x</button>}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center', flexWrap:'wrap', gap:'10px'}}>
        <h2 style={{margin:0}}>🛏️ Global Accommodation Manager</h2>
        <div style={{display:'flex', gap:'10px'}}>
           <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button>
           <button onClick={() => window.print()} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Status</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'20px'}}>
        <div style={{padding:'12px', background:'#e3f2fd', borderRadius:'8px', borderLeft:'5px solid #1565c0'}}>
          <div style={{fontSize:'14px', fontWeight:'bold', color:'#1565c0', marginBottom:'5px'}}>MALE WING</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}><span>Occupied: <strong>{maleOcc}</strong></span><span>Free: <strong>{maleFree}</strong></span></div>
          <div style={{fontSize:'11px', color:'#555', marginTop:'4px'}}>Old: <strong>{maleOld}</strong> | New: <strong>{maleNew}</strong></div>
        </div>
        <div style={{padding:'12px', background:'#fce4ec', borderRadius:'8px', borderLeft:'5px solid #ad1457'}}>
          <div style={{fontSize:'14px', fontWeight:'bold', color:'#ad1457', marginBottom:'5px'}}>FEMALE WING</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}><span>Occupied: <strong>{femaleOcc}</strong></span><span>Free: <strong>{femaleFree}</strong></span></div>
          <div style={{fontSize:'11px', color:'#555', marginTop:'4px'}}>Old: <strong>{femaleOld}</strong> | New: <strong>{femaleNew}</strong></div>
        </div>
        <div style={{padding:'12px', background:'#e8f5e9', borderRadius:'8px', borderLeft:'5px solid #2e7d32'}}>
          <div style={{fontSize:'14px', fontWeight:'bold', color:'#2e7d32', marginBottom:'5px'}}>TOTAL SUMMARY</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}><span>Total Occ: <strong>{maleOcc + femaleOcc}</strong></span><span>Total Free: <strong>{maleFree + femaleFree}</strong></span></div>
          <div style={{fontSize:'11px', color:'#555', marginTop:'4px'}}>Total Rooms: <strong>{rooms.length}</strong></div>
        </div>
      </div>

      {unmappedParticipants.length > 0 && (
        <div style={{marginBottom:'20px', padding:'15px', background:'#fff3e0', borderRadius:'8px', border:'1px solid #ffcc80'}}>
          <h3 style={{margin:'0 0 10px 0', color:'#ef6c00'}}>⚠️ {unmappedParticipants.length} Students with Invalid Room Numbers</h3>
          <div style={{maxHeight:'100px', overflowY:'auto', fontSize:'12px'}}>
             <table style={{width:'100%'}}>
               <thead><tr style={{textAlign:'left'}}><th>Name</th><th>Bad Room No</th><th>Action</th></tr></thead>
               <tbody>{unmappedParticipants.map((p, i) => (<tr key={i}><td>{p.full_name}</td><td style={{fontWeight:'bold', color:'red'}}>{p.room_no}</td><td><button onClick={() => setEditingRoom({ p, newRoomNo: '' })} style={{cursor:'pointer'}}>Fix</button></td></tr>))}</tbody>
             </table>
          </div>
        </div>
      )}

      <div className="no-print" style={{marginBottom:'20px', padding:'10px', background:'#f9f9f9', borderRadius:'6px', display:'flex', gap:'10px', alignItems:'center', border:'1px solid #eee'}}>
        <span style={{fontSize:'12px', fontWeight:'bold'}}>ADD ROOM:</span>
        <input style={{...inputStyle, width:'150px', padding:'8px'}} placeholder="Room No" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} />
        <select style={{...inputStyle, width:'100px', padding:'8px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select>
        <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>Add</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
         <div style={{border:'1px solid #90caf9', borderRadius:'8px', padding:'10px'}}>
            <h3 style={{textAlign:'center', background:'#e3f2fd', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>MALE WING</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}>
               {maleRooms.map(renderRoom)}
            </div>
         </div>
         <div style={{border:'1px solid #f48fb1', borderRadius:'8px', padding:'10px'}}>
            <h3 style={{textAlign:'center', background:'#fce4ec', margin:'0 0 15px 0', padding:'8px', borderRadius:'4px'}}>FEMALE WING</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'8px'}}>
               {femaleRooms.map(renderRoom)}
            </div>
         </div>
      </div>

      {editingRoom && (
        <div style={{position:'fixed', top:0, left:0
