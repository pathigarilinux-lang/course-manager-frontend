import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, MapPin, Coffee, AlertTriangle, CheckCircle, Search, X, BedDouble, Printer, Lock } from 'lucide-react';
import { API_URL, LANGUAGES, styles } from '../config';

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

// --- CONFIGURATION 2: DORMITORY ROOMS ---
const DORM_LAYOUT = {
  MALE: [
    'DORM-21A', 'DORM-21B', 'DORM-21C', 'DORM-21D', 'DORM-21E', 'DORM-21F',
    'DORM-22A', 'DORM-22B', 'DORM-22C', 'DORM-22D', 'DORM-22E', 'DORM-22F',
    'DORM-23A', 'DORM-23B', 'DORM-23C', 'DORM-23D', 'DORM-23E', 'DORM-23F',
    'DORM-24A', 'DORM-24B', 'DORM-24C', 'DORM-24D', 'DORM-24E', 'DORM-24F',
    'DORM-25A', 'DORM-25B', 'DORM-25C', 'DORM-25D', 'DORM-25E', 'DORM-25F',
    'DORM-26A', 'DORM-26B', 'DORM-26C', 'DORM-26D', 'DORM-26E', 'DORM-26F',
    'DORM-27A', 'DORM-27B', 'DORM-27C', 'DORM-27D', 'DORM-27E', 'DORM-27F',
    'DORM-28A', 'DORM-28B', 'DORM-28C', 'DORM-28D', 'DORM-28E', 'DORM-28F',
    'ROOM-1A', 'ROOM-1B', 'ROOM-2A', 'ROOM-2B', 'ROOM-3A', 'ROOM-3B'
  ],
  FEMALE: [
    // --- DORMITORIES (A-E) with 1-6 Suffix ---
    // DORM-A
    'DORM-A1', 'DORM-A2', 'DORM-A3', 'DORM-A4', 'DORM-A5', 'DORM-A6',
    // DORM-B
    'DORM-B1', 'DORM-B2', 'DORM-B3', 'DORM-B4', 'DORM-B5', 'DORM-B6',
    // DORM-C
    'DORM-C1', 'DORM-C2', 'DORM-C3', 'DORM-C4', 'DORM-C5', 'DORM-C6',
    // DORM-D
    'DORM-D1', 'DORM-D2', 'DORM-D3', 'DORM-D4', 'DORM-D5', 'DORM-D6',
    // DORM-E
    'DORM-E1', 'DORM-E2', 'DORM-E3', 'DORM-E4', 'DORM-E5', 'DORM-E6',
    
    // --- ROOMS (1, 2, 3) ---
    'ROOM-1A', 'ROOM-1B',
    'ROOM-2A', 'ROOM-2B',
    'ROOM-3A', 'ROOM-3B',
    // 201-206 (AI/BI)
    '201AI', '201BI', '202AI', '202BI', '203AI', '203BI', 
    '204AI', '204BI', '205AI', '205BI', '206AI', '206BI',
    // 207-212 (AW/BW)
    '207AW', '207BW', '208AW', '208BW', '209AW', '209BW', 
    '210AW', '210BW', '211AW', '211BW', '212AW', '212BW'
  ]
};

const NUMBER_OPTIONS = Array.from({ length: 200 }, (_, i) => String(i + 1));

// Helper: Extract Suffix
const getCourseSuffix = (courseName) => {
    if (!courseName) return '';
    const nameUpper = courseName.toUpperCase();
    const match = nameUpper.match(/(\d+)/); 
    if (match) return `-${match[1]}D`; 
    if (nameUpper.includes('SATIPATTHANA') || nameUpper.includes('STP')) return '-STP';
    if (nameUpper.includes('SERVICE') || nameUpper.includes('TSC')) return '-SVC';
    return ''; 
};

export default function DN1StudentForm({ courses, userRole }) {
  const [participants, setParticipants] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [globalOccupied, setGlobalOccupied] = useState({ dining: [], pagoda: [] });

  const [formData, setFormData] = useState({ 
      courseId: '', courseName: '', 
      participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', seatType: 'Chair', confNo: '', specialSeating: 'None' 
  });
  
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [genderTab, setGenderTab] = useState('MALE'); 

  // --- SYNC DATA ENGINE ---
  useEffect(() => { 
      if (formData.courseId) {
          const syncData = () => {
              fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(d=>Array.isArray(d)&&setParticipants(d)).catch(console.error);
              fetch(`${API_URL}/courses/${formData.courseId}/global-occupied`).then(r=>r.json()).then(setGlobalOccupied).catch(console.error);
              fetch(`${API_URL}/rooms/occupancy`).then(r=>r.json()).then(d => setOccupancy(Array.isArray(d) ? d : [])).catch(()=>setOccupancy([]));
          };
          syncData();
          const i = setInterval(syncData, 5000);
          return () => clearInterval(i);
      }
  }, [formData.courseId]);

  // AUTO-FILL LAUNDRY
  useEffect(() => {
      if (formData.confNo && formData.courseName) {
          const suffix = getCourseSuffix(formData.courseName);
          const autoToken = `${formData.confNo}${suffix}`;
          if (!formData.laundryToken || formData.laundryToken.includes(formData.confNo)) {
             setFormData(prev => ({ ...prev, laundryToken: autoToken }));
          }
      }
  }, [formData.confNo, formData.courseName]);

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

  const handleRoomSelect = (roomNum) => {
      const occupantData = occupancy.find(r => r.room_no === roomNum);
      if (occupantData) return alert(`⛔ Room ${roomNum} occupied by ${occupantData.occupant_name}`);
      setFormData(prev => ({ ...prev, roomNo: roomNum }));
      setShowVisualRoom(false);
  };

  const occupiedSet = useMemo(() => {
    const set = new Set();
    if(globalOccupied.dining) globalOccupied.dining.forEach(i => i.seat && set.add(String(i.seat)));
    return set;
  }, [globalOccupied.dining]);

  // --- PREPARE RECEIPT (IDENTICAL TO STANDARD FORM) ---
  const prepareReceipt = () => {
      const courseObj = courses.find(c => c.course_id == formData.courseId);
      let rawName = courseObj?.course_name || 'Unknown';
      let shortName = rawName.match(/(\d+)\s*-?\s*Day/i) ? `${rawName.match(/(\d+)\s*-?\s*Day/i)[1]}-Day Course` : rawName;
      setPrintReceiptData({ 
          courseName: shortName, teacherName: courseObj?.teacher_name || 'Teacher', 
          from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', 
          to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', 
          studentName: selectedStudent?.full_name, confNo: formData.confNo, roomNo: formData.roomNo, seatNo: formData.seatNo, 
          mobile: formData.mobileLocker || '-', valuables: formData.valuablesLocker || '-', laundry: formData.laundryToken, 
          language: formData.language, special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null,
          pagoda: null // Explicitly null for DN1
      });
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
          
          await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
          
          prepareReceipt(); 
          setTimeout(() => window.print(), 500);
          setStatus('✅ Success');
          
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', confNo: '', specialSeating: 'None' }));
          setSelectedStudent(null);
          setSearchTerm('');
          setTimeout(() => setStatus(''), 3000);
      } catch (err) {
          setStatus('❌ Error');
          alert(err.message);
      }
  };

  const searchResults = participants.filter(p => searchTerm && p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const currentRoomList = DORM_LAYOUT[genderTab] || [];
  
  const usedMobiles = new Set();
  const usedValuables = new Set();
  participants.forEach(p => { if(p.mobile_locker_no) usedMobiles.add(p.mobile_locker_no); if(p.valuables_locker_no) usedValuables.add(p.valuables_locker_no); });
  const availableMobiles = (NUMBER_OPTIONS || []).filter(n => !usedMobiles.has(String(n)) || String(n) === String(formData.mobileLocker));
  const availableValuables = (NUMBER_OPTIONS || []).filter(n => !usedValuables.has(String(n)) || String(n) === String(formData.valuablesLocker));
  const themeColor = genderTab === 'MALE' ? '#007bff' : '#e91e63';

  // --- RENDER HELPERS ---
  const renderDN1Cell = (num, type) => {
    const numStr = String(num); const isOccupied = occupiedSet.has(numStr); const config = DN1_CONFIG[genderTab]; const isSelected = formData.seatNo === numStr;
    return (
      <div key={`${type}-${num}`} onClick={() => { if(isOccupied) return; setFormData(p => ({...p, seatNo: numStr, seatType: type})); setShowVisualDining(false); }}
        style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isOccupied ? '#ffebee' : (isSelected ? '#333' : 'white'), color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'), border: isOccupied ? '1px solid #ef5350' : `1px solid ${config.color}`, borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: isOccupied ? 'not-allowed' : 'pointer', margin:'2px' }}>
        {num}
      </div>
    );
  };

  const renderDormCell = (roomNum) => {
    const occupant = occupancy.find(r => r.room_no === roomNum); const isOccupied = !!occupant; const isSelected = formData.roomNo === roomNum;
    return (
        <div key={roomNum} onClick={() => !isOccupied && handleRoomSelect(roomNum)} style={{ width: '85px', padding:'8px 4px', background: isOccupied ? '#ffebee' : (isSelected ? '#e8f5e9' : 'white'), border: isOccupied ? '1px solid #ffcdd2' : (isSelected ? '2px solid #4caf50' : '1px solid #ccc'), borderRadius: '6px', cursor: isOccupied ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '4px' }}>
            <div style={{fontWeight:'bold', fontSize:'11px', color: isOccupied ? '#c62828' : '#333'}}>{roomNum}</div>
            {!isOccupied && isSelected && <CheckCircle size={12} color="green" style={{marginTop:'2px'}}/>}
        </div>
    );
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`3px solid ${themeColor}`, paddingBottom:'10px', marginBottom:'20px'}}>
        <h3 style={{margin:0, color:themeColor, display:'flex', alignItems:'center', gap:'10px'}}><User/> DN1 Operations Console</h3>
        {status && <span style={{fontWeight:'bold', color: status.includes('Success')?'green':'red'}}>{status}</span>}
      </div>

      <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
        <form onSubmit={handleSubmit}>
            {/* SEARCH & COURSE */}
            <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'15px', border:'1px solid #eee'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px'}}>
                    <div>
                        <label style={{...styles.label, fontSize:'11px'}}>COURSE</label>
                        <select style={{...styles.input, padding:'8px'}} onChange={handleCourseChange} value={formData.courseId}>
                             <option value="">-- Select --</option>
                             {courses.filter(c => c.owner_role === 'dn1ops' || userRole === 'admin').map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                        </select>
                    </div>
                    <div style={{position:'relative'}}>
                        <label style={{...styles.label, fontSize:'11px'}}>FIND STUDENT</label>
                        <input style={{...styles.input, padding:'8px'}} placeholder="Name / ID" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value); setIsSearching(true)}} disabled={!formData.courseId}/>
                        {isSearching && searchTerm && (
                            <div style={{position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #ccc', zIndex:100, maxHeight:'200px', overflowY:'auto'}}>
                                {searchResults.map(p => (
                                    <div key={p.participant_id} onClick={()=>selectStudent(p)} style={{padding:'8px', borderBottom:'1px solid #eee', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}>
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
                    {/* INFO BAR */}
                    {selectedStudent.medical_info && (<div style={{background:'#fff3cd', borderLeft:'3px solid #ffc107', padding:'8px 12px', borderRadius:'4px', marginBottom:'10px', fontSize:'12px', color:'#856404', display:'flex', gap:'8px'}}><AlertTriangle size={16}/><span><strong>Medical:</strong> {selectedStudent.medical_info}</span></div>)}
                    <div style={{display:'flex', gap:'10px', marginBottom:'15px', fontSize:'12px'}}>
                        <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>ID:</strong> {formData.confNo}</div>
                        <div style={{background: themeColor, color:'white', padding:'6px 10px', borderRadius:'4px', fontWeight:'bold'}}>{selectedStudent.gender}</div>
                        <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>Age:</strong> {selectedStudent.age}</div>
                    </div>

                    {/* ROOM & DINING */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px'}}>
                            <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={14}/> Dorm/Room</h5>
                            <button type="button" onClick={()=>setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between'}}>
                                {formData.roomNo || "Select Bed"} {formData.roomNo && <CheckCircle size={14} color="green"/>}
                            </button>
                        </div>
                        <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px'}}>
                            <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px'}}><Coffee size={14}/> Dining (DN1)</h5>
                            <button type="button" onClick={()=>setShowVisualDining(true)} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', flex:1, background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer', width:'100%'}}>
                                {formData.seatNo ? `${formData.seatNo} (${formData.seatType})` : "Select Seat"}
                            </button>
                        </div>
                    </div>

                    {/* LOCKERS & LAUNDRY */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', marginBottom:'15px'}}>
                        <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Mobile</label><select style={{...styles.input, padding:'6px', fontSize:'12px'}} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                        <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Valuables</label><select style={{...styles.input, padding:'6px', fontSize:'12px'}} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                        <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Laundry</label><input style={{...styles.input, padding:'6px', fontSize:'12px', background:'#f0f8ff', fontWeight:'bold'}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token"/></div>
                    </div>

                    {/* EXTRAS */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', fontSize:'12px'}}>
                        <div><label style={{fontWeight:'bold', color:'#777'}}>Language</label><select style={{...styles.input, padding:'6px'}} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                        <div><label style={{fontWeight:'bold', color:'#777'}}>Special Seat</label><select style={{...styles.input, padding:'6px'}} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="None">None</option><option value="Chair">Chair</option><option value="Chowky">Chowky</option></select></div>
                    </div>

                    <button type="submit" style={{width:'100%', marginTop:'20px', padding:'12px', background:'#28a745', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', fontSize:'14px', cursor:'pointer'}}>CONFIRM & PRINT</button>
                </div>
            )}
        </form>

        {/* --- ARRIVAL PASS PREVIEW (IDENTICAL TO STANDARD FORM) --- */}
        {selectedStudent && (
            <div className="no-print" style={{border:'2px solid #333', padding:'15px', background:'#fff', borderRadius:'8px', fontSize:'12px', boxShadow:'0 4px 10px rgba(0,0,0,0.05)'}}>
                <h4 style={{textAlign:'center', margin:'0 0 10px 0', borderBottom:'1px solid #eee', paddingBottom:'5px', color:'#333'}}>Arrival Pass Preview</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'8px'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Name:</span> <strong>{selectedStudent.full_name}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Room:</span> <strong>{formData.roomNo || '-'}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Dining:</span> <strong>{formData.seatNo || '-'}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Mobile Locker:</span> <strong>{formData.mobileLocker || '-'}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Valuables Locker:</span> <strong>{formData.valuablesLocker || '-'}</strong></div>
                    <div style={{display:'flex', justifyContent:'space-between'}}><span>Laundry:</span> <strong>{formData.laundryToken || '-'}</strong></div>
                </div>
                <div style={{marginTop:'15px', padding:'10px', background:'#f8f9fa', textAlign:'center', fontSize:'10px', color:'#666'}}>
                    <Printer size={16} style={{marginBottom:'5px'}}/>
                    <div>Ready to Print</div>
                </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {showVisualRoom && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}><div style={{background:'white', flex:1, borderRadius:'8px', padding:'20px', overflow:'auto'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><h3 style={{display:'flex', alignItems:'center', gap:'10px'}}><BedDouble/> Select {genderTab} Bed</h3><button onClick={()=>setShowVisualRoom(false)}><X/></button></div><div style={{padding:'20px', background:'#f5f5f5', borderRadius:'8px', textAlign:'center'}}><div style={{display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px'}}>{currentRoomList.map(roomNum => renderDormCell(roomNum))}</div></div></div></div>}
      {showVisualDining && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}><div style={{background:'white', flex:1, borderRadius:'8px', padding:'20px', overflow:'auto'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><h3 style={{display:'flex', alignItems:'center', gap:'10px'}}><Coffee/> Select {genderTab} Seat</h3><button onClick={()=>setShowVisualDining(false)}><X/></button></div><div style={{textAlign:'center', background: DN1_CONFIG[genderTab].bg, padding:'20px', borderRadius:'8px'}}><div style={{display:'flex', justifyContent:'center', gap:'40px'}}><div><strong>FLOOR</strong><div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{DN1_CONFIG[genderTab].floor.flat().map(n => renderDN1Cell(n, 'Floor'))}</div></div><div><strong>CHAIRS</strong><div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{DN1_CONFIG[genderTab].chairs.flat().map(n => renderDN1Cell(n, 'Chair'))}</div></div></div></div></div></div>}

      {/* --- EXACT THERMAL PRINT LAYOUT (Copied from StudentForm) --- */}
      {printReceiptData && (
          <div id="receipt-print-area" className="print-only">
              <div style={{border:'2px solid black', padding:'10px', width:'300px', margin:'0 auto', fontFamily:'Arial, sans-serif'}}>
                  <div style={{textAlign:'center', borderBottom:'1px solid black', paddingBottom:'5px', marginBottom:'5px'}}>
                      <h3 style={{margin:0, fontSize:'16px'}}>Dhamma Nagajjuna</h3>
                      <div style={{fontSize:'10px'}}>Vipassana International Meditation Centre</div>
                      <div style={{fontSize:'11px', marginTop:'4px', fontWeight:'bold'}}>{printReceiptData.courseName}</div>
                      <div style={{fontSize:'10px'}}>{printReceiptData.from} - {printReceiptData.to}</div>
                  </div>
                  
                  <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'5px'}}>
                      <tbody>
                          <tr><td colSpan="2" style={{border:'1px solid black', padding:'4px', fontSize:'12px'}}>Name: <strong>{printReceiptData.studentName}</strong></td></tr>
                          <tr>
                             <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>ID: <strong>{printReceiptData.confNo}</strong></td>
                             <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Type: <strong>Student</strong></td>
                          </tr>
                          <tr>
                              <td style={{border:'1px solid black', padding:'4px', fontSize:'12px', background:'#f0f0f0'}}>Room: <strong style={{fontSize:'14px'}}>{printReceiptData.roomNo}</strong></td>
                              <td style={{border:'1px solid black', padding:'4px', fontSize:'12px', background:'#f0f0f0'}}>Dining: <strong style={{fontSize:'14px'}}>{printReceiptData.seatNo}</strong></td>
                          </tr>
                          <tr>
                              <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Mob Locker: <strong>{printReceiptData.mobile}</strong></td>
                              <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Val Locker: <strong>{printReceiptData.valuables}</strong></td>
                          </tr>
                          <tr>
                              <td colSpan="2" style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>
                                  Laundry Token: <strong>{printReceiptData.laundry}</strong>
                              </td>
                          </tr>
                          <tr>
                              <td colSpan="2" style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>
                                  Language: <strong>{printReceiptData.language}</strong>
                              </td>
                          </tr>
                      </tbody>
                  </table>
                  <div style={{textAlign:'center', fontSize:'9px', fontStyle:'italic', marginTop:'5px'}}>*** Student Copy ***</div>
              </div>
          </div>
      )}

      {/* EXACT PRINT CSS */}
      <style>{`
        @media print {
            @page { size: auto; margin: 0; }
            html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; display:flex; justify-content:center; align-items:flex-start; padding-top:10px; }
            .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
