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
import GatekeeperPanel from './components/GatekeeperPanel';
import ATPanel from './components/ATPanel';

function App() {
  // --- STATE ---
  const [user, setUser] = useState(null); // Auth User
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Shared Data State
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});

  // --- DATA FETCHING ---
  const fetchCourses = async () => {
      try {
          const res = await fetch(`${API_URL}/courses`);
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
      } catch (e) { console.error("Failed to fetch courses", e); }
  };

  const fetchStats = async () => {
      if(courses.length > 0) {
          try {
              const res = await fetch(`${API_URL}/courses/${courses[0].course_id}/stats`);
              const data = await res.json();
              setStats(data);
          } catch(e) { console.error("Failed to fetch stats", e); }
      }
  };

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { if(courses.length > 0) fetchStats(); }, [courses]);

  // --- LOGIN GUARD ---
  if (!user) {
      return <Login onLogin={(u) => setUser(u)} />;
  }

  // --- MENU CONFIGURATION ---
  const MENU_ITEMS = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, roles: ['admin', 'staff'] },
      { id: 'gate', label: 'Gate Reception', icon: <UserCheck size={20}/>, roles: ['admin', 'staff'] },
      { id: 'gatekeeper', label: 'Gatekeeper View', icon: <Shield size={20}/>, roles: ['admin', 'staff'] },
      { id: 'checkin', label: 'Onboarding', icon: <UserPlus size={20}/>, roles: ['admin', 'staff'] },
      { id: 'students', label: 'Manage Students', icon: <Users size={20}/>, roles: ['admin', 'staff'] },
      { id: 'accommodation', label: 'Room Manager', icon: <BedDouble size={20}/>, roles: ['admin', 'staff'] },
      // ✅ UPDATED: AT Panel & Admin now accessible to 'staff'
      { id: 'at', label: 'AT Panel', icon: <GraduationCap size={20}/>, roles: ['admin', 'staff'] }, 
      { id: 'admin', label: 'Course Admin', icon: <Database size={20}/>, roles: ['admin', 'staff'] }, 
      
      // 🔒 REMAINING ADMIN ONLY
      { id: 'store', label: 'Store & Expenses', icon: <ShoppingBag size={20}/>, roles: ['admin'] }, 
      { id: 'seva', label: 'Seva Board', icon: <Heart size={20}/>, roles: ['admin'] }, 
  ];

  // Filter menu based on logged-in user role
  const allowedMenuItems = MENU_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f6f8', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* --- SIDEBAR --- */}
      <aside style={{
          width: isSidebarOpen ? '260px' : '70px',
          background: '#1e293b',
          color: 'white',
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 100
      }}>
          {/* Brand */}
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #334155' }}>
              <div style={{ minWidth: '35px', height: '35px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>DS</div>
              {isSidebarOpen && (
                  <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Dhamma Seva</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.username} ({user.role})</div>
                  </div>
              )}
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '15px 10px', overflowY: 'auto' }}>
              {allowedMenuItems.map(item => (
                  <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={!isSidebarOpen ? item.label : ''}
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
                          justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                      }}
                  >
                      {item.icon}
                      {isSidebarOpen && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                  </button>
              ))}
          </nav>

          {/* Footer / Logout */}
          <div style={{ padding: '15px', borderTop: '1px solid #334155' }}>
              <button 
                  onClick={() => setUser(null)}
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
                      justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                  }}
              >
                  <LogOut size={20} />
                  {isSidebarOpen && <span>Sign Out</span>}
              </button>
          </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Top Bar */}
          <header style={{ background: 'white', padding: '15px 30px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                  {MENU_ITEMS.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </div>
          </header>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              
              {activeTab === 'dashboard' && <CourseDashboard courses={courses} stats={stats} />}
              
              {activeTab === 'gate' && <GateReception courses={courses} refreshCourses={fetchCourses} />}
              
              {activeTab === 'gatekeeper' && <GatekeeperPanel courses={courses} />}
              
              {activeTab === 'checkin' && (
                  <StudentForm 
                      courses={courses} 
                      fetchStats={fetchStats} 
                      refreshCourses={fetchCourses}
                      preSelectedRoom={null}
                      clearRoom={()=>{}}
                  />
              )}
              
              {activeTab === 'students' && (
                  <ParticipantList 
                      courses={courses} 
                      refreshCourses={fetchCourses} 
                      userRole={user.role} 
                  />
              )}
              
              {activeTab === 'accommodation' && <GlobalAccommodationManager />}

              {/* ✅ MOVED THESE OUT OF ADMIN BLOCK SO STAFF CAN ACCESS */}
              {activeTab === 'at' && <ATPanel courses={courses} />}
              
              {activeTab === 'admin' && (
                  <CourseAdmin 
                      courses={courses} 
                      refreshCourses={fetchCourses} 
                      userRole={user.role} // Pass role to internal security
                  />
              )}
              
              {/* 🔒 STRICTLY ADMIN ONLY MODULES */}
              {user.role === 'admin' && (
                  <>
                      {activeTab === 'store' && <ExpenseTracker courses={courses} />}
                      {activeTab === 'seva' && <SevaBoard courses={courses} />}
                  </>
              )}

          </div>
      </main>
    </div>
  );
}

export default App;
