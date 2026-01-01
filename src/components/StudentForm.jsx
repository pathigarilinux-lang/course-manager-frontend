import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Coffee, Lock, Key, AlertTriangle, CheckCircle, Search, X, Printer, ArrowRight, Briefcase, RefreshCw, Wand2, RotateCcw } from 'lucide-react';
import DiningLayout from '../DiningLayout';
import PagodaLayout from '../PagodaLayout';
import MaleBlockLayout from './MaleBlockLayout'; 
import FemaleBlockLayout from './FemaleBlockLayout'; 
import NewBlockLayout from './NewBlockLayout'; 
import DN1MaleDining from './DN1MaleDining';
import DN1FemaleDining from './DN1FemaleDining';
import { API_URL, LANGUAGES, styles } from '../config';

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
  // --- STATE ---
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Global Conflict State (RAW DATA)
  const [globalOccupied, setGlobalOccupied] = useState({ dining: [], pagoda: [] });

  const [formData, setFormData] = useState({ 
      courseId: '', courseName: '', 
      participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  const [printReceiptData, setPrintReceiptData] = useState(null);
  
  // Modals & Tabs
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);
  const [roomModalTab, setRoomModalTab] = useState(userRole === 'dn1ops' ? 'New Block' : 'Male'); 
  const [diningModalTab, setDiningModalTab] = useState('General'); 

  // Initial Load
  useEffect(() => { 
      fetch(`${API_URL}/rooms`)
        .then(res => res.json())
        .then(data => setRooms(Array.isArray(data) ? data : []))
        .catch(() => setRooms([])); 
  }, []);

  // Pre-selection Logic
  useEffect(() => { 
      if (preSelectedRoom) { 
          setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); 
          if (courses && courses.length > 0 && !formData.courseId) {
              const defaultCourse = courses[0];
              setFormData(prev => ({ ...prev, courseId: defaultCourse.course_id, courseName: defaultCourse.course_name })); 
          }
      } 
  }, [preSelectedRoom, courses]);

  // Sync Data
  useEffect(() => { 
      if (formData.courseId) {
          const syncData = () => {
              fetch(`${API_URL}/courses/${formData.courseId}/participants`)
                  .then(res => res.json())
                  .then(data => setParticipants(Array.isArray(data) ? data : []))
                  .catch(e => { console.error(e); setParticipants([]); });

              fetch(`${API_URL}/courses/${formData.courseId}/global-occupied`)
                  .then(res => {
                      if (res.status === 404) return { dining: [], pagoda: [] };
                      if (!res.ok) throw new Error('Global fetch failed');
                      return res.json();
                  })
                  .then(data => {
                      setGlobalOccupied({
                          dining: (data && Array.isArray(data.dining)) ? data.dining : [],
                          pagoda: (data && Array.isArray(data.pagoda)) ? data.pagoda : []
                      });
                  })
                  .catch(e => { console.warn(e); setGlobalOccupied({ dining: [], pagoda: [] }); });

              fetch(`${API_URL}/rooms/occupancy`)
                  .then(res => res.json())
                  .then(data => setOccupancy(Array.isArray(data) ? data : []))
                  .catch(e => { console.error(e); setOccupancy([]); });
          };
          syncData();
          const interval = setInterval(syncData, 5000);
          return () => clearInterval(interval);
      }
  }, [formData.courseId]);

  // Auto-fill Laundry
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
  const themeColor = isMale ? '#007bff' : (isFemale ? '#e91e63' : '#6c757d');

  // --- SAFE OCCUPANCY CALCULATIONS ---
  // Create simple Sets for Locker/Valuable checking (Safe from crash)
  const usedMobiles = new Set();
  const usedValuables = new Set();

  (participants || []).forEach(p => {
      if (String(p.participant_id) === String(formData.participantId)) return;
      if (p.status === 'Cancelled') return;
      if (p.mobile_locker_no) usedMobiles.add(cleanNum(p.mobile_locker_no));
      if (p.valuables_locker_no) usedValuables.add(cleanNum(p.valuables_locker_no));
  });

  const availableMobiles = (NUMBER_OPTIONS || []).filter(n => !usedMobiles.has(String(n)) || String(n) === String(formData.mobileLocker));
  const availableValuables = (NUMBER_OPTIONS || []).filter(n => !usedValuables.has(String(n)) || String(n) === String(formData.valuablesLocker));

  // --- HANDLERS ---
  const selectStudent = (student) => {
      setSelectedStudent(student);
      const targetCourseId = student.courseId || formData.courseId;
      const targetCourseName = student.courseName || (courses.find(c => c.course_id == targetCourseId)?.course_name) || '';
      setFormData(prev => ({ ...prev, participantId: student.participant_id, confNo: student.conf_no || '', seatNo: '', mobileLocker: '', valuablesLocker: '', courseId: targetCourseId, courseName: targetCourseName }));
      setSearchTerm(student.full_name);
      setIsSearching(false);
  };

  const handleCourseChange = (e) => {
      const newId = e.target.value;
      const newCourse = courses.find(c => String(c.course_id) === String(newId));
      setFormData(prev => ({ ...prev, courseId: newId, courseName: newCourse ? newCourse.course_name : '' }));
  };

  const handleOpenRoomModal = () => {
      if(!selectedStudent) return alert("⚠️ Please select a student first.");
      if (userRole === 'dn1ops') setRoomModalTab('New Block');
      else setRoomModalTab(isFemale ? 'Female' : 'Male');
      setShowVisualRoom(true);
  };

  const handleOpenDiningModal = () => {
      if(!selectedStudent) return alert("⚠️ Please select a student first.");
      if (userRole === 'dn1ops') setDiningModalTab(isFemale ? 'DN1 Female' : 'DN1 Male');
      else setDiningModalTab('General');
      setShowVisualDining(true);
  };

  const handleRoomSelect = (bedData) => {
      const roomObj = bedData.room_no ? bedData : bedData;
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      const roomGender = (roomObj.gender_type || bedData.gender || '').toLowerCase();
      const studentGenderChar = (selectedStudent?.gender || '').toLowerCase().charAt(0);
      if (userRole !== 'dn1ops' && roomGender && !roomGender.startsWith(studentGenderChar)) {
          if(!window.confirm(`⚠️ WARNING: Assigning ${roomGender} room to ${selectedStudent.gender} student. Continue?`)) return;
      }
      setFormData(prev => ({ ...prev, roomNo: roomObj.room_no }));
      setShowVisualRoom(false);
  };

  const handleDiningSeatChange = (val, typeVal) => { 
      const seatStr = String(val);
      // Basic check against global list (Safe Array Find)
      const isTaken = (globalOccupied.dining || []).some(x => String(x.seat) === seatStr);
      if (isTaken) return alert(`⛔ Dining Seat ${val} is occupied.`);
      
      const lockerVal = (!usedMobiles.has(seatStr) && !usedValuables.has(seatStr)) ? seatStr : '';
      setFormData(prev => ({ ...prev, seatNo: seatStr, seatType: typeVal, mobileLocker: lockerVal, valuablesLocker: lockerVal })); 
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => { 
      const isTaken = (globalOccupied.pagoda || []).some(x => String(x.cell) === String(val));
      if (isTaken) return alert(`⛔ Pagoda Cell ${val} is occupied.`);
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

  const triggerReprint = () => { if (!selectedStudent) return; prepareReceipt(); setTimeout(() => window.print(), 500); };

  const handleSubmit = async (e) => { 
      e.preventDefault();
      if (!formData.confNo) return alert("Missing Conf No");
      const isDTaken = (globalOccupied.dining || []).some(x => String(x.seat) === String(formData.seatNo));
      if (formData.seatNo && isDTaken) return alert(`⛔ STOP: Dining Seat ${formData.seatNo} is ALREADY TAKEN.`);

      setStatus('Submitting...');
      try { 
          const payload = { ...formData, diningSeatType: formData.seatType, gender: selectedStudent?.gender };
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error("Check-in failed"); 
          
          await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
          prepareReceipt(); 
          setTimeout(() => window.print(), 500); 
          setStatus('✅ Success!'); 
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
          setSelectedStudent(null); setSearchTerm(''); clearRoom(); 
          fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(d => setParticipants(Array.isArray(d) ? d : [])); 
          fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(d => setOccupancy(Array.isArray(d) ? d : [])); 
          setTimeout(() => setStatus(''), 4000);
      } catch (err) { setStatus(`❌ ${err.message}`); alert(`🛑 ERROR: ${err.message}`); } 
  };

  const searchResults = (participants || []).filter(p => {
      if (!searchTerm) return false;
      if (p.status === 'Attending') return false; 
      const term = searchTerm.toLowerCase();
      return p.full_name.toLowerCase().includes(term) || (p.conf_no || '').toLowerCase().includes(term);
  });

  const handleResetRoom = () => { setFormData(prev => ({ ...prev, roomNo: '' })); };

  return ( 
      <div style={styles.card}> 
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <User size={20} color="#007bff"/> 
                  <h3 style={{margin:0, color:'#2c3e50', fontSize:'18px'}}>Check-In Console</h3>
              </div>
              {status && (<div style={{padding:'4px 12px', background: status.includes('Success')?'#d4edda':'#f8d7da', color: status.includes('Success')?'#155724':'#721c24', borderRadius:'20px', fontWeight:'bold', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}>{status.includes('Success') ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}{status}</div>)}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              <form onSubmit={handleSubmit}>
                  <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'15px', border:'1px solid #eee'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px', alignItems:'end'}}>
                          <div>
                              <label style={{...styles.label, marginBottom:'4px', fontSize:'11px', color:'#007bff'}}>COURSE</label>
                              <select style={{...styles.input, fontSize:'13px', padding:'8px'}} onChange={handleCourseChange} value={formData.courseId}>
                                  <option value="">-- Select --</option>{(courses || []).map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
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
                          {selectedStudent.medical_info && (<div style={{background:'#fff3cd', borderLeft:'3px solid #ffc107', padding:'8px 12px', borderRadius:'4px', marginBottom:'10px', fontSize:'12px', color:'#856404', display:'flex', gap:'8px'}}><AlertTriangle size={16}/><span><strong>Medical:</strong> {selectedStudent.medical_info}</span></div>)}
                          <div style={{display:'flex', gap:'10px', marginBottom:'15px', fontSize:'12px'}}>
                              <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>ID:</strong> {formData.confNo}</div>
                              <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>Age:</strong> {selectedStudent.age}</div>
                              <div style={{background: themeColor, color:'white', padding:'6px 10px', borderRadius:'4px', fontWeight:'bold'}}>{selectedStudent.gender}</div>
                          </div>

                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.01)'}}>
                                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}>
                                      <h5 style={{margin:0, color:'#555', display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={14} color="#007bff"/> Room</h5>
                                      {userRole !== 'dn1ops' && (<button type="button" onClick={handleResetRoom} style={{background:'none', border:'none', color:'red', cursor:'pointer', fontSize:'10px', display:'flex', alignItems:'center', gap:'2px'}}><RotateCcw size={10}/> Reset</button>)}
                                  </div>
                                  <div style={{marginBottom:'10px'}}>
                                      <button type="button" onClick={handleOpenRoomModal} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', borderColor: formData.roomNo ? '#90caf9' : '#ddd', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>{formData.roomNo || "Select Room"}{formData.roomNo && <CheckCircle size={14} color="#28a745"/>}</button>
                                  </div>
                              </div>
                              
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.01)'}}>
                                  <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}><Coffee size={14} color="#e91e63"/> Dining, Lockers & Laundry</h5>
                                  <div style={{marginBottom:'10px', display:'flex', gap:'5px'}}>
                                      <select style={{...styles.input, width:'70px', padding:'8px', fontSize:'12px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                                      <button type="button" onClick={handleOpenDiningModal} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', flex:1, background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer'}}>{formData.seatNo || "Seat"}</button>
                                  </div>
                                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px'}}>
                                      <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Mobile</label><select style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%'}} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                      <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Valuables</label><select style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%'}} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                      <div><label style={{fontSize:'10px', fontWeight:'bold', color:'#777'}}>Laundry</label><input style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%', background:'#f0f8ff', fontWeight:'bold', color:'#0d47a1'}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div>
                                  </div>
                              </div>
                          </div>

                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', fontSize:'12px'}}>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Lang</label><select style={{...styles.input, padding:'6px'}} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, padding:'6px', textAlign:'left', cursor:'pointer'}}>{formData.pagodaCell || "None"}</button></div>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Special</label><select style={{...styles.input, padding:'6px'}} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option></select></div>
                          </div>

                          <div style={{marginTop:'20px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                              <button type="button" onClick={triggerReprint} disabled={!selectedStudent} style={{...styles.btn(false), background:'white', border:'1px solid #ccc', color:'#555', display:'flex', alignItems:'center', gap:'6px', padding:'10px 15px'}}><Printer size={16}/> Reprint</button>
                              <button type="submit" style={{...styles.btn(true), background:'#28a745', border:'none', color:'white', display:'flex', alignItems:'center', gap:'8px', padding:'10px 25px'}}><CheckCircle size={16}/> CONFIRM CHECK-IN <ArrowRight size={16}/></button>
                          </div>
                      </div>
                  )}
              </form>

              {/* RIGHT COLUMN: PREVIEW RECEIPT (Solid Style) */}
              {selectedStudent && (
                  <div className="no-print" style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #ddd', height:'fit-content', boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
                      <div style={{textAlign:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}>
                          <h4 style={{margin:0, color:'#333', fontSize:'16px'}}>Receipt Preview</h4>
                          <div style={{fontSize:'12px', color:'#777', marginTop:'5px'}}>Dhamma Nagajjuna</div>
                      </div>
                      <div style={{fontSize:'13px', display:'grid', gap:'10px', color:'#444'}}>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #eee', paddingBottom:'5px'}}><span>Name:</span> <strong>{selectedStudent.full_name}</strong></div>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #eee', paddingBottom:'5px'}}><span>ID:</span> <strong>{formData.confNo || '-'}</strong></div>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #eee', paddingBottom:'5px'}}><span>Room:</span> <strong style={{color:'#007bff'}}>{formData.roomNo || '-'}</strong></div>
                          <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px dashed #eee', paddingBottom:'5px'}}><span>Dining:</span> <strong>{formData.seatNo || '-'} ({formData.seatType})</strong></div>
                          <div style={{display:'flex', justifyContent:'space-between'}}><span>Locker:</span> <strong>M:{formData.mobileLocker || '-'} / V:{formData.valuablesLocker || '-'}</strong></div>
                      </div>
                  </div>
              )}
          </div>
          
          {/* ================= MODALS ================= */}
          
          {/* 1. ROOM MODAL */}
          {showVisualRoom && (
              <div className="no-print" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
                  <div style={{background:'white', borderRadius:'12px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.5)'}}>
                      <div style={{padding:'15px 20px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fa'}}>
                          <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><MapPin size={20}/> Select Accommodation</h3>
                          <button onClick={() => setShowVisualRoom(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
                      </div>
                      {userRole !== 'dn1ops' && (
                          <div style={{display:'flex', borderBottom:'1px solid #ddd'}}>
                              {['Male', 'Female', 'New Block'].map(tab => (
                                  <button key={tab} onClick={() => setRoomModalTab(tab)} style={{flex:1, padding:'15px', background: roomModalTab === tab ? 'white' : '#f1f3f5', border:'none', borderBottom: roomModalTab === tab ? '3px solid #007bff' : 'none', fontWeight: 'bold', color: roomModalTab === tab ? '#007bff' : '#666', cursor:'pointer'}}>{tab} Block</button>
                              ))}
                          </div>
                      )}
                      <div style={{flex:1, overflow:'auto', padding:'20px', background:'#f0f2f5'}}>
                          {roomModalTab === 'Male' && <MaleBlockLayout onSelect={handleRoomSelect} occupied={occupancy || []} />}
                          {roomModalTab === 'Female' && <FemaleBlockLayout onSelect={handleRoomSelect} occupied={occupancy || []} />}
                          {roomModalTab === 'New Block' && <NewBlockLayout onSelect={handleRoomSelect} occupied={occupancy || []} />}
                      </div>
                  </div>
              </div>
          )}

          {/* 2. DINING MODAL - ✅ FIXED DATA PASSING */}
          {showVisualDining && (
              <div className="no-print" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
                  <div style={{background:'white', borderRadius:'12px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                      <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <h3 style={{margin:0}}>Select Dining Seat</h3>
                          <button onClick={() => setShowVisualDining(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
                      </div>
                      <div style={{display:'flex', borderBottom:'1px solid #ddd', background:'#f8f9fa'}}>
                          {['General', 'DN1 Male', 'DN1 Female'].map(tab => (
                              <button key={tab} onClick={() => setDiningModalTab(tab)} style={{flex:1, padding:'15px', background: diningModalTab === tab ? 'white' : '#f1f3f5', border:'none', borderBottom: diningModalTab === tab ? '3px solid #007bff' : 'none', fontWeight: 'bold', color: diningModalTab === tab ? '#007bff' : '#666', cursor:'pointer'}}>{tab}</button>
                          ))}
                      </div>
                      <div style={{flex:1, overflow:'auto', padding:'20px'}}>
                          {/* ✅ PASS RAW ARRAY TO NEW COMPONENTS */}
                          {diningModalTab === 'General' && <DiningLayout onSelect={handleDiningSeatChange} occupied={globalOccupied.dining || []} currentGender={selectedStudent?.gender} />}
                          {diningModalTab === 'DN1 Male' && <DN1MaleDining occupiedData={globalOccupied.dining || []} selected={formData.seatNo} onSelect={handleDiningSeatChange} />}
                          {diningModalTab === 'DN1 Female' && <DN1FemaleDining occupiedData={globalOccupied.dining || []} selected={formData.seatNo} onSelect={handleDiningSeatChange} />}
                      </div>
                  </div>
              </div>
          )}

          {/* 3. PAGODA MODAL */}
          {showVisualPagoda && (
              <div className="no-print" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
                  <div style={{background:'white', borderRadius:'12px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                      <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <h3 style={{margin:0}}>Select Pagoda Cell</h3>
                          <button onClick={() => setShowVisualPagoda(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
                      </div>
                      <div style={{flex:1, overflow:'auto', padding:'20px'}}>
                          <PagodaLayout onSelect={handlePagodaSelect} occupied={globalOccupied.pagoda || []} currentGender={selectedStudent?.gender} />
                      </div>
                  </div>
              </div>
          )}

          {/* HIDDEN PRINT AREA */}
          <div id="receipt-print-area" style={{display:'none'}}>
              {printReceiptData && (
                  <div style={{padding:'20px', fontFamily:'Arial, sans-serif', width:'300px', margin:'0 auto', border:'1px solid #000'}}>
                      <div style={{textAlign:'center', marginBottom:'15px', borderBottom:'1px solid #000', paddingBottom:'10px'}}>
                          <h2 style={{margin:0, fontSize:'18px'}}>Dhamma Nagajjuna</h2>
                          <div style={{fontSize:'12px'}}>Vipassana International Meditation Centre</div>
                          <div style={{fontSize:'12px'}}>Nagarjuna Sagar, Telangana</div>
                      </div>
                      <div style={{marginBottom:'15px', fontSize:'12px'}}>
                          <div><strong>Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                          <div><strong>Course:</strong> {printReceiptData.courseName}</div>
                          <div><strong>Dates:</strong> {printReceiptData.from} to {printReceiptData.to}</div>
                          <div><strong>Teacher:</strong> {printReceiptData.teacherName}</div>
                      </div>
                      <div style={{borderTop:'1px solid #000', borderBottom:'1px solid #000', padding:'10px 0', margin:'10px 0'}}>
                          <div style={{fontSize:'14px', fontWeight:'bold', marginBottom:'5px'}}>{printReceiptData.studentName}</div>
                          <div style={{fontSize:'12px'}}>ID: {printReceiptData.confNo}</div>
                      </div>
                      <table style={{width:'100%', borderCollapse:'collapse', marginTop:'10px'}}>
                          <tbody>
                              <tr>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Room No:</td>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'14px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.roomNo}</td>
                              </tr>
                              <tr>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Dining Seat:</td>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'14px', fontWeight:'bold', textAlign:'center'}}>{printReceiptData.seatNo}</td>
                              </tr>
                              <tr>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Mobile Locker:</td>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'12px', textAlign:'center'}}>{printReceiptData.mobile}</td>
                              </tr>
                              <tr>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Valuables Locker:</td>
                                  <td style={{border:'1px solid black', padding:'4px', fontSize:'12px', textAlign:'center'}}>{printReceiptData.valuables}</td>
                              </tr>
                          </tbody>
                      </table>
                      <div style={{textAlign:'center', fontSize:'9px', fontStyle:'italic', marginTop:'15px'}}>May All Beings Be Happy!</div>
                  </div>
              )}
          </div>
          
          <style>{`
              @media print {
                  @page { size: auto; margin: 0; }
                  html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }
                  body * { visibility: hidden; }
                  #receipt-print-area, #receipt-print-area * { visibility: visible; display: block; }
                  #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
              }
              @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
      </div>
  );
}
