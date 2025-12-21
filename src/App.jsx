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

// --- CONFIGURATION ---
const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 
const ADMIN_PASSCODE = "0000"; 
const GATEKEEPER_PASSCODE = "1111";
const TEACHER_PASSCODE = "2222";

const LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi", 
  "French", "German", "Spanish", "Russian", "Chinese", "Mandarin Chinese", 
  "Japanese", "Thai", "Burmese", "Sinhala", "Nepali", 
  "Portuguese", "Vietnamese"
];

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

// --- CONSTANTS ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W","344AW","344BW","345AW","345BW","346AW","346BW","347AW","347BW","348AW","348BW","349AW","349BW","350AW","350BW","351AW","351BW","352AW","352BW","353AW","353BW","354AW","354BW","355AW","355BW","356AW","356BW","357AW","357BW","358AW","358BW","359AW","359BW","360AW","360BW","361AW","361BW","362AW","362BW","363AW","363BW"]);

const getSmartShortName = (name) => {
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

// ------------------------------------------------------------------
// 🧩 MAIN APP COMPONENT
// ------------------------------------------------------------------
export default function App() {
  const [authLevel, setAuthLevel] = useState('none');
  const [pinInput, setPinInput] = useState('');
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
    if (pinInput === ADMIN_PASSCODE) { setAuthLevel('admin'); localStorage.setItem('auth_level', 'admin'); } 
    else if (pinInput === GATEKEEPER_PASSCODE) { setAuthLevel('gatekeeper'); localStorage.setItem('auth_level', 'gatekeeper'); setView('gate-panel'); } 
    else if (pinInput === TEACHER_PASSCODE) { setAuthLevel('teacher'); localStorage.setItem('auth_level', 'teacher'); setView('ta-panel'); } 
    else { alert('❌ Incorrect Passcode'); setPinInput(''); }
  };
  
  const handleLogout = () => { setAuthLevel('none'); localStorage.removeItem('auth_level'); setView('dashboard'); setPinInput(''); };
  
  const fetchCourses = () => { 
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => { console.error(err); setError("Connection Error"); });
  };
  
  const handleRoomClick = (roomNo) => { setPreSelectedRoom(roomNo); setView('onboarding'); };

  // --- COURSE ADMIN HANDLERS ---
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
    const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
    try {
        const payload = { courseName: courseName, teacherName: newCourseData.teacher || 'Goenka Ji', startDate: newCourseData.startDate, endDate: newCourseData.endDate };
        const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { alert(`✅ Course Created: ${courseName}`); fetchCourses(); setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' }); }
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
        if (lineLower.includes('name') && (lineLower.includes('gender') || lineLower.includes('age'))) { headerRowIndex = i; headers = splitRow(lines[i]).map(h => h.toLowerCase()); break; }
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
          for (let c of coursesData) { const resP = await fetch(`${API_URL}/courses/${c.course_id}/participants`); const pData = await resP.json(); allData.participants.push(...pData); }
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
          <div style={{marginBottom:'20px'}}><label style={labelStyle}>Select Target Course</label><select style={inputStyle} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}</select></div>
          <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'30px', textAlign:'center', background:'#f9f9f9', position:'relative'}}><input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} /><div style={{pointerEvents:'none'}}><Database size={40} color="#999" /><p style={{margin:'10px 0', color:'#555'}}>Click to upload .CSV file</p></div></div>
          {uploadStatus && <div style={{marginTop:'15px', padding:'10px', background:'#e6fffa', color:'#2c7a7b'}}>{uploadStatus.msg}</div>}
          {students.length > 0 && (
            <div style={{marginTop:'25px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}><h3 style={{margin:0}}>Preview ({students.length})</h3><button onClick={saveToDatabase} style={{...btnStyle(true), background:'#28a745', color:'white'}}><Save size={16}/> Save to Database</button></div>
               <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee'}}><table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}><thead style={{position:'sticky', top:0, background:'#f1f1f1'}}><tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr></thead><tbody>{students.map(s => (<tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue'}}>{s.conf_no}</td><td style={{padding:'8px'}}>{s.full_name}</td><td style={{padding:'8px'}}>{s.age}</td><td style={{padding:'8px'}}>{s.gender}</td><td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td></tr>))}</tbody></table></div>
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

  // --- UPDATED STUDENT FORM ---
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

    // Helpers
    const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
    const cleanNum = (val) => val ? String(val).trim() : '';

    // Effects
    useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); }, []);
    useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
    useEffect(() => { if (formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); }, [formData.courseId]);

    // Calculations
    const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
    const currentGender = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
    const isMale = currentGender.startsWith('m'); 
    const isFemale = currentGender.startsWith('f');
    let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
    if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
    else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');
    const allRecords = [...occupancy, ...participants].filter(p => String(p.participant_id) !== String(formData.participantId) && p.status !== 'Cancelled');
    const usedDining = new Set();
    const usedPagoda = new Set();
    allRecords.forEach(p => { if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); });

    const handleStudentChange = (e) => { 
        const selectedId = e.target.value; 
        const student = participants.find(p => p.participant_id == selectedId); 
        setSelectedStudent(student);
        setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); 
    };

    // UPDATED DINING HANDLER: No Sync to Mobile/Valuables, Auto-Type
    const handleDiningSeatChange = (val, type) => { 
        setFormData(prev => ({ ...prev, seatNo: val, seatType: type })); 
        setShowVisualDining(false);
    };

    const handlePagodaSelect = (val) => { setFormData(prev => ({ ...prev, pagodaCell: val })); setShowVisualPagoda(false); };
    const triggerPrint = () => { setShowReceipt(true); setTimeout(() => { window.print(); }, 500); };

    const VisualSelector = ({ title, options, occupied, selected, onSelect, onClose }) => (
      <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'80%', maxHeight:'80vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3>Select {title}</h3><button onClick={onClose}>Close</button></div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px'}}>
                  {options.map(opt => {
                      const isOcc = occupied.has(String(opt));
                      const isSel = String(selected) === String(opt);
                      return ( <button key={opt} type="button" onClick={() => !isOcc && onSelect(opt)} disabled={isOcc} style={{padding:'10px', borderRadius:'5px', border:'none', cursor: isOcc?'not-allowed':'pointer', background: isOcc ? '#ffcdd2' : isSel ? '#007bff' : '#c8e6c9', color: isSel?'white':'black', fontWeight:'bold'}}>{opt}</button> );
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
            const pData = { courseName: cleanName, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: selectedStudent?.full_name, confNo: formData.confNo, roomNo: formData.roomNo, seatNo: formData.seatNo, lockers: formData.mobileLocker, language: formData.language, pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null, special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null };
            setPrintData(pData);
            setShowReceipt(true);
            setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
            setSelectedStudent(null); clearRoom(); 
            fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); 
            fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
            setTimeout(() => setStatus(''), 5000);
        } catch (err) { setStatus(`❌ ${err.message}`); } 
    };

    return ( 
        <div style={cardStyle}> 
        <h2>📝 Student Onboarding</h2> 
        {status && <div style={{padding:'10px', background:'#d4edda', color:'#155724', borderRadius:'6px', textAlign:'center', marginBottom:'15px'}}>{status}</div>}
        <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> 
            <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> 
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}> 
                <div><label style={labelStyle}>1. Select Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> 
                <div><label style={labelStyle}>2. Select Student</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{participants.filter(p=>p.status!=='Attending').map(p => <option key={p.participant_id} value={p.participant_id}>{p.status === 'Gate Check-In' ? '⚠️ AT GATE: ' : ''}{p.full_name} ({p.conf_no||'No ID'})</option>)}</select></div> 
              </div>
              {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ ATTENTION:</strong> {selectedStudent.evening_food} {selectedStudent.medical_info}</div>)} 
            </div> 
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:'15px'}}> 
                <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} /></div> 
                <div><label style={labelStyle}>Age</label><input style={{...inputStyle, background:'#e9ecef'}} value={selectedStudent?.age || ''} disabled /></div>
                <div><label style={labelStyle}>Room</label><button type="button" onClick={() => setShowVisualRoom(true)} style={{...inputStyle, textAlign:'left', background: formData.roomNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.roomNo || "Select Room (Grid)"}</button></div> 
                <div><label style={labelStyle}>Dining</label><div style={{display:'flex', gap:'5px'}}><select style={{...inputStyle, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select><button type="button" onClick={() => setShowVisualDining(true)} style={{...inputStyle, textAlign:'left', background: formData.seatNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.seatNo || "--"}</button></div></div> 
            </div> 
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
                <div><label style={labelStyle}>Mobile</label><input style={{...inputStyle}} value={formData.mobileLocker} onChange={e=>setFormData({...formData, mobileLocker:e.target.value})} /></div> 
                <div><label style={labelStyle}>Valuables</label><input style={{...inputStyle}} value={formData.valuablesLocker} onChange={e=>setFormData({...formData, valuablesLocker:e.target.value})} /></div> 
                <div><label style={labelStyle}>Laundry</label><input style={{...inputStyle}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div> 
                <div><label style={labelStyle}>Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> 
            </div> 
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
                <div><label style={labelStyle}>Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div> 
                <div><label style={labelStyle}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...inputStyle, textAlign:'left', background: formData.pagodaCell ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.pagodaCell || "Select Cell"}</button></div>
                <div><label style={labelStyle}>DS Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} /></div>
                <div><label style={labelStyle}>Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> 
            </div> 
            <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}><button type="button" onClick={triggerPrint} disabled={!selectedStudent} style={{padding:'12px 20px', background:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>🖨️ Reprint</button><button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Confirm & Save</button></div> 
        </form> 
        {showVisualDining && <DiningLayout gender={isMale ? 'Male' : 'Female'} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
        {showVisualPagoda && <PagodaLayout gender={isMale ? 'Male' : 'Female'} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
        {showVisualRoom && <VisualSelector title="Room" options={availableRooms.map(r=>r.room_no)} occupied={occupiedRoomsSet} selected={formData.roomNo} onSelect={(val)=>{setFormData({...formData, roomNo:val}); setShowVisualRoom(false)}} onClose={()=>setShowVisualRoom(false)} />}
        {showReceipt && printData && (
            <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}>
                    <button onClick={() => setShowReceipt(false)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button>
                    <div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}>
                        <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div>
                        <div style={{fontSize:'12px', marginBottom:'10px'}}><div><strong>Course:</strong> {printData.courseName}</div><div><strong>Teacher:</strong> {printData.teacherName}</div><div><strong>Dates:</strong> {printData.from} to {printData.to}</div></div><div style={{borderBottom:'1px solid black', margin:'10px 0'}}></div>
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

  // --- SUB COMPONENTS (RESTORED FROM ORIGINAL) ---
  function GatekeeperPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    useEffect(() => { if (courses.length > 0) setCourseId(courses[0].course_id); }, [courses]);
    useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
    const handleGateCheckIn = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as ARRIVED at Gate?`)) return;
        try { await fetch(`${API_URL}/gate-checkin`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const data = await res.json(); setParticipants(data); } catch (err) { alert("Error"); }
    };
    const handleGateCancel = async (p) => {
        if (!window.confirm(`Mark ${p.full_name} as CANCELLED?`)) return;
        try { await fetch(`${API_URL}/gate-cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ participantId: p.participant_id }) }); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); const data = await res.json(); setParticipants(data); } catch (err) { alert("Error"); }
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
                <h3 style={{margin:'0 0 10px 0', fontSize:'16px'}}>Gate Dashboard</h3>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #28a745'}}><div>Checked In</div><div style={{fontSize:'20px', fontWeight:'bold', color:'green'}}>{arrived.length}</div></div>
                    <div style={{background:'white', padding:'10px', borderRadius:'6px', flex:1, textAlign:'center', border:'1px solid #dc3545'}}><div>Pending</div><div style={{fontSize:'20px', fontWeight:'bold', color:'red'}}>{pending.length}</div></div>
                </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><select style={{...inputStyle, flex:1}} value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><button onClick={()=>setShowHistory(!showHistory)} style={{...btnStyle(showHistory), flexShrink:0}}>{showHistory ? <EyeOff size={16}/> : <History size={16}/>} {showHistory ? 'Hide Arrived' : 'View History'}</button></div>
            <div style={{marginBottom:'20px'}}><input style={{...inputStyle, padding:'15px', fontSize:'18px'}} placeholder="🔍 Search Name or Conf No..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus /></div>
            <div style={{height:'400px', overflowY:'auto'}}>
                {filtered.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px'}}>No pending students found.</div> : filtered.map(p => (
                    <div key={p.participant_id} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div><div style={{fontWeight:'bold', fontSize:'16px'}}>{p.full_name}</div><div style={{color:'#666', fontSize:'14px'}}>{p.conf_no} | Age: {p.age}</div></div>
                        {p.status !== 'Attending' && p.status !== 'Gate Check-In' && p.status !== 'Cancelled' && (<div style={{display:'flex', gap:'10px'}}><button onClick={()=>handleGateCheckIn(p)} style={{...btnStyle(true), background:'#007bff', color:'white', padding:'10px 20px'}}>Mark Arrived</button><button onClick={()=>handleGateCancel(p)} style={{...btnStyle(true), background:'#dc3545', color:'white', padding:'10px'}}>Cancel</button></div>)}
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
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0, color:'#333'}}>Zero Day Dashboard v2.0</h2><select style={{padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px', minWidth:'200px'}} onChange={e=>setSelectedCourse(e.target.value)} value={selectedCourse || ''}>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
        {stats && selectedCourse ? (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginBottom:'30px'}}>
             <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid #6c757d`}}><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.attending + stats.gate_checkin + stats.no_response}</div><div style={{marginLeft:'10px'}}>Expected</div></div>
             <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid #ff9800`}}><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.gate_checkin}</div><div style={{marginLeft:'10px'}}>At Gate</div></div>
             <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid #28a745`}}><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.attending}</div><div style={{marginLeft:'10px'}}>Onboarded</div></div>
             <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', borderLeft:`5px solid #dc3545`}}><div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.no_response}</div><div style={{marginLeft:'10px'}}>Pending</div></div>
          </div>
        ) : <p style={{padding:'40px', textAlign:'center', color:'#888'}}>Select a course.</p>}
      </div>
    );
  }

  function GlobalAccommodationManager({ courses, onRoomClick }) {
    const [rooms, setRooms] = useState([]);
    const [occupancy, setOccupancy] = useState([]); 
    const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
    const loadData = () => { fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); };
    useEffect(loadData, []);
    const handleAddRoom = async () => { if (!newRoom.roomNo) return alert("Enter Room Number"); await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) }); loadData(); setNewRoom({ ...newRoom, roomNo: '' }); };
    const handleDeleteRoom = async (id, name) => { if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Room ${name} is protected.`); return; } if(window.confirm(`Delete room ${name}?`)) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } };
    return ( 
      <div style={cardStyle}> 
        <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}> <h2 style={{margin:0}}>🛏️ Global Accommodation</h2> <div style={{display:'flex', gap:'5px', background:'#f9f9f9', padding:'5px', borderRadius:'5px'}}> <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> <select style={{...inputStyle, width:'80px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> <button onClick={handleAddRoom} style={{...toolBtn('#007bff')}}>+ Add</button> </div> <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> </div> 
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}> {rooms.map(r => (<div key={r.room_id} onClick={()=>onRoomClick(r.room_no)} style={{border:'1px solid #ccc', padding:'5px', borderRadius:'4px', cursor:'pointer', textAlign:'center', background: occupancy.find(o=>o.room_no===r.room_no)?'#ffebee':'white'}}>{r.room_no}</div>))} </div>
      </div> 
    );
  }

  function ATPanel({ courses }) {
    const [courseId, setCourseId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStudent, setEditingStudent] = useState(null);
    useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
    const handleSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p)); setEditingStudent(null); };
    const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2>AT Panel</h2></div>
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} /></div>
        {courseId && (<div style={{maxHeight:'500px', overflowY:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}><th style={{padding:'10px'}}>Name</th><th style={{padding:'10px'}}>Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th></tr></thead><tbody>{filtered.map((p) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px'}}><strong>{p.full_name}</strong></td><td style={{padding:'10px'}}>{p.evening_food || '-'}</td><td style={{padding:'10px'}}>{p.medical_info || '-'}</td><td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={{...toolBtn('#007bff'), padding:'5px 10px'}}>✏️ Detail</button></td></tr>))}</tbody></table></div>)}
        {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Update: {editingStudent.full_name}</h3><form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}><div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => setEditingStudent({...editingStudent, evening_food: e.target.value})}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select></div><div><label style={labelStyle}>Medical</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => setEditingStudent({...editingStudent, medical_info: e.target.value})} /></div><div style={{textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false)}}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save</button></div></form></div></div>)}
      </div>
    );
  }

  function ParticipantList({ courses, refreshCourses }) {
    const [courseId, setCourseId] = useState(''); 
    const [participants, setParticipants] = useState([]);
    useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
    return (
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}><select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
        <div style={{overflowX:'auto', border:'1px solid #eee', borderRadius:'8px'}}><table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}><thead><tr style={{background:'#f8f9fa', textAlign:'left'}}>{['FULL_NAME','CONF_NO','ROOM_NO','DINING_SEAT_NO','STATUS'].map(k=><th key={k} style={{...tdStyle, fontWeight:'bold', borderBottom:'2px solid #ddd'}}>{k.replace(/_/g,' ')}</th>)}</tr></thead><tbody>{participants.map((p, i) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={{...tdStyle, fontWeight:'bold'}}>{p.full_name}</td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.status}</td></tr>))}</tbody></table></div>
      </div>
    );
  }

  function ExpenseTracker({ courses }) {
    const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [amount, setAmount] = useState(''); const [expenseType, setExpenseType] = useState('Store Item');
    useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
    const handleSubmit = async (e) => { e.preventDefault(); await fetch(`${API_URL}/expenses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ courseId, participantId: selectedStudentId, type: expenseType, amount }) }); alert('Saved'); setAmount(''); };
    return (
      <div style={cardStyle}>
        <h2>🛒 Store</h2>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select>
          <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)} </select>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}><div><label>Item</label><input style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} /></div><div><label>Amount (₹)</label><input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required /></div></div>
          <button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save Record</button>
        </form>
      </div>
    );
  }

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
          {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
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
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0}}>🚧 Gate Check-In</h2><button onClick={handleLogout} style={{...btnStyle(false), background:'#dc3545', color:'white'}}>Logout</button></div>
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
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0}}>🧘 AT Panel</h2><button onClick={handleLogout} style={{...btnStyle(false), background:'#dc3545', color:'white'}}>Logout</button></div>
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
