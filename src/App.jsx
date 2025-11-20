import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    setView('dashboard');
  };

  const fetchCourses = () => {
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => { console.error(err); setError("Connection Error: Could not load courses."); });
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
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Onboarding Form</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store & Finance</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'onboarding' && <OnboardingForm courses={courses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- 1. DASHBOARD ---
function Dashboard({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0].course_id); }, [courses]);

  useEffect(() => {
    if (selectedCourse) {
      fetch(`${API_URL}/courses/${selectedCourse}/stats`)
        .then(res => res.json())
        .then(data => setStats({ 
          arrived: parseInt(data.arrived || 0), 
          no_response: parseInt(data.no_response || 0), 
          cancelled: parseInt(data.cancelled || 0),
          old_students: parseInt(data.old_students || 0),
          new_students: parseInt(data.new_students || 0),
          servers: parseInt(data.servers || 0)
        }))
        .catch(console.error);
    }
  }, [selectedCourse]);

  const arrivalData = stats ? [ { name: 'Arrived', count: stats.arrived }, { name: 'Pending', count: stats.no_response }, { name: 'Cancelled', count: stats.cancelled } ] : [];
  const typeData = stats ? [ { name: 'Old Students', value: stats.old_students, color: '#8884d8' }, { name: 'New Students', value: stats.new_students, color: '#82ca9d' }, { name: 'Servers (DS)', value: stats.servers, color: '#ffc658' } ] : [];

  return (
    <div>
      <h2 style={{marginBottom: '20px', color: '#333'}}>Summary Dashboard</h2>
      {courses.length === 0 ? <p>No courses.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {courses.map(c => {
             const isSelected = selectedCourse == c.course_id;
             return (
              <div key={c.course_id} onClick={() => setSelectedCourse(c.course_id)} style={{...cardStyle, cursor:'pointer', border: isSelected ? '2px solid #007bff' : '1px solid transparent', background: isSelected ? '#f0f8ff' : 'white'}}>
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
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', animation: 'fadeIn 0.5s' }}>
          <div style={cardStyle}>
            <h3 style={{marginTop:0}}>Status Overview</h3>
            <div style={{height:'250px', width:'100%'}}><ResponsiveContainer width="100%" height="100%"><BarChart data={arrivalData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="count" fill="#0088FE" barSize={50} /></BarChart></ResponsiveContainer></div>
          </div>
          <div style={cardStyle}>
            <h3 style={{marginTop:0}}>Applicant Types</h3>
            <div style={{height:'250px', width:'100%'}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>{typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </div>
          <div style={cardStyle}>
             <h3 style={{marginTop:0}}>Live Counts</h3>
             <div style={{display:'grid', gap:'10px'}}>
               <div style={{padding:'10px', background:'#e8eaf6', borderRadius:'5px'}}>Old Students (OM/OF): <strong>{stats.old_students}</strong></div>
               <div style={{padding:'10px', background:'#e0f2f1', borderRadius:'5px'}}>New Students (NM/NF): <strong>{stats.new_students}</strong></div>
               <div style={{padding:'10px', background:'#fff8e1', borderRadius:'5px'}}>Servers (SM/SF): <strong>{stats.servers}</strong></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. ONBOARDING FORM ---
function OnboardingForm({ courses }) {
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({ 
    courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', 
    mobileLocker: '', valuablesLocker: '', language: 'English', 
    pagodaCell: '', laptop: '', confNo: '', dhammaSeat: '', 
    specialSeating: '', seatType: 'F' 
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (formData.courseId) {
      fetch(`${API_URL}/courses/${formData.courseId}/participants`)
        .then(res => res.json())
        .then(data => setParticipants(Array.isArray(data) ? data : []));
    }
  }, [formData.courseId]);

  const studentsPending = participants.filter(p => p.status !== 'Arrived');

  const handleStudentChange = (e) => {
    const selectedId = e.target.value;
    const student = participants.find(p => p.participant_id == selectedId);
    setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    const finalSeatNo = formData.seatType && formData.seatNo ? `${formData.seatType}-${formData.seatNo}` : formData.seatNo;
    const payload = { ...formData, seatNo: finalSeatNo };

    try {
      const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setStatus('✅ Success!');
      setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: '', confNo: '', dhammaSeat: '', specialSeating: '', seatType: 'F' }));
      fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(data));
    } catch (err) { setStatus(`❌ ${err.message}`); }
  };

  return (
    <div style={cardStyle}>
      <h2>📝 Onboarding Form</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '900px' }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
          <div><label style={labelStyle}>Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
          <div><label style={labelStyle}>Student (Pending)</label><select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId}><option value="">-- Select --</option>{studentsPending.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div>
        </div>
        <hr style={{border:'0', borderTop:'1px solid #eee'}} />
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'10px'}}>
          <div><label style={labelStyle}>Conf No</label><input style={{...inputStyle, background:'#f9f9f9'}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} placeholder="Auto-fills" /></div>
          <div style={{gridColumn: 'span 2', display:'flex', gap:'5px'}}>
             <div style={{flex:1}}><label style={labelStyle}>Type</label><select style={inputStyle} value={formData.seatType} onChange={e => setFormData({...formData, seatType: e.target.value})}><option value="F">Floor</option><option value="C">Chair</option></select></div>
             <div style={{flex:2}}><label style={labelStyle}>Seat No</label><input style={inputStyle} value={formData.seatNo} onChange={e => setFormData({...formData, seatNo: e.target.value})} required /></div>
          </div>
          <div><label style={labelStyle}>Dhamma Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} placeholder="or NA" /></div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
          <div><label style={labelStyle}>Room No</label><input style={inputStyle} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required /></div>
          <div><label style={labelStyle}>Mob Locker</label><input style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})} placeholder="or NA" /></div>
          <div><label style={labelStyle}>Val Locker</label><input style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})} placeholder="or NA" /></div>
          <div><label style={labelStyle}>Laundry Tk</label><input style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} placeholder="or NA" /></div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
           <div><label style={labelStyle}>Laptop</label><input style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})} placeholder="Details/NA" /></div>
           <div><label style={labelStyle}>Pagoda</label><input style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})} placeholder="or NA" /></div>
           <div><label style={labelStyle}>Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>BackRest</option></select></div>
           <div><label style={labelStyle}>Language</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Malayalam</option><option>Gujarati</option><option>Odia</option><option>Bengali</option><option>Mandarin Chinese</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>Russian</option><option>German</option><option>Vietnamese</option><option>Thai</option><option>Japanese</option></select></div>
        </div>
        <button type="submit" style={{...btnStyle(true), background:'#007bff', color:'white', padding:'15px', marginTop:'10px'}}>Confirm Onboarding</button> {status && <p style={{ fontWeight: 'bold', color: status.includes('Success') ? 'green' : 'red', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// --- 3. COURSE ADMIN ---
function CourseAdmin({ courses, refreshCourses, setView }) {
  const [activeTab, setActiveTab] = useState('create');
  return (
    <div style={cardStyle}>
      <div style={{display:'flex', borderBottom:'1px solid #ddd', marginBottom:'20px'}}>
        <button onClick={()=>setActiveTab('create')} style={{padding:'10px 20px', background: activeTab==='create'?'#eee':'white', border:'none', borderBottom: activeTab==='create'?'2px solid #007bff':'none', cursor:'pointer'}}>➕ Create New Course</button>
        <button onClick={()=>setActiveTab('upload')} style={{padding:'10px 20px', background: activeTab==='upload'?'#eee':'white', border:'none', borderBottom: activeTab==='upload'?'2px solid #007bff':'none', cursor:'pointer'}}>📂 Upload Student Data</button>
      </div>
      {activeTab === 'create' ? <CreateCourseForm refreshCourses={refreshCourses} setView={setView} /> : <UploadParticipants courses={courses} setView={setView} />}
    </div>
  );
}
function CreateCourseForm({ refreshCourses, setView }) { 
  const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' }); const [status, setStatus] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Failed"); setStatus('✅ Created!'); refreshCourses(); setTimeout(() => setView('dashboard'), 1500); } catch (err) { setStatus('❌ ' + err.message); } };
  return ( <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}> <h3>Course Details</h3> <input style={inputStyle} placeholder="Course Name" required onChange={e => setFormData({...formData, courseName: e.target.value})} /><input style={inputStyle} placeholder="Teacher Name" required onChange={e => setFormData({...formData, teacherName: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>{status && <p>{status}</p>}</form> );
}
function UploadParticipants({ courses, setView }) { 
  const [courseId, setCourseId] = useState(''); const [csvFile, setCsvFile] = useState(null); const [preview, setPreview] = useState([]); const [status, setStatus] = useState(''); 
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; setCsvFile(file); setStatus(''); setPreview([]); const reader = new FileReader(); reader.onload = (event) => { const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); let headerIndex = -1; let headers = []; for (let i = 0; i < Math.min(lines.length, 20); i++) { if (lines[i].toLowerCase().includes('name')) { headerIndex = i; headers = lines[i].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); break; } } if (headerIndex === -1) { setStatus("⚠️ Error: No header found."); return; } const nameIdx = headers.findIndex(h => h.includes('name')); const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile')); const emailIdx = headers.findIndex(h => h.includes('email')); const ageIdx = headers.findIndex(h => h === 'age'); const genderIdx = headers.findIndex(h => h === 'gender'); const coursesIdx = headers.findIndex(h => h.includes('courses')); const confIdx = headers.findIndex(h => h.includes('conf')); const dataRows = lines.slice(headerIndex + 1); const parsedData = dataRows.map(row => { const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length <= nameIdx) return null; return { name: cols[nameIdx], phone: phoneIdx!==-1?cols[phoneIdx]:'', email: emailIdx!==-1?cols[emailIdx]:'', age: ageIdx!==-1?cols[ageIdx]:'', gender: genderIdx!==-1?cols[genderIdx]:'', courses: coursesIdx!==-1?cols[coursesIdx]:'', confNo: confIdx!==-1?cols[confIdx]:'' }; }).filter(r => r && r.name); setPreview(parsedData); setStatus(`✅ Ready! Found ${parsedData.length} students.`); }; reader.readAsText(file); };
  const handleUpload = async () => { if (!courseId) return alert("Select course"); setStatus('Uploading...'); try { const res = await fetch(`${API_URL}/courses/${courseId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) }); if (!res.ok) throw new Error("Failed"); setStatus(`✅ Added ${preview.length} students.`); setTimeout(() => setView('onboarding'), 2000); } catch (err) { setStatus("❌ " + err.message); } };
  return ( <div><h3>Upload CSV</h3><div style={{maxWidth:'500px'}}><div style={{marginBottom:'10px'}}><label>Select Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div><div style={{marginBottom:'10px'}}><input type="file" accept=".csv" onChange={handleFileChange} /></div>{status && <div style={{padding:'10px', background:'#e3f2fd', borderRadius:'4px', marginBottom:'10px'}}>{status}</div>}<button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc'}}>Upload</button></div></div> );
}

// --- 4. MANAGE STUDENTS (Smart Seating + Dining) ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [search, setSearch] = useState(''); const [editingStudent, setEditingStudent] = useState(null); const [viewMode, setViewMode] = useState('list');
  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);
  const handleDelete = async (id) => { if (window.confirm("Delete?")) { await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' }); loadStudents(); } };
  const handleEditSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); loadStudents(); };
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || 'Course';
  const getCategoryRank = (confNo) => { if (!confNo) return 2; const s = confNo.toUpperCase(); if (s.startsWith('OM') || s.startsWith('OF') || s.startsWith('SM') || s.startsWith('SF')) return 1; return 2; };
  const getSeniorityScore = (p) => { 
    const str = p.courses_info || ""; 
    const s = str.match(/S:\s*(\d+)/); const l = str.match(/L:\s*(\d+)/); 
    const sVal = s ? parseInt(s[1]) : 0; const lVal = l ? parseInt(l[1]) : 0;
    return (lVal * 10000) + (sVal * 10); 
  };

  if (viewMode === 'dining') {
    const sorted = [...participants].sort((a,b) => {
      const rankA = getCategoryRank(a.conf_no); const rankB = getCategoryRank(b.conf_no);
      if (rankA !== rankB) return rankA - rankB;
      return (a.dining_seat_no || 'Z').localeCompare(b.dining_seat_no || 'Z');
    });
    return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print</button></div><div style={{textAlign:'center'}}><h1>Dining Seating Chart</h1><h3>{selectedCourseName}</h3></div><table style={{width:'100%', borderCollapse:'collapse', fontSize:'16px'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Seat</th><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Pagoda</th><th style={thPrint}>Lang</th></tr></thead><tbody>{sorted.filter(p=>p.status==='Arrived').map(p=>(<tr key={p.participant_id} style={{borderBottom:'1px solid #ddd'}}><td style={{padding:'12px', fontWeight:'bold'}}>{p.dining_seat_no}</td><td style={{padding:'12px'}}>{p.conf_no}</td><td style={{padding:'12px'}}>{p.full_name}</td><td style={{padding:'12px'}}>{p.room_no}</td><td style={{padding:'12px'}}>{p.pagoda_cell_no}</td><td style={{padding:'12px'}}>{p.discourse_language}</td></tr>))}</tbody></table></div> );
  }

  if (viewMode === 'seating') {
    const males = participants.filter(p => p.gender && p.gender.toLowerCase() === 'male').sort((a, b) => getSeniorityScore(b) - getSeniorityScore(a));
    const females = participants.filter(p => p.gender && p.gender.toLowerCase() === 'female').sort((a, b) => getSeniorityScore(b) - getSeniorityScore(a));
    const SeatCard = ({ p, rank }) => (<div style={{border:'1px solid #ccc', padding:'8px', background:'white', borderRadius:'4px', fontSize:'12px', marginBottom:'5px'}}><div style={{fontWeight:'bold', color:'#007bff'}}>{rank}. {p.full_name}</div><div>{p.conf_no || '-'} <span style={{color:'#888'}}>| {p.courses_info || 'New'}</span></div><div style={{marginTop:'2px'}}>Seat: <strong>{p.dhamma_hall_seat_no || '__'}</strong></div></div>);
    return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={() => setViewMode('list')} style={btnStyle(false)}>← Back</button><button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Layout</button></div><div style={{textAlign:'center', marginBottom:'20px'}}><h1>Dhamma Hall Seating Plan</h1><h3>{selectedCourseName}</h3></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px'}}><div><h3 style={{background:'#e3f2fd', padding:'10px', textAlign:'center'}}>MALE SIDE ({males.length})</h3>{males.map((p, i) => <SeatCard key={p.participant_id} p={p} rank={i+1} />)}</div><div><h3 style={{background:'#fce4ec', padding:'10px', textAlign:'center'}}>FEMALE SIDE ({females.length})</h3>{females.map((p, i) => <SeatCard key={p.participant_id} p={p} rank={i+1} />)}</div></div></div> );
  }

  return ( <div style={cardStyle}> <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px'}}><div style={{display:'flex', gap:'10px'}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} /></div><div style={{display:'flex', gap:'5px'}}><button onClick={() => setViewMode('dining')} disabled={!courseId} style={quickBtnStyle(true)}>🍽️ Dining Sheet</button><button onClick={() => setViewMode('seating')} disabled={!courseId} style={quickBtnStyle(true)}>🧘 Dhamma Plan</button></div></div>
  <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}><th style={tdStyle}>Name</th><th style={tdStyle}>Conf</th><th style={tdStyle}>Dining</th><th style={tdStyle}>Dhamma</th><th style={tdStyle}>Room</th><th style={tdStyle}>Pagoda</th><th style={tdStyle}>Lang</th><th style={tdStyle}>Actions</th></tr></thead><tbody>{filtered.map(p => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.conf_no}</td><td style={tdStyle}>{p.dining_seat_no}</td><td style={tdStyle}>{p.dhamma_hall_seat_no}</td><td style={tdStyle}>{p.room_no}</td><td style={tdStyle}>{p.pagoda_cell_no}</td><td style={tdStyle}>{p.discourse_language}</td><td style={tdStyle}><button onClick={() => setEditingStudent(p)} style={{marginRight:'5px'}}>✏️</button><button onClick={() => handleDelete(p.participant_id)} style={{color:'red'}}>🗑️</button></td></tr>))}</tbody></table></div>
  {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Edit Student</h3><form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}><label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input value={editingStudent.room_no||''} onChange={e=>setEditingStudent({...editingStudent, room_no:e.target.value})} placeholder="Room"/><input value={editingStudent.dining_seat_no||''} onChange={e=>setEditingStudent({...editingStudent, dining_seat_no:e.target.value})} placeholder="Dining"/></div><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input value={editingStudent.pagoda_cell_no||''} onChange={e=>setEditingStudent({...editingStudent, pagoda_cell_no:e.target.value})} placeholder="Pagoda"/><input value={editingStudent.discourse_language||''} onChange={e=>setEditingStudent({...editingStudent, discourse_language:e.target.value})} placeholder="Lang"/></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white', marginTop:'15px'}}>Save Changes</button><button type="button" onClick={()=>setEditingStudent(null)} style={{...btnStyle(false), marginTop:'5px'}}>Cancel</button></form></div></div>)}</div> );
}

// --- 5. STORE & FINANCE ---
function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [studentToken, setStudentToken] = useState(''); const [expenseType, setExpenseType] = useState('Laundry Token'); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [status, setStatus] = useState(''); const [showInvoice, setShowInvoice] = useState(false); const [reportMode, setReportMode] = useState(''); const [financialData, setFinancialData] = useState([]); const [editingId, setEditingId] = useState(null);
  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(console.error); }, [courseId]);
  useEffect(() => { if (selectedStudentId) { const student = participants.find(p => p.participant_id == selectedStudentId); setStudentToken(student ? student.laundry_token_no : ''); fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error); } else { setHistory([]); setStudentToken(''); } }, [selectedStudentId]);
  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); };
  const handleLaundryClick = () => { const label = studentToken ? `Laundry Token ${studentToken}` : `Laundry Token`; setExpenseType(label); setAmount('50'); };
  const handleEditClick = (item) => { setEditingId(item.expense_id); setExpenseType(item.expense_type); setAmount(item.amount); setStatus('✏️ Editing Mode...'); };
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`; const method = editingId ? 'PUT' : 'POST'; const body = editingId ? { expense_type: expenseType, amount } : { courseId, participantId: selectedStudentId, type: expenseType, amount }; try { const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed"); setStatus(editingId ? '✅ Updated!' : '✅ Saved!'); setAmount(''); setEditingId(null); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); } catch (err) { setStatus('❌ Error'); } };
  const handleDeleteExpense = async (id) => { if (!window.confirm("Delete this expense?")) return; await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); };
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0); const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || ''; const currentStudent = participants.find(p => p.participant_id == selectedStudentId);

  if (reportMode === 'invoice' && currentStudent) { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Invoice</button> </div> <div className="print-area" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px'}}> <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}> <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div> <div style={{textAlign: 'right'}}><h3>{currentStudent.full_name}</h3><p>Room: {currentStudent.room_no}</p><p>{selectedCourseName}</p></div> </div> <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}> <thead><tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}><th style={{textAlign: 'left', padding: '10px'}}>Description</th><th style={{textAlign: 'left', padding: '10px'}}>Date</th><th style={{textAlign: 'right', padding: '10px'}}>Amount</th></tr></thead> <tbody> {history.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}> <td style={{padding: '10px'}}>{ex.expense_type}</td> <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td> <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td> </tr> ))} </tbody> </table> <div style={{textAlign: 'right', marginTop: '20px'}}><h3>Total Due: ₹{totalDue}</h3></div> <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div> </div> </div> ); }
  if (reportMode === 'summary') { return ( <div style={cardStyle}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={btnStyle(false)}>← Back</button> <button onClick={() => window.print()} style={{...btnStyle(true), background:'#28a745', color:'white'}}>🖨️ Print Report</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Total Due (₹)</th></tr></thead><tbody>{financialData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px'}}><td colSpan={3} style={{padding:'15px', textAlign:'right'}}>GRAND TOTAL:</td><td style={{padding:'15px', textAlign:'right'}}>₹{financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0)}</td></tr> </tbody></table> </div> </div> ); }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      <div style={cardStyle}>
        <h2>{editingId ? '✏️ Edit Expense' : '🛒 Record Expense'}</h2>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select>
          <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} (Room: {p.room_no||'-'})</option>)} </select>
          <div style={{background:'#f0f2f5', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}> <label style={{fontSize:'12px', color:'#666', fontWeight:'bold'}}>ASSIGNED LAUNDRY TOKEN:</label> <div style={{fontSize:'18px', fontWeight:'bold', color:'#007bff'}}>{studentToken || '-'}</div> </div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}>
            <div><label>Item / Type</label><input list="expense-types" style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} required /><datalist id="expense-types"><option value="Laundry Token" /><option value="Medicine" /><option value="Store Item" /><option value="Donation" /></datalist></div>
            <div><label>Amount (₹)</label><input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required /></div>
          </div>
          <div style={{display:'flex', gap:'5px'}}><button type="button" onClick={handleLaundryClick} style={quickBtnStyle(false)}>🧺 Laundry (50)</button><button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={quickBtnStyle(false)}>🧼 Soap (30)</button></div>
          <div style={{display:'flex', gap:'10px'}}><button type="submit" style={{...btnStyle(true), flex:1, background: editingId ? '#ffc107' : '#28a745', color: editingId ? 'black' : 'white'}}> {editingId ? 'Update Record' : 'Save Record'} </button>{editingId && <button type="button" onClick={() => {setEditingId(null); setAmount(''); setExpenseType('Laundry Token');}} style={{...btnStyle(false), background:'#6c757d', color:'white'}}>Cancel</button>}</div> {status && <p>{status}</p>}
        </form>
      </div>
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #eee', paddingBottom:'10px', marginBottom:'10px'}}>
          <h3 style={{margin:0}}>History</h3>
          <div style={{display:'flex', gap:'5px'}}> {selectedStudentId && <button onClick={() => setReportMode('invoice')} style={quickBtnStyle(true)}>🖨️ Invoice</button>} {courseId && <button onClick={loadFinancialReport} style={quickBtnStyle(true)}>💰 Summary</button>} </div>
        </div>
        {history.length === 0 ? ( <p style={{color:'#888'}}>No expenses recorded.</p> ) : ( <div style={{maxHeight:'300px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'14px', borderCollapse:'collapse'}}><thead><tr style={{background:'#f9f9f9', textAlign:'left'}}><th>Item</th><th>Date</th><th>₹</th><th></th></tr></thead><tbody>{history.map(h => (<tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px'}}>{h.expense_type}</td><td style={{padding:'8px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td><td style={{padding:'8px', fontWeight:'bold'}}>₹{h.amount}</td><td style={{padding:'8px', textAlign:'right'}}><button onClick={()=>handleEditClick(h)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={()=>handleDeleteExpense(h.expense_id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table><div style={{textAlign:'right', marginTop:'10px', fontSize:'16px', fontWeight:'bold', color:'#2e7d32'}}>Total Due: ₹{totalDue}</div></div> )}
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
