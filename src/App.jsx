import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { 
  Users, Upload, Save, Database, AlertTriangle, CheckCircle, 
  Search, Home, Coffee, FileText, Trash2, X, Edit, Plus,
  CreditCard, DollarSign, Download, Calendar
} from 'lucide-react';

const API_URL = "https://course-manager-backend-staging.onrender.com"; // Staging URL
const ADMIN_PASSCODE = "11111"; 

// --- UTILS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);

// RESTORED: Protected Rooms List (To prevent accidental deletion of infrastructure)
const PROTECTED_ROOMS = new Set([
  "301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"
]);

const getShortCourseName = (name) => {
  if (!name) return 'Unknown';
  if (name.includes('45-Day')) return '45D';
  if (name.includes('30-Day')) return '30D';
  if (name.includes('20-Day')) return '20D';
  if (name.includes('10-Day')) return '10D';
  if (name.includes('Satipatthana')) return 'ST';
  if (name.includes('Gratitude')) return 'GT';
  if (name.includes('Service')) return 'SVC';
  if (name.includes('Children')) return 'CHILD';
  if (name.includes('Teen')) return 'TEEN';
  return 'OTH';
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  // --- COURSE ADMIN STATE ---
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('upload'); 
  const [newCourseData, setNewCourseData] = useState({ name: '', startDate: '', endDate: '' });
  const [manualStudent, setManualStudent] = useState({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });

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

  // ==============================================================================
  // --- COURSE ADMIN LOGIC -------------------------------------------------------
  // ==============================================================================

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
    
    // 1. Create the new course object
    const courseId = `C-${Date.now()}`;
    const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
    
    const newCourseLocal = { 
        course_id: courseId, 
        course_name: courseName, 
        start_date: newCourseData.startDate, 
        end_date: newCourseData.endDate 
    };

    // 2. Force Update UI (Sticky)
    setCourses(prev => [...prev, newCourseLocal]);

    // 3. Save to Backend
    try {
        const payload = {
            courseName: courseName,
            teacherName: 'Goenka Ji',
            startDate: newCourseData.startDate,
            endDate: newCourseData.endDate
        };

        const res = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(`✅ Course Created: ${courseName}`);
            fetchCourses(); 
        } else {
            console.warn("Backend rejected save. Keeping local copy.");
        }
    } catch (err) {
        console.error("Backend Error:", err);
    }
    
    setNewCourseData({ name: '', startDate: '', endDate: '' });
    setSelectedCourseForUpload(courseName);
    setAdminSubTab('upload');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    const newStudent = {
      id: Date.now(),
      ...manualStudent,
      conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`,
      status: 'Active',
      dining_seat: '',
      room_no: ''
    };
    setStudents(prev => [newStudent, ...prev]);
    alert(`Added ${newStudent.full_name} to the Preview list.`);
    setManualStudent({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
    setAdminSubTab('upload');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("❌ Format Error! Please upload a .CSV file.");
      event.target.value = null; 
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try { processCSV(e.target.result); } 
      catch (err) { console.error(err); setUploadStatus({ type: 'error', msg: 'Failed to parse CSV.' }); }
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) { setUploadStatus({ type: 'error', msg: 'File is empty or too short.' }); return; }

    const splitRow = (rowStr) => rowStr.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

    let headerRowIndex = -1;
    let headers = [];

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const lineLower = lines[i].toLowerCase();
        if (lineLower.includes('name') && (lineLower.includes('gender') || lineLower.includes('age'))) {
            headerRowIndex = i;
            headers = splitRow(lines[i]).map(h => h.toLowerCase());
            break;
        }
    }

    if (headerRowIndex === -1) {
        setUploadStatus({ type: 'error', msg: 'Could not detect headers (Name, Gender, Age). Please check CSV format.' });
        return;
    }

    const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const map = {
      conf: getIndex(['conf', 'ref', 'id', 'no.']),
      name: getIndex(['name', 'student', 'given']),
      age: getIndex(['age']), 
      gender: getIndex(['gender', 'sex']),
      courses: getIndex(['course', 'history']), 
      seat: getIndex(['seat', 'dining']),
      email: getIndex(['email']),
      phone: getIndex(['phone', 'mobile']),
      notes: getIndex(['notes', 'remark'])
    };
    
    const parsedStudents = lines.slice(headerRowIndex + 1).map((line, index) => {
      const row = splitRow(line);
      const rawName = map.name > -1 ? row[map.name] : '';
      const rawConf = map.conf > -1 ? row[map.conf] : '';
      
      if (!rawName && !rawConf) return null; 

      return {
        id: Date.now() + index,
        conf_no: rawConf || `TEMP-${index + 1}`,
        full_name: rawName || 'Unknown Student',
        age: map.age > -1 ? row[map.age] : '',
        gender: map.gender > -1 ? row[map.gender] : '',
        courses_info: map.courses > -1 ? row[map.courses] : '', 
        dining_seat: map.seat > -1 ? row[map.seat] : '',
        email: map.email > -1 ? row[map.email] : '',
        mobile: map.phone > -1 ? row[map.phone] : '',
        notes: map.notes > -1 ? row[map.notes] : '',
        status: rawConf ? 'Active' : 'Pending ID'
      };
    }).filter(s => s !== null);

    setStudents(parsedStudents);
    setUploadStatus({ type: 'success', msg: `Ready! Loaded ${parsedStudents.length} valid students.` });
  };

  const saveToDatabase = async () => {
    if (students.length === 0) return;
    const targetCourse = courses.find(c => c.course_name === selectedCourseForUpload);
    if (!targetCourse) return alert("Please select a valid course first.");

    if (!window.confirm(`Save ${students.length} students to ${selectedCourseForUpload}?`)) return;

    try {
        const payload = { students: students.map(s => ({
            name: s.full_name,
            confNo: s.conf_no,
            age: s.age,
            gender: s.gender,
            courses: s.courses_info,
            email: s.email,
            phone: s.mobile
        }))};

        const res = await fetch(`${API_URL}/courses/${targetCourse.course_id}/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if(res.ok) {
            alert(`✅ Success: ${data.message}`);
            setStudents([]); 
        } else {
            alert(`❌ Error: ${data.error}`);
        }
    } catch(err) {
        alert("Network Error: Failed to save data.");
        console.error(err);
    }
  };

  const renderCourseAdmin = () => (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
          <Upload size={24} className="text-blue-600"/> Course Admin
        </h2>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={()=>setAdminSubTab('create')} style={quickBtnStyle(adminSubTab==='create')}>+ New Course</button>
           <button onClick={()=>setAdminSubTab('upload')} style={quickBtnStyle(adminSubTab==='upload')}>📂 Upload CSV</button>
           <button onClick={()=>setAdminSubTab('manual')} style={quickBtnStyle(adminSubTab==='manual')}>✍️ Manual Entry</button>
        </div>
      </div>

      {adminSubTab === 'create' && (
        <form onSubmit={handleCreateCourse} style={{maxWidth:'500px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'15px'}}>
          <h3 style={{textAlign:'center'}}>Create New Course</h3>
          <div><label style={labelStyle}>Course Name</label><input style={inputStyle} placeholder="e.g. 10-Day" value={newCourseData.name} onChange={e=>setNewCourseData({...newCourseData, name:e.target.value})} /></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <div><label style={labelStyle}>Start</label><input type="date" style={inputStyle} value={newCourseData.startDate} onChange={e=>setNewCourseData({...newCourseData, startDate:e.target.value})} /></div>
            <div><label style={labelStyle}>End</label><input type="date" style={inputStyle} value={newCourseData.endDate} onChange={e=>setNewCourseData({...newCourseData, endDate:e.target.value})} /></div>
          </div>
          <button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>
        </form>
      )}

      {adminSubTab === 'upload' && (
        <>
          <div style={{marginBottom:'20px'}}>
            <label style={labelStyle}>Select Target Course</label>
            <select style={inputStyle} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)}>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
            </select>
          </div>
          <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'30px', textAlign:'center', background:'#f9f9f9', position:'relative'}}>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} />
            <div style={{pointerEvents:'none'}}>
              <Database size={40} color="#999" />
              <p style={{margin:'10px 0', color:'#555'}}>Click to upload .CSV file</p>
            </div>
          </div>
          {uploadStatus && <div style={{marginTop:'15px', padding:'10px', background:'#e6fffa', color:'#2c7a7b'}}>{uploadStatus.msg}</div>}
          {students.length > 0 && (
            <div style={{marginTop:'25px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0}}>Preview ({students.length})</h3>
                  <button onClick={saveToDatabase} style={{...btnStyle(true), background:'#28a745', color:'white'}}><Save size={16}/> Save to Database</button>
               </div>
               <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee'}}>
                 <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
                   <thead style={{position:'sticky', top:0, background:'#f1f1f1'}}>
                     <tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr>
                   </thead>
                   <tbody>
                     {students.map(s => (
                       <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                         <td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue'}}>{s.conf_no}</td>
                         <td style={{padding:'8px'}}>{s.full_name}</td>
                         <td style={{padding:'8px'}}>{s.age}</td>
                         <td style={{padding:'8px'}}>{s.gender}</td>
                         <td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}

      {adminSubTab === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{maxWidth:'600px', margin:'0 auto'}}>
          <h3 style={{textAlign:'center', marginBottom:'20px'}}>Add Single Student</h3>
          <div style={{marginBottom:'15px'}}>
            <label style={labelStyle}>Target Course</label>
            <select style={inputStyle} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)} required>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'15px', marginBottom:'15px'}}>
             <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} required /></div>
             <div><label style={labelStyle}>Conf No</label><input style={inputStyle} value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} /></div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:'15px', marginBottom:'15px'}}>
             <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
             <div><label style={labelStyle}>Age</label><input type="number" style={inputStyle} value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} /></div>
             <div><label style={labelStyle}>Courses Info</label><input style={inputStyle} value={manualStudent.courses_info} onChange={e=>setManualStudent({...manualStudent, courses_info:e.target.value})} placeholder="e.g. S:3 L:1" /></div>
          </div>
          <button type="submit" style={{...btnStyle(true), width:'100%', background:'#007bff', color:'white'}}>+ Add to Preview</button>
        </form>
      )}
    </div>
  );

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
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-hide { display: none; } }`}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Zero Day Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>AT Panel</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Global Accommodation</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Student Onboarding</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && renderCourseAdmin()}
    </div>
  );
}

// --- GLOBAL ACCOMMODATION (FIXED & IMPROVED) ---
function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [editingRoom, setEditingRoom] = useState(null);

  const loadData = () => { 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); 
  };
  
  useEffect(loadData, []);

  // Fix for "OTH" issue - handles spaces and dashes
  const getSmartShortName = (name) => {
      if (!name) return 'Unknown';
      const n = name.toUpperCase();
      if (n.includes('45-DAY') || n.includes('45 DAY')) return '45D';
      if (n.includes('30-DAY') || n.includes('30 DAY')) return '30D';
      if (n.includes('20-DAY') || n.includes('20 DAY')) return '20D';
      if (n.includes('10-DAY') || n.includes('10 DAY')) return '10D';
      if (n.includes('SATIPATTHANA')) return 'ST';
      if (n.includes('SERVICE')) return 'SVC';
      return 'OTH';
  };

  const handleAddRoom = async () => { 
      if (!newRoom.roomNo) return alert("Enter Room Number"); 
      try {
          const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) });
          if(res.ok) {
              setNewRoom({ ...newRoom, roomNo: '' }); 
              loadData(); // Force refresh
          } else {
              alert("Failed to add room. Check if it already exists.");
          }
      } catch(err) { console.error(err); }
  };

  const handleDeleteRoom = async (id, name) => { 
      if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Room ${name} is protected.`); return; }
      if(window.confirm(`Delete room ${name}?`)) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } 
  };

  const handleSwapSave = async () => { 
      if (!editingRoom || !editingRoom.p) return;
      const targetRoomNo = editingRoom.newRoomNo.trim();
      if(!targetRoomNo) return alert("Enter Target Room.");
      
      const normalize = (s) => s ? s.toString().trim().toUpperCase() : '';
      const targetNorm = normalize(targetRoomNo);
      const currentNorm = normalize(editingRoom.p.room_no);

      if (targetNorm === currentNorm) { alert("Same room!"); return; }

      const targetOccupant = occupancy.find(p => p.room_no && normalize(p.room_no) === targetNorm);
      const currentStudent = editingRoom.p;
      
      if(targetOccupant) {
          if(!window.confirm(`⚠️ Swap ${currentStudent.full_name} <-> ${targetOccupant.full_name}?`)) return;
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: currentStudent.room_no }) });
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: targetRoomNo }) });
      } else {
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: targetRoomNo }) });
      }
      setEditingRoom(null); 
      loadData();
  };

  // Logic
  const normalize = (str) => str ? str.toString().trim().toUpperCase() : '';
  const courseGroups = {};
  courses.forEach(c => { courseGroups[c.course_id] = { name: c.course_name, males: [], females: [], stats: { old: 0, new: 0, total: 0 } }; });

  const occupiedSet = new Set();
  occupancy.forEach(p => {
      if (p.room_no) {
          occupiedSet.add(normalize(p.room_no));
          const cId = p.course_id; 
          const group = courseGroups[cId]; // Exact match by ID
          if (group) {
              const isOld = p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
              group.stats.total++;
              if (isOld) group.stats.old++; else group.stats.new++;
              if ((p.gender||'').toLowerCase().startsWith('f')) group.females.push(p); else group.males.push(p);
          }
      }
  });

  const availableRooms = rooms.filter(r => !occupiedSet.has(normalize(r.room_no)));
  const maleAvailable = availableRooms.filter(r => r.gender_type === 'Male');
  const femaleAvailable = availableRooms.filter(r => r.gender_type === 'Female');

  const RoomCard = ({ r, p, type }) => {
      const isOld = p && p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
      const bgColor = type === 'available' ? 'white' : (isOld ? '#e1bee7' : '#c8e6c9'); 
      const borderColor = type === 'available' ? '#ccc' : (isOld ? '#8e24aa' : '#2e7d32');
      const genderBorder = r.gender_type === 'Female' ? '4px solid #e91e63' : '4px solid #007bff';

      return (
          <div 
            onClick={() => type === 'occupied' ? setEditingRoom({ p, newRoomNo: '' }) : onRoomClick(r.room_no)}
            style={{ border: `1px solid ${borderColor}`, borderLeft: genderBorder, background: bgColor, borderRadius: '4px', padding: '5px', minHeight: '60px', fontSize: '11px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
              <div style={{fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
                  {r.room_no}
                  {type === 'available' && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(r.room_id, r.room_no)}} style={{border:'none', background:'none', color:'#ccc', cursor:'pointer'}}>×</button>}
              </div>
              {type === 'occupied' && (
                  <div style={{marginTop:'2px'}}>
                      <div style={{fontWeight:'bold', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:'2px'}}>
                          <span style={{fontWeight:'bold', color:'#333'}}>{p.conf_no || '-'}</span>
                          <span style={{color:'#666'}}>{p.age}</span>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return ( 
    <div style={cardStyle}> 
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}> 
        <h2 style={{margin:0}}>🛏️ Global Accommodation</h2> 
        <div style={{display:'flex', gap:'5px', background:'#f9f9f9', padding:'5px', borderRadius:'5px'}}> 
            <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> 
            <select style={{...inputStyle, width:'80px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> 
            <button onClick={handleAddRoom} style={{...quickBtnStyle(true), background:'#007bff', color:'white', padding:'5px 10px'}}>+ Add Room</button> 
        </div>
        <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> 
      </div> 

      {/* DASHBOARD STATS */}
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', overflowX:'auto', paddingBottom:'10px'}}>
          {Object.values(courseGroups).map((g, i) => (
              <div key={i} style={{background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', minWidth:'180px', borderTop:'4px solid #28a745'}}>
                  <div style={{fontWeight:'bold', fontSize:'13px', marginBottom:'5px'}}>{getSmartShortName(g.name)}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>
                      <span>Old: <b>{g.stats.old}</b></span>
                      <span>New: <b>{g.stats.new}</b></span>
                      <span>Total: <b>{g.stats.total}</b></span>
                  </div>
              </div>
          ))}
          <div style={{background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', minWidth:'180px', borderTop:'4px solid #6c757d'}}>
              <div style={{fontWeight:'bold', fontSize:'13px', marginBottom:'5px'}}>Available Pool</div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>
                  <span style={{color:'#007bff'}}>Male: <b>{maleAvailable.length}</b></span>
                  <span style={{color:'#e91e63'}}>Female: <b>{femaleAvailable.length}</b></span>
              </div>
          </div>
      </div>

      {/* ACTIVE COURSE BLOCKS */}
      {Object.values(courseGroups).map((g, i) => ( g.stats.total > 0 &&
          <div key={i} style={{marginBottom:'20px', border:'1px solid #ccc', borderRadius:'8px', overflow:'hidden'}}>
              <div style={{background:'#333', color:'white', padding:'10px', fontWeight:'bold'}}>{getSmartShortName(g.name)} (Allocated)</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
                  {/* MALE SIDE */}
                  <div style={{padding:'10px', borderRight:'1px solid #eee'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#007bff', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>
                          MALE ({g.males.length})
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>
                          {g.males.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (
                              <RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Male'}} p={p} type="occupied" />
                          ))}
                      </div>
                  </div>
                  {/* FEMALE SIDE */}
                  <div style={{padding:'10px'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#e91e63', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>
                          FEMALE ({g.females.length})
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>
                          {g.females.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (
                              <RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Female'}} p={p} type="occupied" />
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      ))}

      {/* AVAILABLE POOL */}
      <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'10px'}}>
          <div style={{textAlign:'center', fontWeight:'bold', color:'#777', marginBottom:'10px'}}>🟢 AVAILABLE POOL</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div>
                  <h4 style={{margin:'0 0 10px 0', color:'#007bff', borderBottom:'2px solid #007bff'}}>MALE WING</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>
                      {maleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}
                  </div>
              </div>
              <div>
                  <h4 style={{margin:'0 0 10px 0', color:'#e91e63', borderBottom:'2px solid #e91e63'}}>FEMALE WING</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>
                      {femaleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}
                  </div>
              </div>
          </div>
      </div>

      {/* SWAP MODAL */}
      {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter target room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update / Swap</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} 
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

  const handleLocalChange = (field, value) => {
    setEditingStudent(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent)
    });
    setEditingStudent(null);
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
               <th style={{padding:'10px'}}>Special SEAT</th><th style={{padding:'10px'}}>Evening Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>
               {filtered.map(p => (
                 <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                   <td style={{padding:'10px'}}><strong>{p.full_name}</strong></td>
                   <td style={{padding:'10px'}}>{p.conf_no}</td>
                   <td style={{padding:'10px'}}>{p.special_seating || '-'}</td>
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
            <form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
               <div><label style={labelStyle}>Special Seating</label><select style={inputStyle} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
               <div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option><option value="Other">Other</option></select></div>
               <div><label style={labelStyle}>Medical Info</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleLocalChange('medical_info', e.target.value)} /></div>
               <div><label style={labelStyle}>Teacher Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} /></div>
               <div style={{marginTop:'10px', textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false)}}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Done & Save</button></div>
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
  const attendanceString = courses.map(c => { const total = (c.arrived || 0) + (c.pending || 0); const pct = total > 0 ? Math.round((c.arrived || 0) / total * 100) : 0; return `${getShortCourseName(c.course_name)}: ${c.arrived}/${total} (${pct}%)`; }).join("  ✦  ");

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard</h2>
        <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      </div>
      <div style={{background:'#e3f2fd', color:'#333', padding:'8px', marginBottom:'20px', overflow:'hidden', whiteSpace:'nowrap', borderRadius:'4px', border:'1px solid #90caf9', fontWeight:'bold', fontSize:'14px'}}><marquee>{attendanceString || "Loading Course Data..."}</marquee></div>
      {stats && selectedCourse ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', animation: 'fadeIn 0.5s' }}>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Status Overview</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={arrivalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Discourse Count</h3>{stats.languages && stats.languages.length > 0 ? (<div style={{maxHeight:'250px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'13px'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>Lang</th><th style={{width:'30px'}}>M</th><th style={{width:'30px'}}>F</th><th style={{textAlign:'right'}}>Tot</th></tr></thead><tbody>{stats.languages.map((l, i) => (<tr key={i} style={{borderBottom:'1px solid #f4f4f4'}}><td style={{padding:'4px 0'}}>{l.discourse_language}</td><td style={{padding:'4px 0', color:'#007bff'}}>{l.male_count}</td><td style={{padding:'4px 0', color:'#e91e63'}}>{l.female_count}</td><td style={{padding:'4px 0', textAlign:'right'}}>{l.total}</td></tr>))}</tbody></table></div>) : <p style={{color:'#888'}}>No data.</p>}</div>
          <div style={cardStyle}><h3 style={{marginTop:0}}>Live Counts</h3><div style={{height:'250px'}}><ResponsiveContainer><BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Male" fill="#007bff"><LabelList dataKey="Male" position="top" fill="#007bff" /></Bar><Bar dataKey="Female" fill="#e91e63"><LabelList dataKey="Female" position="top" fill="#e91e63" /></Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course to view stats.</p>}
    </div>
  );
}

function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]); const [rooms, setRooms] = useState([]); const [occupancy, setOccupancy] = useState([]); const [selectedStudent, setSelectedStudent] = useState(null); 
  const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Chair' }); 
  const [status, setStatus] = useState('');

  useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(data => setRooms(Array.isArray(data)?data:[])); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(Array.isArray(data)?data:[])); }, []);
  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) { fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); } }, [formData.courseId]);

  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  const roomGenderMap = {}; rooms.forEach(r => { if(r.room_no) roomGenderMap[normalize(r.room_no)] = r.gender_type; });
  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));

  const currentGender = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGender.startsWith('m'); const isFemale = currentGender.startsWith('f');
  const allRecords = [...occupancy, ...participants].filter(p => String(p.participant_id) !== String(formData.participantId) && p.status !== 'Cancelled');
  const usedDining = new Set(); const usedLaundry = new Set(); const usedMobile = new Set(); const usedValuables = new Set();

  allRecords.forEach(p => {
      let pGender = ''; if (p.gender) pGender = p.gender.toLowerCase(); else if (p.room_no && roomGenderMap[normalize(p.room_no)]) pGender = roomGenderMap[normalize(p.room_no)].toLowerCase();
      if ((isMale && pGender.startsWith('m')) || (isFemale && pGender.startsWith('f'))) {
          if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no));
          if (p.laundry_token_no) usedLaundry.add(cleanNum(p.laundry_token_no));
          if (p.mobile_locker_no) usedMobile.add(cleanNum(p.mobile_locker_no));
          if (p.valuables_locker_no) usedValuables.add(cleanNum(p.valuables_locker_no));
      }
  });

  const getAvailableOptions = (usedSet) => NUMBER_OPTIONS.filter(n => !usedSet.has(String(n)));
  const availableDiningOpts = getAvailableOptions(usedDining); const availableLaundryOpts = getAvailableOptions(usedLaundry); const availableMobileOpts = getAvailableOptions(usedMobile); const availableValuablesOpts = getAvailableOptions(usedValuables);
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female'); 
  const studentsPending = participants.filter(p => p.status !== 'Arrived');

  const handleStudentChange = (e) => { const selectedId = e.target.value; const student = participants.find(p => p.participant_id == selectedId); setSelectedStudent(student); setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); };
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    if (!formData.confNo || formData.confNo.trim() === '') { return alert("⛔ STOP: Student is missing a Confirmation Number (e.g. NM50)."); }
    setStatus('Submitting...'); const payload = { ...formData, diningSeatType: formData.seatType }; 
    try { 
      const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unknown Error"); 
      fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
      setStatus('✅ Success!'); setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor' })); setSelectedStudent(null); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data)); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(data => setOccupancy(data)); 
    } catch (err) { setStatus(`❌ ${err.message}`); } 
  };

  const sectionHeader = (title) => <div style={{fontSize:'14px', fontWeight:'bold', color:'#007bff', borderBottom:'1px solid #eee', paddingBottom:'5px', marginTop:'15px', marginBottom:'10px'}}>{title}</div>;
  return ( <div style={cardStyle}> <h2>📝 Student Onboarding Form</h2> <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>2. Select Student</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{studentsPending.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div> </div> {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ SPECIAL ATTENTION:</strong> {selectedStudent.evening_food && <div>🍛 Food: {selectedStudent.evening_food}</div>} {selectedStudent.medical_info && <div>🏥 Medical: {selectedStudent.medical_info}</div>}</div>)} </div> {sectionHeader("📍 Allocation Details")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🆔 Conf No <span style={{color:'red'}}>*</span></label><input style={{...inputStyle, background: formData.confNo ? '#e8f5e9' : '#ffebee', border: formData.confNo ? '1px solid #ccc' : '1px solid red'}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} placeholder="REQUIRED" /></div> <div><label style={labelStyle}>🛏️ Room No</label><select style={{...inputStyle, background: preSelectedRoom ? '#e8f5e9' : 'white'}} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required><option value="">-- Free Rooms --</option>{preSelectedRoom && <option value={preSelectedRoom}>{preSelectedRoom} (Selected)</option>}{availableRooms.map(r => <option key={r.room_id} value={r.room_no}>{r.room_no}</option>)}</select></div> <div><label style={labelStyle}>🍽️ Dining Seat</label><div style={{display:'flex', gap:'5px'}}><select style={{...inputStyle, width:'80px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select><select style={inputStyle} value={formData.seatNo} onChange={e=>setFormData({...formData, seatNo:e.target.value})} required><option value="">-- Free --</option>{availableDiningOpts.map(n=><option key={n} value={n}>{n}</option>)}</select></div></div> </div> {sectionHeader("🧘 Hall & Meditation")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>🗣️ Discourse Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Malayalam</option><option>Gujarati</option><option>Odia</option><option>Bengali</option><option>Mandarin Chinese</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Vietnamese</option><option>Thai</option><option>Japanese</option></select></div> <div><label style={labelStyle}>🛖 Pagoda Cell</label><select style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n=><option key={n} value={n}>{n}</option>)}</select></div> </div> {sectionHeader("🔐 Lockers & Other")} <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px'}}> <div><label style={labelStyle}>📱 Mobile Locker</label><select style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobileOpts.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💍 Val Locker</label><select style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuablesOpts.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>🧺 Laundry Token</label><select style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})}><option value="">None</option>{availableLaundryOpts.map(n=><option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>💻 Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> <div><label style={labelStyle}>💺 Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> </div> <div style={{marginTop:'30px', textAlign:'right'}}><button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 6px rgba(0,123,255,0.2)'}}>Confirm & Save</button></div> {status && <div style={{marginTop:'15px', padding:'10px', borderRadius:'6px', background: status.includes('Success') ? '#d4edda' : '#f8d7da', color: status.includes('Success') ? '#155724' : '#721c24', textAlign:'center', fontWeight:'bold'}}>{status}</div>} </form> </div> );
}

// --- PARTICIPANT LIST (FIXED AUTO-ASSIGN & ADDED COLUMN) ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewingStudent, setViewingStudent] = useState(null); 
  const [viewAllMode, setViewAllMode] = useState(false); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [assignProgress, setAssignProgress] = useState(''); 
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [badgeStudent, setBadgeStudent] = useState(null);

  // --- HELPERS ---
  const getCategory = (seatNo) => { if (!seatNo) return '-'; const s = String(seatNo).toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF')) return 'Old'; if (s.startsWith('NM') || s.startsWith('NF')) return 'New'; if (s.startsWith('SM') || s.startsWith('SF')) return 'DS'; return 'New'; };
  const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = String(confNo).toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 0; if (s.startsWith('N')) return 1; return 2; };
  const parseCourses = (str) => { if (!str) return { s: 0, l: 0 }; const sMatch = str.match(/S\s*[:=-]?\s*(\d+)/i); const lMatch = str.match(/L\s*[:=-]?\s*(\d+)/i); return { s: sMatch ? parseInt(sMatch[1]) : 0, l: lMatch ? parseInt(lMatch[1]) : 0 }; };
  const getSeniorityScore = (p) => { const c = parseCourses(p.courses_info || ''); return (c.l * 10000) + (c.s * 10); };
  
  // Format Name: Nitesh Sharma -> Nitesh S
  const formatName = (name) => {
      if(!name) return "";
      const parts = name.trim().split(" ");
      if(parts.length === 1) return parts[0];
      return `${parts[0]} ${parts[parts.length-1][0]}`;
  };

  const getLangCode = (lang) => {
      if(!lang) return "";
      const l = lang.toLowerCase();
      if(l.includes('telugu')) return 'T';
      if(l.includes('hindi')) return 'H';
      if(l.includes('english')) return 'E';
      if(l.includes('marathi')) return 'M';
      return l[0].toUpperCase();
  };

  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);
  
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const downloadCSV = (headers, rows, filename) => { const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", filename); document.body.appendChild(link); link.click(); };
  
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Age", "Gender", "Dining", "Room", "Dhamma Seat", "Status"]; const rows = participants.map(p => [`"${p.full_name || ''}"`, p.conf_no || '', p.age || '', p.gender || '', p.dining_seat_no || '', p.room_no || '', p.dhamma_hall_seat_no || '', p.status || '']); downloadCSV(headers, rows, `master_${courseId}.csv`); };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Arrived'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.discourse_language || '']); downloadCSV(headers, rows, `dining_${courseId}.csv`); };
  const handleSeatingExport = () => { const seated = participants.filter(p => p.dhamma_hall_seat_no); if (seated.length === 0) return alert("No seats."); const headers = ["Seat", "Name", "Gender", "Conf No", "Status"]; const rows = seated.map(p => [p.dhamma_hall_seat_no, `"${p.full_name || ''}"`, p.gender || '', p.conf_no || '', p.status || '']); downloadCSV(headers, rows, `hall_${courseId}.csv`); };

  const sortedList = React.useMemo(() => { let sortableItems = [...participants].filter(p => p); if (sortConfig.key) { sortableItems.sort((a, b) => { const valA = (a[sortConfig.key] || '').toString().toLowerCase(); const valB = (b[sortConfig.key] || '').toString().toLowerCase(); if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } return sortableItems.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); }, [participants, sortConfig, search]);

  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleCancelStudent = async (student) => { if (!window.confirm("Cancel Student?")) return; const updatedData = { ...student, status: 'Cancelled', room_no: null, dining_seat_no: null, dhamma_hall_seat_no: null }; await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) }); loadStudents(); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };

  const handleSeatClick = async (seatLabel, student) => {
      if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; }
      const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null);
      if (source.label === target.label) return;
      if (!source.p) return; 
      const isSourceMale = (source.p.gender || '').toLowerCase().startsWith('m');
      if (target.p) { const isTargetMale = (target.p.gender || '').toLowerCase().startsWith('m'); if (isSourceMale !== isTargetMale) return alert("⛔ Gender Mismatch!"); }

      if (window.confirm(`Confirm Move/Swap?\nFrom ${source.label} (${source.p.full_name})\nTo ${target.label} ${target.p ? '('+target.p.full_name+')' : '(Empty)'}`)) {
          if (!target.p) { 
               await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
          } else { 
               await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); 
               await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); 
               await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
          }
          loadStudents();
      }
  };

  const handleAutoAssign = async () => {
    if (!window.confirm("⚡ Auto-Assign Seats?\n\n- ONLY 'Arrived' students will be assigned.\n- Locked/Manual seats preserved.")) return;
    setAssignProgress('Calculations...');
    
    // 1. Fetch Students
    const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
    const allP = await res.json();
    
    // 2. Filter: Only Active + Arrived students (Fixes "null" issue)
    const activeStudents = allP.filter(p => p.status === 'Arrived');

    const males = activeStudents.filter(p => (p.gender || '').toLowerCase().startsWith('m'));
    const females = activeStudents.filter(p => (p.gender || '').toLowerCase().startsWith('f'));

    const generateSeats = (cols, rows) => {
        let seats = [];
        for(let r=1; r<=rows; r++) { cols.forEach(c => seats.push(`${c}${r}`)); }
        return seats;
    };
    
    // Male: L, K, J... A (12 Cols * 8 Rows = 96 Seats)
    const maleRegularSeats = generateSeats(['J','I','H','G','F','E','D','C','B','A'], 8);
    const maleSpecialSeats = generateSeats(['L','K'], 8); 
    
    // Female: I, H, G... A (9 Cols * 8 Rows = 72 Seats)
    const femaleRegularSeats = generateSeats(['G','F','E','D','C','B','A'], 8);
    const femaleSpecialSeats = generateSeats(['I','H'], 8);

    const assignGroup = (studentList, regularSeats, specialSeats) => {
        const updates = []; const usedSeats = new Set();
        studentList.filter(p => p.is_seat_locked && p.dhamma_hall_seat_no).forEach(p => usedSeats.add(p.dhamma_hall_seat_no));
        const toAssign = studentList.filter(p => !p.is_seat_locked);
        
        // Robust Sorting
        const sorter = (a,b) => { 
            const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); 
            if(rankA !== rankB) return rankA - rankB; 
            if(rankA === 0) return getSeniorityScore(b) - getSeniorityScore(a); 
            return (parseInt(b.age)||0) - (parseInt(a.age)||0); 
        };
        
        const specialGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating)).sort(sorter);
        const regularGroup = toAssign.filter(p => !p.special_seating || !['Chowky','Chair','BackRest'].includes(p.special_seating)).sort(sorter);

        // Fill Special
        let sIdx = 0;
        specialGroup.forEach(p => { 
            while(sIdx < specialSeats.length && usedSeats.has(specialSeats[sIdx])) sIdx++; 
            if(sIdx < specialSeats.length) { 
                const seat = specialSeats[sIdx]; updates.push({ ...p, dhamma_hall_seat_no: seat }); usedSeats.add(seat); 
            } else { regularGroup.unshift(p); } 
        });

        // Fill Regular
        let rIdx = 0;
        regularGroup.forEach(p => { 
            while(rIdx < regularSeats.length && usedSeats.has(regularSeats[rIdx])) rIdx++; 
            if(rIdx < regularSeats.length) { 
                updates.push({ ...p, dhamma_hall_seat_no: regularSeats[rIdx] }); 
            } else {
                 console.warn("Out of seats for:", p.full_name);
            }
        });
        return updates;
    };

    const allUpdates = [...assignGroup(males, maleRegularSeats, maleSpecialSeats), ...assignGroup(females, femaleRegularSeats, femaleSpecialSeats)];
    
    if(allUpdates.length === 0) { setAssignProgress(''); return alert("No new assignments needed (or no Arrived students found)."); }

    setAssignProgress(`Saving ${allUpdates.length}...`);
    const BATCH_SIZE = 5;
    for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) { const batch = allUpdates.slice(i, i + BATCH_SIZE); await Promise.all(batch.map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }))); }
    setAssignProgress(''); alert(`✅ Auto-Assign Complete! Assigned ${allUpdates.length} seats.`); loadStudents();
  };

  const BadgeModal = ({ student, onClose }) => ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'white', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}> <div className="print-area" style={{textAlign:'center'}}> <div style={{border:'2px solid #333', padding:'20px', width:'350px', margin:'20px auto', borderRadius:'10px', background: (student.conf_no||'').startsWith('O') ? '#fff9c4' : '#fff'}}><h2>IDENTITY CARD</h2><h3>{student.full_name}</h3><p><strong>Course:</strong> {courseId}</p><p><strong>Room:</strong> {student.room_no}</p></div> <div style={{border:'2px solid #333', padding:'20px', width:'350px', margin:'20px auto', borderRadius:'10px'}}><h2>DINING CARD</h2><h1>{student.dining_seat_no}</h1><p>{['F','Floor'].includes(student.dining_seat_type) ? 'Floor' : 'Chair'}</p><p>{student.full_name}</p></div> <div className="no-print"><button onClick={() => window.print()} style={{...quickBtnStyle(true), marginRight:'10px'}}>🖨️ Print</button><button onClick={onClose} style={{...quickBtnStyle(false)}}>Close</button></div> </div> </div> );

  if (viewAllMode) { return ( <div style={{background:'white', padding:'20px'}}> <div className="no-print" style={{marginBottom:'20px'}}><button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button><button onClick={handleExport} style={{...quickBtnStyle(true), marginLeft:'10px'}}>Export CSV</button></div> <h2>Master List</h2> <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Seat</th></tr></thead><tbody>{participants.map(p=>(<tr key={p.participant_id}><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.dhamma_hall_seat_no}</td></tr>))}</tbody></table> </div> ); }
  
  if (viewMode === 'dining') { const arrived = participants.filter(p => p.status==='Arrived'); const sorter = (a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return String(a.dining_seat_no || '0').localeCompare(String(b.dining_seat_no || '0'), undefined, { numeric: true }); }; const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={handleDiningExport} style={quickBtnStyle(true)}>CSV</button> <button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={{...quickBtnStyle(true), background: color, color:'white'}}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Dining</h2> <table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr><th style={thPrint}>Seat</th><th style={thPrint}>Name</th><th style={thPrint}>Cat</th><th style={thPrint}>Room</th></tr></thead><tbody>{list.map(p=>(<tr key={p.participant_id}><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{getCategory(p.conf_no)}</td><td style={tdStyle}>{p.room_no}</td></tr>))}</tbody></table> </div> ); return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-m")} {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-f")} </div> ); }

  // --- DHAMMA HALL SEATING VIEW ---
  if (viewMode === 'seating') { 
    const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.dhamma_hall_seat_no && p.status!=='Cancelled'); 
    const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.dhamma_hall_seat_no && p.status!=='Cancelled'); 
    const maleMap = {}; males.forEach(p => maleMap[p.dhamma_hall_seat_no] = p); 
    const femaleMap = {}; females.forEach(p => femaleMap[p.dhamma_hall_seat_no] = p);
    
    const SeatBox = ({ p, label }) => { 
        const isSelected = selectedSeat && selectedSeat.label === label; 
        const isLocked = p && p.is_seat_locked;
        return ( 
            <div onClick={() => handleSeatClick(label, p)} style={{ border: isSelected ? '3px solid gold' : '1px solid #333', background: 'white', height:'85px', width: '100%', overflow: 'hidden', padding: '2px', fontSize:'11px', cursor:'pointer', position:'relative', boxSizing: 'border-box', display:'flex', flexDirection:'column' }}> 
                <div style={{textAlign:'center', borderBottom:'1px solid #333', fontWeight:'bold', fontSize:'13px', marginBottom:'2px'}}> {label} {isLocked && <span style={{color:'red', fontSize:'10px'}}>🔒</span>} </div>
                {p ? ( <> 
                    <div style={{textAlign:'center', fontWeight:'bold', fontSize:'13px', marginBottom:'2px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', padding:'0 2px'}}> {formatName(p.full_name)} </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', fontSize:'11px', lineHeight:'1.2'}}> <div style={{fontWeight:'500'}}>{p.conf_no}</div> <div style={{textAlign:'right'}}>Cell:{p.pagoda_cell_no||'-'}</div> <div style={{color:'#007bff'}}>DS:{p.dining_seat_no||'-'}</div> <div style={{textAlign:'right', fontWeight:'bold'}}>{getLangCode(p.discourse_language)}</div> </div>
                </> ) : null} 
            </div> 
        ); 
    };

    const renderGrid = (map, cols, rows) => { 
        let grid = []; 
        for (let r = 0; r < rows; r++) { 
            let cells = []; 
            cols.forEach(c => { const label = `${c}${r+1}`; cells.push(<SeatBox key={label} p={map[label]} label={label} />); });
            grid.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${cols.length}, 90px)`, gap:'-1px'}}>{cells}</div>); 
        } 
        return grid; 
    };

    const printSection = (sectionId) => { const style = document.createElement('style'); style.innerHTML = `@media print { @page { size: A3 landscape; margin: 5mm; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flexDirection: column; alignItems: center; } .no-print { display: none !important; } .seat-grid { page-break-inside: avoid; border: 1px solid #333; margin-top: 20px; } .seat-grid > div { border-bottom: 1px solid #333; } .seat-grid > div > div { border-right: 1px solid #333; } h1 { font-size: 24px !important; margin: 0 0 10px 0; } }`; document.head.appendChild(style); window.print(); document.head.removeChild(style); };

    const SeatingSheet = ({ id, title, map, cols, rows }) => (
        <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto'}}> 
            <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={()=>printSection(id)} style={{...quickBtnStyle(true), background:'#007bff', color:'white'}}>🖨️ Print {title} (A3)</button> </div> 
            <div style={{textAlign:'center', marginBottom:'10px'}}> <h1 style={{margin:0, fontSize:'24px', textTransform:'uppercase'}}>Dhamma Hall Seating Plan - {title}</h1> </div> 
            <div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}> <div style={{textAlign:'center'}}> <div style={{border:'2px dashed #333', width:'250px', height:'50px'}}></div> <div style={{fontWeight:'bold', marginTop:'5px', fontSize:'16px'}}>TEACHER</div> </div> </div>
            <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{border:'2px solid #333', background:'#ccc', width:'fit-content'}}> {renderGrid(map, cols, rows)} </div> </div>
        </div>
    );

    return ( <div style={cardStyle}> 
        <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}> <button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> {assignProgress && <span style={{color:'green', fontWeight:'bold'}}>{assignProgress}</span>} <div style={{fontSize:'12px', background:'#fff3cd', padding:'5px 10px', borderRadius:'4px'}}>💡 Manual Move = Auto-Lock</div> <button onClick={handleSeatingExport} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>CSV</button> <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#ff9800', color:'white'}}>⚡ Auto-Assign (Smart)</button> </div> </div> 
        <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}> 
            <SeatingSheet id="print-male" title="Male Side" map={maleMap} cols={['L','K', 'J','I','H','G','F','E','D','C','B','A']} rows={8} />
            <SeatingSheet id="print-female" title="Female Side" map={femaleMap} cols={['I','H', 'G','F','E','D','C','B','A']} rows={8} />
        </div> 
    </div> );
  }

  // --- DEFAULT LIST VIEW ---
  return ( <div style={cardStyle}> 
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}>
          <div style={{display:'flex', gap:'10px'}}> <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select> <input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} /> </div>
          <div style={{display:'flex', gap:'5px'}}> <button onClick={handleAutoNoShow} disabled={!courseId} style={{...quickBtnStyle(true), background:'#d32f2f', color:'white'}}>🚫 No-Shows</button> <button onClick={handleSendReminders} disabled={!courseId} style={{...quickBtnStyle(true), background:'#ff9800', color:'white'}}>📢 Reminders</button> <button onClick={() => setViewAllMode(true)} disabled={!courseId} style={{...quickBtnStyle(true), background:'#6c757d', color:'white'}}>👁️ View All</button> <button onClick={handleExport} disabled={!courseId} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>📥 Export</button> <button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining</button> <button onClick={() => setViewMode('seating')} disabled={!courseId} style={{...quickBtnStyle(true), background:'#28a745', color:'white'}}>🧘 Dhamma Hall</button> </div>
      </div>
      {courseId && (<div style={{background:'#fff5f5', border:'1px solid #feb2b2', padding:'10px', borderRadius:'5px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{color:'#c53030', fontWeight:'bold', fontSize:'13px'}}>⚠️ Admin Zone:</span><div><button onClick={handleResetCourse} style={{background:'#e53e3e', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', marginRight:'10px', fontSize:'12px'}}>Reset Data</button><button onClick={handleDeleteCourse} style={{background:'red', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Delete Course</button></div></div>)}
      <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}>{['full_name','conf_no','courses_info','age','gender','dining_seat_no','dining_seat_type','room_no','pagoda_cell_no', 'dhamma_hall_seat_no', 'status'].map(k=><th key={k} style={{...tdStyle, cursor:'pointer'}} onClick={()=>handleSort(k)}>{k.replace('_',' ').toUpperCase()}{sortConfig.key===k?(sortConfig.direction==='asc'?'▲':'▼'):''}</th>)}<th style={tdStyle}>ACTIONS</th></tr></thead><tbody>{sortedList.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.courses_info}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{['F','Floor'].includes(p.dining_seat_type) ? 'Floor' : 'Chair'}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.pagoda_cell_no}</td><td style={{...tdStyle, fontWeight:'bold', color:'#007bff'}}>{p.dhamma_hall_seat_no}</td><td style={{...tdStyle, color: p.status==='Arrived'?'green':'orange'}}>{p.status}</td><td style={tdStyle}><button onClick={() => setBadgeStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>🪪</button><button onClick={() => setViewingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>👁️</button><button onClick={() => setEditingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={() => handleCancelStudent(p)} style={{marginRight:'5px', cursor:'pointer', color:'orange'}}>🚫</button><button onClick={() => handleDelete(p.participant_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div>
      {viewingStudent && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px'}}> <h3>👤 Student Details</h3> <p><strong>Name:</strong> {viewingStudent.full_name}</p> <p><strong>Conf No:</strong> {viewingStudent.conf_no}</p> <p><strong>Status:</strong> {viewingStudent.status}</p> <p><strong>Room:</strong> {viewingStudent.room_no}</p> <p><strong>Dining:</strong> {viewingStudent.dining_seat_no} ({viewingStudent.dining_seat_type})</p> <button onClick={()=>setViewingStudent(null)} style={{marginTop:'20px', width:'100%', padding:'10px', background:'#007bff', color:'white', border:'none', borderRadius:'5px'}}>Close</button> </div> </div> )}
      {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}><label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e => setEditingStudent({...editingStudent, conf_no: e.target.value})} /></div><div><label>Lang</label><input style={inputStyle} value={editingStudent.discourse_language||''} onChange={e => setEditingStudent({...editingStudent, discourse_language: e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Dining Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} /></div><div><label>Dining Type</label><select style={inputStyle} value={editingStudent.dining_seat_type||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_type: e.target.value})}><option value="F">Floor</option><option value="C">Chair</option></select></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><div><label>Room</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e => setEditingStudent({...editingStudent, room_no: e.target.value})} /></div><div><label>Pagoda</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e => setEditingStudent({...editingStudent, pagoda_cell_no: e.target.value})} /></div></div><label>Seating Type</label><select style={inputStyle} value={editingStudent.special_seating||''} onChange={e => setEditingStudent({...editingStudent, special_seating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select><div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button type="submit" style={{...btnStyle(true), flex:1, background:'#28a745', color:'white'}}>Save</button><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button></div></form></div></div>)}
      {badgeStudent && <BadgeModal student={badgeStudent} onClose={() => setBadgeStudent(null)} />}
  </div> );
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

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
