import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

// YOUR BACKEND URL
const API_URL = "https://course-manager-backend-cd1m.onrender.com";

export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]); // Initialized as empty array
  const [error, setError] = useState('');

  // Load Courses on Start
  useEffect(() => {
    fetch(`${API_URL}/courses`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
      })
      .then(data => {
        // SAFETY CHECK: Only set courses if data is actually an Array
        if (Array.isArray(data)) {
          setCourses(data);
          setError('');
        } else {
          console.error("API returned non-array:", data);
          setCourses([]); // Fallback to empty
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError("Could not load courses. Backend might be sleeping.");
        setCourses([]);
      });
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      
      {/* Navigation */}
      <nav style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
        <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In Desk</button>
      </nav>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px', border: '1px solid #ef9a9a' }}>
          ⚠️ <strong>System Alert:</strong> {error}
        </div>
      )}

      {/* Views */}
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'checkin' && <CheckInForm courses={courses} />}

    </div>
  );
}

// --- SUB-COMPONENT: DASHBOARD ---
function Dashboard({ courses }) {
  // Safety Check: Ensure courses is an array before using .length
  const safeCourses = Array.isArray(courses) ? courses : [];
  
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
        
        <div style={cardStyle}>
          <h3>Active Courses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{safeCourses.length}</p>
        </div>

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
  // Safety Check
  const safeCourses = Array.isArray(courses) ? courses : [];

  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({
    courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: ''
  });
  const [status, setStatus] = useState('');

  // Fetch Participants when Course is selected
  useEffect(() => {
    if (formData.courseId) {
      fetch(`${API_URL}/courses/${formData.courseId}/participants`)
        .then(res => res.json())
        .then(data => {
           if (Array.isArray(data)) setParticipants(data);
           else setParticipants([]);
        })
        .catch(err => console.error(err));
    }
  }, [formData.courseId]);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

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
      if (!res.ok) throw new Error(data.error || "Error checking in");
      setStatus('✅ Success! Check-in complete.');
      setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '' }));
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
          <option value="">-- Select Course --</option>
          {/* THIS IS WHERE THE ERROR HAPPENED - NOW FIXED */}
          {safeCourses.map(c => (
            <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
          ))}
        </select>

        <label>Select Student:</label>
        <select name="participantId" onChange={handleChange} value={formData.participantId} style={inputStyle} required disabled={!formData.courseId}>
          <option value="">-- Select Student --</option>
          {participants.map(p => (
            <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>
          ))}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><label>Room No:</label><input name="roomNo" value={formData.roomNo} onChange={handleChange} style={inputStyle} required /></div>
          <div><label>Seat No:</label><input name="seatNo" value={formData.seatNo} onChange={handleChange} style={inputStyle} required /></div>
        </div>
        
        <div><label>Laundry Token:</label><input name="laundryToken" value={formData.laundryToken} onChange={handleChange} style={inputStyle} /></div>

        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm Check-In</button>
        {status && <p style={{ fontWeight: 'bold', marginTop: '10px' }}>{status}</p>}
      </form>
    </div>
  );
}

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#eee', color: isActive ? 'white' : 'black' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
