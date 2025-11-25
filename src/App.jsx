import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

// --- CONFIG ---
const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);
const PROTECTED_ROOMS = new Set(["301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"]);

// --- HELPERS ---
const getShortCourseName = (name) => {
  if (!name) return 'Unknown';
  if (name.includes('45-Day')) return '45D';
  if (name.includes('30-Day')) return '30D';
  if (name.includes('20-Day')) return '20D';
  if (name.includes('10-Day')) return '10D';
  if (name.includes('Satipatthana')) return 'ST';
  if (name.includes('Gratitude')) return 'GT';
  if (name.includes('Service')) return 'SVC';
  return 'OTH';
};

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const thPrint = { textAlign: 'left', padding: '10px', borderBottom: '1px solid #000' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);
    fetchCourses();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      alert('❌ Incorrect Passcode');
      setPinInput('');
    }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('admin_auth'); setView('dashboard'); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res => res.ok ? res.json() : []).then(data => Array.isArray(data) ? setCourses(data) : setCourses([])).catch(err => { console.error(err); setError("Connection Error"); }); };
  const handleRoomClick = (roomNo) => { setPreSelectedRoom(roomNo); setView('onboarding'); };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Center Admin</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Enter Passcode" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', textAlign: 'center' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .app-container { background: white !important; padding: 0 !important; } 
          body { font-size: 10pt; } 
          .print-male-only .female-section { display: none; }
          .print-female-only .male-section { display: none; }
        }
      `}</style>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Zero Day Dashboard</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>AT Panel</button>
          <button onClick={() => setView('room-view')} style={btnStyle(view === 'room-view')}>🛏️ Global Accommodation</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Student Onboarding</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('course-admin')} style={btnStyle(view === 'course-admin')}>⚙️ Course Admin</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>
      
      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'ta-panel' && <ATPanel courses={courses} />}
      {view === 'room-view' && <GlobalAccommodationManager courses={courses} onRoomClick={handleRoomClick} />}
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} refreshCourses={fetchCourses} />}
      {view === 'course-admin' && <CourseAdmin courses={courses} refreshCourses={fetchCourses} setView={setView} />}
    </div>
  );
}

// --- COMPONENTS ---
function Dashboard({ courses }) { /* ... same ... */ return <div>Dashboard (Use previous code if needed or standard logic)</div>; }
function ATPanel({ courses }) { /* ... same ... */ return <div>AT Panel</div>; }
function GlobalAccommodationManager({ courses, onRoomClick }) { /* ... same ... */ return <div>Accommodation</div>; }
function StudentForm({ courses, preSelectedRoom, clearRoom }) { /* ... same ... */ return <div>Form</div>; }
function ExpenseTracker() { return <div>Store</div>; }
function CourseAdmin() { return <div>Admin</div>; }

// --- 4. MANAGE STUDENTS (UPDATED FOR DRAG DROP & PRINT) ---
function ParticipantList({ courses, refreshCourses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [viewMode, setViewMode] = useState('list');
  const [printMode, setPrintMode] = useState(''); // '', 'male', 'female'
  const [draggedStudent, setDraggedStudent] = useState(null);

  const loadStudents = () => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : [])); };
  useEffect(loadStudents, [courseId]);

  // --- DRAG & DROP LOGIC ---
  const handleDrop = async (targetSeat, targetStudent) => {
      if (!draggedStudent) return;
      // If dropped on occupied seat, swap. If empty, move.
      if (targetStudent) {
          if(!window.confirm(`Swap ${draggedStudent.full_name} with ${targetStudent.full_name}?`)) return;
          // Swap
          const seatA = draggedStudent.dhamma_hall_seat_no;
          const seatB = targetSeat;
          await fetch(`${API_URL}/participants/${draggedStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...draggedStudent, dhamma_hall_seat_no: seatB}) });
          await fetch(`${API_URL}/participants/${targetStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...targetStudent, dhamma_hall_seat_no: seatA}) });
      } else {
          // Move
          await fetch(`${API_URL}/participants/${draggedStudent.participant_id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...draggedStudent, dhamma_hall_seat_no: targetSeat}) });
      }
      setDraggedStudent(null);
      loadStudents();
  };

  // --- AUTO-ASSIGN ---
  const MALE_COLS=10; const MALE_ROWS=8; const FEMALE_COLS=7; const FEMALE_ROWS=7;
  const handleAutoAssign = () => {
      if(!window.confirm("Overwrite Seats?")) return;
      setTimeout(async () => {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const all = await res.json();
          let males = all.filter(p => p.gender==='Male' && !p.conf_no.startsWith('SM') && p.status!=='Cancelled');
          let females = all.filter(p => p.gender==='Female' && !p.conf_no.startsWith('SF') && p.status!=='Cancelled');
          
          // Sort: Old (Seniority) -> New (Age)
          const sorter = (a,b) => {
             const oldA = a.conf_no.startsWith('O'); const oldB = b.conf_no.startsWith('O');
             if(oldA && !oldB) return -1; if(!oldA && oldB) return 1;
             // Simplified seniority logic
             return 0; 
          };
          males.sort(sorter); females.sort(sorter);

          const updates = [];
          // Male: Fill A1, B1... J1 (Left to Right visually A-J)
          males.forEach((p, i) => {
              if (i < MALE_COLS * MALE_ROWS) {
                  const r = Math.floor(i / MALE_COLS) + 1; 
                  const c = i % MALE_COLS;
                  const char = String.fromCharCode(65 + c); // A, B, C...
                  updates.push({...p, dhamma_hall_seat_no: `${char}${r}`});
              }
          });
          // Female: A1...G1
          females.forEach((p, i) => {
              if (i < FEMALE_COLS * FEMALE_ROWS) {
                  const r = Math.floor(i / FEMALE_COLS) + 1; 
                  const c = i % FEMALE_COLS;
                  const char = String.fromCharCode(65 + c);
                  updates.push({...p, dhamma_hall_seat_no: `${char}${r}`});
              }
          });
          await Promise.all(updates.map(u => fetch(`${API_URL}/participants/${u.participant_id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)})));
          loadStudents();
      }, 50);
  };

  // --- RENDER SEAT ---
  const SeatBox = ({ p, label }) => {
      const isOld = p && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
      return (
          <div 
             draggable={!!p} 
             onDragStart={()=>setDraggedStudent(p)}
             onDragOver={e=>e.preventDefault()}
             onDrop={()=>handleDrop(label, p)}
             style={{
               border:'1px solid #999', 
               background: p ? (isOld ? '#fff9c4' : 'white') : '#f0f0f0', 
               height:'55px', 
               fontSize:'10px', 
               textAlign:'center', 
               display:'flex', 
               flexDirection:'column', 
               justifyContent:'center',
               cursor: p ? 'grab' : 'default'
             }}>
             {p ? (
               <>
                 <div style={{fontWeight:'bold', color:'blue'}}>{p.dhamma_hall_seat_no}</div>
                 <div style={{overflow:'hidden', whiteSpace:'nowrap'}}>{p.full_name.substring(0,10)}</div>
                 <div>{p.conf_no}</div>
               </>
             ) : <span style={{color:'#ccc'}}>{label}</span>}
          </div>
      );
  };

  if (viewMode === 'seating') {
      const males = participants.filter(p => p.gender==='Male');
      const females = participants.filter(p => p.gender==='Female');
      const maleMap={}; males.forEach(p=>maleMap[p.dhamma_hall_seat_no]=p);
      const femaleMap={}; females.forEach(p=>femaleMap[p.dhamma_hall_seat_no]=p);
      
      const renderGrid = (map, cols, rows) => {
          let grid = [];
          // Header Row (A B C D...)
          let headerCells = [<div key="empty"></div>];
          for(let c=0; c<cols; c++) headerCells.push(<div key={c} style={{textAlign:'center', fontWeight:'bold'}}>{String.fromCharCode(65+c)}</div>);
          grid.push(<div key="head" style={{display:'grid', gridTemplateColumns:`20px repeat(${cols}, 1fr)`, gap:'2px', marginBottom:'2px'}}>{headerCells}</div>);

          for(let r=1; r<=rows; r++) {
              let cells = [];
              cells.push(<div key={`row-${r}`} style={{display:'flex', alignItems:'center', fontWeight:'bold'}}>{r}</div>);
              for(let c=0; c<cols; c++) {
                  const label = `${String.fromCharCode(65+c)}${r}`;
                  cells.push(<SeatBox key={label} label={label} p={map[label]} />);
              }
              grid.push(<div key={r} style={{display:'grid', gridTemplateColumns:`20px repeat(${cols}, 1fr)`, gap:'2px', marginBottom:'2px'}}>{cells}</div>);
          }
          return grid;
      };

      const selectedCourse = courses.find(c=>c.course_id == courseId);
      const printClass = printMode === 'male' ? 'print-male-only' : printMode === 'female' ? 'print-female-only' : '';

      return (
        <div style={cardStyle} className={printClass}>
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
             <button onClick={()=>setViewMode('list')}>Back</button>
             <div style={{display:'flex', gap:'5px'}}>
               <button onClick={()=>setPrintMode('male')} style={quickBtnStyle(printMode==='male')}>Print Male</button>
               <button onClick={()=>setPrintMode('female')} style={quickBtnStyle(printMode==='female')}>Print Female</button>
               <button onClick={()=>{setPrintMode(''); setTimeout(()=>window.print(), 100);}} style={{...btnStyle(true)}}>Print All</button>
             </div>
          </div>
          <div className="print-area">
              <div style={{textAlign:'center', marginBottom:'20px'}}>
                 <h1>DHAMMA HALL SEATING</h1>
                 <h3>{selectedCourse?.course_name} (Start: {selectedCourse?.start_date})</h3>
                 <h4>Teacher: {selectedCourse?.teacher_name}</h4>
              </div>
              <div style={{display:'flex', gap:'30px'}}>
                 <div className="male-section" style={{flex:1}}>
                    <h3 style={{textAlign:'center', background:'#e3f2fd'}}>MALE (10x8)</h3>
                    {renderGrid(maleMap, 10, 8)}
                    <div style={{marginTop:'20px', borderTop:'2px dashed #ccc'}}>
                        <h4>Special (K1-K8)</h4>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:'2px'}}>
                           {Array.from({length:8}, (_,i) => <SeatBox key={`K${i+1}`} label={`K${i+1}`} p={maleMap[`K${i+1}`]} />)}
                        </div>
                    </div>
                 </div>
                 <div className="female-section" style={{flex:0.8}}>
                    <h3 style={{textAlign:'center', background:'#fce4ec'}}>FEMALE (7x7)</h3>
                    {renderGrid(femaleMap, 7, 7)}
                 </div>
              </div>
          </div>
        </div>
      );
  }

  // Default list view
  return <div style={cardStyle}>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
         <select style={inputStyle} onChange={e=>setCourseId(e.target.value)}><option>Select Course</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         <button onClick={()=>setViewMode('seating')} style={btnStyle(true)}>Dhamma Hall Plan</button>
      </div>
      <div style={{padding:'20px', textAlign:'center', color:'#888'}}>Select a course to manage students.</div>
  </div>;
}
