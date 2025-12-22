import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { 
  Users, Upload, Save, Database, AlertTriangle, CheckCircle, 
  Search, Home, Coffee, FileText, Trash2, X, Edit, Plus,
  CreditCard, DollarSign, Download, Calendar, Printer, Settings,
  LayoutGrid, LogOut, Utensils, MapPin, UserCheck, History, Eye, EyeOff
} from 'lucide-react';

// --- EXTERNAL COMPONENTS ---
// Ensure these files exist in your src folder
import DiningLayout from './DiningLayout';
import PagodaLayout from './PagodaLayout';

// ==========================================
// 1. GLOBAL CONSTANTS & CONFIG
// ==========================================
const LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi", 
  "French", "German", "Spanish", "Russian", "Chinese", "Mandarin Chinese", 
  "Japanese", "Thai", "Burmese", "Sinhala", "Nepali", 
  "Portuguese", "Vietnamese"
];

const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 
const ADMIN_PASSCODE = "0"; 
const GATEKEEPER_PASSCODE = "1111";
const TEACHER_PASSCODE = "2222";

const PROTECTED_ROOMS = new Set([
  "301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","344AW","344BW","345AW","345BW","346AW","346BW","347AW","347BW","348AW","348BW","349AW","349BW","350AW","350BW","351AW","351BW","352AW","352BW","353AW","353BW","354AW","354BW","355AW","355BW","356AW","356BW","357AW","357BW","358AW","358BW","359AW","359BW","360AW","360BW","361AW","361BW","362AW","362BW","363AW","363BW",
  "201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW",
  "DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"
]);

const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);

// --- UTILS ---
const getShortCourseName = (name) => {
  if (!name) return 'Unknown';
  const n = name.toUpperCase();
  if (n.includes('45-DAY')) return '45D';
  if (n.includes('30-DAY')) return '30D';
  if (n.includes('20-DAY')) return '20D';
  if (n.includes('10-DAY')) return '10D';
  if (n.includes('SATIPATTHANA')) return 'ST';
  if (n.includes('SERVICE')) return 'SVC';
  return 'OTH';
};
const getSmartShortName = (name) => getShortCourseName(name);

// --- STYLES ---
const btnStyle = (isActive) => ({ 
  padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', 
  cursor: 'pointer', background: isActive ? '#007bff' : '#fff', 
  color: isActive ? 'white' : '#555', fontWeight: '600', fontSize:'13px', 
  display:'flex', alignItems:'center', gap:'5px' 
});

const quickBtnStyle = (isActive) => ({ 
  padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', 
  background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', 
  cursor: 'pointer', fontSize: '13px' 
});

const toolBtn = (bg) => ({ 
  padding: '8px 16px', border: 'none', borderRadius: '20px', 
  background: bg, color: 'white', cursor: 'pointer', 
  fontSize: '13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px' 
});

const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };
const tdPrint = { padding: '8px', border: '1px solid #000', fontSize:'12px', verticalAlign:'middle' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee', fontSize:'13px', verticalAlign:'middle' };


// ==========================================
// 🧩 MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [authLevel, setAuthLevel] = useState('none'); // 'none', 'admin', 'gatekeeper', 'teacher'
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  // Course Admin State
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('upload'); 
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
  const [manualStudent, setManualStudent] = useState({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });

  useEffect(() => {
    const savedLevel = localStorage.getItem('auth_level');
    if (savedLevel) setAuthLevel(savedLevel);
    fetchCourses();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PASSCODE) {
      setAuthLevel('admin');
      localStorage.setItem('auth_level', 'admin');
    } else if (pinInput === GATEKEEPER_PASSCODE) {
      setAuthLevel('gatekeeper');
      localStorage.setItem('auth_level', 'gatekeeper');
      setView('gate-panel'); 
    } else if (pinInput === TEACHER_PASSCODE) {
      setAuthLevel('teacher');
      localStorage.setItem('auth_level', 'teacher');
      setView('ta-panel');
    } else {
      setLoginError('❌ Incorrect Passcode');
      setPinInput('');
    }
  };

  const handleLogout = () => { 
    setAuthLevel('none'); 
    localStorage.removeItem('auth_level'); 
    setView('dashboard'); 
    setPinInput(''); 
  };
  
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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
    const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
    try {
        const payload = {
            courseName: courseName,
            teacherName: newCourseData.teacher || 'Goenka Ji',
            startDate: newCourseData.startDate,
            endDate: newCourseData.endDate
        };
        const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            alert(`✅ Course Created: ${courseName}`);
            fetchCourses(); 
            setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
        }
    } catch (err) { console.error(err); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    const newStudent = { id: Date.now(), ...manualStudent, conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`, status: 'Active', dining_seat: '', room_no: '' };
    setStudents(prev => [newStudent, ...prev]);
    alert(`Added ${newStudent.full_name} to the Preview list.`);
    setManualStudent({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
    setAdminSubTab('upload');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { try { processCSV(e.target.result); } catch (err) { console.error(err); setUploadStatus({ type: 'error', msg: 'Failed to parse CSV.' }); } };
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
    if (headerRowIndex === -1) { setUploadStatus({ type: 'error', msg: 'Could not detect headers (Name, Gender, Age). Please check CSV format.' }); return; }
    const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
    const map = { conf: getIndex(['conf', 'ref', 'id', 'no.']), name: getIndex(['name', 'student', 'given']), age: getIndex(['age']), gender: getIndex(['gender', 'sex']), courses: getIndex(['course', 'history']), seat: getIndex(['seat', 'dining']), email: getIndex(['email']), phone: getIndex(['phone', 'mobile']), notes: getIndex(['notes', 'remark']) };
    const parsedStudents = lines.slice(headerRowIndex + 1).map((line, index) => {
      const row = splitRow(line);
      const rawName = map.name > -1 ? row[map.name] : '';
      const rawConf = map.conf > -1 ? row[map.conf] : '';
      if (!rawName && !rawConf) return null; 
      return { id: Date.now() + index, conf_no: rawConf || `TEMP-${index + 1}`, full_name: rawName || 'Unknown Student', age: map.age > -1 ? row[map.age] : '', gender: map.gender > -1 ? row[map.gender] : '', courses_info: map.courses > -1 ? row[map.courses] : '', dining_seat: map.seat > -1 ? row[map.seat] : '', email: map.email > -1 ? row[map.email] : '', mobile: map.phone > -1 ? row[map.phone] : '', notes: map.notes > -1 ? row[map.notes] : '', status: rawConf ? 'Active' : 'Pending ID' };
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
        const payload = { students: students.map(s => ({ name: s.full_name, confNo: s.conf_no, age: s.age, gender: s.gender, courses: s.courses_info, email: s.email, phone: s.mobile }))};
        const res = await fetch(`${API_URL}/courses/${targetCourse.course_id}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { alert(`✅ Success: ${data.message}`); setStudents([]); } else { alert(`❌ Error: ${data.error}`); }
    } catch(err) { alert("Network Error: Failed to save data."); console.error(err); }
  };

  const renderCourseAdmin = () => (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Upload size={24} className="text-blue-600"/> Course Admin</h2>
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
          <div><label style={labelStyle}>Teacher Name</label><input style={inputStyle} placeholder="e.g. Goenka Ji" value={newCourseData.teacher || ''} onChange={e=>setNewCourseData({...newCourseData, teacher:e.target.value})} /></div>
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
            <div style={{pointerEvents:'none'}}><Database size={40} color="#999" /><p style={{margin:'10px 0', color:'#555'}}>Click to upload .CSV file</p></div>
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
                   <thead style={{position:'sticky', top:0, background:'#f1f1f1'}}><tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr></thead>
                   <tbody>{students.map(s => (<tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue'}}>{s.conf_no}</td><td style={{padding:'8px'}}>{s.full_name}</td><td style={{padding:'8px'}}>{s.age}</td><td style={{padding:'8px'}}>{s.gender}</td><td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td></tr>))}</tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}
      {adminSubTab === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{maxWidth:'600px', margin:'0 auto'}}>
          <h3 style={{textAlign:'center', marginBottom:'20px'}}>Add Single Student</h3>
          <div style={{marginBottom:'15px'}}><label style={labelStyle}>Target Course</label><select style={inputStyle} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)} required><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}</select></div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} required /></div><div><label style={labelStyle}>Conf No</label><input style={inputStyle} value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} /></div></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:'15px', marginBottom:'15px'}}><div><label style={labelStyle}>Gender</label><select style={inputStyle} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select></div><div><label style={labelStyle}>Age</label><input type="number" style={inputStyle} value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} /></div><div><label style={labelStyle}>Courses Info</label><input style={inputStyle} value={manualStudent.courses_info} onChange={e=>setManualStudent({...manualStudent, courses_info:e.target.value})} placeholder="e.g. S:3 L:1" /></div></div>
          <button type="submit" style={{...btnStyle(true), width:'100%', background:'#007bff', color:'white'}}>+ Add to Preview</button>
        </form>
      )}
    </div>
  );

  // --- LOGIN SCREEN ---
  if (authLevel === 'none') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Course Manager</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Enter Passcode" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', textAlign: 'center' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Unlock</button>
          </form>
          {loginError && <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold' }}>{loginError}</p>}
          <p style={{marginTop:'20px', fontSize:'12px', color:'#777'}}>0=Admin | 1=Gate | 2=Teacher</p>
        </div>
      </div>
    );
  }

  // --- GATEKEEPER VIEW ---
  if (authLevel === 'gatekeeper') {
      return (
          <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#e3f2fd', minHeight: '100vh' }}>
              <div style={{maxWidth:'800px', margin:'0 auto'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h2 style={{margin:0}}>🚧 Gate Check-In</h2>
                      <button onClick={handleLogout} style={{...btnStyle(false), background:'#dc3545', color:'white'}}>Logout</button>
                  </div>
                  <GatekeeperPanel courses={courses} />
              </div>
          </div>
      );
  }
  
  // --- TEACHER VIEW ---
  if (authLevel === 'teacher') {
      return (
          <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#fff3e0', minHeight: '100vh' }}>
              <div style={{maxWidth:'1000px', margin:'0 auto'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h2 style={{margin:0}}>🧘 AT Panel</h2>
                      <button onClick={handleLogout} style={{...btnStyle(false), background:'#dc3545', color:'white'}}>Logout</button>
                  </div>
                  <ATPanel courses={courses} />
              </div>
          </div>
      );
  }

  // --- ADMIN VIEW ---
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

// ------------------------------------------------------------------
// 🧩 SUB-COMPONENTS 
// ------------------------------------------------------------------

function GatekeeperPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => { if (courses.length > 0) setCourseId(courses[0].course_id); }, [courses]);
    useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

    const handleGateCheckIn = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as ARRIVED at Gate?`)) return;
        await fetch(`${API_URL}/gate-checkin`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
        const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json());
    };

    const handleGateCancel = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as CANCELLED?`)) return;
        await fetch(`${API_URL}/gate-cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
        const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json());
    };

    const all = participants.filter(p => p.status !== 'Cancelled');
    const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
    const pending = all.filter(p => p.status === 'No Response');
    const filtered = participants.filter(p => {
        const match = p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(search.toLowerCase()));
        if (!match) return false;
        if (p.status === 'Cancelled' && !search) return false;
        if (!showHistory && !search) return p.status === 'No Response' || !p.status;
        return true;
    });

    return (
        <div style={cardStyle}>
            <div style={{background:'#f1f3f5', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
                <h3 style={{margin:'0 0 10px 0'}}>Gate Dashboard</h3>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', padding:'10px', flex:1, textAlign:'center'}}><div>Total</div><div style={{fontSize:'20px', fontWeight:'bold'}}>{all.length}</div></div>
                    <div style={{background:'white', padding:'10px', flex:1, textAlign:'center', border:'1px solid green'}}><div>Checked In</div><div style={{fontSize:'20px', fontWeight:'bold', color:'green'}}>{arrived.length}</div></div>
                    <div style={{background:'white', padding:'10px', flex:1, textAlign:'center', border:'1px solid red'}}><div>Pending</div><div style={{fontSize:'20px', fontWeight:'bold', color:'red'}}>{pending.length}</div></div>
                </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <select style={{...inputStyle, flex:1}} value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <button onClick={()=>setShowHistory(!showHistory)} style={{...btnStyle(showHistory), flexShrink:0}}>{showHistory ? <EyeOff size={16}/> : <History size={16}/>} {showHistory ? 'Hide Arrived' : 'View History'}</button>
            </div>
            <input style={{...inputStyle, padding:'15px', fontSize:'18px'}} placeholder="🔍 Search Name or Conf No..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
            <div style={{height:'400px', overflowY:'auto', marginTop:'15px'}}>
                {filtered.map(p => (
                    <div key={p.participant_id} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div><div style={{fontWeight:'bold', fontSize:'16px'}}>{p.full_name}</div><div style={{color:'#666', fontSize:'14px'}}>{p.conf_no} | Age: {p.age}</div><div>{p.status}</div></div>
                        {p.status !== 'Attending' && p.status !== 'Gate Check-In' && p.status !== 'Cancelled' && (
                            <div style={{display:'flex', gap:'10px'}}><button onClick={()=>handleGateCheckIn(p)} style={{...btnStyle(true), background:'#007bff', color:'white'}}>Mark Arrived</button><button onClick={()=>handleGateCancel(p)} style={{...btnStyle(true), background:'#dc3545', color:'white'}}>Cancel</button></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  useEffect(() => { if (selectedCourse) fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); }, [selectedCourse]);

  return (
    <div>
      <select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', marginBottom:'20px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      {stats && selectedCourse ? (
        <>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', borderLeft:'5px solid #6c757d'}}><h3>Expected</h3><h1>{stats.attending + stats.gate_checkin + stats.no_response}</h1></div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', borderLeft:'5px solid orange'}}><h3>At Gate</h3><h1>{stats.gate_checkin}</h1></div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', borderLeft:'5px solid green'}}><h3>Onboarded</h3><h1>{stats.attending}</h1></div>
                <div style={{background:'white', padding:'20px', borderRadius:'8px', borderLeft:'5px solid red'}}><h3>Pending</h3><h1>{stats.no_response}</h1></div>
            </div>
            <div style={{display:'flex', gap:'20px'}}>
                <div style={{flex:2, ...cardStyle}}>
                    <h3>Arrival Flow (Male vs Female)</h3>
                    <div style={{height:'300px'}}>
                        <ResponsiveContainer>
                            <BarChart data={[{ name: 'Male', Onboarded: stats.attending_m, AtGate: stats.gate_m, Pending: stats.pending_m }, { name: 'Female', Onboarded: stats.attending_f, AtGate: stats.gate_f, Pending: stats.pending_f }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name"/>
                                <YAxis/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="Onboarded" stackId="a" fill="#28a745" />
                                <Bar dataKey="AtGate" stackId="a" fill="#ff9800" />
                                <Bar dataKey="Pending" stackId="a" fill="#e0e0e0" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
      ) : <p>Loading...</p>}
    </div>
  );
}

function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [editingRoom, setEditingRoom] = useState(null);

  const loadData = () => { fetch(`${API_URL}/rooms`).then(res => res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(setOccupancy); };
  useEffect(loadData, []);

  const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); setNewRoom({ ...newRoom, roomNo: '' }); loadData(); };
  const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Protected.`); return; } if(window.confirm(`Delete ${name}?`)) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };
  const handleSwapSave = async () => { if (!editingRoom) return; await fetch(`${API_URL}/participants/${editingRoom.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...editingRoom.p, room_no: editingRoom.newRoomNo }) }); setEditingRoom(null); loadData(); };

  const normalize = (str) => str ? str.toString().trim().toUpperCase() : '';
  const occupiedSet = new Set();
  occupancy.forEach(p => { if (p.room_no) occupiedSet.add(normalize(p.room_no)); });
  const availableRooms = rooms.filter(r => !occupiedSet.has(normalize(r.room_no)));

  return ( 
    <div style={cardStyle}> 
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}> <input style={{...inputStyle, width:'100px'}} placeholder="Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'100px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={toolBtn('#007bff')}>+ Add Room</button> </div> 
      <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'10px'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div><h4 style={{color:'#007bff'}}>MALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{availableRooms.filter(r=>r.gender_type==='Male').map(r => <button key={r.room_id} onClick={()=>onRoomClick(r.room_no)} style={{padding:'10px', border:'1px solid #ccc', background:'white'}}>{r.room_no}</button>)}</div></div>
              <div><h4 style={{color:'#e91e63'}}>FEMALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{availableRooms.filter(r=>r.gender_type==='Female').map(r => <button key={r.room_id} onClick={()=>onRoomClick(r.room_no)} style={{padding:'10px', border:'1px solid #ccc', background:'white'}}>{r.room_no}</button>)}</div></div>
          </div>
      </div>
      {editingRoom && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px'}}><input value={editingRoom.newRoomNo} onChange={e=>setEditingRoom({...editingRoom, newRoomNo:e.target.value})} /><button onClick={handleSwapSave}>Save</button></div></div>}
    </div> 
  );
}

function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showKitchenReport, setShowKitchenReport] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
  const handleSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (showKitchenReport) {
      return (
          <div style={cardStyle}>
              <div className="no-print"><button onClick={() => setShowKitchenReport(false)} style={btnStyle(false)}>Back</button><button onClick={()=>window.print()} style={{...toolBtn('#ff9800'), marginLeft:'10px'}}>Print</button></div>
              <div className="print-area"><h1 style={{textAlign:'center'}}>Kitchen Report</h1><table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Food</th><th style={thPrint}>Medical</th></tr></thead><tbody>{participants.filter(p => (p.evening_food && p.evening_food !== 'None') || p.medical_info).map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody></table></div>
          </div>
      );
  }

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><h2>AT Panel</h2><button onClick={()=>setShowKitchenReport(true)} style={toolBtn('#ff9800')}><Utensils size={16}/> Report</button></div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
      {courseId && <div style={{maxHeight:'500px', overflowY:'auto'}}><table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left', background:'#f9f9f9'}}><th>Name</th><th>Food</th><th>Medical</th><th>Action</th></tr></thead><tbody>{filtered.map((p) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td><strong>{p.full_name}</strong></td><td>{p.evening_food || '-'}</td><td>{p.medical_info || '-'}</td><td><button onClick={() => setEditingStudent(p)} style={toolBtn('#007bff')}>Edit</button></td></tr>))}</tbody></table></div>}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', width:'500px'}}><h3>Update</h3><form onSubmit={handleSave}><label>Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => setEditingStudent({...editingStudent, evening_food: e.target.value})}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select><label>Medical</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => setEditingStudent({...editingStudent, medical_info: e.target.value})} /><div style={{marginTop:'10px'}}><button type="button" onClick={() => setEditingStudent(null)} style={btnStyle(false)}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save</button></div></form></div></div>)}
    </div>
  );
}

// ------------------------------------------------------------------
// 5. STUDENT FORM (PERFECT VERSION)
// ------------------------------------------------------------------
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  const [formData, setFormData] = useState({ 
      courseId: '', participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);

  useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); }, []);
  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); }, [formData.courseId]);

  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  const currentGenderRaw = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGenderRaw.startsWith('m');
  const isFemale = currentGenderRaw.startsWith('f');
  const currentGenderLabel = isMale ? 'Male' : (isFemale ? 'Female' : 'Male');

  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
  else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

  const allRecords = [...occupancy, ...participants].filter(p => String(p.participant_id) !== String(formData.participantId) && p.status !== 'Cancelled');
  const usedDining = new Set();
  const usedPagoda = new Set();

  allRecords.forEach(p => { 
      const pGender = (p.gender || '').toLowerCase();
      const pIsMale = pGender.startsWith('m');
      const pIsFemale = pGender.startsWith('f');
      if ((isMale && pIsMale) || (isFemale && pIsFemale)) {
          if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); 
          if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); 
      }
  });

  const handleStudentChange = (e) => { 
      const selectedId = e.target.value; 
      const student = participants.find(p => p.participant_id == selectedId); 
      setSelectedStudent(student);
      setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '', seatNo: '' })); 
  };

  const handleDiningSeatChange = (seatVal, typeVal) => { setFormData(prev => ({ ...prev, seatNo: seatVal, seatType: typeVal })); setShowVisualDining(false); };
  const handlePagodaSelect = (val) => { setFormData(prev => ({ ...prev, pagodaCell: val })); setShowVisualPagoda(false); };

  const handleReprint = () => {
    if (selectedStudent && selectedStudent.status === 'Attending') {
        const courseObj = courses.find(c => c.course_id == formData.courseId);
        setPrintData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: selectedStudent.full_name, confNo: selectedStudent.conf_no, roomNo: selectedStudent.room_no, seatNo: selectedStudent.dining_seat_no, lockers: selectedStudent.mobile_locker_no, language: selectedStudent.discourse_language, pagoda: selectedStudent.pagoda_cell_no, special: selectedStudent.special_seating });
        setShowReceipt(true);
        setTimeout(() => window.print(), 500);
    }
  };

  const VisualSelector = ({ title, options, occupied, selected, onSelect, onClose }) => ( <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'80%', maxHeight:'80vh', overflowY:'auto'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3>Select {title}</h3><button onClick={onClose}>Close</button></div><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px'}}>{options.map(opt => { const isOcc = occupied.has(String(opt)); const isSel = String(selected) === String(opt); return (<button key={opt} type="button" onClick={() => !isOcc && onSelect(opt)} disabled={isOcc} style={{padding:'10px', borderRadius:'5px', border:'none', cursor: isOcc?'not-allowed':'pointer', background: isOcc ? '#ffcdd2' : isSel ? '#007bff' : '#c8e6c9', color: isSel?'white':'black', fontWeight:'bold'}}>{opt}</button>); })}</div></div></div> );

  const handleSubmit = async (e) => { 
      e.preventDefault();
      if (!formData.confNo) return alert("Missing Conf No");
      setStatus('Submitting...');
      try { 
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, diningSeatType: formData.seatType }) });
          if (!res.ok) throw new Error("Check-in failed"); 
          await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
          setStatus('✅ Success!'); window.scrollTo(0, 0);
          const courseObj = courses.find(c => c.course_id == formData.courseId);
          setPrintData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: selectedStudent?.full_name, confNo: formData.confNo, roomNo: formData.roomNo, seatNo: formData.seatNo, lockers: formData.mobileLocker, language: formData.language, pagoda: formData.pagodaCell, special: formData.specialSeating });
          setShowReceipt(true);
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
          setSelectedStudent(null); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
          setTimeout(() => setStatus(''), 5000);
      } catch (err) { setStatus(`❌ ${err.message}`); } 
  };

  return ( 
      <div style={{background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px'}}> 
      <h2>📝 Student Onboarding</h2> {status && <div style={{padding:'10px', background:'#d4edda', color:'#155724', borderRadius:'6px', textAlign:'center', marginBottom:'15px'}}>{status}</div>}
      <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> 
          <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> 
            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}> <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={labelStyle}>2. Select Student</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{participants.filter(p=>p.status!=='Attending').map(p => <option key={p.participant_id} value={p.participant_id}>{p.status === 'Gate Check-In' ? '⚠️ AT GATE: ' : ''}{p.full_name} ({p.conf_no||'No ID'})</option>)}</select></div> </div>
            {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ ATTENTION:</strong> {selectedStudent.evening_food} {selectedStudent.medical_info}</div>)} 
          </div> 
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:'15px'}}> <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} /></div> <div><label style={labelStyle}>Age</label><input style={{...inputStyle, background:'#e9ecef'}} value={selectedStudent?.age || ''} disabled /></div><div><label style={labelStyle}>Room</label><button type="button" onClick={() => setShowVisualRoom(true)} style={{...inputStyle, textAlign:'left', background: formData.roomNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.roomNo || "Select Room (Grid)"}</button></div> <div><label style={labelStyle}>Dining ({currentGenderLabel})</label><div style={{display:'flex', gap:'5px'}}><select style={{...inputStyle, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select><button type="button" onClick={() => setShowVisualDining(true)} disabled={!selectedStudent} style={{...inputStyle, textAlign:'left', background: formData.seatNo ? '#e8f5e9' : 'white', cursor: selectedStudent ? 'pointer' : 'not-allowed'}}>{formData.seatNo || "--"}</button></div></div> </div> 
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> <div><label style={labelStyle}>Mobile</label><select style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>Valuables</label><select style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{NUMBER_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}</select></div> <div><label style={labelStyle}>Laundry</label><input style={{...inputStyle}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div> <div><label style={labelStyle}>Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> </div> 
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> <div><label style={labelStyle}>Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div> <div><label style={labelStyle}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...inputStyle, textAlign:'left', background: formData.pagodaCell ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.pagodaCell || "Select Cell"}</button></div><div><label style={labelStyle}>DS Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} /></div><div><label style={labelStyle}>Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> </div> 
          <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}> <button type="button" onClick={handleReprint} disabled={!selectedStudent} style={{padding:'12px 20px', background:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>🖨️ Reprint</button> <button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Confirm & Save</button> </div> 
      </form> 
      {showVisualDining && <DiningLayout gender={currentGenderLabel} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
      {showVisualPagoda && <PagodaLayout gender={currentGenderLabel} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
      {showVisualRoom && <VisualSelector title="Room" options={availableRooms.map(r=>r.room_no)} occupied={occupiedRoomsSet} selected={formData.roomNo} onSelect={(val)=>{setFormData({...formData, roomNo:val}); setShowVisualRoom(false)}} onClose={()=>setShowVisualRoom(false)} />}
      {showReceipt && printData && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px', width:'350px'}}><div id="receipt-print-area" style={{border:'2px solid black', padding:'10px'}}><h3>{printData.courseName}</h3><p>{printData.studentName}</p></div><button onClick={()=>window.print()}>Print</button><button onClick={()=>setShowReceipt(false)}>Close</button></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style></div>)}
      </div> 
  );
}

// ------------------------------------------------------------------
// 6. PARTICIPANT LIST (FULLY RESTORED - NO DINING SWAP)
// ------------------------------------------------------------------
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewAllMode, setViewAllMode] = useState(false); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [printTokenData, setPrintTokenData] = useState(null);
  const [printBulkData, setPrintBulkData] = useState(null);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false); 
  const [assignProgress, setAssignProgress] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatingConfig, setSeatingConfig] = useState({ mCols: 10, mRows: 8, mChowky: 2, fCols: 7, fRows: 8, fChowky: 2 });
  
  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const sortedList = useMemo(() => { 
      let items = [...participants]; 
      if (sortConfig.key) items.sort((a, b) => { let valA = a[sortConfig.key]||'', valB = b[sortConfig.key]||''; return valA < valB ? (sortConfig.direction==='asc'?-1:1) : (valA > valB ? (sortConfig.direction==='asc'?1:-1) : 0); });
      return items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); 
  }, [participants, sortConfig, search]);

  const prepareReceipt = (p) => { setPrintReceiptData({ courseName: courses.find(c=>c.course_id==p.course_id)?.course_name, studentName: p.full_name, roomNo: p.room_no, seatNo: p.dining_seat_no }); setTimeout(()=>window.print(), 500); };
  const prepareToken = (p) => { setPrintTokenData({ seat: p.dhamma_hall_seat_no, name: p.full_name }); setTimeout(()=>window.print(), 500); };
  const prepareBulkTokens = () => { setPrintBulkData(participants.filter(p=>p.status==='Attending'&&p.dhamma_hall_seat_no).map(p=>({seat:p.dhamma_hall_seat_no, name:p.full_name}))); setTimeout(()=>window.print(), 500); };
  const handleDelete = async (id) => { if(window.confirm("Delete?")) await fetch(`${API_URL}/participants/${id}`, {method:'DELETE'}); };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editingStudent)}); setEditingStudent(null); };
  const handleExport = () => { 
    const headers = ["Name", "Conf No", "Room", "Dining", "Pagoda", "DH Seat", "Status", "Mobile", "Valuables", "Laundry", "Lang"]; 
    const rows = participants.map(p => [`"${p.full_name}"`, p.conf_no, p.room_no, p.dining_seat_no, p.pagoda_cell_no, p.dhamma_hall_seat_no, p.status, p.mobile_locker_no, p.valuables_locker_no, p.laundry_token_no, p.discourse_language]); 
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); 
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `master_${courseId}.csv`; document.body.appendChild(link); link.click(); 
  };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); const headers = ["Seat", "Name", "Gender", "Room"]; const rows = arrived.map(p => [p.dining_seat_no, `"${p.full_name}"`, p.gender, p.room_no]); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `dining_${courseId}.csv`; document.body.appendChild(link); link.click(); };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };

  // --- LOGIC: DHAMMA HALL GRID ---
  const generateColLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse(); };
  const generateChowkyLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse().map(l => `CW-${l}`); };
  const handleSeatClick = async (seatLabel, student) => { 
      if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; } 
      const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null); 
      if (source.label === target.label) return; 
      if (window.confirm(`Swap/Move?`)) { 
          if (!target.p) { await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); } 
          else { 
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: 'TEMP', is_seat_locked: true}) }); 
              await fetch(`${API_URL}/participants/${target.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...target.p, dhamma_hall_seat_no: source.label, is_seat_locked: true}) }); 
              await fetch(`${API_URL}/participants/${source.p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...source.p, dhamma_hall_seat_no: target.label, is_seat_locked: true}) }); 
          } 
          loadStudents(); 
      } 
  };
  const handleAutoAssign = async () => { setShowAutoAssignModal(false); setAssignProgress('Calculating...'); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const allP = await res.json(); const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre))); const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m')); const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f')); const genSeats = (cols, rows) => { let s=[]; for(let r=1; r<=rows; r++) cols.forEach(c=>s.push(c+r)); return s; }; const mReg = genSeats(generateColLabels(seatingConfig.mCols), seatingConfig.mRows); const mSpec = genSeats(generateChowkyLabels(seatingConfig.mChowky), seatingConfig.mRows); const fReg = genSeats(generateColLabels(seatingConfig.fCols), seatingConfig.fRows); const fSpec = genSeats(generateChowkyLabels(seatingConfig.fChowky), seatingConfig.fRows); const assign = (list, regSeats, specSeats) => { const updates = []; const locked = new Set(); list.forEach(p => { if(p.is_seat_locked && p.dhamma_hall_seat_no) locked.add(p.dhamma_hall_seat_no); }); const availReg = regSeats.filter(s => !locked.has(s)); const availSpec = specSeats.filter(s => !locked.has(s)); const toAssign = list.filter(p => !p.is_seat_locked).sort((a,b) => { const rA = (a.conf_no?1:2); const rB = (b.conf_no?1:2); if (rA !== rB) return rA - rB; return (parseInt(b.age)||0) - (parseInt(a.age)||0); }); const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating)); const regGroup = toAssign.filter(p => !specGroup.includes(p)); specGroup.forEach(p => { if(availSpec.length) updates.push({...p, dhamma_hall_seat_no: availSpec.shift()}); else regGroup.unshift(p); }); regGroup.forEach(p => { if(availReg.length) updates.push({...p, dhamma_hall_seat_no: availReg.shift()}); }); return updates; }; const updates = [...assign(males, mReg, mSpec), ...assign(females, fReg, fSpec)]; if(updates.length === 0) { setAssignProgress(''); return alert("No assignments needed."); } setAssignProgress(`Saving ${updates.length}...`); const BATCH = 5; for(let i=0; i<updates.length; i+=BATCH) await Promise.all(updates.slice(i, i+BATCH).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) }))); setAssignProgress(''); alert("Done!"); loadStudents(); };

  // --- VIEWS ---
  if (showSummaryReport) {
      const arrived = participants.filter(p => p.status === 'Attending');
      const getCount = (gender, type) => arrived.filter(p => { const g = (p.gender || '').toLowerCase().startsWith(gender); const c = (p.conf_no || '').toUpperCase(); if (type === 'OLD') return g && (c.startsWith('O') || c.startsWith('S')); if (type === 'NEW') return g && c.startsWith('N'); return false; }).length;
      return (
          <div style={{background:'white', padding:'25px', borderRadius:'12px', marginBottom:'20px'}}>
              <div className="no-print"><button onClick={() => setShowSummaryReport(false)} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...toolBtn('#007bff'), marginLeft:'10px'}}>Print PDF</button></div>
              <div className="print-area" id="print-summary" style={{padding:'20px'}}>
                  <h2 style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px'}}>COURSE SUMMARY REPORT</h2>
                  <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'20px'}}><thead><tr style={{background:'#f0f0f0'}}><th rowSpan="2" style={thPrint}>Category</th><th colSpan="2" style={thPrint}>INDIAN</th><th colSpan="2" style={thPrint}>FOREIGNER</th><th rowSpan="2" style={thPrint}>TOTAL</th></tr><tr style={{background:'#f0f0f0'}}><th style={thPrint}>OLD</th><th style={thPrint}>NEW</th><th style={thPrint}>OLD</th><th style={thPrint}>NEW</th></tr></thead><tbody><tr><td style={tdPrint}>MALE</td><td style={tdPrint}>{getCount('m', 'OLD')}</td><td style={tdPrint}>{getCount('m', 'NEW')}</td><td style={tdPrint}>0</td><td style={tdPrint}>0</td><td style={tdPrint}><strong>{getCount('m', 'OLD') + getCount('m', 'NEW')}</strong></td></tr><tr><td style={tdPrint}>FEMALE</td><td style={tdPrint}>{getCount('f', 'OLD')}</td><td style={tdPrint}>{getCount('f', 'NEW')}</td><td style={tdPrint}>0</td><td style={tdPrint}>0</td><td style={tdPrint}><strong>{getCount('f', 'OLD') + getCount('f', 'NEW')}</strong></td></tr><tr style={{background:'#f0f0f0', fontWeight:'bold'}}><td style={tdPrint}>TOTAL</td><td style={tdPrint}>{getCount('m', 'OLD') + getCount('f', 'OLD')}</td><td style={tdPrint}>{getCount('m', 'NEW') + getCount('f', 'NEW')}</td><td style={tdPrint}>0</td><td style={tdPrint}>0</td><td style={tdPrint}>{arrived.length}</td></tr></tbody></table>
              </div>
          </div>
      );
  }

  if (viewMode === 'dining') { 
      const arrived = participants.filter(p => p.status==='Attending'); 
      const sorter = (a,b) => String(a.dining_seat_no || '0').localeCompare(String(b.dining_seat_no || '0'), undefined, { numeric: true }); 
      const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={handleDiningExport} style={toolBtn('#17a2b8')}>CSV</button> <button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={{...toolBtn(color), marginLeft:'10px'}}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Dining Plan</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint}>Seat</th><th style={thPrint}>Name</th><th style={thPrint}>Cat</th><th style={thPrint}>Room</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={{...tdPrint, fontWeight:'bold', fontSize:'14px'}}>{p.dining_seat_no}</td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.conf_no}</td><td style={tdPrint}>{p.room_no}</td></tr>))}</tbody></table> </div> ); 
      return ( <div style={{background:'white', padding:'25px', borderRadius:'12px'}}><div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-m")} {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-f")} </div> ); 
  }

  if (viewMode === 'pagoda') { 
      const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); 
      const sorter = (a,b) => String(a.pagoda_cell_no || '0').localeCompare(String(b.pagoda_cell_no || '0'), undefined, { numeric: true }); 
      const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={toolBtn(color)}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Pagoda Cells</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint}>Cell ↕</th><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Room</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={{...tdPrint, fontWeight:'bold'}}>{p.pagoda_cell_no}</td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.conf_no}</td><td style={tdPrint}>{p.room_no}</td></tr>))}</tbody></table> </div> ); 
      return ( <div style={{background:'white', padding:'25px', borderRadius:'12px'}}><div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-pm")} {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-pf")} </div> ); 
  }

  if (viewMode === 'seating') {
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled');
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled');
      const mM = {}, fM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); females.forEach(p=>fM[p.dhamma_hall_seat_no]=p);
      const SeatingSheet = ({ id, title, map, cols, rows }) => ( <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto'}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={()=>{const style = document.createElement('style'); style.innerHTML = `@media print { @page { size: A3 landscape; margin: 5mm; } body * { visibility: hidden; } #${id}, #${id} * { visibility: visible; } #${id} { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flexDirection: column; alignItems: center; } .no-print { display: none !important; } .seat-grid { page-break-inside: avoid; border-top: 2px solid black; border-left: 2px solid black; } h1 { font-size: 24px !important; margin: 0 0 10px 0; } }`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={{...quickBtnStyle(true), background:'#007bff', color:'white'}}>🖨️ Print {title} (A3)</button> </div> <div style={{textAlign:'center', marginBottom:'20px'}}> <h1 style={{margin:0, fontSize:'24px', textTransform:'uppercase'}}>Seating Plan - {title}</h1> <h3 style={{margin:'5px 0', fontSize:'16px'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> </div> <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content'}}> {(() => { let g=[]; for(let r=rows; r>=1; r--) { let cells=[]; cols.forEach(c => { const p = map[c+r]; cells.push(<div key={c+r} onClick={()=>handleSeatClick(c+r, p)} style={{border: '2px solid black', background: p?'#e3f2fd':'white', height:'90px', width:'130px', fontSize:'10px', display:'flex', flexDirection:'column', cursor:'pointer', position:'relative'}}><div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid black', padding:'2px 4px', fontWeight:'bold', fontSize:'13px'}}><span>{c+r}</span><span>{p?.room_no}</span></div><div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2px', textAlign:'center', fontWeight:'bold', fontSize:'11px'}}>{p?.full_name}</div></div>); }); g.push(<div key={r} style={{display:'flex'}}>{cells}</div>); } return g; })()} </div> </div> </div> );
      const mCols = [...generateChowkyLabels(seatingConfig.mChowky), ...generateColLabels(seatingConfig.mCols)];
      const fCols = [...generateChowkyLabels(seatingConfig.fChowky), ...generateColLabels(seatingConfig.fCols)];
      return ( <div style={{background:'white', padding:'25px', borderRadius:'12px'}}><div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}> <button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button> <button onClick={()=>setShowAutoAssignModal(true)} style={{...btnStyle(true), background:'#ff9800', color:'white'}}>Auto-Assign</button> </div> <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}><SeatingSheet id="print-male" title="MALE" map={mM} cols={mCols} rows={seatingConfig.mRows} /><SeatingSheet id="print-female" title="FEMALE" map={fM} cols={fCols} rows={seatingConfig.fRows} /></div> {showAutoAssignModal && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Auto-Assign Logic</h3><button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#28a745', color:'white', width:'100%'}}>RUN ASSIGNMENT</button><button onClick={()=>setShowAutoAssignModal(false)} style={{...btnStyle(false), marginTop:'10px', width:'100%'}}>Cancel</button></div></div>)} </div> );
  }
  
  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
         <div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e=>setSearch(e.target.value)} /></div>
         <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}><button onClick={prepareBulkTokens} style={toolBtn('#17a2b8')}>🎫 Bulk</button><button onClick={()=>setShowSummaryReport(true)} style={toolBtn('#28a745')}>📈 Summary</button><button onClick={handleAutoNoShow} style={toolBtn('#d32f2f')}>🚫 No-Show</button><button onClick={handleSendReminders} style={toolBtn('#ff9800')}>📢 Remind</button><button onClick={handleExport} style={toolBtn('#17a2b8')}>📥 Export</button><button onClick={()=>setViewMode('dining')} style={toolBtn('#007bff')}>🍽️ Dining</button><button onClick={()=>setViewMode('pagoda')} style={toolBtn('#007bff')}>🛖 Pagoda</button><button onClick={()=>setViewMode('seating')} style={toolBtn('#28a745')}>🧘 DH</button></div>
      </div>
      <table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr style={{background:'#f8f9fa', textAlign:'left'}}><th>Name</th><th>Conf</th><th>Room</th><th>Dining</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {sortedList.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td>{p.full_name}</td><td>{p.conf_no}</td><td>{p.room_no}</td><td>{p.dining_seat_no}</td><td>{p.status}</td><td><button onClick={()=>prepareReceipt(p)}>Receipt</button><button onClick={()=>prepareToken(p)}>Token</button><button onClick={()=>setEditingStudent(p)}>Edit</button><button onClick={()=>handleDelete(p.participant_id)}>🗑️</button></td></tr>))}
      </tbody></table>
      {printReceiptData && <div style={{position:'fixed', inset:0, background:'white', zIndex:9999}}><div id="receipt-area"><h3>{printReceiptData.courseName}</h3><p>{printReceiptData.studentName}</p></div><button onClick={()=>window.print()}>Print</button><button onClick={()=>setPrintReceiptData(null)}>Close</button><style>{`@media print { body * { visibility: hidden; } #receipt-area, #receipt-area * { visibility: visible; } #receipt-area { position: absolute; left: 0; top: 0; } }`}</style></div>}
      {printBulkData && <div style={{position:'fixed', inset:0, background:'white', zIndex:9999}}><div id="bulk-area">{printBulkData.map((p,i)=><div key={i} style={{pageBreakAfter:'always'}}><h1>{p.seat}</h1><p>{p.name}</p></div>)}</div><button onClick={()=>window.print()}>Print</button><button onClick={()=>setPrintBulkData(null)}>Close</button><style>{`@media print { body * { visibility: hidden; } #bulk-area, #bulk-area * { visibility: visible; } #bulk-area { position: absolute; left: 0; top: 0; } }`}</style></div>}
      {editingStudent && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px'}}><form onSubmit={handleEditSave}><input value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})}/><button type="submit">Save</button><button onClick={()=>setEditingStudent(null)}>Cancel</button></form></div></div>}
    </div>
  );
}

// ------------------------------------------------------------------
// 7. EXPENSES
// ------------------------------------------------------------------
function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [checkoutMode, setCheckoutMode] = useState(false); const [reportMode, setReportMode] = useState('');
  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
  useEffect(() => { if (selectedStudentId) fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(setHistory); }, [selectedStudentId]);
  const handleSubmit = async (e) => { e.preventDefault(); await fetch(`${API_URL}/expenses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ courseId, participantId: selectedStudentId, type: 'Laundry Token', amount }) }); setAmount(''); const res = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); setHistory(await res.json()); };
  
  if (checkoutMode) return (<div style={cardStyle}><h2>Check-Out Valuables</h2><button onClick={()=>setCheckoutMode(false)}>Exit</button><select onChange={e=>setSelectedStudentId(e.target.value)}>{participants.map(p=><option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div>);
  if (reportMode === 'invoice') return (<div style={cardStyle}><button onClick={()=>setReportMode('')}>Back</button><h3>Invoice</h3><button onClick={()=>window.print()}>Print</button></div>);

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h2>🛒 Store</h2><div><button onClick={()=>setReportMode('invoice')}>Invoice</button><button onClick={()=>setCheckoutMode(true)}>Checkout Valuables</button></div></div>
      <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">Select Course</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
      <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId}><option value="">Select Student</option>{participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select>
      <form onSubmit={handleSubmit}><input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} /><button type="submit" style={btnStyle(true)}>Save</button></form>
      <ul>{history.map(h => <li key={h.expense_id}>{h.expense_type}: {h.amount}</li>)}</ul>
    </div>
  );
}
