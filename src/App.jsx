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
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
          <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px', boxShadow:'0 5px 15px rgba(0,0,0,0.3)'}}>
            <h3>🔄 Change/Swap Room</h3>
            <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}>
              <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name}</strong></p>
              <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p>
            </div>
            <label style={labelStyle}>New Room Number:</label>
            <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter free room no" />
            <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
              <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update</button>
              <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. ONBOARDING FORM ---
function OnboardingForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: '', confNo: '', dhammaSeat: '', specialSeating: '', diningSeatType: 'Floor' });
  const [status, setStatus] = useState('');

  useEffect(() => { 
    fetch(`${API_URL}/rooms`).then(res=>res.json()).then(data => setRooms(Array.isArray(data)?data:[]));
    fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(Array.isArray(data)?data:[]));
  }, []);

  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) { fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); } }, [formData.courseId]);
  
  // Filter Rooms
  const occupiedSet = new Set(occupancy.map(p => p.room_no ? p.room_no.replace(/\s+/g, '').toUpperCase() : ''));
  const availableRooms = rooms.filter(r => !occupiedSet.has(r.room_no.replace(/\s+/g, '').toUpperCase()));
  
  const studentsPending = participants.filter(p => p.status !== 'Arrived');

  const handleStudentChange = (e) => { 
    const selectedId = e.target.value; 
    const student = participants.find(p => p.participant_id == selectedId); 
    setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setStatus('Submitting...');
    
    const payload = { ...formData, diningSeatType: formData.diningSeatType }; 

    try {
      const res = await fetch(`${API_URL}/check-in`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unknown Error");
      }

      setStatus('✅ Success!');
      setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: '', confNo: '', dhammaSeat: '', specialSeating: '', diningSeatType: 'Floor' }));
      
      // Refresh Data
      clearRoom();
      fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data));
      fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data));

    } catch (err) { 
      setStatus(`❌ ${err.message}`); 
    }
  };

  return (
    <div style={cardStyle}>
      <h2>📝 Onboarding Form</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '900px' }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
          <div><label style={labelStyle}>Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} required><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
          <div><label style={labelStyle}>Student (Pending)</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{studentsPending.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div>
        </div>
        <hr style={{border:'0', borderTop:'1px solid #eee'}} />
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'10px'}}>
          <div><label style={labelStyle}>Conf No</label><input style={{...inputStyle, background:'#f9f9f9'}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} placeholder="Auto-fills" /></div>
          <div style={{gridColumn: 'span 2', display:'flex', gap:'5px'}}>
             <div style={{flex:1}}><label style={labelStyle}>Type</label><select style={inputStyle} value={formData.diningSeatType} onChange={e => setFormData({...formData, diningSeatType: e.target.value})}><option>Floor</option><option>Chair</option></select></div>
             <div style={{flex:2}}><label style={labelStyle}>Dining Seat</label><input style={inputStyle} value={formData.seatNo} onChange={e => setFormData({...formData, seatNo: e.target.value})} placeholder="e.g. 12" required /></div>
          </div>
          <div><label style={labelStyle}>Dhamma Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} placeholder="or NA" /></div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Room No</label>
            <select style={{...inputStyle}} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required>
              <option value="">-- Select Free Room --</option>
              {preSelectedRoom && <option value={preSelectedRoom}>{preSelectedRoom} (Selected)</option>}
              {availableRooms.map(r => <option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Mob Locker</label><input style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})} placeholder="or NA" /></div>
          <div><label style={labelStyle}>Val Locker</label><input style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})} placeholder="or NA" /></div>
          <div><label style={labelStyle}>Laundry Tk</label><input style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} placeholder="or NA" /></div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
           <div><label style={labelStyle}>Laptop</label><input style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})} placeholder="Details/NA" /></div>
           <div><label style={labelStyle}>Pagoda</label><input style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})} placeholder="or NA" /></div>
           <div><label style={labelStyle}>Special (Hidden)</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div>
           <div><label style={labelStyle}>Discourse Language</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Malayalam</option><option>Gujarati</option><option>Odia</option><option>Bengali</option><option>Mandarin Chinese</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Vietnamese</option><option>Thai</option><option>Japanese</option></select></div>
        </div>
        <button type="submit" style={{...btnStyle(true), background:'#007bff', color:'white', padding:'15px', marginTop:'10px'}}>Confirm Onboarding</button> 
        {status && <p style={{ fontWeight: 'bold', color: status.includes('Success') ? 'green' : 'red', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// --- 4. MANAGE STUDENTS ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState(''); const [editingStudent, setEditingStudent] = useState(null); const [viewMode, setViewMode] = useState('list'); const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Courses", "Age", "Gender", "Dining Seat", "Dining Type", "Room", "Pagoda", "Language", "Status"]; const rows = participants.map(p => [`"${p.full_name}"`, p.conf_no, `"${p.courses_info}"`, p.age, p.gender, p.dining_seat_no, p.dining_seat_type, p.room_no, p.pagoda_cell_no, p.discourse_language, p.status]); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `students_course_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const sortedList = React.useMemo(() => { let sortableItems = [...participants]; if (sortConfig.key) { sortableItems.sort((a, b) => { const valA = (a[sortConfig.key] || '').toString().toLowerCase(); const valB = (b[sortConfig.key] || '').toString().toLowerCase(); if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } return sortableItems.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())); }, [participants, sortConfig, search]);
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students/expenses?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE COMPLETELY?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || 'Course';
  const getCategory = (seatNo) => { if (!seatNo) return '-'; const s = seatNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF')) return 'Old'; if (s.startsWith('NM') || s.startsWith('NF')) return 'New'; if (s.startsWith('SM') || s.startsWith('SF')) return 'DS'; return 'New'; };
  const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = confNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 1; return 2; };
  const parseCourses = (str) => { if (!str) return { s: 0, l: 0, seva: 0 }; const s = str.match(/S:\s*(\d+)/); const l = str.match(/L:\s*(\d+)/); const sv = str.match(/Seva:\s*(\d+)/); return { s: s ? parseInt(s[1]) : 0, l: l ? parseInt(l[1]) : 0, seva: sv ? parseInt(sv[1]) : 0 }; };
  const getSeniorityScore = (p) => { const c = parseCourses(p.courses_info); return (c.l * 10000) + (c.s * 10) + (c.seva * 0.1); };

  if (viewMode === 'dining') {
    const sorted = [...participants].sort((a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return (a.dining_seat_no || 'Z').localeCompare(b.dining_seat_no || 'Z'); });
    return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Sheet</button></div><div style={{textAlign:'center'}}><h1>Dining Seating Chart</h1><h3>{selectedCourseName}</h3></div><table style={{width:'100%', borderCollapse:'collapse', fontSize:'16px'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Seat</th><th style={thPrint}>Type</th><th style={thPrint}>Cat</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Pagoda</th><th style={thPrint}>Lang</th></tr></thead><tbody>{sorted.filter(p=>p.status==='Arrived').map(p=>(<tr key={p.participant_id} style={{borderBottom:'1px solid #ddd'}}><td style={{padding:'12px', fontWeight:'bold'}}>{p.dining_seat_no}</td><td style={{padding:'12px'}}>{p.dining_seat_type === 'F' ? 'Floor' : 'Chair'}</td><td style={{padding:'12px'}}>{getCategory(p.conf_no)}</td><td style={{padding:'12px'}}>{p.full_name}</td><td style={{padding:'12px'}}>{p.room_no}</td><td style={{padding:'12px'}}>{p.pagoda_cell_no}</td><td style={{padding:'12px'}}>{p.discourse_language}</td></tr>))}</tbody></table></div> );
  }
  if (viewMode === 'seating') { const sorted = participants.filter(p => p.dhamma_hall_seat_no).sort((a,b) => (a.dhamma_hall_seat_no || 'Z').localeCompare(b.dhamma_hall_seat_no || 'Z')); return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Plan</button></div><div style={{textAlign:'center', marginBottom:'20px'}}><h1>Dhamma Hall Seating</h1><h3>{selectedCourseName}</h3></div>{sorted.length===0?<p style={{textAlign:'center',color:'red'}}>No Dhamma Seats assigned.</p>:<div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'10px', marginTop:'20px'}}>{sorted.map(p => (<div key={p.participant_id} style={{border:'1px solid #333', padding:'10px', textAlign:'center', borderRadius:'5px', background:'#f9f9f9'}}><div style={{fontWeight:'bold', fontSize:'18px', marginBottom:'5px'}}>{p.dhamma_hall_seat_no}</div><div style={{fontSize:'13px'}}>{p.full_name}</div></div>))}</div>}</div> ); }

  return ( <div style={cardStyle}> <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} /></div><div style={{display:'flex', gap:'5px'}}><button onClick={handleExport} disabled={!courseId} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>📥 Export CSV</button><button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining Sheet</button><button onClick={() => setViewMode('seating')} disabled={!courseId} style={quickBtnStyle(true)}>🧘 Dhamma Plan</button></div></div>
  {courseId && (<div style={{background:'#fff5f5', border:'1px solid #feb2b2', padding:'10px', borderRadius:'5px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{color:'#c53030', fontWeight:'bold', fontSize:'13px'}}>⚠️ Admin Zone:</span><div><button onClick={handleResetCourse} style={{background:'#e53e3e', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', marginRight:'10px', fontSize:'12px'}}>Reset Data</button><button onClick={handleDeleteCourse} style={{background:'red', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Delete Course</button></div></div>)}
  <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}>{['full_name','conf_no','courses_info','age','gender','dining_seat_no','dining_seat_type','room_no','pagoda_cell_no'].map(k=><th key={k} style={{...tdStyle, cursor:'pointer'}} onClick={()=>handleSort(k)}>{k.replace('_',' ').toUpperCase()}{sortConfig.key===k?(sortConfig.direction==='asc'?'▲':'▼'):''}</th>)}<th style={tdStyle}>ACTIONS</th></tr></thead><tbody>{sortedList.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.conf_no||'-'}</td><td style={{...tdStyle, fontSize:'12px'}}>{p.courses_info||'-'}</td><td style={tdStyle}>{p.age||'-'}</td><td style={tdStyle}>{p.gender||'-'}</td><td style={tdStyle}>{p.dining_seat_no||'-'}</td><td style={tdStyle}>{p.dining_seat_type==='C'?'Chair':'Floor'}</td><td style={tdStyle}>{p.room_no||'-'}</td><td style={tdStyle}>{p.pagoda_cell_no||'-'}</td><td style={tdStyle}><button onClick={() => setEditingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={() => handleDelete(p.participant_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div>
  {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}><label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e => setEditingStudent({...editingStudent, conf_no: e.target.value})} /></div><div><label>Lang</label><input style={inputStyle} value={editingStudent.discourse_language||''} onChange={e => setEditingStudent({...editingStudent, discourse_language: e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Dining</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} /></div><div><label>Dhamma</label><input style={inputStyle} value={editingStudent.dhamma_hall_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dhamma_hall_seat_no: e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Room</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e => setEditingStudent({...editingStudent, room_no: e.target.value})} /></div><div><label>Pagoda</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e => setEditingStudent({...editingStudent, pagoda_cell_no: e.target.value})} /></div></div><label>Seating Type</label><select style={inputStyle} value={editingStudent.special_seating||''} onChange={e => setEditingStudent({...editingStudent, special_seating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="submit" style={{...btnStyle(true), flex:1, background:'#28a745', color:'white'}}>Save</button><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button></div></form></div></div>)}</div> );
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
      <h2>{editingId ? '✏️ Edit Expense' : '🛒 Record Expense'}</h2>
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
