import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Coffee, AlertTriangle, CheckCircle, Search, X, BedDouble } from 'lucide-react';
import { API_URL, styles } from '../config';

// --- CONFIGURATION 1: DN1 DINING ---
const DN1_CONFIG = {
  MALE: {
    color: '#1565c0', bg: '#e3f2fd',
    chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
    floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
  },
  FEMALE: {
    color: '#ad1457', bg: '#fce4ec',
    chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
    floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
  }
};

// --- CONFIGURATION 2: DORMITORY ROOMS (UPDATED) ---
const DORM_LAYOUT = {
  MALE: [
    // Pairs: 21 to 28 (A & E)
    'DORM-21A', 'DORM-21E', 'DORM-22A', 'DORM-22E', 
    'DORM-23A', 'DORM-23E', 'DORM-24A', 'DORM-24E', 
    'DORM-25A', 'DORM-25E', 'DORM-26A', 'DORM-26E', 
    'DORM-27A', 'DORM-27E', 'DORM-28A', 'DORM-28E'
  ],
  FEMALE: [
    // Dorm & Rooms
    'DORM-A', 'DORM-E', 'ROOM-1A', 'ROOM-1B', 'ROOM-2A', 'ROOM-2B',
    // 201-206 (AI/BI)
    '201AI', '201BI', '202AI', '202BI', '203AI', '203BI', 
    '204AI', '204BI', '205AI', '205BI', '206AI', '206BI',
    // 207-212 (AW/BW)
    '207AW', '207BW', '208AW', '208BW', '209AW', '209BW', 
    '210AW', '210BW', '211AW', '211BW', '212AW', '212BW'
  ]
};

export default function DN1StudentForm({ courses, userRole }) {
  // --- STATE ---
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Global Conflict Data
  const [globalOccupied, setGlobalOccupied] = useState({ dining: [], pagoda: [] });

  // Form Data
  const [formData, setFormData] = useState({ 
      courseId: '', courseName: '', 
      participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', seatType: 'Chair', confNo: '' 
  });
  
  // Visual Toggles
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [genderTab, setGenderTab] = useState('MALE'); // Controls both Room list and Dining Map

  // --- INITIAL DATA ---
  useEffect(() => { 
      fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms).catch(console.error); 
  }, []);

  // --- SYNC DATA ENGINE ---
  useEffect(() => { 
      if (formData.courseId) {
          const syncData = () => {
              fetch(`${API_URL}/courses/${formData.courseId}/participants`)
                .then(r=>r.json()).then(d => Array.isArray(d) && setParticipants(d)).catch(console.error);

              fetch(`${API_URL}/courses/${formData.courseId}/global-occupied`)
                .then(r=>r.json()).then(setGlobalOccupied).catch(console.error);

              fetch(`${API_URL}/rooms/occupancy`)
                .then(r=>r.json())
                .then(d => { if (Array.isArray(d)) setOccupancy(d); else setOccupancy([]); })
                .catch(err => { console.error(err); setOccupancy([]); });
          };
          syncData();
          const i = setInterval(syncData, 5000);
          return () => clearInterval(i);
      }
  }, [formData.courseId]);

  // --- HELPERS ---
  const handleCourseChange = (e) => {
      const newId = e.target.value;
      const newCourse = courses.find(c => String(c.course_id) === String(newId));
      setFormData(prev => ({ ...prev, courseId: newId, courseName: newCourse ? newCourse.course_name : '' }));
  };

  const selectStudent = (student) => {
      setSelectedStudent(student);
      const isFem = (student.gender || '').toLowerCase().startsWith('f');
      
      setGenderTab(isFem ? 'FEMALE' : 'MALE');
      
      setFormData(prev => ({ 
          ...prev, 
          participantId: student.participant_id, 
          confNo: student.conf_no || '', 
          seatNo: '', roomNo: '',
          courseId: student.courseId || prev.courseId,
          courseName: student.courseName || prev.courseName
      }));
      setSearchTerm(student.full_name);
      setIsSearching(false);
  };

  // --- ROOM HANDLER (INLINED) ---
  const handleRoomSelect = (roomNum) => {
      const occupantData = occupancy.find(r => r.room_no === roomNum);
      if (occupantData) return alert(`⛔ Room ${roomNum} is already occupied by ${occupantData.occupant_name || 'someone'}.`);
      setFormData(prev => ({ ...prev, roomNo: roomNum }));
      setShowVisualRoom(false);
  };

  // --- DINING HANDLER (INLINED) ---
  const occupiedSet = useMemo(() => {
    const set = new Set();
    if(globalOccupied.dining) globalOccupied.dining.forEach(i => i.seat && set.add(String(i.seat)));
    return set;
  }, [globalOccupied.dining]);

  // --- RENDERERS ---

  // 1. Render Dining Cell
  const renderDN1Cell = (num, type) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const config = DN1_CONFIG[genderTab];
    const isSelected = formData.seatNo === numStr;

    return (
      <div 
        key={`${type}-${num}`}
        onClick={() => {
            if(isOccupied) return;
            setFormData(p => ({...p, seatNo: numStr, seatType: type}));
            setShowVisualDining(false);
        }}
        style={{
          width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOccupied ? '#ffebee' : (isSelected ? '#333' : 'white'),
          color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'),
          border: isOccupied ? '1px solid #ef5350' : `1px solid ${config.color}`,
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          cursor: isOccupied ? 'not-allowed' : 'pointer', margin:'2px'
        }}
      >
        {num}
      </div>
    );
  };

  // 2. Render Dorm Room Cell
  const renderDormCell = (roomNum) => {
    const occupant = occupancy.find(r => r.room_no === roomNum);
    const isOccupied = !!occupant;
    const isSelected = formData.roomNo === roomNum;

    return (
        <div 
            key={roomNum}
            onClick={() => !isOccupied && handleRoomSelect(roomNum)}
            style={{
                width: '90px', padding:'10px 5px',
                background: isOccupied ? '#ffebee' : (isSelected ? '#e8f5e9' : 'white'),
                border: isOccupied ? '1px solid #ffcdd2' : (isSelected ? '2px solid #4caf50' : '1px solid #ccc'),
                borderRadius: '8px', cursor: isOccupied ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                margin: '5px'
            }}
        >
            <div style={{fontWeight:'bold', fontSize:'12px', color: isOccupied ? '#c62828' : '#333'}}>{roomNum}</div>
            {isOccupied && <div style={{fontSize:'9px', color:'#d32f2f', marginTop:'2px'}}>Occupied</div>}
            {!isOccupied && isSelected && <CheckCircle size={12} color="green" style={{marginTop:'2px'}}/>}
        </div>
    );
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.confNo) return alert("Missing ID");
      if (occupiedSet.has(formData.seatNo)) return alert("Seat already taken!");

      setStatus('Saving...');
      try {
          const payload = { ...formData, diningSeatType: formData.seatType, gender: selectedStudent?.gender };
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error("Check-in Failed");
          
          setTimeout(() => window.print(), 500);
          setStatus('✅ Success');
          
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', confNo: '' }));
          setSelectedStudent(null);
          setSearchTerm('');
          setTimeout(() => setStatus(''), 3000);
      } catch (err) {
          setStatus('❌ Error');
          alert(err.message);
      }
  };

  const searchResults = participants.filter(p => searchTerm && p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get current list of rooms based on gender
  const currentRoomList = DORM_LAYOUT[genderTab] || [];

  return (
    <div style={styles.card}>
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #1565c0', paddingBottom:'10px', marginBottom:'20px'}}>
        <h3 style={{margin:0, color:'#1565c0'}}>DN1 Operations Console</h3>
        {status && <span style={{fontWeight:'bold', color: status.includes('Success')?'green':'red'}}>{status}</span>}
      </div>

      <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
        <form onSubmit={handleSubmit}>
            <div style={{background:'#f1f8ff', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'10px'}}>
                    <div>
                        <label style={styles.label}>Course</label>
                        <select style={styles.input} onChange={handleCourseChange} value={formData.courseId}>
                             <option value="">-- Select --</option>
                             {courses.filter(c => c.owner_role === 'dn1ops' || userRole === 'admin').map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                        </select>
                    </div>
                    <div style={{position:'relative'}}>
                        <label style={styles.label}>Search Student</label>
                        <input style={styles.input} placeholder="Name / ID" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value); setIsSearching(true)}} disabled={!formData.courseId}/>
                        {isSearching && searchTerm && (
                            <div style={{position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #ccc', zIndex:100, maxHeight:'200px', overflowY:'auto'}}>
                                {searchResults.map(p => (
                                    <div key={p.participant_id} onClick={()=>selectStudent(p)} style={{padding:'8px', borderBottom:'1px solid #eee', cursor:'pointer', fontWeight:'bold'}}>
                                        {p.full_name} ({p.conf_no})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedStudent && (
                <div style={{animation:'fadeIn 0.3s'}}>
                    <div style={{marginBottom:'15px', padding:'10px', background:'#eee', borderRadius:'4px', display:'flex', gap:'15px'}}>
                         <strong>{selectedStudent.full_name}</strong>
                         <span>{selectedStudent.gender}</span>
                         <span>Age: {selectedStudent.age}</span>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'20px'}}>
                        {/* ROOM SELECTOR */}
                        <div style={{border:'2px solid #ddd', borderRadius:'8px', padding:'15px'}}>
                            <h4 style={{marginTop:0, display:'flex', alignItems:'center', gap:'5px'}}><MapPin size={16}/> Dormitory / Room</h4>
                            <button type="button" onClick={()=>setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', fontWeight:'bold', cursor:'pointer', background: formData.roomNo ? '#e8f5e9' : 'white'}}>
                                {formData.roomNo || "Select Bed"}
                            </button>
                        </div>
                        {/* DINING SELECTOR */}
                        <div style={{border:'2px solid #ddd', borderRadius:'8px', padding:'15px'}}>
                            <h4 style={{marginTop:0, display:'flex', alignItems:'center', gap:'5px'}}><Coffee size={16}/> DN1 Seat</h4>
                            <button type="button" onClick={()=>setShowVisualDining(true)} style={{...styles.input, textAlign:'left', fontWeight:'bold', cursor:'pointer', background: formData.seatNo ? '#e3f2fd' : 'white'}}>
                                {formData.seatNo ? `${formData.seatNo} (${formData.seatType})` : "Select Seat"}
                            </button>
                        </div>
                    </div>

                    <button type="submit" style={{width:'100%', padding:'15px', background:'#1565c0', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', fontSize:'16px', cursor:'pointer'}}>
                        CONFIRM & PRINT
                    </button>
                </div>
            )}
        </form>

        {selectedStudent && (
            <div className="no-print" style={{border:'2px solid #333', padding:'15px', background:'white'}}>
                <h4 style={{textAlign:'center', borderBottom:'1px solid #ccc'}}>Receipt</h4>
                <p>Name: {selectedStudent.full_name}</p>
                <p>Room: {formData.roomNo || '-'}</p>
                <p>DN1 Seat: {formData.seatNo || '-'}</p>
            </div>
        )}
      </div>

      {/* --- MODAL: DORM ROOMS (Updated) --- */}
      {showVisualRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
             <div style={{background:'white', flex:1, borderRadius:'8px', padding:'20px', overflow:'auto'}}>
                 <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                     <h3 style={{display:'flex', alignItems:'center', gap:'10px'}}><BedDouble/> Select {genderTab === 'MALE' ? 'Male' : 'Female'} Bed</h3>
                     <button onClick={()=>setShowVisualRoom(false)}><X/></button>
                 </div>
                 
                 {/* Auto-switches based on Gender */}
                 <div style={{padding:'20px', background:'#f5f5f5', borderRadius:'8px', textAlign:'center'}}>
                    <div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px'}}>
                        {currentRoomList.map(roomNum => renderDormCell(roomNum))}
                    </div>
                 </div>
             </div>
          </div>
      )}

      {/* --- MODAL: DINING (DN1 Grid) --- */}
      {showVisualDining && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
             <div style={{background:'white', flex:1, borderRadius:'8px', padding:'20px', overflow:'auto'}}>
                 <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                     <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <h3>Select DN1 Seat ({genderTab})</h3>
                     </div>
                     <button onClick={()=>setShowVisualDining(false)}><X/></button>
                 </div>
                 
                 <div style={{textAlign:'center', background: DN1_CONFIG[genderTab].bg, padding:'20px', borderRadius:'8px'}}>
                     <div style={{display:'flex', justifyContent:'center', gap:'40px'}}>
                         <div>
                             <strong>FLOOR</strong>
                             <div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{DN1_CONFIG[genderTab].floor.flat().map(n => renderDN1Cell(n, 'Floor'))}</div>
                         </div>
                         <div>
                             <strong>CHAIRS</strong>
                             <div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{DN1_CONFIG[genderTab].chairs.flat().map(n => renderDN1Cell(n, 'Chair'))}</div>
                         </div>
                     </div>
                 </div>

             </div>
          </div>
      )}
    </div>
  );
}
