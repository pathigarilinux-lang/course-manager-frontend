import React, { useState, useEffect } from 'react';
import { BedDouble, Users, UserPlus, LayoutDashboard, Database, LogOut } from 'lucide-react';

// ✅ CORRECTED IMPORTS (Pointing to components folder)
import Login from './components/Login'; 
import CourseAdmin from './components/CourseAdmin';
import StudentForm from './components/StudentForm';
import ParticipantList from './components/ParticipantList';
// Ensure this file exists (see Step 2 below if you don't have it)
import GlobalAccommodationManager from './components/GlobalAccommodationManager'; 

import { API_URL, styles } from './config';

function App() {
  const [user, setUser] = useState(null); // Auth State
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

  // ✅ 1. LOGIN SCREEN
  if (!user) {
      return <Login onLogin={(u) => setUser(u)} />;
  }

  // ✅ 2. MAIN APP (Only renders if user is logged in)
  return (
    <div className="App" style={{ fontFamily: 'Segoe UI, sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ background: '#fff', padding: '15px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #007bff, #0056b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>DS</div>
            <div>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#2c3e50', fontWeight: '800' }}>Dhamma Seva</h1>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>Logged in as: {user.username} ({user.role})</div>
            </div>
        </div>
        
        {/* NAVIGATION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '5px', borderRadius: '30px', border: '1px solid #eee' }}>
                <button onClick={() => setActiveTab('checkin')} style={activeTab === 'checkin' ? (styles.navActive || {background:'#007bff', color:'white', padding:'8px 15px', borderRadius:'20px', border:'none'}) : (styles.navBtn || {background:'transparent', color:'#555', padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer'})}>
                    <UserPlus size={18} style={{marginRight:'5px', verticalAlign:'middle'}}/> Onboarding
                </button>
                <button onClick={() => setActiveTab('students')} style={activeTab === 'students' ? (styles.navActive || {background:'#007bff', color:'white', padding:'8px 15px', borderRadius:'20px', border:'none'}) : (styles.navBtn || {background:'transparent', color:'#555', padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer'})}>
                    <Users size={18} style={{marginRight:'5px', verticalAlign:'middle'}}/> Students
                </button>
                <button onClick={() => setActiveTab('accommodation')} style={activeTab === 'accommodation' ? (styles.navActive || {background:'#007bff', color:'white', padding:'8px 15px', borderRadius:'20px', border:'none'}) : (styles.navBtn || {background:'transparent', color:'#555', padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer'})}>
                    <BedDouble size={18} style={{marginRight:'5px', verticalAlign:'middle'}}/> Rooms
                </button>
                <button onClick={() => setActiveTab('admin')} style={activeTab === 'admin' ? (styles.navActive || {background:'#007bff', color:'white', padding:'8px 15px', borderRadius:'20px', border:'none'}) : (styles.navBtn || {background:'transparent', color:'#555', padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer'})}>
                    <Database size={18} style={{marginRight:'5px', verticalAlign:'middle'}}/> Admin
                </button>
            </div>

            <div style={{height:'30px', width:'1px', background:'#ddd'}}></div>

            <button onClick={() => setUser(null)} title="Logout" style={{background:'#ffebee', color:'#c62828', border:'none', borderRadius:'50%', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
                <LogOut size={16}/>
            </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* --- MODULE 1: ONBOARDING / RECEPTION --- */}
        {activeTab === 'checkin' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 350px', gap:'30px'}}>
                <div>
                    <StudentForm courses={courses} fetchStats={fetchStats} refreshCourses={fetchCourses} />
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    {/* DASHBOARD STATS */}
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
                    {/* GATE STATUS */}
                    <div style={{background:'white', borderRadius:'16px', padding:'20px', border:'1px solid #eee', boxShadow:'0 5px 15px rgba(0,0,0,0.03)'}}>
                        <h4 style={{margin:'0 0 15px 0', color:'#555', fontSize:'14px', textTransform:'uppercase'}}>At the Gate</h4>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                            <span style={{fontSize:'24px', fontWeight:'bold', color:'#f57c00'}}>{stats.gate_checkin}</span>
                            <span style={{fontSize:'12px', color:'#777'}}>Waiting for Room</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODULE 2: STUDENTS --- */}
        {activeTab === 'students' && (
            <ParticipantList 
                courses={courses} 
                refreshCourses={fetchCourses} 
                userRole={user.role} // ✅ Pass Role
            />
        )}

        {/* --- MODULE 3: ROOMS --- */}
        {activeTab === 'accommodation' && (
            <GlobalAccommodationManager />
        )}

        {/* --- MODULE 4: ADMIN / STORE --- */}
        {activeTab === 'admin' && (
            <CourseAdmin 
                courses={courses} 
                refreshCourses={fetchCourses} 
                userRole={user.role} // ✅ Pass Role
            />
        )}

      </main>
    </div>
  );
}

export default App;
