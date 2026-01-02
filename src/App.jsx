import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BedDouble, UserPlus, Users, ShoppingBag, 
  Settings, LogOut, Shield, GraduationCap, Heart, UserCheck, 
  Menu, X, Database 
} from 'lucide-react';
import { API_URL, styles } from './config';

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
// ✅ NEW IMPORT: Standalone Dining Console
import DN1DiningConsole from './components/DN1DiningConsole';
import DN1StudentForm from './components/DN1StudentForm';

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
  const [courses, setCourses] = useState([]); // ✅ Always initialized as empty array
  const [stats, setStats] = useState({});

  // 2. Login/Logout Handlers
  const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem('dhammaUser', JSON.stringify(userData));
      
      // ✅ Redirect 'gate' role directly to gate tab
      if (userData.role === 'gate') {
          setActiveTab('gate');
      }
  };

  const handleLogout = () => {
      setUser(null);
      setCourses([]); // Clear sensitive data on logout
      localStorage.removeItem('dhammaUser');
      setActiveTab('dashboard');
  };

  // 3. Robust Fetch Logic
  const fetchCourses = async () => {
      if (!user) return; // Don't fetch if logged out

      try {
          const res = await fetch(`${API_URL}/courses`);
          const allCourses = await res.json();
          
          if (!Array.isArray(allCourses)) {
              setCourses([]);
              return;
          }

          // 🛡️ ROLE-BASED FILTERING
          let filteredCourses = [];
          if (user.role === 'admin') {
              filteredCourses = allCourses;
          } else if (user.role === 'dn1ops') {
              filteredCourses = allCourses.filter(c => c.owner_role === 'dn1ops');
          } else if (user.role === 'gate') {
              // ✅ GATE USER SEES ALL COURSES
              filteredCourses = allCourses;
          } else {
              // Staff/AT see everything EXCEPT dn1ops courses
              filteredCourses = allCourses.filter(c => c.owner_role !== 'dn1ops');
          }

          setCourses(filteredCourses);

      } catch (e) { 
          console.error("Failed to fetch courses", e); 
          setCourses([]); // Fallback to empty array on error
      }
  };

  // 4. Load Data on Mount & User Change
  useEffect(() => {
      if (user) {
          fetchCourses();
      }
  }, [user]); // ✅ Re-runs whenever user logs in/out

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

  // 6. Menu Items - ✅ MODIFIED: Added 'gate' role to 'gate' tab
  const MENU_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'gate', label: 'Gate Reception', icon: <UserCheck size={20}/>, roles: ['admin', 'staff', 'gate', 'dn1ops'] }, // ✅ Added 'gate'
      { id: 'checkin', label: 'Onboarding', icon: <UserPlus size={20}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'students', label: 'Manage Students', icon: <Users size={20}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'accommodation', label: 'Room Manager', icon: <BedDouble size={20}/>, roles: ['admin', 'staff', ] },
      { id: 'at', label: 'AT Panel', icon: <GraduationCap size={20}/>, roles: ['admin', 'staff', 'at', 'dn1ops'] }, 
      { id: 'admin', label: 'Course Admin', icon: <Database size={20}/>, roles: ['admin', 'staff', 'dn1ops'] }, 
      { id: 'store', label: 'Store & Expenses', icon: <ShoppingBag size={20}/>, roles: ['admin', 'staff', 'dn1ops'] },
      { id: 'seva', label: 'Seva Board', icon: <Heart size={20}/>, roles: ['admin', 'staff', 'dn1ops'] }, 
  ];

  const allowedMenuItems = MENU_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f6f8', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{
          width: isSidebarOpen ? '260px' : '0px', 
          minWidth: isSidebarOpen ? '260px' : '0px',
          background: '#1e293b',
          color: 'white',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 100,
          overflow: 'hidden'
      }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #334155', whiteSpace:'nowrap' }}>
              <div style={{ minWidth: '35px', height: '35px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>DN</div>
              <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Dhamma Nagajjuna</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.username} ({user.role})</div>
              </div>
          </div>

          <nav style={{ flex: 1, padding: '15px 10px', overflowY: 'auto' }}>
              {allowedMenuItems.map(item => (
                  <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          padding: '12px 15px',
                          background: activeTab === item.id ? '#334155' : 'transparent',
                          color: activeTab === item.id ? '#60a5fa' : '#cbd5e1',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '5px',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                      }}
                  >
                      {item.icon}
                      <span style={{ fontSize: '14px' }}>{item.label}</span>
                  </button>
              ))}
          </nav>

          <div style={{ padding: '15px', borderTop: '1px solid #334155' }}>
              <button 
                  onClick={handleLogout}
                  style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '12px 15px',
                      background: '#ef44441a',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                  }}
              >
                  <LogOut size={20} />
                  <span>Sign Out</span>
              </button>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <header style={{ background: 'white', padding: '15px 30px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                  <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                  <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                      {MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Dhamma Nagajjuna'}
                  </div>
              </div>
              {!isSidebarOpen && (
                  <button onClick={handleLogout} style={{background:'#ffebee', color:'#c62828', border:'none', borderRadius:'50%', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                      <LogOut size={16}/>
                  </button>
              )}
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {activeTab === 'dashboard' && <CourseDashboard courses={courses} stats={stats} />}
              
              {/* ✅ UPDATE: Pass userRole to GateReception */}
              {activeTab === 'gate' && <GateReception courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              
              {/* ✅ UPDATE: Pass userRole to StudentForm */}
              {activeTab === 'checkin' && <StudentForm courses={courses || []} fetchStats={fetchStats} refreshCourses={fetchCourses} preSelectedRoom={null} clearRoom={()=>{}} userRole={user.role} />}
              {activeTab === 'checkin' && (user.role === 'dn1ops' ? <DN1StudentForm courses={courses || []} userRole={user.role} /> : <StudentForm courses={courses || []} fetchStats={fetchStats} refreshCourses={fetchCourses} preSelectedRoom={null} clearRoom={()=>{}} userRole={user.role} />)}
            
              {/* ✅ UPDATE: Pass userRole to ParticipantList */}
              {activeTab === 'students' && <ParticipantList courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              
              {activeTab === 'accommodation' && <GlobalAccommodationManager />}
              {activeTab === 'at' && <ATPanel courses={courses} />}
              
              {/* ✅ UPDATE: Pass userRole to CourseAdmin */}
              {activeTab === 'admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              
              {activeTab === 'seva' && <SevaBoard courses={courses} />}
              
              {/* Render Store for Admin, Staff AND dn1ops */}
              {(user.role === 'admin' || user.role === 'staff' || user.role === 'dn1ops') && activeTab === 'store' && <ExpenseTracker courses={courses} />}
          </div>
      </main>
    </div>
  );
}

export default App;
