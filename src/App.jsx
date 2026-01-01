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

function App() {
  const [user, setUser] = useState(() => {
      try {
          const savedUser = localStorage.getItem('dhammaUser');
          return savedUser ? JSON.parse(savedUser) : null;
      } catch (e) { return null; }
  });

  // ✅ LOGIC: If 'gate' user, default directly to 'gate' tab
  const [activeTab, setActiveTab] = useState(user?.role === 'gate' ? 'gate' : 'dashboard');
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [courses, setCourses] = useState([]); 
  const [stats, setStats] = useState({});

  const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem('dhammaUser', JSON.stringify(userData));
      // ✅ Redirect Gate users immediately
      setActiveTab(userData.role === 'gate' ? 'gate' : 'dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('dhammaUser');
      setActiveTab('dashboard');
  };

  const fetchCourses = async () => {
      try {
          const res = await fetch(`${API_URL}/courses`); 
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
      } catch (err) { console.error("Fetch Error:", err); setCourses([]); }
  };

  const fetchStats = async () => {
      try {
          const res = await fetch(`${API_URL}/stats`);
          const data = await res.json();
          setStats(data);
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      if (user) {
          fetchCourses();
          fetchStats();
      }
  }, [user]);

  if (!user) return <Login onLogin={handleLogin} />;

  // --- SIDEBAR NAVIGATION HELPER ---
  const NavItem = ({ id, label, icon: Icon, roles = [] }) => {
      // ✅ If roles array is empty, everyone sees it. 
      // ✅ If roles array has values, USER MUST BE IN IT.
      if (roles.length > 0 && !roles.includes(user.role)) return null;
      
      return (
          <button
              onClick={() => { setActiveTab(id); if (window.innerWidth <= 768) setSidebarOpen(false); }}
              style={{
                  ...styles.navItem,
                  background: activeTab === id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  padding: isSidebarOpen ? '12px 20px' : '12px',
              }}
              title={label}
          >
              <Icon size={20} />
              {isSidebarOpen && <span>{label}</span>}
          </button>
      );
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* MOBILE HEADER */}
      <div className="mobile-header" style={{display: 'none', padding: '15px', background: '#2c3e50', color: 'white', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{background:'none', border:'none', color:'white'}}><Menu size={24}/></button>
              <h3 style={{margin:0}}>Dhamma Nagajjuna</h3>
          </div>
      </div>

      <aside style={{
          ...styles.sidebar,
          width: isSidebarOpen ? '260px' : '70px',
          transform: (window.innerWidth <= 768 && !isSidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
          position: window.innerWidth <= 768 ? 'fixed' : 'relative',
          zIndex: 1000, transition: 'width 0.3s ease'
      }}>
          <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
              {isSidebarOpen ? <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Dhamma Seva</h2> : <Heart size={28}/>}
              {isSidebarOpen && <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>{user.role === 'gate' ? 'Gate Access' : user.role}</div>}
          </div>

          <nav style={{ flex: 1, overflowY: 'auto' }}>
              {/* ✅ VISIBILITY RULES:
                  - 'gate' user sees ONLY Gate tab.
                  - 'dn1ops' sees Gate + others (if you kept previous logic).
                  - 'admin'/'staff' see standard tabs.
              */}
              
              <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} roles={['admin', 'staff', 'dn1ops']} />
              
              {/* ✅ GATE TAB: Visible to EVERYONE (including 'gate' role) */}
              <NavItem id="gate" label="Gate / Reception" icon={UserCheck} roles={['admin', 'staff', 'dn1ops', 'gate']} />
              
              <NavItem id="checkin" label="Check-In" icon={UserPlus} roles={['admin', 'staff', 'dn1ops']} />
              <NavItem id="students" label="Participants" icon={Users} roles={['admin', 'staff', 'dn1ops']} />
              <NavItem id="accommodation" label="Accommodation" icon={BedDouble} roles={['admin', 'staff']} />
              <NavItem id="at" label="AT / Teacher" icon={GraduationCap} roles={['admin', 'staff', 'dn1ops']} />
              <NavItem id="store" label="Store / Expenses" icon={ShoppingBag} roles={['admin', 'staff', 'dn1ops']} />
              <NavItem id="seva" label="Seva Board" icon={Heart} roles={['admin', 'staff', 'dn1ops', 'gate']} />
              <NavItem id="admin" label="Course Admin" icon={Database} roles={['admin', 'staff', 'dn1ops']} />
          </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f4f6f9' }}>
          <header style={{ background: 'white', padding: '15px 30px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
                  {activeTab === 'gate' ? 'Gate Reception' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              
              {user && (
                  <button onClick={handleLogout} style={{background:'#ffebee', color:'#c62828', border:'none', padding:'8px 12px', borderRadius:'50%', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                      <LogOut size={16}/>
                  </button>
              )}
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {activeTab === 'dashboard' && <CourseDashboard courses={courses} stats={stats} />}
              
              {/* ✅ GATE: Pass 'gate' role logic down */}
              {activeTab === 'gate' && <GateReception courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              
              {activeTab === 'checkin' && <StudentForm courses={courses || []} fetchStats={fetchStats} refreshCourses={fetchCourses} preSelectedRoom={null} clearRoom={()=>{}} userRole={user.role} />}
              {activeTab === 'students' && <ParticipantList courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              {activeTab === 'accommodation' && <GlobalAccommodationManager />}
              {activeTab === 'at' && <ATPanel courses={courses} />}
              {activeTab === 'admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} userRole={user.role} />}
              {activeTab === 'seva' && <SevaBoard courses={courses} />}
              
              {(user.role === 'admin' || user.role === 'staff' || user.role === 'dn1ops') && activeTab === 'store' && <ExpenseTracker courses={courses} />}
          </div>
      </main>
    </div>
  );
}

export default App;
