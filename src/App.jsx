import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { 
  Users, Upload, Save, Database, AlertTriangle, CheckCircle, 
  Search, Home, Coffee, FileText, Trash2, X, Edit, Plus,
  CreditCard, DollarSign, Download, Calendar, Printer, Settings,
  LayoutGrid, LogOut, Utensils, MapPin, UserCheck, History, Eye, EyeOff
} from 'lucide-react';

// --- IMPORTS ---
import DiningLayout from './DiningLayout';
import PagodaLayout from './PagodaLayout';

// --- CONFIGURATION ---
const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 
const ADMIN_PASSCODE = "0000"; 
const GATEKEEPER_PASSCODE = "1111";
const TEACHER_PASSCODE = "2222";

const LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi", 
  "French", "German", "Spanish", "Russian", "Chinese", "Mandarin Chinese", 
  "Japanese", "Thai", "Burmese", "Sinhala", "Nepali", 
  "Portuguese", "Vietnamese"
];

// --- STYLES ---
const btnStyle = (isActive) => ({ 
  padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', 
  cursor: 'pointer', background: isActive ? '#007bff' : '#fff', 
  color: isActive ? 'white' : '#555', fontWeight: '600', fontSize:'13px', 
  display:'flex', alignItems:'center', gap:'5px' 
});
const quickBtnStyle = (isActive) => ({ 
  padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', 
  background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', 
  cursor: 'pointer', fontSize: '13px' 
});
const toolBtn = (bg) => ({ 
  padding: '8px 16px', border: 'none', borderRadius: '20px', 
  background: bg, color: 'white', cursor: 'pointer', 
  fontSize: '13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px' 
});
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };

// --- MAIN APP COMPONENT ---
export default function App() {
  const [authLevel, setAuthLevel] = useState('none');
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [preSelectedRoom, setPreSelectedRoom] = useState('');

  useEffect(() => {
    const savedLevel = localStorage.getItem('auth_level');
    if (savedLevel) setAuthLevel(savedLevel);
    fetchCourses();
  }, []);

  const fetchCourses = () => { 
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => { console.error(err); setError("Connection Error"); });
  };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PASSCODE) { setAuthLevel('admin'); localStorage.setItem('auth_level', 'admin'); } 
    else if (pinInput === GATEKEEPER_PASSCODE) { setAuthLevel('gatekeeper'); localStorage.setItem('auth_level', 'gatekeeper'); setView('gate-panel'); } 
    else if (pinInput === TEACHER_PASSCODE) { setAuthLevel('teacher'); localStorage.setItem('auth_level', 'teacher'); setView('ta-panel'); } 
    else { alert('❌ Incorrect Passcode'); setPinInput(''); }
  };
  
  const handleLogout = () => { setAuthLevel('none'); localStorage.removeItem('auth_level'); setView('dashboard'); setPinInput(''); };

  // --- STUDENT FORM COMPONENT ---
  function StudentForm({ courses, preSelectedRoom, clearRoom }) {
    const [participants, setParticipants] = useState([]); 
    const [rooms, setRooms] = useState([]);
    const [occupancy, setOccupancy] = useState([]); 
    const [selectedStudent, setSelectedStudent] = useState(null); 
    const [status, setStatus] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [printData, setPrintData] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({ 
        courseId: '', participantId: '', roomNo: '', seatNo: '', 
        laundryToken: '', mobileLocker: '', valuablesLocker: '', 
        language: 'English', pagodaCell: '', laptop: 'No', 
        confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
    });
    
    // Visual Modal States
    const [showVisualRoom, setShowVisualRoom] = useState(false);
    const [showVisualDining, setShowVisualDining] = useState(false);
    const [showVisualPagoda, setShowVisualPagoda] = useState(false);

    // Helpers
    const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);

    // Effects
    useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); }, []);
    useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
    useEffect(() => { if (formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); }, [formData.courseId]);

    // Derived Logic
    const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
    const cleanNum = (val) => val ? String(val).trim() : '';
    const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
    const currentGender = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
    const isMale = currentGender.startsWith('m'); 
    const isFemale = currentGender.startsWith('f');

    // Filter Rooms by Gender
    let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
    if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
    else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

    // Calculate Occupied Sets for Visual Grids
    const allRecords = [...occupancy, ...participants].filter(p => String(p.participant_id) !== String(formData.participantId) && p.status !== 'Cancelled');
    const usedDining = new Set();
    const usedPagoda = new Set();
    allRecords.forEach(p => { 
        if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); 
        if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); 
    });

    const handleStudentChange = (e) => { 
        const selectedId = e.target.value; 
        const student = participants.find(p => p.participant_id == selectedId); 
        setSelectedStudent(student);
        setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '' })); 
    };

    // LOGIC UPDATE: Dining Seat syncs Mobile & Valuables only. Laundry is INDEPENDENT.
    const handleDiningSeatChange = (val) => { 
        setFormData(prev => ({ 
            ...prev, 
            seatNo: val, 
            mobileLocker: val, 
            valuablesLocker: val
            // laundryToken is NOT touched
        })); 
        setShowVisualDining(false);
    };

    const handlePagodaSelect = (val) => {
        setFormData(prev => ({ ...prev, pagodaCell: val }));
        setShowVisualPagoda(false);
    };

    const triggerPrint = () => { setShowReceipt(true); setTimeout(() => { window.print(); }, 500); };

    // Visual Room Selector Component
    const VisualSelector = ({ title, options, occupied, selected, onSelect, onClose }) => (
      <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'80%', maxHeight:'80vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3>Select {title}</h3><button onClick={onClose}>Close</button></div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px'}}>
                  {options.map(opt => {
                      const isOcc = occupied.has(String(opt));
                      const isSel = String(selected) === String(opt);
                      return (
                          <button key={opt} type="button" onClick={() => !isOcc && onSelect(opt)} disabled={isOcc}
                              style={{padding:'10px', borderRadius:'5px', border:'none', cursor: isOcc?'not-allowed':'pointer', background: isOcc ? '#ffcdd2' : isSel ? '#007bff' : '#c8e6c9', color: isSel?'white':'black', fontWeight:'bold'}}>
                              {opt}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
    );

    const handleSubmit = async (e) => { 
        e.preventDefault();
        if (!formData.confNo) return alert("Missing Conf No");
        setStatus('Submitting...');
        try { 
            const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, diningSeatType: formData.seatType }) });
            if (!res.ok) throw new Error("Check-in failed"); 
            await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
            
            setStatus('✅ Success!'); window.scrollTo(0, 0);
            const courseObj = courses.find(c => c.course_id == formData.courseId);
            
            // Print Name Logic
            let cleanName = courseObj?.course_name || 'Unknown Course';
            cleanName = cleanName.replace(/-[A-Za-z]{3}-\d{2,4}.*$/g, '').replace(/\/.*$/, '').trim();

            const pData = { 
                courseName: cleanName, 
                teacherName: courseObj?.teacher_name || 'Goenka Ji', 
                from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', 
                to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', 
                studentName: selectedStudent?.full_name, 
                confNo: formData.confNo, 
                roomNo: formData.roomNo, seatNo: formData.seatNo, 
                lockers: formData.mobileLocker, 
                language: formData.language,
                pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null,
                special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null
            };
            setPrintData(pData);
            setShowReceipt(true);
            
            // Reset
            setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
            setSelectedStudent(null); clearRoom(); 
            fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); 
            fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
            setTimeout(() => setStatus(''), 5000);
        } catch (err) { setStatus(`❌ ${err.message}`); } 
    };

    return ( 
        <div style={{background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px'}}> 
        <h2>📝 Student Onboarding</h2> 
        {status && <div style={{padding:'10px', background:'#d4edda', color:'#155724', borderRadius:'6px', textAlign:'center', marginBottom:'15px'}}>{status}</div>}
        <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> 
            
            <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> 
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}> 
                <div>
                  <label style={labelStyle}>1. Select Course</label>
                  <select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
                </div> 
                <div>
                  <label style={labelStyle}>2. Select Student</label>
                  <select style={inputStyle} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required>
                    <option value="">-- Select --</option>
                    {participants.filter(p=>p.status!=='Attending').map(p => <option key={p.participant_id} value={p.participant_id}>{p.status === 'Gate Check-In' ? '⚠️ AT GATE: ' : ''}{p.full_name} ({p.conf_no||'No ID'})</option>)}
                  </select>
                </div> 
              </div>
              {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ ATTENTION:</strong> {selectedStudent.evening_food} {selectedStudent.medical_info}</div>)} 
            </div> 

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:'15px'}}> 
                <div><label style={labelStyle}>🆔 Conf No</label><input style={{...inputStyle}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} /></div> 
                <div><label style={labelStyle}>Age</label><input style={{...inputStyle, background:'#e9ecef'}} value={selectedStudent?.age || ''} disabled /></div>
                
                <div>
                    <label style={labelStyle}>Room</label>
                    <button type="button" onClick={() => setShowVisualRoom(true)} style={{...inputStyle, textAlign:'left', background: formData.roomNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.roomNo || "Select Room (Grid)"}</button>
                </div> 
                
                <div>
                    <label style={labelStyle}>Dining</label>
                    <div style={{display:'flex', gap:'5px'}}>
                        <select style={{...inputStyle, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                        <button type="button" onClick={() => setShowVisualDining(true)} style={{...inputStyle, textAlign:'left', background: formData.seatNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.seatNo || "--"}</button>
                    </div>
                </div> 
            </div> 

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
                <div><label style={labelStyle}>Mobile</label><input style={{...inputStyle, background:'#e9ecef', color:'#6c757d'}} value={formData.mobileLocker} readOnly /></div> 
                <div><label style={labelStyle}>Valuables</label><input style={{...inputStyle, background:'#e9ecef', color:'#6c757d'}} value={formData.valuablesLocker} readOnly /></div> 
                {/* Laundry Independent */}
                <div><label style={labelStyle}>Laundry</label><input style={{...inputStyle}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div> 
                <div><label style={labelStyle}>Laptop</label><select style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> 
            </div> 
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> 
                <div><label style={labelStyle}>Lang</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div> 
                <div>
                    <label style={labelStyle}>Pagoda</label>
                    <button type="button" onClick={() => setShowVisualPagoda(true)} style={{...inputStyle, textAlign:'left', background: formData.pagodaCell ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.pagodaCell || "Select Cell"}</button>
                </div>
                <div><label style={labelStyle}>DS Seat</label><input style={inputStyle} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} /></div>
                <div><label style={labelStyle}>Special</label><select style={inputStyle} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> 
            </div> 
            
            <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                <button type="button" onClick={triggerPrint} disabled={!selectedStudent} style={{padding:'12px 20px', background:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>🖨️ Reprint</button>
                <button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Confirm & Save</button>
            </div> 
        </form> 

        {/* Visual Modals */}
        {showVisualDining && <DiningLayout gender={isMale ? 'Male' : 'Female'} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
        {showVisualPagoda && <PagodaLayout gender={isMale ? 'Male' : 'Female'} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
        {showVisualRoom && <VisualSelector title="Room" options={availableRooms.map(r=>r.room_no)} occupied={occupiedRoomsSet} selected={formData.roomNo} onSelect={(val)=>{setFormData({...formData, roomNo:val}); setShowVisualRoom(false)}} onClose={()=>setShowVisualRoom(false)} />}

        {/* Receipt Print */}
        {showReceipt && printData && (
            <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}>
                    <button onClick={() => setShowReceipt(false)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button>
                    <div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}>
                        <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div>
                        <div style={{fontSize:'12px', marginBottom:'10px'}}>
                            <div><strong>Course:</strong> {printData.courseName}</div>
                            <div><strong>Teacher:</strong> {printData.teacherName}</div>
                            <div><strong>Dates:</strong> {printData.from} to {printData.to}</div>
                        </div>
                        <div style={{borderBottom:'1px solid black', margin:'10px 0'}}></div>
                        <div style={{fontSize:'16px', fontWeight:'bold', margin:'10px 0'}}><div>{printData.studentName}</div><div style={{fontSize:'14px'}}>Conf: {printData.confNo}</div></div>
                        <table style={{width:'100%', fontSize:'14px', border:'1px solid black', borderCollapse:'collapse'}}><tbody><tr><td style={{border:'1px solid black', padding:'5px'}}>Room</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.roomNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Dining</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.seatNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lockers</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.lockers}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lang</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.language}</td></tr>{printData.pagoda && <tr><td style={{border:'1px solid black', padding:'5px'}}>Pagoda</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.pagoda}</td></tr>}{printData.special && <tr><td style={{border:'1px solid black', padding:'5px'}}>Special</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.special}</td></tr>}</tbody></table>
                        <div style={{textAlign:'center', fontSize:'10px', fontStyle:'italic', marginTop:'10px'}}>*** Student Copy ***</div>
                    </div>
                    <div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button></div>
                </div>
                <style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; } @page { size: auto; margin: 0; } }`}</style>
            </div>
        )}
        </div> 
    );
  }

  // --- STANDARD RENDER ---
  if (authLevel === 'none') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontFamily: 'Segoe UI' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>Course Manager</h1>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Enter Passcode" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', textAlign: 'center' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Unlock</button>
          </form>
          <p style={{marginTop:'20px', fontSize:'12px', color:'#777'}}>0=Admin | 1=Gate | 2=Teacher</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setView('onboarding')} style={btnStyle(view === 'onboarding')}>📝 Onboarding</button>
          <button onClick={() => setView('gate-panel')} style={btnStyle(view === 'gate-panel')}>🚧 Gate</button>
          <button onClick={() => setView('ta-panel')} style={btnStyle(view === 'ta-panel')}>🧘 AT Panel</button>
        </div>
        <button onClick={handleLogout} style={{ ...btnStyle(false), border: '1px solid #dc3545', color: '#dc3545' }}>🔒 Logout</button>
      </nav>
      
      {view === 'onboarding' && <StudentForm courses={courses} preSelectedRoom={preSelectedRoom} clearRoom={() => setPreSelectedRoom('')} />}
      {view === 'dashboard' && <div style={{padding:'20px', textAlign:'center'}}><h3>Dashboard (Select Course to View Stats)</h3></div>}
      {view === 'gate-panel' && <div style={{padding:'20px'}}>Gatekeeper View</div>}
      {view === 'ta-panel' && <div style={{padding:'20px'}}>Teacher View</div>}
    </div>
  );
}
