import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BedDouble, UserPlus, Users, ShoppingBag, Settings, LogOut, Shield, GraduationCap, Heart, UserCheck, Menu, X } from 'lucide-react';
import { API_URL } from './config';
import Login from './components/Login';
import CourseDashboard from './components/Dashboard'; 
import GlobalAccommodationManager from './components/GlobalAccommodationManager';
import StudentForm from './components/StudentForm';
import ParticipantList from './components/ParticipantList';
import ExpenseTracker from './components/ExpenseTracker';
import CourseAdmin from './components/CourseAdmin';
import SevaBoard from './components/SevaBoard'; 
import GateReception from './components/GateReception';
import GatekeeperPanel from './components/GatekeeperPanel';
import ATPanel from './components/ATPanel';

export default function App() {
  const [authLevel, setAuthLevel] = useState('none'); 
  const [activeModule, setActiveModule] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [preSelectedRoom, setPreSelectedRoom] = useState(''); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedLevel = localStorage.getItem('auth_level');
    if (savedLevel) setAuthLevel(savedLevel);
    refreshCourses();
  }, []);

  const refreshCourses = () => {
    fetch(`${API_URL}/courses`).then(res => res.ok ? res.json() : []).then(data => setCourses(Array.isArray(data) ? data : [])).catch(err => console.error(err));
  };

  const handleLogin = (level) => { setAuthLevel(level); localStorage.setItem('auth_level', level); setActiveModule('dashboard'); };
  const handleLogout = () => { setAuthLevel('none'); localStorage.removeItem('auth_level'); setPreSelectedRoom(''); setMobileMenuOpen(false); };
  const handleRoomClick = (roomNo) => { setPreSelectedRoom(roomNo); setActiveModule('onboarding'); setMobileMenuOpen(false); };

  if (authLevel === 'none') return <Login onLogin={handleLogin} />;

  // --- RESTRICTED ROLES (Mobile Optimized Wrappers) ---
  
  if (authLevel === 'gatekeeper') {
    return (
      <div style={{minHeight:'100vh', background:'#e3f2fd', fontFamily:"'Segoe UI', sans-serif"}}>
        <div style={{background:'white', padding:'15px', display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#0d47a1', fontSize:'18px'}}><Shield size={20}/> Gatekeeper</h2>
            <button onClick={handleLogout} style={{padding:'6px 12px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}}>Logout</button>
        </div>
        <div className="mobile-pad" style={{padding:'30px'}}>
            <GatekeeperPanel courses={courses} />
        </div>
        <style>{`@media(max-width:768px){ .mobile-pad { padding: 15px !important; } }`}</style>
      </div>
    );
  }

  if (authLevel === 'reception') {
    return (
      <div style={{minHeight:'100vh', background:'#f0fdf4', fontFamily:"'Segoe UI', sans-serif"}}>
        <div className="no-print" style={{background:'white', padding:'15px', display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', borderBottom:'3px solid #2e7d32'}}>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#1b5e20', fontSize:'18px'}}><UserCheck size={24}/> Reception Console</h2>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Logout</button>
        </div>
        <div className="mobile-pad" style={{padding:'30px'}}>
            <GateReception courses={courses} refreshCourses={refreshCourses} />
        </div>
        <style>{`@media(max-width:768px){ .mobile-pad { padding: 10px !important; } }`}</style>
      </div>
    );
  }

  if (authLevel === 'teacher') {
    return (
      <div style={{minHeight:'100vh', background:'#fff3e0', fontFamily:"'Segoe UI', sans-serif"}}>
        <div style={{background:'white', padding:'15px', display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#e65100', fontSize:'18px'}}><GraduationCap size={24}/> Assistant Teacher</h2>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Logout</button>
        </div>
        <div className="mobile-pad" style={{padding:'30px'}}>
            <ATPanel courses={courses} />
        </div>
        <style>{`@media(max-width:768px){ .mobile-pad { padding: 10px !important; } }`}</style>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  const MENU_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'gate', label: 'Reception', icon: <UserCheck size={20} /> },
      { id: 'room', label: 'Room', icon: <BedDouble size={20} /> },
      { id: 'onboarding', label: 'Onboarding', icon: <UserPlus size={20} /> },
      { id: 'students', label: 'Manage Students', icon: <Users size={20} /> },
      { id: 'store', label: 'Store', icon: <ShoppingBag size={20} /> },
      { id: 'admin', label: 'Course Admin', icon: <Settings size={20} /> }, 
      { id: 'seva', label: 'Seva Board', icon: <Heart size={20} /> },
      
  ];

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: '#f4f6f8', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"}}>
      <button className="menu-toggle no-print" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{position: 'fixed', top: '15px', left: '15px', zIndex: 1100, background: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        {mobileMenuOpen ? <X size={24} color="#333"/> : <Menu size={24} color="#333"/>}
      </button>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999}} />}

      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''} no-print`} style={{width: '260px', background: '#ffffff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 1000, transition: 'transform 0.3s ease-in-out'}}>
          <div style={{padding: '30px 25px 40px 25px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px'}}>
                  <div style={{width:'36px', height:'36px', background:'linear-gradient(45deg, #007bff, #00d2ff)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px'}}>☸️</div>
                  <div style={{fontWeight:'900', fontSize:'16px', color:'#2c3e50', letterSpacing:'-0.5px'}}>DHAMMA<br/>NAGAJJUNA 2</div>
              </div>
              <div style={{fontSize:'11px', color:'#999', fontWeight:'bold', letterSpacing:'1px', textTransform:'uppercase'}}>Admin Console</div>
          </div>
          <div style={{flex: 1, padding: '0 15px', display:'flex', flexDirection:'column', gap:'5px', overflowY:'auto'}}>
              {MENU_ITEMS.map(item => {
                  const isActive = activeModule === item.id;
                  return (
                      <button key={item.id} onClick={() => { setActiveModule(item.id); setMobileMenuOpen(false); }} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', border: 'none', borderRadius: '12px', background: isActive ? '#e3f2fd' : 'transparent', color: isActive ? '#007bff' : '#555', fontWeight: isActive ? '700' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'}}>
                          {item.icon} <span>{item.label}</span>
                      </button>
                  );
              })}
          </div>
          <div style={{padding: '20px', borderTop: '1px solid #eee'}}>
              <button onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', width: '100%', border: '1px solid #ffcdd2', background: '#fff5f5', color: '#d32f2f', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', justifyContent: 'center'}}>
                  <LogOut size={18}/> Logout
              </button>
          </div>
      </div>

      <div className="main-content" style={{flex: 1, padding: '40px', overflowY: 'auto'}}>
          <div className="content-wrapper" style={{maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out'}}>
              {activeModule === 'dashboard' && <CourseDashboard courses={courses} />}
              {activeModule === 'gate' && <GateReception courses={courses} refreshCourses={refreshCourses} />}
              {activeModule === 'room' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
              {activeModule === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
              {activeModule === 'students' && <ParticipantList courses={courses} refreshCourses={refreshCourses}/>}
              {activeModule === 'store' && <ExpenseTracker courses={courses} />}
              {activeModule === 'seva' && <SevaBoard courses={courses} />}
              {activeModule === 'admin' && <CourseAdmin courses={courses} refreshCourses={refreshCourses} />}
          </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; background: #f4f6f8; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; borderRadius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #aaa; }
        .menu-toggle { display: none; }
        .sidebar { left: 0; }
        .main-content { margin-left: 260px; }
        @media (max-width: 768px) {
            .menu-toggle { display: block !important; }
            .sidebar { transform: translateX(-100%); box-shadow: none; }
            .sidebar.open { transform: translateX(0); box-shadow: 5px 0 15px rgba(0,0,0,0.1); }
            .main-content { margin-left: 0 !important; padding: 20px !important; }
            .content-wrapper { padding-top: 40px; }
        }
        @media print { .no-print { display: none !important; } .main-content { margin-left: 0 !important; padding: 0 !important; } }
      `}</style>
    </div>
  );
}
