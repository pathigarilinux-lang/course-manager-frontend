import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { 
  Users, Upload, Save, Database, AlertTriangle, CheckCircle, 
  Search, Home, Coffee, FileText, Trash2, X, Edit, Plus,
  CreditCard, DollarSign, Download, Calendar, Printer, Settings,
  LayoutGrid, LogOut, Utensils, MapPin, UserCheck, History, Eye, EyeOff
} from 'lucide-react';

// --- IMPORTS ---
import DiningLayout from './DiningLayout';
import PagodaLayout from './PagodaLayout';

// --- UPDATED LANGUAGES LIST ---
const LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi", 
  "French", "German", "Spanish", "Russian", "Chinese", "Mandarin Chinese", 
  "Japanese", "Thai", "Burmese", "Sinhala", "Nepali", 
  "Portuguese", "Vietnamese"
];
// ------------------------------------------------------------------
// 🟢 PRODUCTION CONFIGURATION
// ------------------------------------------------------------------
const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 
const ADMIN_PASSCODE = "0000"; 
const GATEKEEPER_PASSCODE = "1111";
const TEACHER_PASSCODE = "2222";

// ------------------------------------------------------------------
// 🎨 STYLES
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 🛠 UTILS & CONSTANTS
// ------------------------------------------------------------------
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set([
  "301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W",
  "344AW","344BW","345AW","345BW","346AW","346BW","347AW","347BW","348AW","348BW","349AW","349BW","350AW","350BW","351AW","351BW","352AW","352BW","353AW","353BW","354AW","354BW","355AW","355BW","356AW","356BW","357AW","357BW","358AW","358BW","359AW","359BW","360AW","360BW","361AW","361BW","362AW","362BW","363AW","363BW"
]);

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

// ------------------------------------------------------------------
// 🧩 MAIN APP COMPONENT
// ------------------------------------------------------------------
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

  const handleDownloadBackup = async () => {
      try {
          const resCourses = await fetch(`${API_URL}/courses`);
          const coursesData = await resCourses.json();
          let allData = { timestamp: new Date().toISOString(), courses: coursesData, participants: [] };
          for (let c of coursesData) {
              const resP = await fetch(`${API_URL}/courses/${c.course_id}/participants`);
              const pData = await resP.json();
              allData.participants.push(...pData);
          }
          const blob = new Blob([JSON.stringify(allData, null, 2)], {type : 'application/json'});
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `dhamma_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch(e) { alert("Backup Failed"); }
  };

  const renderCourseAdmin = () => (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Upload size={24} className="text-blue-600"/> Course Admin</h2>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={()=>setAdminSubTab('create')} style={quickBtnStyle(adminSubTab==='create')}>+ New Course</button>
           <button onClick={()=>setAdminSubTab('upload')} style={quickBtnStyle(adminSubTab==='upload')}>📂 Upload CSV</button>
           <button onClick={()=>setAdminSubTab('manual')} style={quickBtnStyle(adminSubTab==='manual')}>✍️ Manual Entry</button>
           <button onClick={handleDownloadBackup} style={{...quickBtnStyle(false), background:'#6c757d', color:'white'}}>💾 Backup DB</button>
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
  
  // --- TEACHER VIEW (NEW) ---
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
// 🧩 SUB-COMPONENTS (FULL IMPLEMENTATION)
// ------------------------------------------------------------------

function GatekeeperPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => { 
        if (courses.length > 0) setCourseId(courses[0].course_id); 
    }, [courses]);

    useEffect(() => { 
        if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); 
    }, [courseId]);

    const handleGateCheckIn = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as ARRIVED at Gate?`)) return;
        try {
            await fetch(`${API_URL}/gate-checkin`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const data = await res.json();
            setParticipants(data);
        } catch (err) { alert("Error"); }
    };

    const handleGateCancel = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as CANCELLED?`)) return;
        try {
            await fetch(`${API_URL}/gate-cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) });
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const data = await res.json();
            setParticipants(data);
        } catch (err) { alert("Error"); }
    };

    // --- GATE DASHBOARD METRICS ---
    const all = participants.filter(p => p.status !== 'Cancelled');
    const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
    const pending = all.filter(p => p.status === 'No Response');
    
    const getBreakdown = (list, filterFn) => list.filter(filterFn).length;
    const isMale = (p) => (p.gender||'').toLowerCase().startsWith('m');
    const isFemale = (p) => (p.gender||'').toLowerCase().startsWith('f');
    const isOld = (p) => (p.conf_no||'').startsWith('O') || (p.conf_no||'').startsWith('S');
    const isNew = (p) => (p.conf_no||'').startsWith('N');

    const stats = {
        total: all.length,
        arrived: arrived.length,
        pending: pending.length,
        m: { tot: getBreakdown(all, isMale), arr: getBreakdown(arrived, isMale), pend: getBreakdown(pending, isMale) },
        f: { tot: getBreakdown(all, isFemale), arr: getBreakdown(arrived, isFemale), pend: getBreakdown(pending, isFemale) },
        cat: { old: getBreakdown(arrived, isOld), new: getBreakdown(arrived, isNew) }
    };

    const filtered = participants.filter(p => {
        const match = p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(search.toLowerCase()));
        if (!match) return false;
        
        // IMPORTANT: Show cancelled ONLY if searching specific user, otherwise hide
        if (p.status === 'Cancelled' && !search) return false;
        
        // "Disappearing" Logic: Show pending by default. Show Arrived only if history enabled.
        if (!showHistory && !search) return p.status === 'No Response' || !p.status;
        return true;
    });

    const StatBox = ({ label, v1, v2, v3, color }) => (
        <div style={{background:'white', padding:'10px', borderRadius:'6px', borderTop:`3px solid ${color}`, textAlign:'center', flex:1}}>
            <div style={{fontSize:'11px', color:'#777', fontWeight:'bold', textTransform:'uppercase'}}>{label}</div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px', fontSize:'13px'}}>
                <span title="Total">T:<b>{v1}</b></span>
                <span title="Arrived" style={{color:'green'}}>A:<b>{v2}</b></span>
                <span title="Pending" style={{color:'red'}}>P:<b>{v3}</b></span>
            </div>
        </div>
    );

    return (
        <div style={cardStyle}>
            {/* GATE DASHBOARD */}
            <div style={{background:'#f1f3f5', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
                <h3 style={{margin:'0 0 10px 0', fontSize:'16px'}}>Gate Dashboard</h3>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'12px', color:'#777'}}>Total Expected</div>
                        <div style={{fontSize:'20px', fontWeight:'bold'}}>{stats.total}</div>
                    </div>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #28a745'}}>
                        <div style={{fontSize:'12px', color:'green'}}>Checked In</div>
                        <div style={{fontSize:'20px', fontWeight:'bold', color:'green'}}>{stats.arrived}</div>
                    </div>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #dc3545'}}>
                        <div style={{fontSize:'12px', color:'red'}}>Pending</div>
                        <div style={{fontSize:'20px', fontWeight:'bold', color:'red'}}>{stats.pending}</div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <StatBox label="Male" v1={stats.m.tot} v2={stats.m.arr} v3={stats.m.pend} color="#007bff" />
                    <StatBox label="Female" v1={stats.f.tot} v2={stats.f.arr} v3={stats.f.pend} color="#e91e63" />
                </div>
                <div style={{marginTop:'10px', fontSize:'12px', textAlign:'center', color:'#555'}}>
                    <b>Arrived Breakdown:</b> Old Students: {stats.cat.old} | New Students: {stats.cat.new}
                </div>
            </div>

            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                <select style={{...inputStyle, flex:1}} value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                <button onClick={()=>setShowHistory(!showHistory)} style={{...btnStyle(showHistory), flexShrink:0}}>{showHistory ? <EyeOff size={16}/> : <History size={16}/>} {showHistory ? 'Hide Arrived' : 'View History'}</button>
            </div>
            
            <div style={{marginBottom:'20px'}}>
                <input style={{...inputStyle, padding:'15px', fontSize:'18px'}} placeholder="🔍 Search Name or Conf No..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
            </div>

            <div style={{height:'400px', overflowY:'auto'}}>
                {filtered.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px'}}>No pending students found matching filter.</div> : 
                filtered.map(p => (
                    <div key={p.participant_id} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                            <div style={{fontWeight:'bold', fontSize:'16px'}}>{p.full_name}</div>
                            <div style={{color:'#666', fontSize:'14px'}}>{p.conf_no} | Age: {p.age}</div>
                            <div style={{marginTop:'5px'}}>
                                {p.status === 'Gate Check-In' && <span style={{background:'#ffc107', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>AT GATE</span>}
                                {p.status === 'Attending' && <span style={{background:'#28a745', color:'white', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>INSIDE (DONE)</span>}
                                {p.status === 'Cancelled' && <span style={{background:'#dc3545', color:'white', padding:'2px 6px', borderRadius:'4px', fontSize:'12px', fontWeight:'bold'}}>CANCELLED</span>}
                                {(p.status === 'No Response' || !p.status) && <span style={{background:'#eee', padding:'2px 6px', borderRadius:'4px', fontSize:'12px'}}>PENDING</span>}
                            </div>
                        </div>
                        {p.status !== 'Attending' && p.status !== 'Gate Check-In' && p.status !== 'Cancelled' && (
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={()=>handleGateCheckIn(p)} style={{...btnStyle(true), background:'#007bff', color:'white', padding:'10px 20px'}}>Mark Arrived</button>
                                <button onClick={()=>handleGateCancel(p)} style={{...btnStyle(true), background:'#dc3545', color:'white', padding:'10px'}}>Cancel</button>
                            </div>
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
  const [participants, setParticipants] = useState([]);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);
  
  useEffect(() => { 
      if (selectedCourse) {
          fetch(`${API_URL}/courses/${selectedCourse}/stats`).then(res => res.json()).then(setStats).catch(console.error); 
          fetch(`${API_URL}/courses/${selectedCourse}/participants`).then(res => res.json()).then(setParticipants).catch(console.error); 
      }
  }, [selectedCourse]);

  // --- REUSE CALCULATION LOGIC FOR DETAILED STATS ---
  const all = participants.filter(p => p.status !== 'Cancelled');
  const arrived = all.filter(p => p.status === 'Gate Check-In' || p.status === 'Attending');
  const pending = all.filter(p => p.status === 'No Response');
  
  const getBreakdown = (list, filterFn) => list.filter(filterFn).length;
  const isMale = (p) => (p.gender||'').toLowerCase().startsWith('m');
  const isFemale = (p) => (p.gender||'').toLowerCase().startsWith('f');
  
  // Dashboard Specific Stats
  const detailedStats = {
      m: { tot: getBreakdown(all, isMale), arr: getBreakdown(arrived, isMale), pend: getBreakdown(pending, isMale) },
      f: { tot: getBreakdown(all, isFemale), arr: getBreakdown(arrived, isFemale), pend: getBreakdown(pending, isFemale) },
  };

  const StatBox = ({ label, v1, v2, v3, color }) => (
      <div style={{background:'white', padding:'15px', borderRadius:'8px', borderTop:`4px solid ${color}`, textAlign:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
          <div style={{fontSize:'12px', color:'#777', fontWeight:'bold', textTransform:'uppercase', marginBottom:'10px'}}>{label}</div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
              <span title="Total">Exp: <b>{v1}</b></span>
              <span title="Arrived" style={{color:'green'}}>Arr: <b>{v2}</b></span>
              <span title="Pending" style={{color:'red'}}>Pen: <b>{v3}</b></span>
          </div>
      </div>
  );

  const ActionCard = ({ title, count, color, icon, desc }) => (
      <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid ${color}`}}>
          <div style={{background: color, borderRadius:'50%', padding:'10px', color:'white', marginRight:'15px'}}>{icon}</div>
          <div><div style={{fontSize:'12px', color:'#777', textTransform:'uppercase', fontWeight:'bold'}}>{title}</div><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{count}</div><div style={{fontSize:'11px', color:'#999'}}>{desc}</div></div>
      </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard v2.0</h2><select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
      {stats && selectedCourse ? (
        <>
            {/* THE FUNNEL */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                <ActionCard title="Expected" count={stats.attending + stats.gate_checkin + stats.no_response} color="#6c757d" icon={<Users size={20}/>} desc="Total Confirmed" />
                <ActionCard title="At Gate" count={stats.gate_checkin} color="#ff9800" icon={<MapPin size={20}/>} desc="Arrived at Campus" />
                <ActionCard title="Onboarded" count={stats.attending} color="#28a745" icon={<UserCheck size={20}/>} desc="Room Assigned" />
                <ActionCard title="Pending" count={stats.no_response} color="#dc3545" icon={<AlertTriangle size={20}/>} desc="Not yet arrived" />
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                <StatBox label="Male Statistics" v1={detailedStats.m.tot} v2={detailedStats.m.arr} v3={detailedStats.m.pend} color="#007bff" />
                <StatBox label="Female Statistics" v1={detailedStats.f.tot} v2={detailedStats.f.arr} v3={detailedStats.f.pend} color="#e91e63" />
            </div>

            <div style={{display:'flex', gap:'20px'}}>
                <div style={{flex:2, ...cardStyle}}>
                    <h3>Arrival Flow (Male vs Female)</h3>
                    <div style={{height:'300px'}}>
                        <ResponsiveContainer>
                            <BarChart data={[
                                { name: 'Male', Onboarded: stats.attending_m, AtGate: stats.gate_m, Pending: stats.pending_m }, 
                                { name: 'Female', Onboarded: stats.attending_f, AtGate: stats.gate_f, Pending: stats.pending_f }
                            ]}>
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
                <div style={{flex:1, ...cardStyle}}>
                    <h3>Occupancy</h3>
                    <div style={{marginBottom:'20px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}><span>Male Rooms</span><span>{stats.attending_m}/100</span></div>
                        <div style={{height:'10px', background:'#eee', borderRadius:'5px'}}><div style={{width:`${Math.min(100, (stats.attending_m/100)*100)}%`, height:'100%', background:'#007bff', borderRadius:'5px'}}></div></div>
                    </div>
                    <div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}><span>Female Rooms</span><span>{stats.attending_f}/80</span></div>
                        <div style={{height:'10px', background:'#eee', borderRadius:'5px'}}><div style={{width:`${Math.min(100, (stats.attending_f/80)*100)}%`, height:'100%', background:'#e91e63', borderRadius:'5px'}}></div></div>
                    </div>
                </div>
            </div>
        </>
      ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course.</p>}
    </div>
  );
}

// ... Include other components (GlobalAccommodationManager, ATPanel, StudentForm, ParticipantList, ExpenseTracker) as defined previously
// (For brevity, ensure you copy the full implementations from the previous complete App.jsx provided, as they haven't changed except for context usage)

function GlobalAccommodationManager({ courses, onRoomClick }) {
  // ... (Paste full implementation from previous response)
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [editingRoom, setEditingRoom] = useState(null);

  const loadData = () => { 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); 
  };
  
  useEffect(loadData, []);

  const handleAddRoom = async () => { 
      if (!newRoom.roomNo) return alert("Enter Room Number"); 
      try {
          const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) });
          if(res.ok) {
              setNewRoom({ ...newRoom, roomNo: '' }); 
              loadData(); 
          } else {
              const err = await res.json();
              alert(`Error: ${err.error || "Failed to add room"}`);
          }
      } catch(err) { console.error(err); alert("Network Error"); }
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

  const normalize = (str) => str ? str.toString().trim().toUpperCase() : '';
  const courseGroups = {};
  courses.forEach(c => { courseGroups[c.course_id] = { name: c.course_name, males: [], females: [], stats: { old: 0, new: 0, total: 0 } }; });
  const occupiedSet = new Set();
  occupancy.forEach(p => {
      if (p.room_no) {
          occupiedSet.add(normalize(p.room_no));
          const cId = p.course_id; 
          const group = courseGroups[cId]; 
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
          <div onClick={() => type === 'occupied' ? setEditingRoom({ p, newRoomNo: '' }) : onRoomClick(r.room_no)}
            style={{ border: `1px solid ${borderColor}`, borderLeft: genderBorder, background: bgColor, borderRadius: '4px', padding: '5px', minHeight: '60px', fontSize: '11px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <div style={{fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
                  {r.room_no}
                  {type === 'available' && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(r.room_id, r.room_no)}} style={{border:'none', background:'none', color:'#ccc', cursor:'pointer'}}>×</button>}
              </div>
              {type === 'occupied' && (<div style={{marginTop:'2px'}}><div style={{fontWeight:'bold', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div><div style={{display:'flex', justifyContent:'space-between', marginTop:'2px'}}><span style={{fontWeight:'bold', color:'#333'}}>{p.conf_no || '-'}</span><span style={{color:'#666'}}>{p.age}</span></div></div>)}
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
            <button onClick={handleAddRoom} style={{...toolBtn('#007bff')}}>+ Add Room</button> 
        </div>
        <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> 
      </div> 
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', overflowX:'auto', paddingBottom:'10px'}}>
          {Object.values(courseGroups).map((g, i) => (
              <div key={i} style={{background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', minWidth:'180px', borderTop:'4px solid #28a745'}}>
                  <div style={{fontWeight:'bold', fontSize:'13px', marginBottom:'5px'}}>{getSmartShortName(g.name)}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}><span>Old: <b>{g.stats.old}</b></span><span>New: <b>{g.stats.new}</b></span><span>Total: <b>{g.stats.total}</b></span></div>
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
      {Object.values(courseGroups).map((g, i) => ( g.stats.total > 0 &&
          <div key={i} style={{marginBottom:'20px', border:'1px solid #ccc', borderRadius:'8px', overflow:'hidden'}}>
              <div style={{background:'#333', color:'white', padding:'10px', fontWeight:'bold'}}>{getSmartShortName(g.name)} (Allocated)</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
                  <div style={{padding:'10px', borderRight:'1px solid #eee'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#007bff', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>MALE ({g.males.length})</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>{g.males.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (<RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Male'}} p={p} type="occupied" />))}</div>
                  </div>
                  <div style={{padding:'10px'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#e91e63', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>FEMALE ({g.females.length})</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>{g.females.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (<RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Female'}} p={p} type="occupied" />))}</div>
                  </div>
              </div>
          </div>
      ))}
      <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'10px'}}>
          <div style={{textAlign:'center', fontWeight:'bold', color:'#777', marginBottom:'10px'}}>🟢 AVAILABLE POOL</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div><h4 style={{margin:'0 0 10px 0', color:'#007bff', borderBottom:'2px solid #007bff'}}>MALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{maleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}</div></div>
              <div><h4 style={{margin:'0 0 10px 0', color:'#e91e63', borderBottom:'2px solid #e91e63'}}>FEMALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{femaleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}</div></div>
          </div>
      </div>
      {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter target room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update / Swap</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} 
    </div> 
  );
}

function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [showKitchenReport, setShowKitchenReport] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleLocalChange = (field, value) => setEditingStudent(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) });
    setEditingStudent(null);
  };

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => { const valA = a.conf_no || ''; const valB = b.conf_no || ''; return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); });

  const printKitchenReport = () => {
      // Logic for Kitchen Report
      setShowKitchenReport(true);
      setTimeout(() => window.print(), 500);
  };

  if (showKitchenReport) {
      const kitchenData = participants.filter(p => (p.evening_food && p.evening_food !== 'None') || (p.medical_info && p.medical_info.trim() !== ''));
      return (
          <div style={cardStyle}>
              <div className="no-print"><button onClick={() => setShowKitchenReport(false)} style={btnStyle(false)}>← Back</button></div>
              <div className="print-area">
                  <h1 style={{textAlign:'center'}}>Kitchen & Medical Report</h1>
                  <table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}>
                      <thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Evening Food</th><th style={thPrint}>Medical/Notes</th></tr></thead>
                      <tbody>{kitchenData.map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2>AT Panel</h2>
          <button onClick={printKitchenReport} disabled={!courseId} style={{...toolBtn('#ff9800')}}><Utensils size={16}/> Kitchen Report</button>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <input style={inputStyle} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
      </div>
      {courseId && (
        <div style={{maxHeight:'500px', overflowY:'auto'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}>
               <th style={{padding:'10px'}}>S.N.</th><th style={{padding:'10px'}}>Name</th><th style={{padding:'10px', cursor:'pointer'}} onClick={toggleSort}>Conf {sortOrder==='asc'?'▲':'▼'}</th><th style={{padding:'10px'}}>Special SEAT</th><th style={{padding:'10px'}}>Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>{filtered.map((p, i) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px', color:'#777'}}>{i+1}</td><td style={{padding:'10px'}}><strong>{p.full_name}</strong></td><td style={{padding:'10px'}}>{p.conf_no}</td><td style={{padding:'10px'}}>{p.special_seating || '-'}</td><td style={{padding:'10px'}}>{p.evening_food || '-'}</td><td style={{padding:'10px'}}>{p.medical_info || '-'}</td><td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={{...toolBtn('#007bff'), padding:'5px 10px'}}>✏️ Detail</button></td></tr>))}</tbody>
           </table>
        </div>
      )}
      {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Update: {editingStudent.full_name}</h3><form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}><div><label style={labelStyle}>Special Seating</label><select style={inputStyle} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div><div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select></div><div><label style={labelStyle}>Medical</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleLocalChange('medical_info', e.target.value)} /></div><div><label style={labelStyle}>Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} /></div><div style={{textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false)}}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save</button></div></form></div></div>)}
    </div>
  );
}
// --- MODIFIED STUDENT FORM COMPONENT ---
function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ 
      courseId: '', participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  // Visual Modal States
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);

  // Constants & Helpers
  const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 
  const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
  const btnStyle = (isActive) => ({ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#555', fontWeight: '600', fontSize:'13px', display:'flex', alignItems:'center', gap:'5px' });
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
  const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };

  // Effects
  useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); }, []);
  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); }, [formData.courseId]);

  // Derived Logic
  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  const currentGender = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGender.startsWith('m'); 
  const isFemale = currentGender.startsWith('f');

  // Filter Rooms by Gender
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
  else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

  // Calculate Occupied Sets for Visual Grids
  const allRecords = [...occupancy, ...participants].filter(p => String(p.participant_id) !== String(formData.participantId) && p.status !== 'Cancelled');
  const usedDining = new Set();
  const usedPagoda = new Set();
  allRecords.forEach(p => { 
      if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); 
      if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); 
  });

  const handleStudentChange = (e) => { 
      const selectedId = e.target.value; 
      const student = participants.find(p => p.participant_id == selectedId); 
      setSelectedStudent(student);
      setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); 
  };

  // 🔴 UPDATED LOGIC: Dining Seat syncs Mobile & Valuables. Laundry is INDEPENDENT.
  const handleDiningSeatChange = (val) => { 
      setFormData(prev => ({ 
          ...prev, 
          seatNo: val, 
          mobileLocker: val, 
          valuablesLocker: val
          // laundryToken is NOT touched
      })); 
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => {
      setFormData(prev => ({ ...prev, pagodaCell: val }));
      setShowVisualPagoda(false);
  };

  const triggerPrint = () => { setShowReceipt(true); setTimeout(() => { window.print(); }, 500); };

  // Visual Room Selector Component
  const VisualSelector = ({ title, options, occupied, selected, onSelect, onClose }) => (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'80%', maxHeight:'80vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3>Select {title}</h3><button onClick={onClose}>Close</button></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px'}}>
                {options.map(opt => {
                    const isOcc = occupied.has(String(opt));
                    const isSel = String(selected) === String(opt);
                    return (
                        <button key={opt} type="button" onClick={() => !isOcc && onSelect(opt)} disabled={isOcc}
                            style={{padding:'10px', borderRadius:'5px', border:'none', cursor: isOcc?'not-allowed':'pointer', background: isOcc ? '#ffcdd2' : isSel ? '#007bff' : '#c8e6c9', color: isSel?'white':'black', fontWeight:'bold'}}>
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );

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
          
          // Print Name Logic
          let cleanName = courseObj?.course_name || 'Unknown Course';
          cleanName = cleanName.replace(/-[A-Za-z]{3}-\d{2,4}.*$/g, '').replace(/\/.*$/, '').trim();

          const pData = { 
              courseName: cleanName, 
              teacherName: courseObj?.teacher_name || 'Goenka Ji', 
              from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', 
              to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', 
              studentName: selectedStudent?.full_name, 
              confNo: formData.confNo, 
              roomNo: formData.roomNo, seatNo: formData.seatNo, 
              lockers: formData.mobileLocker, 
              language: formData.language,
              pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null,
              special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null
          };
          setPrintData(pData);
          setShowReceipt(true);
          
          // Reset
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
          setSelectedStudent(null); clearRoom(); 
          fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); 
          fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
          setTimeout(() => setStatus(''), 5000);
      } catch (err) { setStatus(`❌ ${err.message}`); } 
  };

  return ( 
      <div style={{background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px'}}> 
      <h2>📝 Student Onboarding</h2> 
      {status && <div style={{padding:'10px', background:'#d4edda', color:'#155724', borderRadius:'6px', textAlign:'center', marginBottom:'15px'}}>{status}</div>}
      <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> 
          
          <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> 
            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}> 
              <div>
                <label style={labelStyle}>1. Select Course</label>
                <select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
              </div> 
              <div>
                <label style={labelStyle}>2. Select Student</label>
                <select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required>
                  <option value="">-- Select --</option>
                  {participants.filter(p=>p.status!=='Attending').map(p => <option key={p.participant_id} value={p.participant_id}>{p.status === 'Gate Check-In' ? '⚠️ AT GATE: ' : ''}{p.full_name} ({p.conf_no||'No ID'})</option>)}
                </select>
              </div> 
            </div>
            {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ ATTENTION:</strong> {selectedStudent.evening_food} {selectedStudent.medical_info}</div>)} 
          </div> 

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:'15px'}}> 
              <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} /></div> 
              <div><label style={labelStyle}>Age</label><input style={{...inputStyle, background:'#e9ecef'}} value={selectedStudent?.age || ''} disabled /></div>
              
              <div>
                  <label style={labelStyle}>Room</label>
                  <button type="button" onClick={() => setShowVisualRoom(true)} style={{...inputStyle, textAlign:'left', background: formData.roomNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.roomNo || "Select Room (Grid)"}</button>
              </div> 
              
              <div>
                  <label style={labelStyle}>Dining</label>
                  <div style={{display:'flex', gap:'5px'}}>
                      <select style={{...inputStyle, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                      <button type="button" onClick={() => setShowVisualDining(true)} style={{...inputStyle, textAlign:'left', background: formData.seatNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.seatNo || "--"}</button>
                  </div>
              </div> 
          </div> 

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
              <div><label style={labelStyle}>Mobile</label><input style={{...inputStyle, background:'#e9ecef', color:'#6c757d'}} value={formData.mobileLocker} readOnly /></div> 
              <div><label style={labelStyle}>Valuables</label><input style={{...inputStyle, background:'#e9ecef', color:'#6c757d'}} value={formData.valuablesLocker} readOnly /></div> 
              {/* Laundry Independent */}
              <div><label style={labelStyle}>Laundry</label><input style={{...inputStyle}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div> 
              <div><label style={labelStyle}>Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> 
          </div> 
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
              <div><label style={labelStyle}>Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div> 
              <div>
                  <label style={labelStyle}>Pagoda</label>
                  <button type="button" onClick={() => setShowVisualPagoda(true)} style={{...inputStyle, textAlign:'left', background: formData.pagodaCell ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.pagodaCell || "Select Cell"}</button>
              </div>
              <div><label style={labelStyle}>DS Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} /></div>
              <div><label style={labelStyle}>Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> 
          </div> 
          
          <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
              <button type="button" onClick={triggerPrint} disabled={!selectedStudent} style={{padding:'12px 20px', background:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>🖨️ Reprint</button>
              <button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Confirm & Save</button>
          </div> 
      </form> 

      {/* Visual Modals */}
      {showVisualDining && <DiningLayout gender={isMale ? 'Male' : 'Female'} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
      {showVisualPagoda && <PagodaLayout gender={isMale ? 'Male' : 'Female'} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
      {showVisualRoom && <VisualSelector title="Room" options={availableRooms.map(r=>r.room_no)} occupied={occupiedRoomsSet} selected={formData.roomNo} onSelect={(val)=>{setFormData({...formData, roomNo:val}); setShowVisualRoom(false)}} onClose={()=>setShowVisualRoom(false)} />}

      {/* Receipt Print */}
      {showReceipt && printData && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}>
                  <button onClick={() => setShowReceipt(false)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button>
                  <div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}>
                      <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div>
                      <div style={{fontSize:'12px', marginBottom:'10px'}}>
                          <div><strong>Course:</strong> {printData.courseName}</div>
                          <div><strong>Teacher:</strong> {printData.teacherName}</div>
                          <div><strong>Dates:</strong> {printData.from} to {printData.to}</div>
                      </div>
                      <div style={{borderBottom:'1px solid black', margin:'10px 0'}}></div>
                      <div style={{fontSize:'16px', fontWeight:'bold', margin:'10px 0'}}><div>{printData.studentName}</div><div style={{fontSize:'14px'}}>Conf: {printData.confNo}</div></div>
                      <table style={{width:'100%', fontSize:'14px', border:'1px solid black', borderCollapse:'collapse'}}><tbody><tr><td style={{border:'1px solid black', padding:'5px'}}>Room</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.roomNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Dining</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.seatNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lockers</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.lockers}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lang</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.language}</td></tr>{printData.pagoda && <tr><td style={{border:'1px solid black', padding:'5px'}}>Pagoda</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.pagoda}</td></tr>}{printData.special && <tr><td style={{border:'1px solid black', padding:'5px'}}>Special</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.special}</td></tr>}</tbody></table>
                      <div style={{textAlign:'center', fontSize:'10px', fontStyle:'italic', marginTop:'10px'}}>*** Student Copy ***</div>
                  </div>
                  <div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button></div>
              </div>
              <style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; } @page { size: auto; margin: 0; } }`}</style>
          </div>
      )}
      </div> 
  );
}

function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [search, setSearch] = useState(''); 
  const [editingStudent, setEditingStudent] = useState(null); 
  const [viewAllMode, setViewAllMode] = useState(false); 
  const [viewMode, setViewMode] = useState('list'); 
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [assignProgress, setAssignProgress] = useState(''); 
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [printTokenData, setPrintTokenData] = useState(null);
  const [printBulkData, setPrintBulkData] = useState(null);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  
  // --- DYNAMIC SEATING CONFIGURATION ---
  const [seatingConfig, setSeatingConfig] = useState({ mCols: 10, mRows: 8, mChowky: 2, fCols: 7, fRows: 8, fChowky: 2 });

  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);

  // --- HELPER FUNCTIONS ---
  const getCategoryRank = (conf) => { if (!conf) return 2; const s = conf.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 0; if (s.startsWith('N')) return 1; return 2; };
  const getCategory = (conf) => { if(!conf) return '-'; const s = conf.toUpperCase(); if (s.startsWith('O') || s.startsWith('S')) return 'OLD'; if (s.startsWith('N')) return 'NEW'; return 'Other'; };
  const getLangCode = (lang) => { if(!lang) return 'ENG'; const map = { 'Hindi': 'HIN', 'English': 'ENG', 'Marathi': 'MAR', 'Telugu': 'TEL', 'Tamil': 'TAM', 'Kannada': 'KAN', 'Malayalam': 'MAL', 'Gujarati': 'GUJ' }; return map[lang] || lang.substring(0,3).toUpperCase(); };
  
  const handleSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  const sortedList = React.useMemo(() => { 
      let items = [...participants]; 
      if (sortConfig.key) { 
          items.sort((a, b) => { 
              let valA = a[sortConfig.key];
              let valB = b[sortConfig.key];
              if (valA === null || valA === undefined) valA = '';
              if (valB === null || valB === undefined) valB = '';
              if (['age', 'dining_seat_no', 'pagoda_cell_no', 'laundry_token_no'].includes(sortConfig.key)) {
                  valA = parseInt(valA) || 0;
                  valB = parseInt(valB) || 0;
              } else {
                  valA = valA.toString().toLowerCase();
                  valB = valB.toString().toLowerCase();
              }
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          }); 
      } 
      return items.filter(p => (p.full_name || '').toLowerCase().includes(search.toLowerCase())); 
  }, [participants, sortConfig, search]);

  const getSeniorityScore = (p) => { const sMatch = (p.courses_info||'').match(/S\s*[:=-]?\s*(\d+)/i); const lMatch = (p.courses_info||'').match(/L\s*[:=-]?\s*(\d+)/i); const s = sMatch ? parseInt(sMatch[1]) : 0; const l = lMatch ? parseInt(lMatch[1]) : 0; return (l * 10000) + (s * 10); };
  
  // --- DYNAMIC GRID GENERATOR ---
  const generateColLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse(); };
  const generateChowkyLabels = (count) => { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); return letters.slice(0, count).reverse().map(l => `CW-${l}`); };

  const handleAutoAssign = async () => { setShowAutoAssignModal(false); setAssignProgress('Calculating...'); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const allP = await res.json(); const active = allP.filter(p => p.status === 'Attending' && !['SM','SF'].some(pre => (p.conf_no||'').toUpperCase().startsWith(pre))); const males = active.filter(p => (p.gender||'').toLowerCase().startsWith('m')); const females = active.filter(p => (p.gender||'').toLowerCase().startsWith('f')); const genSeats = (cols, rows) => { let s=[]; for(let r=1; r<=rows; r++) cols.forEach(c=>s.push(c+r)); return s; }; const mReg = genSeats(generateColLabels(seatingConfig.mCols), seatingConfig.mRows); const mSpec = genSeats(generateChowkyLabels(seatingConfig.mChowky), seatingConfig.mRows); const fReg = genSeats(generateColLabels(seatingConfig.fCols), seatingConfig.fRows); const fSpec = genSeats(generateChowkyLabels(seatingConfig.fChowky), seatingConfig.fRows); const assign = (list, regSeats, specSeats) => { const updates = []; const locked = new Set(); list.forEach(p => { if(p.is_seat_locked && p.dhamma_hall_seat_no) locked.add(p.dhamma_hall_seat_no); }); const availReg = regSeats.filter(s => !locked.has(s)); const availSpec = specSeats.filter(s => !locked.has(s)); const toAssign = list.filter(p => !p.is_seat_locked).sort((a,b) => { const rA = getCategoryRank(a.conf_no), rB = getCategoryRank(b.conf_no); if (rA !== rB) return rA - rB; if (rA === 0) return getSeniorityScore(b) - getSeniorityScore(a); return (parseInt(b.age)||0) - (parseInt(a.age)||0); }); const specGroup = toAssign.filter(p => p.special_seating && ['Chowky','Chair','BackRest'].includes(p.special_seating)); const regGroup = toAssign.filter(p => !specGroup.includes(p)); specGroup.forEach(p => { if(availSpec.length) updates.push({...p, dhamma_hall_seat_no: availSpec.shift()}); else regGroup.unshift(p); }); regGroup.forEach(p => { if(availReg.length) updates.push({...p, dhamma_hall_seat_no: availReg.shift()}); }); return updates; }; const updates = [...assign(males, mReg, mSpec), ...assign(females, fReg, fSpec)]; if(updates.length === 0) { setAssignProgress(''); return alert("No assignments needed."); } setAssignProgress(`Saving ${updates.length}...`); const BATCH = 5; for(let i=0; i<updates.length; i+=BATCH) await Promise.all(updates.slice(i, i+BATCH).map(p => fetch(`${API_URL}/participants/${p.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) }))); setAssignProgress(''); alert("Done!"); loadStudents(); };

  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleResetCourse = async () => { if (window.confirm("⚠️ RESET: Delete ALL students?")) { await fetch(`${API_URL}/courses/${courseId}/reset`, { method: 'DELETE' }); loadStudents(); } };
  const handleDeleteCourse = async () => { if (window.confirm("🛑 DELETE COURSE?")) { await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' }); refreshCourses(); setCourseId(''); } };
  const handleAutoNoShow = async () => { if (!window.confirm("🚫 Auto-Flag No-Show?")) return; await fetch(`${API_URL}/courses/${courseId}/auto-noshow`, { method: 'POST' }); loadStudents(); };
  const handleSendReminders = async () => { if (!window.confirm("📢 Send Reminders?")) return; await fetch(`${API_URL}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reminder_all' }) }); };

  // --- PRINT PREPARATION FUNCTIONS ---
  const prepareReceipt = (student) => { const courseObj = courses.find(c => c.course_id == student.course_id) || courses.find(c => c.course_id == courseId); setPrintReceiptData({ courseName: courseObj?.course_name, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: student.full_name, confNo: student.conf_no, roomNo: student.room_no, seatNo: student.dining_seat_no, lockers: student.mobile_locker_no || student.dining_seat_no, language: student.discourse_language, pagoda: student.pagoda_cell_no && student.pagoda_cell_no !== 'None' ? student.pagoda_cell_no : null, special: student.special_seating && student.special_seating !== 'None' ? student.special_seating : null }); setTimeout(() => window.print(), 500); };
  const prepareToken = (student) => { if (!student.dhamma_hall_seat_no) return alert("No Dhamma Seat assigned."); setPrintTokenData({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no||'-', room: student.room_no||'-', age: student.age, cat: getCategory(student.conf_no), sVal: (student.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (student.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }); setTimeout(() => window.print(), 500); };
  const prepareBulkTokens = () => { const valid = participants.filter(p => p.status === 'Attending' && p.dhamma_hall_seat_no); if(valid.length === 0) return alert("No seats assigned"); setPrintBulkData(valid.sort((a,b)=>a.dhamma_hall_seat_no.localeCompare(b.dhamma_hall_seat_no, undefined, {numeric:true})).map(student=>({ seat: student.dhamma_hall_seat_no, name: student.full_name, conf: student.conf_no, cell: student.pagoda_cell_no||'-', room: student.room_no||'-', age: student.age, cat: getCategory(student.conf_no), sVal: (student.courses_info?.match(/S\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1], lVal: (student.courses_info?.match(/L\s*[:=-]?\s*(\d+)/i)||[0,'-'])[1] }))); setTimeout(()=>window.print(), 500); };
  const handleExport = () => { if (participants.length === 0) return alert("No data"); const headers = ["Name", "Conf No", "Courses Info", "Age", "Gender", "Room", "Dining Seat", "Pagoda", "Dhamma Seat", "Status", "Mobile Locker", "Valuables Locker", "Laundry Token", "Language"]; const rows = participants.map(p => [`"${p.full_name || ''}"`, p.conf_no || '', `"${p.courses_info || ''}"`, p.age || '', p.gender || '', p.room_no || '', p.dining_seat_no || '', p.pagoda_cell_no || '', p.dhamma_hall_seat_no || '', p.status || '', p.mobile_locker_no || '', p.valuables_locker_no || '', p.laundry_token_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `master_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleDiningExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Type", "Name", "Gender", "Room", "Lang"]; const rows = arrived.map(p => [p.dining_seat_no || '', p.dining_seat_type || '', `"${p.full_name || ''}"`, p.gender || '', p.room_no || '', p.discourse_language || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `dining_${courseId}.csv`); document.body.appendChild(link); link.click(); };
  const handleSeatingExport = () => { const arrived = participants.filter(p => p.status === 'Attending'); if (arrived.length === 0) return alert("No data."); const headers = ["Seat", "Name", "Conf", "Gender", "Pagoda", "Room"]; const rows = arrived.map(p => [p.dhamma_hall_seat_no || '', `"${p.full_name || ''}"`, p.conf_no || '', p.gender || '', p.pagoda_cell_no || '', p.room_no || '']); const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `seating_${courseId}.csv`); document.body.appendChild(link); link.click(); };

  // --- COURSE SUMMARY REPORT COMPONENT ---
  if (showSummaryReport) {
      const arrived = participants.filter(p => p.status === 'Attending');
      const getCount = (gender, type) => arrived.filter(p => {
          const g = (p.gender || '').toLowerCase().startsWith(gender);
          const c = (p.conf_no || '').toUpperCase();
          if (type === 'OLD') return g && (c.startsWith('O') || c.startsWith('S'));
          if (type === 'NEW') return g && c.startsWith('N');
          return false;
      }).length;
      
      return (
          <div style={cardStyle}>
              <div className="no-print"><button onClick={() => setShowSummaryReport(false)} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...toolBtn('#007bff'), marginLeft:'10px'}}>Print PDF</button></div>
              <div className="print-area" id="print-summary" style={{padding:'20px'}}>
                  <h2 style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px'}}>COURSE SUMMARY REPORT</h2>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                      <div><strong>Centre Name:</strong> Dhamma Nagajjuna 2</div>
                      <div><strong>Course Date:</strong> {courses.find(c=>c.course_id==courseId)?.start_date}</div>
                  </div>
                  
                  <h3 style={{background:'#eee', padding:'5px'}}>COURSE DETAILS</h3>
                  <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'20px'}}>
                      <thead>
                          <tr style={{background:'#f0f0f0'}}>
                              <th rowSpan="2" style={thPrint}>Category</th>
                              <th colSpan="2" style={thPrint}>INDIAN</th>
                              <th colSpan="2" style={thPrint}>FOREIGNER</th>
                              <th rowSpan="2" style={thPrint}>TOTAL</th>
                          </tr>
                          <tr style={{background:'#f0f0f0'}}>
                              <th style={thPrint}>OLD</th><th style={thPrint}>NEW</th>
                              <th style={thPrint}>OLD</th><th style={thPrint}>NEW</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td style={tdPrint}>MALE</td>
                              <td style={tdPrint}>{getCount('m', 'OLD')}</td><td style={tdPrint}>{getCount('m', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}><strong>{getCount('m', 'OLD') + getCount('m', 'NEW')}</strong></td>
                          </tr>
                          <tr>
                              <td style={tdPrint}>FEMALE</td>
                              <td style={tdPrint}>{getCount('f', 'OLD')}</td><td style={tdPrint}>{getCount('f', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}><strong>{getCount('f', 'OLD') + getCount('f', 'NEW')}</strong></td>
                          </tr>
                          <tr style={{background:'#f0f0f0', fontWeight:'bold'}}>
                              <td style={tdPrint}>TOTAL</td>
                              <td style={tdPrint}>{getCount('m', 'OLD') + getCount('f', 'OLD')}</td>
                              <td style={tdPrint}>{getCount('m', 'NEW') + getCount('f', 'NEW')}</td>
                              <td style={tdPrint}>0</td><td style={tdPrint}>0</td>
                              <td style={tdPrint}>{arrived.length}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  // --- STANDARD VIEWS ---
  if (viewAllMode) { return ( <div style={{background:'white', padding:'20px'}}> <div className="no-print" style={{marginBottom:'20px'}}><button onClick={() => setViewAllMode(false)} style={btnStyle(false)}>← Back</button><button onClick={handleExport} style={{...toolBtn('#17a2b8'), marginLeft:'10px'}}>Export CSV</button></div> <h2>Master List</h2> <div style={{overflowX:'auto'}}><table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Courses</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th><th style={thPrint}>Pagoda</th><th style={thPrint}>DH Seat</th><th style={thPrint}>Status</th><th style={thPrint}>Mobile</th><th style={thPrint}>Val</th><th style={thPrint}>Laundry</th><th style={thPrint}>Lang</th></tr></thead><tbody>{participants.map((p,i)=>(<tr key={p.participant_id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{p.full_name}</td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.courses_info}</td><td style={tdStyle}>{p.age}</td><td style={tdStyle}>{p.gender}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.pagoda_cell_no}</td><td style={tdStyle}>{p.dhamma_hall_seat_no}</td><td style={tdStyle}>{p.status}</td><td style={tdStyle}>{p.mobile_locker_no}</td><td style={tdStyle}>{p.valuables_locker_no}</td><td style={tdStyle}>{p.laundry_token_no}</td><td style={tdStyle}>{p.discourse_language}</td></tr>))}</tbody></table></div> </div> ); }

  if (viewMode === 'dining') { const currentCourse = courses.find(c=>c.course_id == courseId); const arrived = participants.filter(p => p.status==='Attending'); const sorter = (a,b) => { const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no); if (rankA !== rankB) return rankA - rankB; return String(a.dining_seat_no || '0').localeCompare(String(b.dining_seat_no || '0'), undefined, { numeric: true }); }; const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={handleDiningExport} style={toolBtn('#17a2b8')}>CSV</button> <button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={{...toolBtn(color), marginLeft:'10px'}}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Dining Plan - {currentCourse?.course_name}</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint} onClick={()=>handleSort('dining_seat_no')}>Seat ↕</th><th style={thPrint}>Name</th><th style={thPrint}>Cat</th><th style={thPrint}>Room</th><th style={thPrint}>Pagoda</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={tdPrint}><strong>{p.dining_seat_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{getCategory(p.conf_no)}</td><td style={tdPrint}>{p.room_no}</td><td style={tdPrint}>{p.pagoda_cell_no||'-'}</td></tr>))}</tbody></table> </div> ); return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-m")} {renderTable(arrived.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-f")} </div> ); }

  if (viewMode === 'pagoda') { const currentCourse = courses.find(c=>c.course_id == courseId); const assigned = participants.filter(p => p.status==='Attending' && p.pagoda_cell_no); const sorter = (a,b) => String(a.pagoda_cell_no || '0').localeCompare(String(b.pagoda_cell_no || '0'), undefined, { numeric: true }); const renderTable = (list, title, color, sectionId) => ( <div id={sectionId} style={{marginBottom:'40px', padding:'20px', border:`1px solid ${color}`}}> <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}><button onClick={() => {const style=document.createElement('style'); style.innerHTML=`@media print{body *{visibility:hidden}#${sectionId},#${sectionId} *{visibility:visible}#${sectionId}{position:absolute;left:0;top:0;width:100%}}`; document.head.appendChild(style); window.print(); document.head.removeChild(style);}} style={toolBtn(color)}>Print {title}</button></div> <h2 style={{color:color, textAlign:'center'}}>{title} Pagoda Cells - {currentCourse?.course_name}</h2> <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #000'}}><thead><tr><th style={thPrint}>S.N.</th><th style={thPrint} onClick={()=>handleSort('pagoda_cell_no')}>Cell ↕</th><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Room</th><th style={thPrint}>Dining</th></tr></thead><tbody>{list.map((p,i)=>(<tr key={p.participant_id}><td style={tdPrint}>{i+1}</td><td style={tdPrint}><strong>{p.pagoda_cell_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.conf_no}</td><td style={tdPrint}>{p.room_no}</td><td style={tdPrint}>{p.dining_seat_no||'-'}</td></tr>))}</tbody></table> </div> ); return ( <div style={cardStyle}> <div className="no-print"><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button></div> {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('m')).sort(sorter), "MALE", "#007bff", "pd-pm")} {renderTable(assigned.filter(p=>(p.gender||'').toLowerCase().startsWith('f')).sort(sorter), "FEMALE", "#e91e63", "pd-pf")} </div> ); }

  if (viewMode === 'seating') {
      const males = participants.filter(p => (p.gender||'').toLowerCase().startsWith('m') && p.status!=='Cancelled');
      const females = participants.filter(p => (p.gender||'').toLowerCase().startsWith('f') && p.status!=='Cancelled');
      const mM = {}, fM = {}; males.forEach(p=>mM[p.dhamma_hall_seat_no]=p); females.forEach(p=>fM[p.dhamma_hall_seat_no]=p);
      
      const handleSeatClick = async (seatLabel, student) => {
        if (!selectedSeat) { setSelectedSeat({ label: seatLabel, p: student }); return; }
        const source = selectedSeat; const target = { label: seatLabel, p: student }; setSelectedSeat(null);
        if (source.label === target.label) return;
        if (!source.p) return; 
        if (target.p) { const isSourceMale = (source.p.gender || '').toLowerCase().startsWith('m'); const isTargetMale = (target.p.gender || '').toLowerCase().startsWith('m'); if (isSourceMale !== isTargetMale) return alert("⛔ Gender Mismatch!"); }

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

      const Box = ({p, l}) => {
          let sVal = '-', lVal = '-';
          if (p && p.courses_info) {
             const sMatch = p.courses_info.match(/S\s*[:=-]?\s*(\d+)/i);
             const lMatch = p.courses_info.match(/L\s*[:=-]?\s*(\d+)/i);
             if(sMatch) sVal = sMatch[1];
             if(lMatch) lVal = lMatch[1];
          }

          return (
              <div onClick={() => handleSeatClick(l, p)} style={{border: '2px solid black', background:'white', height:'100%', fontSize:'10px', display:'flex', flexDirection:'column', cursor:'pointer', position:'relative', minHeight:'90px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid black', padding:'2px 4px', fontWeight:'bold', fontSize:'13px', background:'#fff'}}>
                      <span>{l}</span>
                      <span>{p ? (p.room_no || '') : ''}</span>
                  </div>
                  <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2px', textAlign:'center', fontWeight:'bold', fontSize:'11px', lineHeight:'1.2'}}>
                      {p ? p.full_name : ''}
                  </div>
                  {p && (
                      <div style={{borderTop:'1px solid black', padding:'2px 4px', fontSize:'10px', display:'flex', justifyContent:'space-between', background:'#f9f9f9'}}>
                          <span>({getCategory(p.conf_no).charAt(0)})</span>
                          <span>s:{sVal} L:{lVal}</span>
                          <span>Age: ({p.age})</span>
                      </div>
                  )}
              </div>
          );
      };
      
      const renderGrid = (map, cols, rows) => {
          let g=[]; 
          // Reverse loop to ensure top rows (highest number) are printed first
          for(let r=rows; r>=1; r--) { 
              let cells=[]; 
              cols.forEach(c => cells.push(<Box key={c+r} l={c+r} p={map[c+r]} />)); 
              g.push(<div key={r} style={{display:'grid', gridTemplateColumns:`repeat(${cols.length}, 130px)`, gridAutoRows:'95px', gap:'-1px'}}>{cells}</div>); 
          } 
          return g;
      };
      
      const printSection = (sectionId) => { const style = document.createElement('style'); style.innerHTML = `@media print { @page { size: A3 landscape; margin: 5mm; } body * { visibility: hidden; } #${sectionId}, #${sectionId} * { visibility: visible; } #${sectionId} { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; flexDirection: column; alignItems: center; } .no-print { display: none !important; } .seat-grid { page-break-inside: avoid; border-top: 2px solid black; border-left: 2px solid black; } h1 { font-size: 24px !important; margin: 0 0 10px 0; } }`; document.head.appendChild(style); window.print(); document.head.removeChild(style); };
      const SeatingSheet = ({ id, title, map, cols, rows }) => (
        <div id={id} style={{width:'100%', maxWidth:'1500px', margin:'0 auto'}}> 
            <div className="no-print" style={{textAlign:'right', marginBottom:'10px'}}> <button onClick={()=>printSection(id)} style={{...quickBtnStyle(true), background:'#007bff', color:'white'}}>🖨️ Print {title} (A3)</button> </div> 
            
            <div style={{textAlign:'center', marginBottom:'20px'}}> <h1 style={{margin:0, fontSize:'24px', textTransform:'uppercase'}}>Seating Plan - {title}</h1> <h3 style={{margin:'5px 0', fontSize:'16px'}}>{courses.find(c=>c.course_id==courseId)?.course_name}</h3> </div>
            
            <div style={{display:'flex', justifyContent:'center'}}> <div className="seat-grid" style={{width:'fit-content'}}> {renderGrid(map, cols, rows)} </div> </div>
            
            <div style={{display:'flex', justifyContent:'center', marginTop:'40px'}}> 
                <div style={{textAlign:'center'}}> 
                    <div style={{border:'2px dashed black', width:'400px', padding:'15px', fontWeight:'900', fontSize:'28px', letterSpacing:'2px', textTransform:'uppercase'}}>TEACHER</div>
                </div> 
            </div>
        </div>
      );

      // Generate Dynamic Columns for Display
      const mCols = [...generateChowkyLabels(seatingConfig.mChowky), ...generateColLabels(seatingConfig.mCols)];
      const fCols = [...generateChowkyLabels(seatingConfig.fChowky), ...generateColLabels(seatingConfig.fCols)];

      return (
          <div style={cardStyle}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}> <button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button> <div style={{display:'flex', gap:'10px', alignItems:'center'}}> {assignProgress && <span style={{color:'green', fontWeight:'bold'}}>{assignProgress}</span>} <div style={{fontSize:'12px', background:'#fff3cd', padding:'5px 10px', borderRadius:'4px'}}>💡 Manual Move = Auto-Lock</div> <button onClick={handleSeatingExport} style={{...quickBtnStyle(true), background:'#17a2b8', color:'white'}}>CSV</button> <button onClick={()=>setShowAutoAssignModal(true)} style={{...btnStyle(true), background:'#ff9800', color:'white'}}><Settings size={16}/> Auto-Assign</button> </div> </div>
              <div className="print-area" style={{display:'flex', flexDirection:'column', gap:'100px'}}>
                  <SeatingSheet id="print-male" title="MALE" map={mM} cols={mCols} rows={seatingConfig.mRows} />
                  <SeatingSheet id="print-female" title="FEMALE" map={fM} cols={fCols} rows={seatingConfig.fRows} />
              </div>

              {showAutoAssignModal && (
                  <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
                      <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}>
                          <h3>🛠️ Auto-Assign Logic Configuration</h3>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                              <div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}>
                                  <h4 style={{marginTop:0, color:'#007bff'}}>Male Side (Right)</h4>
                                  <label style={labelStyle}>Standard Cols</label><input type="number" style={inputStyle} value={seatingConfig.mCols} onChange={e=>setSeatingConfig({...seatingConfig, mCols: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Chowky Cols</label><input type="number" style={inputStyle} value={seatingConfig.mChowky} onChange={e=>setSeatingConfig({...seatingConfig, mChowky: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Total Rows</label><input type="number" style={inputStyle} value={seatingConfig.mRows} onChange={e=>setSeatingConfig({...seatingConfig, mRows: parseInt(e.target.value)||0})} />
                              </div>
                              <div style={{border:'1px solid #ddd', padding:'10px', borderRadius:'5px'}}>
                                  <h4 style={{marginTop:0, color:'#e91e63'}}>Female Side (Left)</h4>
                                  <label style={labelStyle}>Standard Cols</label><input type="number" style={inputStyle} value={seatingConfig.fCols} onChange={e=>setSeatingConfig({...seatingConfig, fCols: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Chowky Cols</label><input type="number" style={inputStyle} value={seatingConfig.fChowky} onChange={e=>setSeatingConfig({...seatingConfig, fChowky: parseInt(e.target.value)||0})} />
                                  <label style={labelStyle}>Total Rows</label><input type="number" style={inputStyle} value={seatingConfig.fRows} onChange={e=>setSeatingConfig({...seatingConfig, fRows: parseInt(e.target.value)||0})} />
                              </div>
                          </div>
                          <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                               <button onClick={()=>setShowAutoAssignModal(false)} style={btnStyle(false)}>Cancel</button>
                               <button onClick={handleAutoAssign} style={{...btnStyle(true), background:'#28a745', color:'white'}}>RUN ASSIGNMENT</button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- DEFAULT LIST VIEW ---
  const getStatusColor = (s) => {
    if (s === 'Attending') return '#28a745'; // Green
    if (s === 'Gate Check-In') return '#ffc107'; // Yellow/Orange
    if (s === 'Cancelled' || s === 'No-Show') return '#dc3545'; // Red
    return '#6c757d'; // Grey (Pending)
  };

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
         <div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e=>setSearch(e.target.value)} disabled={!courseId} /></div>
         <div style={{display:'flex', gap:'8px'}}>
             <button onClick={prepareBulkTokens} disabled={!courseId} style={toolBtn('#17a2b8')}>🎫 Bulk Tokens</button>
             <button onClick={() => setShowSummaryReport(true)} disabled={!courseId} style={toolBtn('#28a745')}>📈 Summary Report</button>
             <button onClick={handleAutoNoShow} disabled={!courseId} style={toolBtn('#d32f2f')}>🚫 No-Shows</button>
             <button onClick={handleSendReminders} disabled={!courseId} style={toolBtn('#ff9800')}>📢 Reminders</button>
             <button onClick={()=>setViewAllMode(true)} disabled={!courseId} style={toolBtn('#6c757d')}>👁️ View All</button>
             <button onClick={handleExport} disabled={!courseId} style={toolBtn('#17a2b8')}>📥 Export</button>
             <button onClick={()=>setViewMode('dining')} disabled={!courseId} style={toolBtn('#007bff')}>🍽️ Dining</button>
             <button onClick={()=>setViewMode('pagoda')} disabled={!courseId} style={toolBtn('#007bff')}>🛖 Pagoda</button>
             <button onClick={()=>setViewMode('seating')} disabled={!courseId} style={toolBtn('#28a745')}>🧘 Dhamma Hall</button>
         </div>
      </div>
      
      {courseId && <div style={{marginBottom:'15px', padding:'15px', background:'#fff0f0', border:'1px solid red', borderRadius:'5px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span style={{fontWeight:'bold', color:'red', display:'flex', alignItems:'center', gap:'5px'}}><AlertTriangle size={18}/> Admin Zone:</span>
          <div>
              <button onClick={handleResetCourse} style={{padding:'8px 16px', background:'#dc3545', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', marginRight:'10px'}}>Reset Data</button>
              <button onClick={handleDeleteCourse} style={{padding:'8px 16px', background:'red', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Delete Course</button>
          </div>
      </div>}

      <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'8px'}}>
        <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f8f9fa', textAlign:'left'}}>
              {['S.N.', 'FULL_NAME','CONF_NO','COURSES_INFO','AGE','GENDER','ROOM_NO','DINING_SEAT_NO','PAGODA_CELL_NO','DHAMMA_HALL_SEAT_NO', 'LAUNDRY_TOKEN_NO', 'STATUS'].map(k=><th key={k} style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd', cursor:'pointer'}} onClick={()=>handleSort(k.toLowerCase())}>{k.replace(/_/g,' ')}</th>)}
              <th style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd'}}>PRINTS</th>
              <th style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd'}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((p, i) => (
              <tr key={p.participant_id} style={{borderBottom:'1px solid #eee', background: p.status === 'Attending' ? 'white' : '#fff5f5'}}>
                <td style={{...tdStyle, color:'#777'}}>{i+1}</td>
                <td style={{...tdStyle, fontWeight:'bold'}}>{p.full_name}</td>
                <td style={tdStyle}>{p.conf_no}</td>
                <td style={{...tdStyle, fontSize:'11px', color:'#666'}}>{p.courses_info}</td>
                <td style={tdStyle}>{p.age}</td>
                <td style={tdStyle}>{p.gender}</td>
                <td style={tdStyle}>{p.room_no}</td>
                <td style={tdStyle}>{p.dining_seat_no}</td>
                <td style={tdStyle}>{p.pagoda_cell_no}</td>
                <td style={{...tdStyle, fontWeight:'bold', color:'#007bff'}}>{p.dhamma_hall_seat_no}</td>
                <td style={tdStyle}>{p.laundry_token_no}</td>
                <td style={{...tdStyle, color: getStatusColor(p.status), fontWeight:'bold'}}>{p.status}</td>
                <td style={tdStyle}>
                   <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                      <button onClick={() => prepareReceipt(p)} style={{padding:'4px 8px', background:'#e3f2fd', border:'1px solid #90caf9', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:'#0d47a1', display:'flex', alignItems:'center', gap:'3px'}}><Printer size={12}/> Receipt</button>
                      <button onClick={() => prepareToken(p)} style={{padding:'4px 8px', background:'#fff3cd', border:'1px solid #ffeeba', borderRadius:'4px', cursor:'pointer', fontSize:'11px', color:'#856404', display:'flex', alignItems:'center', gap:'3px'}}><Printer size={12}/> Token</button>
                   </div>
                </td>
                <td style={tdStyle}>
                   <div style={{display:'flex', gap:'5px'}}>
                      <button onClick={() => setEditingStudent(p)} style={{padding:'5px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'4px', cursor:'pointer'}}><Edit size={16} color="#555"/></button>
                      <button onClick={() => handleDelete(p.participant_id)} style={{padding:'5px', background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:'4px', cursor:'pointer'}}><Trash2 size={16} color="#d32f2f"/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Modals Omitted for Brevity - they are included in state */}
      {printReceiptData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={()=>setPrintReceiptData(null)} style={{float:'right'}}>X</button><div id="receipt-print-area" style={{border:'1px dashed black', padding:'10px'}}><h3>{printReceiptData.courseName}</h3><p>{printReceiptData.studentName}</p></div><button onClick={()=>window.print()} style={{marginTop:'10px', width:'100%'}}>Print</button></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style></div>}
      {printTokenData && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'300px'}}><button onClick={()=>setPrintTokenData(null)} style={{float:'right'}}>X</button><div id="token-print-area" style={{border:'2px solid black', padding:'20px', textAlign:'center'}}><h1>{printTokenData.seat}</h1><p>{printTokenData.name}</p></div><button onClick={()=>window.print()} style={{marginTop:'10px', width:'100%'}}>Print</button></div><style>{`@media print { body * { visibility: hidden; } #token-print-area, #token-print-area * { visibility: visible; } #token-print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style></div>}
      {/* BULK TOKENS MODAL */}
      {printBulkData && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:'20px', borderRadius:'5px', width:'350px', maxHeight:'80vh', overflowY:'auto', position:'relative'}}>
                  <button onClick={() => setPrintBulkData(null)} style={{position:'absolute', right:'10px', top:'10px', background:'red', color:'white', border:'none', borderRadius:'50%', width:'25px', height:'25px', cursor:'pointer'}}>X</button>
                  <h3 style={{textAlign:'center', margin:'0 0 20px 0'}}>🖨️ Bulk Printing...</h3>
                  
                  <div id="bulk-token-print-area">
                      {printBulkData.map((t, i) => (
                          <div key={i} className="bulk-token-container" style={{fontFamily:'Helvetica, Arial, sans-serif', color:'black', padding:'20px', textAlign:'center', border:'2px solid black', marginBottom:'20px'}}>
                              <div style={{fontSize:'16px', fontWeight:'bold', marginBottom:'10px'}}>DHAMMA SEAT TOKEN</div>
                              <div style={{fontSize:'60px', fontWeight:'900', margin:'10px 0'}}>{t.seat}</div>
                              <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>{t.name}</div>
                              <div style={{fontSize:'12px', color:'#555', marginBottom:'10px'}}>{t.conf}</div>
                              <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid black', paddingTop:'10px'}}>
                                  <div style={{textAlign:'left'}}><div style={{fontSize:'10px'}}>Cell</div><div style={{fontWeight:'bold', fontSize:'14px'}}>{t.cell}</div></div>
                                  <div style={{textAlign:'right'}}><div style={{fontSize:'10px'}}>Room</div><div style={{fontWeight:'bold', fontSize:'14px'}}>{t.room}</div></div>
                              </div>
                              <div style={{marginTop:'10px', paddingTop:'10px', borderTop:'1px dashed #ccc', fontSize:'11px', display:'flex', justifyContent:'space-between'}}>
                                  <span>{t.cat}</span>
                                  <span>S:{t.sVal} L:{t.lVal}</span>
                                  <span>Age: {t.age}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              <style>{`
                  @media print {
                      @page { size: auto; margin: 0; }
                      body * { visibility: hidden; }
                      #bulk-token-print-area, #bulk-token-print-area * { visibility: visible; }
                      #bulk-token-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                      .bulk-token-container { page-break-after: always; display: block; height: auto; border-bottom: 2px dashed black !important; margin-bottom: 5px; padding-bottom: 20px; }
                      .bulk-token-container:last-child { page-break-after: auto; }
                  }
              `}</style>
          </div>
      )}

      {/* Edit Modal with Lockers */}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', width:'600px', borderRadius:'10px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Full Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e=>setEditingStudent({...editingStudent, full_name:e.target.value})} /></div><div><label>Conf No</label><input style={inputStyle} value={editingStudent.conf_no||''} onChange={e=>setEditingStudent({...editingStudent, conf_no:e.target.value})} /></div></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label>Room No</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} /></div><div><label>Dining Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} /></div><div><label>Pagoda Cell</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} /></div></div>
      <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}><h4 style={{marginTop:0}}>Manual Locker Override</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}><div><label>Mobile</label><input style={inputStyle} value={editingStudent.mobile_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, mobile_locker_no:e.target.value})} /></div><div><label>Valuables</label><input style={inputStyle} value={editingStudent.valuables_locker_no||''} onChange={e=>setEditingStudent({...editingStudent, valuables_locker_no:e.target.value})} /></div><div><label>Laundry</label><input style={inputStyle} value={editingStudent.laundry_token_no||''} onChange={e=>setEditingStudent({...editingStudent, laundry_token_no:e.target.value})} /></div><div><label>Dhamma Hall Seat</label><input style={inputStyle} value={editingStudent.dhamma_hall_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dhamma_hall_seat_no:e.target.value})} /></div></div></div>
      <div style={{textAlign:'right'}}><button onClick={()=>setEditingStudent(null)} style={{marginRight:'10px', padding:'8px 16px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>Cancel</button><button type="submit" style={{padding:'8px 16px', background:'#007bff', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Save Changes</button></div></form></div></div>)}
    </div>
  );
}

function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [studentToken, setStudentToken] = useState(''); const [expenseType, setExpenseType] = useState('Laundry Token'); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [status, setStatus] = useState(''); const [showInvoice, setShowInvoice] = useState(false); const [reportMode, setReportMode] = useState(''); const [financialData, setFinancialData] = useState([]); const [editingId, setEditingId] = useState(null); const [checkoutMode, setCheckoutMode] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(err => console.error(err)); }, [courseId]);
  useEffect(() => { if (selectedStudentId) { const student = participants.find(p => p.participant_id == selectedStudentId); setStudentToken(student ? student.laundry_token_no : ''); fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error); } else { setHistory([]); setStudentToken(''); } }, [selectedStudentId]);
  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); };
  const loadLaundryReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/participants`).then(res=>res.json()).then(data=>{ setFinancialData(data.filter(p=>p.status==='Attending')); setReportMode('laundry'); }); };
  const handleLaundryClick = () => { const label = studentToken ? `Laundry Token ${studentToken}` : `Laundry Token`; setExpenseType(label); setAmount('50'); };
  const handleEditClick = (item) => { setEditingId(item.expense_id); setExpenseType(item.expense_type); setAmount(item.amount); setStatus('✏️ Editing Mode...'); };
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`; const method = editingId ? 'PUT' : 'POST'; const body = editingId ? { expense_type: expenseType, amount } : { courseId, participantId: selectedStudentId, type: expenseType, amount }; try { const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed"); setStatus(editingId ? '✅ Updated!' : '✅ Saved!'); setAmount(''); setEditingId(null); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); } catch (err) { setStatus('❌ Error'); } };
  const handleDeleteExpense = async (id) => { if (!window.confirm("Delete?")) return; await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); };
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0); const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || ''; const currentStudent = participants.find(p => p.participant_id == selectedStudentId);
  
  if (reportMode === 'invoice' && currentStudent) { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Invoice</button> </div> <div className="print-area" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px'}}> <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}> <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div> <div style={{textAlign: 'right'}}><h3>{currentStudent.full_name}</h3><p>Room: {currentStudent.room_no}</p><p>{selectedCourseName}</p></div> </div> <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}> <thead><tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}><th style={{textAlign: 'left', padding: '10px'}}>Description</th><th style={{textAlign: 'left', padding: '10px'}}>Date</th><th style={{textAlign: 'right', padding: '10px'}}>Amount</th></tr></thead> <tbody> {history.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}> <td style={{padding: '10px'}}>{ex.expense_type}</td> <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td> <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td> </tr> ))} </tbody> </table> <div style={{textAlign: 'right', marginTop: '20px'}}><h3>Total Due: ₹{totalDue}</h3></div> <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div> </div> </div> ); }
  
  if (reportMode === 'summary') { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Report</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary Report</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Total Due (₹)</th></tr></thead><tbody>{financialData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px'}}><td colSpan={4} style={{padding:'15px', textAlign:'right'}}>GRAND TOTAL:</td><td style={{padding:'15px', textAlign:'right'}}>₹{financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0)}</td></tr> </tbody></table> </div> </div> ); }

  if (reportMode === 'laundry') { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#007bff', color:'white'}}>🖨️ Print List</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Laundry Token List</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Laundry Token</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Dining Seat</th></tr></thead><tbody>{financialData.sort((a,b)=> (parseInt(a.laundry_token_no)||999)-(parseInt(b.laundry_token_no)||999)).map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px', fontWeight:'bold', fontSize:'16px'}}>{p.laundry_token_no || '-'}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td></tr>))}</tbody></table> </div> </div> ); }

  if (checkoutMode) {
      // VALUABLES CHECK-OUT MODE
      return (
          <div style={cardStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                  <h2 style={{color:'#d32f2f'}}>🔐 Valuables Check-Out Mode</h2>
                  <button onClick={()=>setCheckoutMode(false)} style={btnStyle(false)}>Exit Mode</button>
              </div>
              <div style={{background:'#fff5f5', padding:'20px', borderRadius:'10px', border:'2px solid #ffcdd2'}}>
                  <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- Select Student to Return Valuables --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no || '-'})</option>)} </select>
                  {currentStudent && (
                      <div style={{marginTop:'20px', padding:'20px', background:'white', borderRadius:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                          <h3 style={{marginTop:0}}>{currentStudent.full_name}</h3>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                              <div style={{padding:'15px', background:'#e3f2fd', borderRadius:'5px'}}><h4>Mobile Locker</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.mobile_locker_no || 'None'}</div></div>
                              <div style={{padding:'15px', background:'#fff3cd', borderRadius:'5px'}}><h4>Valuables Locker</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.valuables_locker_no || 'None'}</div></div>
                              <div style={{padding:'15px', background:'#e8f5e9', borderRadius:'5px'}}><h4>Room Key</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.room_no || 'None'}</div></div>
                          </div>
                          <button onClick={()=>{alert(`✅ Items Returned to ${currentStudent.full_name}`); setSelectedStudentId('');}} style={{...btnStyle(true), width:'100%', padding:'15px', fontSize:'18px', background:'#28a745'}}>CONFIRM ITEMS RETURNED</button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div style={cardStyle}>
      <h2>🛒 Store</h2>
      
      {/* MOVED TOOLS & REPORTS TO TOP */}
      <div style={{marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #eee'}}>
        <h3 style={{marginTop:0, color:'#555', fontSize:'16px'}}>Tools & Reports</h3>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} style={{...quickBtnStyle(!!selectedStudentId), background: selectedStudentId ? '#17a2b8' : '#e2e6ea', color: selectedStudentId ? 'white' : '#999', cursor: selectedStudentId ? 'pointer' : 'not-allowed'}}>🖨️ Print Invoice</button>
          <button onClick={loadFinancialReport} disabled={!courseId} style={{...quickBtnStyle(!!courseId), background: courseId ? '#28a745' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>💰 Course Summary</button>
          <button onClick={loadLaundryReport} disabled={!courseId} style={{...quickBtnStyle(!!courseId), background: courseId ? '#007bff' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>📋 Laundry List</button>
          <button onClick={() => setCheckoutMode(true)} disabled={!courseId} style={{...quickBtnStyle(!!courseId), background: courseId ? '#d32f2f' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}><LogOut size={14}/> Check-Out Valuables</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select>
        <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no || '-'})</option>)} </select>
        <div style={{background:'#f0f2f5', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}> <label style={{fontSize:'12px', color:'#666', fontWeight:'bold'}}>ASSIGNED LAUNDRY TOKEN:</label> <div style={{fontSize:'18px', fontWeight:'bold', color:'#007bff'}}>{studentToken || '-'}</div> </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}>
          <div><label>Item / Type</label><input list="expense-types" style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} required /><datalist id="expense-types"><option value="Laundry Token" /><option value="Medicine" /><option value="Store Item" /><option value="Donation" /></datalist></div>
          <div><label>Amount (₹)</label><input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        </div>
        <div style={{display:'flex', gap:'5px'}}> <button type="button" onClick={handleLaundryClick} style={quickBtnStyle(false)}>🧺 Laundry (50)</button> <button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={quickBtnStyle(false)}>🧼 Soap (30)</button> </div>
        <div style={{display:'flex', gap:'10px'}}> <button type="submit" style={{...btnStyle(true), flex:1, background: editingId ? '#ffc107' : '#28a745', color: editingId ? 'black' : 'white'}}> {editingId ? 'Update Record' : 'Save Record'} </button> {editingId && <button type="button" onClick={() => {setEditingId(null); setAmount(''); setExpenseType('Laundry Token');}} style={{...btnStyle(false), background:'#6c757d', color:'white'}}>Cancel</button>} </div> {status && <p>{status}</p>}
      </form>
      
      <div style={{marginTop:'20px'}}>
         <h4 style={{marginBottom:'10px'}}>Recent Transactions</h4>
         {history.length === 0 ? ( <p style={{color:'#888', fontSize:'13px'}}>No history found.</p> ) : ( <div style={{maxHeight:'200px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>S.N.</th><th>Item</th><th>Date</th><th>₹</th><th></th></tr></thead><tbody>{history.map((h, i) => (<tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'5px'}}>{i+1}</td><td style={{padding:'5px'}}>{h.expense_type}</td><td style={{padding:'5px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td><td style={{padding:'5px', fontWeight:'bold'}}>₹{h.amount}</td><td style={{textAlign:'right'}}><button onClick={()=>handleEditClick(h)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={()=>handleDeleteExpense(h.expense_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div> )}
      </div>
    </div>
  );
}
