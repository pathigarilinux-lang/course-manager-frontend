import React, { useState, useEffect } from 'react';
import { API_URL, styles } from './config';

// Import Separated Components
import Dashboard from './components/Dashboard';
import GatekeeperPanel from './components/GatekeeperPanel';
import GlobalAccommodationManager from './components/GlobalAccommodationManager';
import ATPanel from './components/ATPanel';
import StudentForm from './components/StudentForm';
import ParticipantList from './components/ParticipantList';
import ExpenseTracker from './components/ExpenseTracker';
import CourseAdmin from './components/CourseAdmin';

// Login Constants
const ADMIN_PASSCODE = "11"; 
const GATEKEEPER_PASSCODE = "0";
const TEACHER_PASSCODE = "2";

export default function App() {
  const [authLevel, setAuthLevel] = useState('none'); 
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  // Initial Load
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
    else { setLoginError('❌ Incorrect Passcode'); setPinInput(''); }
  };

  const handleLogout = () => { setAuthLevel('none'); localStorage.removeItem('auth_level'); setView('dashboard'); setPinInput(''); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res => res.ok ? res.json() : []).then(data => Array.isArray(data) ? setCourses(data) : setCourses([])).catch(err => { console.error(err); setError("Connection Error"); }); };
  const handleRoomClick = (roomNo) => { setPreSelectedRoom(roomNo); setView('onboarding'); };

  // --- VIEW ROUTING ---

  // 1. Login Screen
  if (authLevel === 'none') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Dhamma Nagajjuna Course Manager</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Passcode" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', textAlign: 'center' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Unlock</button>
          </form>
          {loginError && <p style={{ color: 'red', marginTop: '15px' }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  // 2. Role-Based Views
  if (authLevel === 'gatekeeper') return <div className="app-container" style={{padding:'20px', minHeight:'100vh', background:'#e3f2fd'}}><div style={{display:'flex',justifyContent:'space-between'}}><h2>Gate</h2><button onClick={handleLogout} style={styles.btn(false)}>Logout</button></div><GatekeeperPanel courses={courses} /></div>;
  if (authLevel === 'teacher') return <div className="app-container" style={{padding:'20px', minHeight:'100vh', background:'#fff3e0'}}><div style={{display:'flex',justifyContent:'space-between'}}><h2>AT Panel</h2><button onClick={handleLogout} style={styles.btn(false)}>Logout</button></div><ATPanel courses={courses} /></div>;

  // 3. Admin View (Main Dashboard)
  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 10pt; } .print-hide { display: none; } }`}</style>
      
      {/* Navigation Bar */}
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={styles.btn(view === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={styles.btn(view === 'ta-panel')}>AT Panel</button>
          <button onClick={() => setView('room-view')} style={styles.btn(view === 'room-view')}>🛏️ Rooms</button>
          <button onClick={() => setView('onboarding')} style={styles.btn(view === 'onboarding')}>📝 Onboarding</button>
          <button onClick={() => setView('participants')} style={styles.btn(view === 'participants')}>👥 Students</button>
          <button onClick={() => setView('expenses')} style={styles.btn(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('course-admin')} style={styles.btn(view === 'course-admin')}>⚙️ Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...styles.btn(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>

      {error && <div className="no-print" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}
      
      {/* Main Content Area */}
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} />}
    </div>
  );
}
