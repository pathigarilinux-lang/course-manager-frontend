import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// YOUR BACKEND URL
const API_URL = "https://course-manager-backend-cd1m.onrender.com";

export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  // Reusable function to fetch course list
  const fetchCourses = () => {
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => {
        console.error(err);
        setError("Could not connect to backend. Check internet or refresh.");
      });
  };

  // Load courses when app starts
  useEffect(() => { fetchCourses(); }, []);

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* --- Main Navigation Bar --- */}
      <nav style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
        <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In Desk</button>
        <button onClick={() => setView('create-course')} style={btnStyle(view === 'create-course')}>➕ New Course</button>
        <button onClick={() => setView('upload')} style={btnStyle(view === 'upload')}>📂 Upload List</button>
      </nav>

      {/* Global Error Message */}
      {error && <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px', border: '1px solid #ffcdd2' }}>⚠️ {error}</div>}

      {/* --- View Routing --- */}
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'checkin' && <CheckInForm courses={courses} />}
      {view === 'create-course' && <CreateCourseForm refreshCourses={fetchCourses} setView={setView} />}
      {view === 'upload' && <UploadParticipants courses={courses} setView={setView} />}

    </div>
  );
}

// --- 1. SMART UPLOAD COMPONENT ---
function UploadParticipants({ courses, setView }) {
  const [courseId, setCourseId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState('');
  const [debugLines, setDebugLines] = useState([]); 
  const [showDebug, setShowDebug] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setStatus('');
    setPreview([]);
    setShowDebug(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      
      setDebugLines(lines.slice(0, 5));

      // 1. Find Header Row (Looks for "Name", "Student", or "Participant")
      let headerIndex = -1;
      let headers = [];

      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const rowLower = lines[i].toLowerCase();
        if (rowLower.includes('name') || rowLower.includes('student') || rowLower.includes('participant')) {
          headerIndex = i;
          const delimiter = lines[i].includes(';') ? ';' : ',';
          headers = lines[i].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
          break;
        }
      }

      if (headerIndex === -1) {
        setStatus("⚠️ Error: Could not find a header row with 'Name' or 'Student'.");
        setShowDebug(true); 
        return;
      }

      // 2. Map Columns
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('participant') || h.includes('student'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));

      if (nameIdx === -1) {
        setStatus("⚠️ Error: Found headers, but couldn't identify the Name column.");
        setShowDebug(true);
        return;
      }

      // 3. Parse Data
      const dataRows = lines.slice(headerIndex + 1);
      const delimiter = lines[headerIndex].includes(';') ? ';' : ',';

      const parsedData = dataRows.map(row => {
        // Regex handles commas inside quotes
        const cols = row.split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(c => c.trim().replace(/^"|"$/g, ''));
        
        if (cols.length <= nameIdx) return null;

        return { 
          name: cols[nameIdx], 
          phone: phoneIdx !== -1 ? cols[phoneIdx] : '', 
          email: emailIdx !== -1 ? cols[emailIdx] : '' 
        };
      }).filter(r => r && r.name && r.name.length > 1);

      setPreview(parsedData);
      setStatus(`✅ Ready! Found headers: Name=[${headers[nameIdx]}] Phone=[${phoneIdx !== -1 ? headers[phoneIdx] : 'None'}]. Loaded ${parsedData.length} students.`);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!courseId) return alert("Please select a course first.");
    if (preview.length === 0) return alert("No valid data found.");

    setStatus('Uploading...');
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: preview })
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      setStatus(`✅ Success! Added ${preview.length} students.`);
      setTimeout(() => setView('checkin'), 2000); 
    } catch (err) {
      setStatus("❌ Error: " + err.message);
      setShowDebug(true);
    }
  };

  return (
    <div style={cardStyle}>
      <h2>📂 Upload Student List</h2>
      <div style={{maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
        
        <div>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>1. Target Course:</label>
          <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required>
            <option value="">-- Select Course --</option>
            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
          </select>
        </div>

        <div>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>2. Choose File (CSV):</label>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>

        {status && <div style={{padding: '10px', background: status.includes('Success') || status.includes('Ready') ? '#d4edda' : '#fff3cd', borderRadius: '4px', fontWeight: 'bold', color: '#333'}}>{status}</div>}

        {/* Preview Box */}
        {preview.length > 0 && (
          <div>
            <p style={{margin:'0 0 5px 0', fontSize:'14px', color:'#666'}}><strong>Valid Data Preview (First 5):</strong></p>
            <div style={{maxHeight: '150px', overflowY: 'auto', background: '#f8f9fa', padding: '10px', border:'1px solid #ddd', borderRadius:'4px', fontSize: '13px'}}>
              {preview.slice(0, 5).map((s, i) => <div key={i} style={{padding:'2px 0', borderBottom:'1px solid #eee'}}><strong>{s.name}</strong> <span style={{color:'#888'}}>| {s.phone}</span></div>)}
            </div>
          </div>
        )}

        <button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length === 0} 
          style={{...btnStyle(preview.length > 0), width: '100%', background: preview.length > 0 ? '#28a745' : '#ccc', color: 'white'}}>
          Upload {preview.length > 0 ? `${preview.length} Students` : 'Data'}
        </button>

        {/* Toggle Debug Info */}
        <div style={{textAlign:'right'}}>
          <button onClick={() => setShowDebug(!showDebug)} style={{fontSize:'12px', background:'none', border:'none', color:'#007bff', cursor:'pointer', textDecoration:'underline'}}>
            {showDebug ? 'Hide Debug Info' : 'Show Troubleshooting Info'}
          </button>
        </div>

        {/* Conditional Debug Box */}
        {showDebug && debugLines.length > 0 && (
          <div style={{padding: '10px', background: '#333', color: '#0f0', borderRadius: '5px', fontSize: '11px', fontFamily: 'monospace'}}>
            <strong>RAW FILE (First 5 lines):</strong><br/>
            {debugLines.map((line, i) => <div key={i}>{i}: {line}</div>)}
          </div>
        )}

      </div>
    </div>
  );
}

// --- 2. DASHBOARD COMPONENT ---
function Dashboard({ courses }) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const statusData = [{ name: 'Arrived', value: 12 }, { name: 'Expected', value: 5 }];
  const COLORS = ['#0088FE', '#FFBB28'];
  return (
    <div>
      <h2 style={{marginBottom: '20px', color: '#333'}}>Summary Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{marginTop:0}}>Active Courses</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#007bff' }}>{safeCourses.length}</p>
          <ul style={{marginTop: '10px', paddingLeft: '20px', color: '#666'}}>
            {safeCourses.map(c => <li key={c.course_id}>{c.course_name}</li>)}
          </ul>
        </div>
        <div style={cardStyle}>
          <h3 style={{marginTop:0}}>Arrival Status</h3>
          <PieChart width={250} height={200}>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
              {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}

// --- 3. CREATE COURSE COMPONENT ---
function CreateCourseForm({ refreshCourses, setView }) {
  const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' });
  const [status, setStatus] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed");
      setStatus('✅ Course Created!');
      refreshCourses();
      setTimeout(() => setView('dashboard'), 1500);
    } catch (err) { setStatus('❌ Error: ' + err.message); }
  };
  return (
    <div style={cardStyle}>
      <h2>Create New Course</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
        <label>Course Name:</label><input style={inputStyle} required onChange={e => setFormData({...formData, courseName: e.target.value})} />
        <label>Teacher Name:</label><input style={inputStyle} required onChange={e => setFormData({...formData, teacherName: e.target.value})} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label>Start Date:</label><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
          <div><label>End Date:</label><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
        </div>
        <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize:'16px', cursor: 'pointer' }}>Create Course</button>
        {status && <p>{status}</p>}
      </form>
    </div>
  );
}

// --- 4. CHECK-IN COMPONENT ---
function CheckInForm({ courses }) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (formData.courseId) {
      fetch(`${API_URL}/courses/${formData.courseId}/participants`)
        .then(res => res.json())
        .then(data => Array.isArray(data) ? setParticipants(data) : setParticipants([]))
        .catch(console.error);
    }
  }, [formData.courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const res = await fetch(`${API_URL}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Error checking in");
      setStatus('✅ Check-In Successful!');
      setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '' }));
    } catch (err) { setStatus(`❌ Error: ${err.message}`); }
  };

  return (
    <div style={cardStyle}>
      <h2>Participant Check-In</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
        <label>Select Course:</label>
        <select name="courseId" onChange={e => setFormData({...formData, courseId: e.target.value})} style={inputStyle} required>
          <option value="">-- Select Course --</option>
          {safeCourses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
        </select>
        <label>Select Student:</label>
        <select name="participantId" onChange={e => setFormData({...formData, participantId: e.target.value})} value={formData.participantId} style={inputStyle} required disabled={!formData.courseId}>
          <option value="">-- Select Student --</option>
          {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label>Room No:</label><input name="roomNo" value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} style={inputStyle} required /></div>
          <div><label>Seat No:</label><input name="seatNo" value={formData.seatNo} onChange={e => setFormData({...formData, seatNo: e.target.value})} style={inputStyle} required /></div>
        </div>
        <label>Laundry Token:</label><input name="laundryToken" value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} style={inputStyle} />
        <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize:'16px', cursor: 'pointer' }}>Confirm Check-In</button>
        {status && <p style={{fontWeight:'bold', color: status.includes('Success') ? 'green' : 'red'}}>{status}</p>}
      </form>
    </div>
  );
}

// --- GLOBAL STYLES ---
const btnStyle = (isActive) => ({ 
  padding: '10px 20px', 
  border: 'none', 
  borderRadius: '5px', 
  cursor: 'pointer', 
  background: isActive ? '#007bff' : '#fff', 
  color: isActive ? 'white' : '#333',
  border: isActive ? 'none' : '1px solid #ddd',
  fontWeight: '500'
});

const cardStyle = { 
  background: 'white', 
  padding: '25px', 
  borderRadius: '12px', 
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
  marginBottom: '20px' 
};

const inputStyle = { 
  width: '100%', 
  padding: '10px', 
  borderRadius: '6px', 
  border: '1px solid #ccc',
  fontSize: '14px'
};
