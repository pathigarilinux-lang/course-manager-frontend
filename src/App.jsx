import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// YOUR BACKEND URL
const API_URL = "https://course-manager-backend-cd1m.onrender.com";

export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  // Fetch courses function (reusable)
  const fetchCourses = () => {
    fetch(`${API_URL}/courses`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
          setError('');
        } else {
          setCourses([]);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Backend sleeping or disconnected.");
      });
  };

  // Load on start
  useEffect(() => { fetchCourses(); }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      
      {/* Navigation */}
      <nav style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
        <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In Desk</button>
        <button onClick={() => setView('create-course')} style={btnStyle(view === 'create-course')}>➕ New Course</button>
      </nav>

      {error && <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {/* Views */}
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'checkin' && <CheckInForm courses={courses} />}
      {view === 'create-course' && <CreateCourseForm refreshCourses={fetchCourses} setView={setView} />}

    </div>
  );
}

// --- COMPONENT: CREATE COURSE ---
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
      if (!res.ok) throw new Error("Failed to create course");
      
      setStatus('✅ Course Created!');
      refreshCourses(); // Reload the list so it appears in dropdowns
      setTimeout(() => setView('dashboard'), 1500); // Auto-redirect
    } catch (err) {
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div style={cardStyle}>
      <h2>Create New Course</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
        <label>Course Name:</label>
        <input style={inputStyle} placeholder="e.g. 20-Day Course" required 
          onChange={e => setFormData({...formData, courseName: e.target.value})} />
        
        <label>Teacher Name:</label>
        <input style={inputStyle} placeholder="e.g. S.N. Goenka" required 
          onChange={e => setFormData({...formData, teacherName: e.target.value})} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label>Start Date:</label><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
          <div><label>End Date:</label><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
        </div>

        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Create Course</button>
        {status && <p style={{ fontWeight: 'bold', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// --- COMPONENT: DASHBOARD ---
function Dashboard({ courses }) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const statusData = [{ name: 'Arrived', value: 12 }, { name: 'Expected', value: 5 }];
  const COLORS = ['#0088FE', '#FFBB28'];

  return (
    <div>
      <h2 style={{marginBottom: '20px'}}>Summary Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <h3>Active Courses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{safeCourses.length}</p>
          <ul style={{marginTop: '10px', paddingLeft: '20px', color: '#666'}}>
            {safeCourses.map(c => <li key={c.course_id}>{c.course_name}</li>)}
          </ul>
        </div>
        <div style={cardStyle}>
          <h3>Arrival Status</h3>
          <PieChart width={300} height={200}>
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

// --- COMPONENT: CHECK IN FORM ---
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
      setStatus('✅ Success! Check-in complete.');
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
        
        <div><label>Laundry Token:</label><input name="laundryToken" value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} style={inputStyle} /></div>

        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm Check-In</button>
        {status && <p style={{ fontWeight: 'bold', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// STYLES
const btnStyle = (isActive) => ({ padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#eee', color: isActive ? 'white' : 'black' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
