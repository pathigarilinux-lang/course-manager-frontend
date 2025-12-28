import React, { useState, useEffect } from 'react';
import { BedDouble, Users, UserPlus, LayoutDashboard, Database, LogOut } from 'lucide-react';
import Login from './Login'; // ✅ Import Login Component
import CourseAdmin from './components/CourseAdmin';
import StudentForm from './components/StudentForm';
import GlobalAccommodationManager from './components/GlobalAccommodationManager';
import ParticipantList from './components/ParticipantList';
import { API_URL, styles } from './config';

function App() {
  // ✅ User State for Authentication
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('checkin');
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ 
      attending: 0, gate_checkin: 0, no_response: 0, cancelled: 0,
      om: 0, nm: 0, sm: 0, 
      of: 0, nf: 0, sf: 0,
      attending_m: 0, attending_f: 0,
      gate_m: 0, gate_f: 0,
      pending_m: 0, pending_f: 0
  });

  const fetchCourses = async () => {
      try {
          const res = await fetch(`${API_URL}/courses`);
          const data = await res.json();
          setCourses(data);
      } catch (e) { console.error("Failed to fetch courses"); }
  };

  const fetchStats = async () => {
      if(courses.length > 0) {
          try {
              // Fetch stats for the most recent active course (usually first one)
              const res = await fetch(`${API_URL}/courses/${courses[0].course_id}/stats`);
              setStats(await res.json());
          } catch(e) { console.error("Failed to fetch stats"); }
      }
  };

  useEffect(() => {
      fetchCourses();
  }, []);

  useEffect(() => {
      if(courses.length > 0) fetchStats();
  }, [courses]);

  // ✅ IF NOT LOGGED IN, SHOW LOGIN SCREEN
  if (!user) {
      return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="App" style={{ fontFamily: 'Segoe UI, sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ background: '#fff', padding: '15px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #007bff, #0056b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>DS</div>
            <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', fontWeight: '800' }}>Dhamma Seva</h1>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>Registration & Accommodation System</div>
            </div>
        </div>
        
        {/* NAV & USER PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '5px', borderRadius: '30px', border: '1px solid #eee' }}>
                <button onClick={() => setActiveTab('checkin')} style={activeTab === 'checkin' ? styles.navActive : styles.navBtn}>
                    <UserPlus size={18} /> Onboarding
                </button>
                <button onClick={() => setActiveTab('students')} style={activeTab === 'students' ? styles.navActive : styles.navBtn}>
                    <Users size={18} /> Manage Students
                </button>
                <button onClick={() => setActiveTab('accommodation')} style={activeTab === 'accommodation' ? styles.navActive : styles.navBtn}>
                    <BedDouble size={18} /> Room Manager
                </button>
                <button onClick={() => setActiveTab('admin')} style={activeTab === 'admin' ? styles.navActive : styles.navBtn}>
                    <Database size={18} /> Course Admin
                </button>
            </div>

            <div style={{height:'30px', width:'1px', background:'#ddd'}}></div>

            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#333'}}>{user.username}</div>
                    <div style={{fontSize:'11px', color:'#777', textTransform:'uppercase'}}>{user.role}</div>
                </div>
                <button onClick={() => setUser(null)} title="Logout" style={{background:'#ffebee', color:'#c62828', border:'none', borderRadius:'50%', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                    <LogOut size={16}/>
                </button>
            </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {activeTab === 'checkin' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 350px', gap:'30px'}}>
                <div>
                    <StudentForm courses={courses} fetchStats={fetchStats} refreshCourses={fetchCourses} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    {/* LIVE STATS CARD */}
                    <div style={{background:'linear-gradient(135deg, #0d47a1, #1976d2)', borderRadius:'16px', padding:'25px', color:'white', boxShadow:'0 10px 30px rgba(13, 71, 161, 0.3)'}}>
                        <div style={{fontSize:'12px', opacity:0.8, textTransform:'uppercase', fontWeight:'bold', marginBottom:'5px'}}>Total Arrival</div>
                        <div style={{fontSize:'48px', fontWeight:'800', lineHeight:1}}>{stats.attending + stats.gate_checkin}</div>
                        <div style={{fontSize:'14px', opacity:0.9, marginTop:'5px'}}>of {stats.attending + stats.gate_checkin + stats.no_response} expected</div>
                        
                        <div style={{marginTop:'25px', display:'flex', gap:'15px'}}>
                            <div style={{flex:1, background:'rgba(255,255,255,0.1)', padding:'10px', borderRadius:'10px'}}>
                                <div style={{fontSize:'11px', opacity:0.8}}>MALE</div>
                                <div style={{fontSize:'20px', fontWeight:'bold'}}>{stats.attending_m + stats.gate_m}</div>
                            </div>
                            <div style={{flex:1, background:'rgba(255,255,255,0.1)', padding:'10px', borderRadius:'10px'}}>
                                <div style={{fontSize:'11px', opacity:0.8}}>FEMALE</div>
                                <div style={{fontSize:'20px', fontWeight:'bold'}}>{stats.attending_f + stats.gate_f}</div>
                            </div>
                        </div>
                    </div>

                    {/* GATE STATUS CARD */}
                    <div style={{background:'white', borderRadius:'16px', padding:'20px', border:'1px solid #eee', boxShadow:'0 5px 15px rgba(0,0,0,0.03)'}}>
                        <h4 style={{margin:'0 0 15px 0', color:'#555', fontSize:'14px', textTransform:'uppercase'}}>At the Gate</h4>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                            <span style={{fontSize:'24px', fontWeight:'bold', color:'#f57c00'}}>{stats.gate_checkin}</span>
                            <span style={{fontSize:'12px', color:'#777'}}>Waiting for Room</span>
                        </div>
                        <div style={{height:'6px', width:'100%', background:'#eee', borderRadius:'3px', overflow:'hidden'}}>
                            <div style={{height:'100%', width: `${(stats.gate_checkin / (stats.attending + stats.gate_checkin + 1))*100}%`, background:'#f57c00'}}></div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <ParticipantList 
                courses={courses} 
                refreshCourses={fetchCourses} 
                userRole={user.role} // ✅ PASS ROLE
            />
        )}

        {activeTab === 'accommodation' && (
            <GlobalAccommodationManager />
        )}

        {activeTab === 'admin' && (
            <CourseAdmin 
                courses={courses} 
                refreshCourses={fetchCourses} 
                userRole={user.role} // ✅ PASS ROLE
            />
        )}

      </main>
    </div>
  );
}

export default App;
