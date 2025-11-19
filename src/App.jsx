import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

// *** IMPORTANT: YOUR BACKEND URL ***
const API_URL = "https://course-manager-backend-cd1m.onrender.com";

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'checkin'
  const [courses, setCourses] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Load Courses on Start
  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error("Error fetching courses:", err));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      
      {/* --- Navigation --- */}
      <nav style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
        <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In Desk</button>
      </nav>

      {/* --- View: Dashboard --- */}
      {view === 'dashboard' && <Dashboard courses={courses} />}

      {/* --- View: Check In --- */}
      {view === 'checkin' && <CheckInForm courses={courses} />}

    </div>
  );
}

// --- SUB-COMPONENT: DASHBOARD ---
function Dashboard({ courses }) {
  // Mock Data for Visuals (Connect to API if needed later)
  const statusData = [
    { name: 'Arrived', value: 12 },
    { name: 'Expected', value: 5 },
    { name: 'Cancelled', value: 2 },
  ];
  const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

  return (
    <div>
      <h2 style={{marginBottom: '20px'}}>Summary Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Stats */}
        <div style={cardStyle}>
          <h3>Active Courses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{courses.length}</p>
        </div>

        {/* Card 2: Chart */}
        <div style={cardStyle}>
          <h3>Arrival Status</h3>
          <PieChart width={300} height={200}>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: CHECK IN FORM ---
function CheckInForm({ courses }) {
  const [formData, setFormData] = useState({
    courseId: '', participantId: '1', // Defaulting ID for demo
    roomNo: '', seatNo: '', laundryToken: '', 
    mobileLocker: '', valuablesLocker: '', language: 'English'
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    try {
      const res = await fetch(`${API_URL}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error checking in");
      }

      setStatus('✅ Success! Check-in complete.');
      // Clear form logic here if needed
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={cardStyle}>
      <h2>Participant Check-In</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
        
        <label>Select Course:</label>
        <select name="courseId" onChange={handleChange} style={inputStyle} required>
          <option value="">-- Select --</option>
          {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label>Room No:</label>
            <input name="roomNo" onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label>Seat No:</label>
            <input name="seatNo" onChange={handleChange} style={inputStyle} required />
          </div>
        </div>

        <label>Laundry Token:</label>
        <input name="laundryToken" onChange={handleChange} style={inputStyle} />

        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Confirm Check-In
        </button>

        {status && <p style={{ fontWeight: 'bold', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// --- STYLES ---
const btnStyle = (isActive) => ({
  padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer',
  background: isActive ? '#007bff' : '#eee', color: isActive ? 'white' : 'black'
});

const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
