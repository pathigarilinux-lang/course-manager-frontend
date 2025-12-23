import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BedDouble, UserPlus, Users, ShoppingBag, Settings, LogOut, Shield, GraduationCap } from 'lucide-react';
import { API_URL } from './config';

// --- COMPONENT IMPORTS ---
import Login from './components/Login';

// Admin Modules
import CourseDashboard from './components/Dashboard'; // ✅ Using the NEW Zero-Day Dashboard
import GlobalAccommodationManager from './components/GlobalAccommodationManager';
import StudentForm from './components/StudentForm';
import ParticipantList from './components/ParticipantList';
import ExpenseTracker from './components/ExpenseTracker';
import CourseAdmin from './components/CourseAdmin';

// Restricted Modules (Preserved from your original file)
import GatekeeperPanel from './components/GatekeeperPanel';
import ATPanel from './components/ATPanel';

export default function App() {
  const [authLevel, setAuthLevel] = useState('none'); // 'none', 'admin', 'gatekeeper', 'teacher'
  const [activeModule, setActiveModule] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [preSelectedRoom, setPreSelectedRoom] = useState(''); // Logic Preserved

  // --- INITIAL LOAD ---
  useEffect(() => {
    const savedLevel = localStorage.getItem('auth_level');
    if (savedLevel) setAuthLevel(savedLevel);
    refreshCourses();
  }, []);

  const refreshCourses = () => {
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const handleLogin = (level) => {
    setAuthLevel(level);
    localStorage.setItem('auth_level', level);
    setActiveModule('dashboard'); // Reset view on login
  };

  const handleLogout = () => {
    setAuthLevel('none');
    localStorage.removeItem('auth_level');
    setPreSelectedRoom('');
  };

  // Logic: Clicking a room in Map -> Goes to Onboarding with that room
  const handleRoomClick = (roomNo) => {
    setPreSelectedRoom(roomNo);
    setActiveModule('onboarding');
  };

  // --- 1. LOGIN SCREEN ---
  if (authLevel === 'none') {
    return <Login onLogin={handleLogin} />;
  }

  // --- 2. RESTRICTED ROLES (Simplified UI) ---
  if (authLevel === 'gatekeeper') {
    return (
      <div style={{minHeight:'100vh', background:'#e3f2fd', fontFamily:"'Segoe UI', sans-serif"}}>
        <div style={{background:'white', padding:'15px 30px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#0d47a1'}}><Shield size={24}/> Gatekeeper Access</h2>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Logout</button>
        </div>
        <div style={{padding:'30px'}}>
            <GatekeeperPanel courses={courses} />
        </div>
      </div>
    );
  }

  if (authLevel === 'teacher') {
    return (
      <div style={{minHeight:'100vh', background:'#fff3e0', fontFamily:"'Segoe UI', sans-serif"}}>
        <div style={{background:'white', padding:'15px 30px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#e65100'}}><GraduationCap size={24}/> Assistant Teacher Panel</h2>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Logout</button>
        </div>
        <div style={{padding:'30px'}}>
            <ATPanel courses={courses} />
        </div>
      </div>
    );
  }

  // --- 3. ADMIN DASHBOARD (RICH UI) ---
  const MENU_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { id: 'room', label: 'Room Map', icon: <BedDouble size={18} /> },
      { id: 'onboarding', label: 'Onboarding', icon: <UserPlus size={18} /> },
      { id: 'students', label: 'Students', icon: <Users size={18} /> },
      { id: 'store', label: 'Store', icon: <ShoppingBag size={18} /> },
      { id: 'admin', label: 'Admin', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{
        minHeight: '100vh', 
        background: '#f4f6f8', 
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      
      {/* TOP NAVIGATION */}
      <div className="no-print" style={{
          background: 'white',
          padding: '0 30px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          position: 'sticky', top: 0, zIndex: 1000
      }}>
          {/* BRAND */}
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{width:'40px', height:'40px', background:'linear-gradient(45deg, #007bff, #00d2ff)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'20px'}}>☸️</div>
              <div>
                  <div style={{fontWeight: '900', fontSize: '18px', color: '#2c3e50', letterSpacing: '-0.5px'}}>DHAMMA NAGAJJUNA 2</div>
                  <div style={{fontSize: '11px', color: '#999', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px'}}>Admin Console</div>
              </div>
          </div>

          {/* MENU */}
          <div style={{display: 'flex', gap: '8px', overflowX:'auto'}}>
              {MENU_ITEMS.map(item => {
                  const isActive = activeModule === item.id;
                  return (
                      <button 
                          key={item.id}
                          onClick={() => setActiveModule(item.id)}
                          style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '10px 16px',
                              border: 'none', borderRadius: '30px',
                              background: isActive ? '#e3f2fd' : 'transparent',
                              color: isActive ? '#007bff' : '#666',
                              fontWeight: isActive ? '700' : '500',
                              fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none'
                          }}
                      >
                          {item.icon}
                          <span style={{whiteSpace:'nowrap'}}>{item.label}</span>
                      </button>
                  );
              })}
          </div>

          {/* LOGOUT */}
          <button 
              onClick={handleLogout} 
              style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '6px',
                  border: '1px solid #ffcdd2', background: '#fff5f5',
                  color: '#d32f2f', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
              }}
          >
              <LogOut size={16}/> Logout
          </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{maxWidth: '1600px', margin: '30px auto', padding: '0 20px'}}>
          <div style={{animation: 'fadeIn 0.4s ease-in-out'}}>
              
              {activeModule === 'dashboard' && <CourseDashboard courses={courses} />}
              
              {activeModule === 'room' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
              
              {activeModule === 'onboarding' && (
                  <StudentForm 
                      courses={courses} 
                      preSelectedRoom={preSelectedRoom} 
                      clearRoom={() => setPreSelectedRoom('')} 
                  />
              )}
              
              {activeModule === 'students' && <ParticipantList courses={courses} refreshCourses={refreshCourses}/>}
              
              {activeModule === 'store' && <ExpenseTracker courses={courses} />}
              
              {activeModule === 'admin' && <CourseAdmin courses={courses} refreshCourses={refreshCourses} />}
              
          </div>
      </div>

      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; background: #f4f6f8; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; borderRadius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #aaa; }
      `}</style>
    </div>
  );
}
