import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Coffee, AlertTriangle, CheckCircle, Search, X } from 'lucide-react';

// ✅ FIXED IMPORTS: Everything is now expected to be in ./components/
import DiningLayout from './DiningLayout';       // Changed from ../DiningLayout
import PagodaLayout from '../PagodaLayout';      // Kept as ../ if PagodaLayout is still in src/ (Check this!)
import MaleBlockLayout from './MaleBlockLayout'; 
import FemaleBlockLayout from './FemaleBlockLayout'; 
import NewBlockLayout from './NewBlockLayout'; 

import { API_URL, LANGUAGES, styles } from '../config'; // Correct (config is in src/)

// ... (Rest of your code remains exactly the same, just fixing imports)

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

export default function StudentForm({ courses, preSelectedRoom, clearRoom, userRole }) {
  // ... (Keep existing logic)
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  
  // GLOBAL CONFLICT STATE
  const [globalOccupied, setGlobalOccupied] = useState({ dining: [], pagoda: [] });

  const [formData, setFormData] = useState({ 
      courseId: '', courseName: '', 
      participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  
  // TAB STATE FOR ROOM MODAL
  const [roomModalTab, setRoomModalTab] = useState('Male'); 

  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);

  // Initial Room Load
  useEffect(() => { 
      fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms).catch(e => console.error(e)); 
  }, []);

  // Pre-selection Logic
  useEffect(() => { 
      if (preSelectedRoom) { 
          setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); 
          if (courses.length > 0 && !formData.courseId) {
              const defaultCourse = courses[0];
              setFormData(prev => ({ ...prev, courseId: defaultCourse.course_id, courseName: defaultCourse.course_name })); 
          }
      } 
  }, [preSelectedRoom, courses]);

  // SYNC DATA ENGINE
  useEffect(() => { 
      if (formData.courseId) {
          const syncData = () => {
              fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => { if(Array.isArray(data)) setParticipants(data); }).catch(console.error);
              fetch(`${API_URL}/courses/${formData.courseId}/global-occupied`).then(res => res.json()).then(data => setGlobalOccupied(data)).catch(console.error);
              fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(setOccupancy).catch(console.error);
          };
          syncData();
          const interval = setInterval(syncData, 5000);
          return () => clearInterval(interval);
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

  const cleanNum = (val) => val ? String(val).trim() : '';
  const currentGenderRaw = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGenderRaw.startsWith('m');
  const isFemale = currentGenderRaw.startsWith('f'); 
  const currentGenderLabel = isMale ? 'Male' : (isFemale ? 'Female' : 'Male');
  const themeColor = isMale ? '#007bff' : (isFemale ? '#e91e63' : '#6c757d');

  // CONFLICT MAP GENERATION
  const diningMap = new Map();
  const pagodaMap = new Map();

  if(globalOccupied.dining) {
      globalOccupied.dining.forEach(item => {
          const itemGender = (item.gender || '').toLowerCase();
          if (!itemGender || itemGender.startsWith(currentGenderRaw.charAt(0))) {
              diningMap.set(String(item.seat), { blocked: true, tag: item.tag || 'Other', type: 'Global' });
          }
      });
  }

  if(globalOccupied.pagoda) {
      globalOccupied.pagoda.forEach(item => {
          const itemGender = (item.gender || '').toLowerCase();
          if (!itemGender || itemGender.startsWith(currentGenderRaw.charAt(0))) {
              pagodaMap.set(String(item.cell), { blocked: true, tag: item.tag || 'Other', type: 'Global' });
          }
      });
  }

  const usedMobiles = new Set();
  const usedValuables = new Set();

  participants.forEach(p => {
      if (String(p.participant_id) === String(formData.participantId)) return;
      if (p.status === 'Cancelled') return;
      if (p.mobile_locker_no) usedMobiles.add(cleanNum(p.mobile_locker_no));
      if (p.valuables_locker_no) usedValuables.add(cleanNum(p.valuables_locker_no));
      
      const pGender = (p.gender || '').toLowerCase();
      if ((isMale && pGender.startsWith('m')) || (isFemale && pGender.startsWith('f'))) {
          const conf = (p.conf_no || '').toUpperCase();
          const cat = (conf.startsWith('O') || conf.startsWith('S')) ? 'O' : 'N';
          if (p.dining_seat_no) diningMap.set(cleanNum(p.dining_seat_no), { blocked: true, tag: cat, type: 'Local' });
          if (p.pagoda_cell_no) pagodaMap.set(cleanNum(p.pagoda_cell_no), { blocked: true, tag: cat, type: 'Local' });
      }
  });

  const availableMobiles = (NUMBER_OPTIONS || []).filter(n => !usedMobiles.has(String(n)) || String(n) === String(formData.mobileLocker));
  const availableValuables = (NUMBER_OPTIONS || []).filter(n => !usedValuables.has(String(n)) || String(n) === String(formData.valuablesLocker));

  const selectStudent = (student) => {
      setSelectedStudent(student);
      const targetCourseId = student.courseId || formData.courseId;
      const targetCourseName = student.courseName || (courses.find(c => c.course_id == targetCourseId)?.course_name) || '';

      setFormData(prev => ({ 
          ...prev, 
          participantId: student.participant_id, 
          confNo: student.conf_no || '', 
          seatNo: '', mobileLocker: '', valuablesLocker: '',
          courseId: targetCourseId, 
          courseName: targetCourseName 
      }));
      setSearchTerm(student.full_name);
      setIsSearching(false);
  };

  const handleCourseChange = (e) => {
      const newId = e.target.value;
      const newCourse = courses.find(c => String(c.course_id) === String(newId));
      setFormData(prev => ({ ...prev, courseId: newId, courseName: newCourse ? newCourse.course_name : '' }));
  };

  const handleOpenRoomModal = () => {
      if(isFemale) setRoomModalTab('Female');
      else setRoomModalTab('Male');
      setShowVisualRoom(true);
  };

  const handleRoomSelect = (bedData) => {
      const roomObj = bedData.room_no ? bedData : bedData;
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      
      const roomGender = (roomObj.gender_type || bedData.gender || '').toLowerCase();
      const studentGenderChar = (selectedStudent?.gender || '').toLowerCase().charAt(0);
      
      if (roomGender && !roomGender.startsWith(studentGenderChar)) {
          if(!window.confirm(`⚠️ WARNING: Assigning ${roomGender} room to ${selectedStudent.gender} student. Continue?`)) return;
      }
      setFormData(prev => ({ ...prev, roomNo: roomObj.room_no }));
      setShowVisualRoom(false);
  };

  const handleDiningSelect = (seat, type) => {
      const seatStr = String(seat);
      const status = diningMap.get(seatStr);
      if (status && status.blocked) return alert(`⛔ Dining Seat ${seatStr} is occupied.`);
      
      // Auto-assign locker if available matches seat number
      const lockerVal = (!usedMobiles.has(seatStr) && !usedValuables.has(seatStr)) ? seatStr : '';
      
      setFormData(prev => ({ 
          ...prev, 
          seatNo: seatStr, 
          seatType: type, 
          mobileLocker: lockerVal, 
          valuablesLocker: lockerVal 
      }));
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => { 
      const status = pagodaMap.get(String(val));
      if (status && status.blocked) return alert(`⛔ Pagoda Cell ${val} is occupied.`);
      setFormData(prev => ({ ...prev, pagodaCell: val })); 
      setShowVisualPagoda(false); 
  };

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
          language: formData.language, pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null, 
          special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null
      });
  };

  const handleSubmit = async (e) => { 
      e.preventDefault();
      if (!formData.confNo) return alert("Missing Conf No");
      
      const dStatus = diningMap.get(formData.seatNo);
      if (formData.seatNo && dStatus && dStatus.blocked) return alert(`⛔ STOP: Dining Seat ${formData.seatNo} is ALREADY TAKEN.`);
      
      const pStatus = pagodaMap.get(formData.pagodaCell);
      if (formData.pagodaCell && pStatus && pStatus.blocked) return alert(`⛔ STOP: Pagoda Cell ${formData.pagodaCell} is ALREADY TAKEN.`);

      setStatus('Submitting...');
      
      try { 
          const payload = { ...formData, diningSeatType: formData.seatType, gender: selectedStudent?.gender };
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Check-in failed"); 
          }

          await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
          prepareReceipt(); 
          setTimeout(() => window.print(), 500); 
          setStatus('✅ Success!'); 
          
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
          setSelectedStudent(null); 
          setSearchTerm(''); 
          clearRoom(); 
          
          fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); 
          fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
          
          setTimeout(() => setStatus(''), 4000);

      } catch (err) { 
          setStatus(`❌ ${err.message}`); 
          alert(`🛑 ERROR: ${err.message}`);
      } 
  };

  const searchResults = participants.filter(p => {
      if (!searchTerm) return false;
      if (p.status === 'Attending') return false; 
      const term = searchTerm.toLowerCase();
      return p.full_name.toLowerCase().includes(term) || (p.conf_no || '').toLowerCase().includes(term);
  });

  return (
      <div style={styles.card}>
          {/* HEADER */}
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <User size={20} color="#007bff"/> 
                  <h3 style={{margin:0, color:'#2c3e50', fontSize:'18px'}}>Check-In Console</h3>
              </div>
              {status && (<div style={{padding:'4px 12px', background: status.includes('Success')?'#d4edda':'#f8d7da', color: status.includes('Success')?'#155724':'#721c24', borderRadius:'20px', fontWeight:'bold', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}>{status.includes('Success')?<CheckCircle size={14}/>:<AlertTriangle size={14}/>}{status}</div>)}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              {/* FORM SIDE */}
              <form onSubmit={handleSubmit}>
                  {/* SELECT & SEARCH */}
                  <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'15px', border:'1px solid #eee'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px', alignItems:'end'}}>
                          <div>
                              <label style={{...styles.label, marginBottom:'4px', fontSize:'11px', color:'#007bff'}}>COURSE</label>
                              <select style={{...styles.input, fontSize:'13px', padding:'8px'}} onChange={handleCourseChange} value={formData.courseId}>
                                  <option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                              </select>
                          </div>
                          <div style={{position:'relative'}}>
                              <label style={{...styles.label, marginBottom:'4px', fontSize:'11px', color:'#007bff'}}>FIND STUDENT</label>
                              <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                                  <Search size={16} style={{position:'absolute', left:'10px', color:'#999'}}/>
                                  <input ref={searchInputRef} style={{...styles.input, padding:'8px 8px 8px 32px', fontSize:'14px'}} placeholder="Name / ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }} disabled={!formData.courseId} onFocus={() => setIsSearching(true)}/>
                                  {searchTerm && (<button type="button" onClick={()=>{setSearchTerm(''); setSelectedStudent(null);}} style={{position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', color:'#999'}}><X size={14}/></button>)}
                              </div>
                              {isSearching && searchTerm && (<div style={{position:'absolute', top:'105%', left:0, right:0, background:'white', border:'1px solid #eee', borderRadius:'8px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'250px', overflowY:'auto'}}>{searchResults.length === 0 ? <div style={{padding:'10px', color:'#999', textAlign:'center', fontSize:'12px'}}>No matches.</div> : searchResults.map(p => (<div key={p.participant_id} onClick={() => selectStudent(p)} style={{padding:'8px 12px', borderBottom:'1px solid #f9f9f9', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', ':hover': {background: '#f8f9fa'}}} onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><div><div style={{fontWeight:'bold', color:'#333'}}>{p.full_name}</div><div style={{fontSize:'11px', color:'#777'}}>{p.conf_no} • {p.gender}</div></div><div style={{background: p.status === 'Cancelled' ? '#ffebee' : '#eee', color: p.status === 'Cancelled' ? '#c62828' : '#333', padding:'2px 6px', borderRadius:'8px', fontSize:'10px', fontWeight:'bold'}}>{p.status}</div></div>))}</div>)}
                          </div>
                      </div>
                  </div>

                  {selectedStudent && (
                      <div style={{animation:'fadeIn 0.2s ease'}}>
                          <div style={{display:'flex', gap:'10px', marginBottom:'15px', fontSize:'12px'}}>
                              <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>ID:</strong> {formData.confNo}</div>
                              <div style={{background: themeColor, color:'white', padding:'6px 10px', borderRadius:'4px', fontWeight:'bold'}}>{selectedStudent.gender}</div>
                          </div>

                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                              {/* ROOM */}
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px'}}>
                                  <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}><MapPin size={14} color="#007bff"/> Room</h5>
                                  <button type="button" onClick={handleOpenRoomModal} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', borderColor: formData.roomNo ? '#90caf9' : '#ddd', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>{formData.roomNo || "Select Room"}{formData.roomNo && <CheckCircle size={14} color="#28a745"/>}</button>
                              </div>
                              
                              {/* DINING */}
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px'}}>
                                  <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}><Coffee size={14} color="#e91e63"/> Dining</h5>
                                  <div style={{marginBottom:'10px', display:'flex', gap:'5px'}}>
                                      <select style={{...styles.input, width:'70px', padding:'8px', fontSize:'12px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                                      <button type="button" onClick={() => setShowVisualDining(true)} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', flex:1, background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer'}}>{formData.seatNo || "Seat"}</button>
                                  </div>
                              </div>
                          </div>

                          {/* ACTION BUTTON */}
                          <button type="submit" style={{width:'100%', padding:'12px', background:'#28a745', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', fontSize:'14px', cursor:'pointer'}}>CONFIRM CHECK-IN</button>
                      </div>
                  )}
              </form>
              
              {/* RECEIPT PREVIEW (Right Side) */}
              {selectedStudent && (
                  <div className="no-print" style={{border:'2px solid #333', padding:'15px', borderRadius:'8px', background:'#fff', fontSize:'12px'}}>
                      <h4 style={{textAlign:'center', margin:'0 0 10px 0', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>Receipt Preview</h4>
                      <p><strong>Name:</strong> {selectedStudent.full_name}</p>
                      <p><strong>Room:</strong> {formData.roomNo}</p>
                      <p><strong>Dining:</strong> {formData.seatNo}</p>
                      <p><strong>Locker:</strong> {formData.mobileLocker || formData.valuablesLocker || 'None'}</p>
                  </div>
              )}
          </div>

          {/* --- MODALS --- */}
          
          {/* DINING MODAL */}
          {showVisualDining && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
                  <div style={{background:'white', flex:1, borderRadius:'8px', overflow:'hidden', display:'flex', flexDirection:'column'}}>
                      <div style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><h3>Select Dining</h3><button onClick={()=>setShowVisualDining(false)}><X/></button></div>
                      <div style={{flex:1, overflow:'auto'}}>
                          <DiningLayout onSelect={handleDiningSelect} occupied={globalOccupied.dining} gender={selectedStudent?.gender} selected={formData.seatNo}/>
                      </div>
                  </div>
              </div>
          )}

          {/* ROOM MODAL */}
          {showVisualRoom && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
                  <div style={{background:'white', flex:1, borderRadius:'8px', overflow:'auto', padding:'20px'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}><h3>Select Room</h3><button onClick={()=>setShowVisualRoom(false)}><X/></button></div>
                      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                          {['Male','Female','New Block'].map(t=><button key={t} onClick={()=>setRoomModalTab(t)} style={{padding:'10px', borderBottom: roomModalTab===t?'2px solid blue':'1px solid #ccc'}}>{t}</button>)}
                      </div>
                      {roomModalTab === 'Male' && <MaleBlockLayout onSelect={handleRoomSelect} occupied={occupancy} />}
                      {roomModalTab === 'Female' && <FemaleBlockLayout onSelect={handleRoomSelect} occupied={occupancy} />}
                      {roomModalTab === 'New Block' && <NewBlockLayout onSelect={handleRoomSelect} occupied={occupancy} />}
                  </div>
              </div>
          )}
      </div>
  );
}
