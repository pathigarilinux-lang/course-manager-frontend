import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BedDouble, UserPlus, Users, ShoppingBag, 
  Settings, LogOut, Shield, GraduationCap, Heart, UserCheck, 
  Menu, X, Database, ChevronRight, History 
} from 'lucide-react';
import { API_URL } from './config';

// --- COMPONENTS ---
import Login from './components/Login';
import CourseDashboard from './components/Dashboard'; 
import GlobalAccommodationManager from './components/GlobalAccommodationManager';
import StudentForm from './components/StudentForm';
import ParticipantList from './components/ParticipantList';
import ExpenseTracker from './components/ExpenseTracker'; 
import CourseAdmin from './components/CourseAdmin';
import SevaBoard from './components/SevaBoard'; 
import GateReception from './components/GateReception';
import ATPanel from './components/ATPanel';
import DN1StudentForm from './components/DN1StudentForm';
import AlumniDirectory from './components/AlumniDirectory'; 
import MasterDatabase from './components/MasterDatabase';
import MentorManager from './components/MentorManager';
import SevaPassport from './components/SevaPassport'; // ✅ NEW IMPORT

// --- PREMIUM STYLES CONSTANTS ---
const theme = {
    sidebarBg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    sidebarText: '#94a3b8',
    sidebarActiveBg: 'rgba(255, 255, 255, 0.1)',
    sidebarActiveText: '#ffffff',
    accent: '#3b82f6',
    bg: '#f1f5f9', // Light slate background for content
    cardShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

function App() {
  // 1. Initialize User
  const [user, setUser] = useState(() => {
      try {
          const savedUser = localStorage.getItem('dhammaUser');
          return savedUser ? JSON.parse(savedUser) : null;
      } catch (e) { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [courses, setCourses] = useState([]); 
  const [stats, setStats] = useState({});

  // 2. Login/Logout Handlers
  const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem('dhammaUser', JSON.stringify(userData));
      if (userData.role === 'gate') setActiveTab('gate');
  };

  const handleLogout = () => {
      setUser(null);
      setCourses([]); 
      localStorage.removeItem('dhammaUser');
      setActiveTab('dashboard');
  };

  // 3. Robust Fetch Logic
  const fetchCourses = async () => {
      if (!user) return; 
      try {
          const res = await fetch(`${API_URL}/courses`);
          const allCourses = await res.json();
          if (!Array.isArray(allCourses)) { setCourses([]); return; }

          // 🛡️ ROLE-BASED FILTERING
          let filteredCourses = [];
          if (user.role === 'admin' || user.role === 'gate' || user.role === 'at') {
              // ✅ GOD MODE: Admin, Gate, AT see ALL courses
              filteredCourses = allCourses;
          } else if (user.role === 'dn1ops') {
              // 🔒 DN1 OPS: Restricted
              filteredCourses = allCourses.filter(c => c.owner_role === 'dn1ops');
          } else {
              // 🔒 STAFF: Restricted
              filteredCourses = allCourses.filter(c => c.owner_role !== 'dn1ops');
          }
          setCourses(filteredCourses);
      } catch (e) { console.error("Failed to fetch courses", e); setCourses([]); }
  };

  useEffect(() => { if (user) fetchCourses(); }, [user]); 

  const fetchStats = async () => {
      if(courses.length > 0) {
          try {
              const res = await fetch(`${API_URL}/courses/${courses[0].course_id}/stats`);
              const data = await res.json();
              setStats(data);
          } catch(e) { console.error("Stats Error", e); }
      }
  };

  useEffect(() => { if(courses.length > 0) fetchStats(); }, [courses]);

  // 5. Role-Based Redirects
  useEffect(() => {
      if (user) {
          if (user.role === 'gate') { setActiveTab('gate'); setSidebarOpen(false); }
          else if (user.role === 'at') { setActiveTab('at'); setSidebarOpen(false); }
      }
  }, [user]);

  if (!user) return <Login onLogin={handleLogin} />;

  // 6. Menu Items
  const MENU_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'gate', label: 'Gate Reception', icon: <UserCheck size={18}/>, roles: ['admin', 'staff', 'gate', 'dn1ops'] }, 
      { id: 'checkin', label: 'Onboarding', icon: <UserPlus size={18}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'students', label: 'Manage Students', icon: <Users size={18}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'accommodation', label: 'Room Manager', icon: <BedDouble size={18}/>, roles: ['admin', 'staff', ] },
      { id: 'at', label: 'AT Panel', icon: <GraduationCap size={18}/>, roles: ['admin', 'staff', 'at', 'dn1ops'] }, 
      { id: 'alumni', label: 'Alumni Directory', icon: <History size={18}/>, roles: ['admin'] }, 
      { id: 'admin', label: 'Course Admin', icon: <Database size={18}/>, roles: ['admin', 'staff', 'dn1ops'] }, 
      { id: 'store', label: 'Store & Expenses', icon: <ShoppingBag size={18}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'seva', label: 'Seva Board', icon: <Heart size={18}/>, roles: ['admin'] },
      // ✅ UPDATED: Added 'master_at' to roles
      { id: 'master', label: 'Master Database', icon: <Database size={18}/>, roles: ['admin', 'master_at'] },
      { id: 'mentor', label: 'Mentor Distribution', icon: <Users size={18}/>, roles: ['admin', 'master_at'] }
      { id: 'passport', label: 'Seva Passport (View)', icon: <CreditCard size={18}/>, roles: ['admin'] }
  ];

  const allowedMenuItems = MENU_ITEMS.filter(item => item.roles.includes(user.role));
  const activeLabel = MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Dhamma Nagajjuna';

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* --- MODERN SIDEBAR --- */}
      <aside style={{
          width: isSidebarOpen ? '280px' : '0px', 
          minWidth: isSidebarOpen ? '280px' : '0px',
          background: theme.sidebarBg,
          color: 'white',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring animation
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 50,
          overflow: 'hidden',
          position: 'relative'
      }}>
          {/* Brand */}
          <div style={{ padding: '30px 25px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ 
                  minWidth: '40px', height: '40px', borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' 
              }}>DN</div>
              <div style={{ opacity: isSidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', letterSpacing:'0.5px' }}>Dhamma Nagajjuna</div>
                  <div style={{ fontSize: '12px', color: theme.sidebarText, marginTop:'2px' }}>System v2.0</div>
              </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '25px 15px', overflowY: 'auto' }}>
              <div style={{fontSize:'11px', textTransform:'uppercase', color: theme.sidebarText, marginBottom:'15px', paddingLeft:'10px', fontWeight:'600', letterSpacing:'1px'}}>Main Menu</div>
              {allowedMenuItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                      <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          style={{
                              width: '100%',
                              display: 'flex', alignItems: 'center', gap: '15px',
                              padding: '12px 20px',
                              background: isActive ? theme.sidebarActiveBg : 'transparent',
                              color: isActive ? theme.sidebarActiveText : theme.sidebarText,
                              border: 'none', borderRadius: '12px',
                              cursor: 'pointer', marginBottom: '8px',
                              transition: 'all 0.2s ease',
                              fontWeight: isActive ? '600' : '400',
                              position: 'relative',
                              overflow: 'hidden'
                          }}
                      >
                          {/* Active Indicator Bar */}
                          {isActive && <div style={{position:'absolute', left:0, top:'15%', height:'70%', width:'4px', background:'#60a5fa', borderRadius:'0 4px 4px 0'}}></div>}
                          
                          <div style={{color: isActive ? '#60a5fa' : 'currentColor'}}>{item.icon}</div>
                          <span style={{ fontSize: '14px' }}>{item.label}</span>
                          {isActive && <ChevronRight size={14} style={{marginLeft:'auto', opacity:0.5}}/>}
                      </button>
                  );
              })}
          </nav>

          {/* User Profile Footer */}
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'15px'}}>
                  <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold'}}>
                      {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <div style={{fontSize:'14px', fontWeight:'600'}}>{user.username}</div>
                      <div style={{fontSize:'11px', color: theme.sidebarText, textTransform:'uppercase'}}>{user.role}</div>
                  </div>
              </div>
              <button 
                  onClick={handleLogout}
                  style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent:'center', gap: '8px',
                      padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px',
                      cursor: 'pointer', fontSize:'13px', fontWeight:'500', transition:'0.2s'
                  }}
              >
                  <LogOut size={16} /> Sign Out
              </button>
          </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position:'relative' }}>
          
          {/* Glass Header */}
          <header style={{ 
              background: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(10px)',
              padding: '15px 30px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              zIndex: 40,
              position: 'sticky', top: 0
          }}>
              <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                  <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius:'8px', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer', color: '#64748b', transition:'0.2s', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
                      {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                  <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', textTransform:'uppercase', fontWeight:'600' }}>Dhamma Nagajjuna</span>
                      <span style={{ fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>{activeLabel}</span>
                  </div>
              </div>
              
              <div style={{fontSize:'12px', color:'#64748b', fontWeight:'500', background:'#f8fafc', padding:'6px 12px', borderRadius:'20px', border:'1px solid #e2e8f0'}}>
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
          </header>

          {/* Scrollable Content Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '30px', maxWidth:'1600px', width:'100%', margin:'0 auto' }}>
              <div style={{animation: 'fadeIn 0.4s ease-out'}}>
                  {activeTab === 'dashboard' && <CourseDashboard courses={courses} stats={stats} />}
                  
                  {activeTab === 'gate' && <GateReception courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
                  
                  {activeTab === 'checkin' && (user.role === 'dn1ops' ? <DN1StudentForm courses={courses || []} userRole={user.role} /> : <StudentForm courses={courses || []} fetchStats={fetchStats} refreshCourses={fetchCourses} preSelectedRoom={null} clearRoom={()=>{}} userRole={user.role} />)}
                
                  {activeTab === 'students' && <ParticipantList courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
                  
                  {activeTab === 'accommodation' && <GlobalAccommodationManager />}
                  {activeTab === 'at' && <ATPanel courses={courses} />}
                  {activeTab === 'mentor' && <MentorManager />} 
                  {activeTab === 'alumni' && <AlumniDirectory courses={courses} />}
                  {/* ✅ UPDATED: Passed user prop to MasterDatabase */}
                  {activeTab === 'master' && <MasterDatabase user={user} />}                  
                  {activeTab === 'admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
                  
                  {activeTab === 'seva' && <SevaBoard courses={courses} />}
                  {activeTab === 'passport' && <SevaPassport />}  {/* ✅ RENDER NEW TAB */}
                  {(user.role === 'admin' || user.role === 'staff' || user.role === 'dn1ops') && activeTab === 'store' && <ExpenseTracker courses={courses} />}
              </div>
          </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

export default App;
