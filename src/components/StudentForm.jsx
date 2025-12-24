import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Coffee, Lock, Key, AlertTriangle, CheckCircle, Search, X, Printer, ArrowRight } from 'lucide-react';
import DiningLayout from '../DiningLayout';
import PagodaLayout from '../PagodaLayout';
import MaleBlockLayout from './MaleBlockLayout'; 
import FemaleBlockLayout from './FemaleBlockLayout'; 
import { API_URL, LANGUAGES, styles } from '../config';

// ✅ FIX: Define this locally to prevent "undefined" crashes
const NUMBER_OPTIONS = Array.from({ length: 200 }, (_, i) => String(i + 1));

export default function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  // --- STATE ---
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  
  // Smart Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({ 
      courseId: '', participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  // Print State
  const [printReceiptData, setPrintReceiptData] = useState(null);
  
  // Visual Modals State
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);

  // --- INITIAL DATA LOAD ---
  useEffect(() => { 
      fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); 
      fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); 
  }, []);

  useEffect(() => { 
      if (preSelectedRoom) { 
          setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); 
          if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); 
      } 
  }, [preSelectedRoom, courses]);

  useEffect(() => { 
      if (formData.courseId) {
          fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants);
          setSearchTerm(''); 
      }
  }, [formData.courseId]);

  // --- LOGIC ENGINE ---
  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  
  // Gender Detection
  const currentGenderRaw = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGenderRaw.startsWith('m');
  const isFemale = currentGenderRaw.startsWith('f'); 
  const currentGenderLabel = isMale ? 'Male' : (isFemale ? 'Female' : 'Male');
  const themeColor = isMale ? '#007bff' : (isFemale ? '#e91e63' : '#6c757d');

  // Room Logic
  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
  else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

  // Locker & Seat Logic
  const usedDining = new Set();
  const usedPagoda = new Set();
  const usedMobiles = new Set();
  const usedValuables = new Set();

  participants.forEach(p => {
      if (String(p.participant_id) === String(formData.participantId)) return;
      if (p.status === 'Cancelled') return;
      if (p.mobile_locker_no) usedMobiles.add(cleanNum(p.mobile_locker_no));
      if (p.valuables_locker_no) usedValuables.add(cleanNum(p.valuables_locker_no));
      const pGender = (p.gender || '').toLowerCase();
      if ((isMale && pGender.startsWith('m')) || (isFemale && pGender.startsWith('f'))) {
          if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); 
          if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); 
      }
  });

  const availableMobiles = (NUMBER_OPTIONS || []).filter(n => !usedMobiles.has(String(n)) || String(n) === String(formData.mobileLocker));
  const availableValuables = (NUMBER_OPTIONS || []).filter(n => !usedValuables.has(String(n)) || String(n) === String(formData.valuablesLocker));

  // --- HANDLERS ---
  const selectStudent = (student) => {
      setSelectedStudent(student);
      setFormData(prev => ({ 
          ...prev, 
          participantId: student.participant_id, 
          confNo: student.conf_no || '', 
          seatNo: '', mobileLocker: '', valuablesLocker: '' 
      }));
      setSearchTerm(student.full_name);
      setIsSearching(false);
  };

  const handleRoomSelect = (roomObj) => {
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      
      const roomGender = (roomObj.gender_type || '').toLowerCase();
      const studentGenderChar = (selectedStudent?.gender || '').toLowerCase().charAt(0);
      if (roomGender && !roomGender.startsWith(studentGenderChar)) {
          if(!window.confirm(`⚠️ WARNING: Assigning ${roomObj.gender_type} room to ${selectedStudent.gender} student. Continue?`)) return;
      }

      setFormData(prev => ({ ...prev, roomNo: roomObj.room_no }));
      setShowVisualRoom(false);
  };

  const handleDiningSeatChange = (val, typeVal) => { 
      const lockerVal = (!usedMobiles.has(val) && !usedValuables.has(val)) ? val : '';
      setFormData(prev => ({ ...prev, seatNo: val, seatType: typeVal, mobileLocker: lockerVal, valuablesLocker: lockerVal })); 
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => { setFormData(prev => ({ ...prev, pagodaCell: val })); setShowVisualPagoda(false); };

  // --- REPRINT / RECEIPT PREP ---
  const prepareReceipt = () => {
      const courseObj = courses.find(c => c.course_id == formData.courseId);
      
      let rawName = courseObj?.course_name || 'Unknown';
      let shortName = rawName;
      const dayMatch = rawName.match(/(\d+)\s*-?\s*Day/i);
      if (dayMatch) shortName = `${dayMatch[1]}-Day Course`;

      setPrintReceiptData({ 
          courseName: shortName, 
          teacherName: courseObj?.teacher_name || 'Teacher', 
          from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', 
          to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', 
          studentName: selectedStudent?.full_name, 
          confNo: formData.confNo, 
          roomNo: formData.roomNo, 
          seatNo: formData.seatNo, 
          mobile: formData.mobileLocker || '-',
          valuables: formData.valuablesLocker || '-',
          laundry: formData.laundryToken,
          language: formData.language,
          pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null,
          special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null
      });
  };

  const triggerReprint = () => {
      if (!selectedStudent) return;
      prepareReceipt();
      setTimeout(() => window.print(), 500);
  };

  const handleSubmit = async (e) => { 
      e.preventDefault();
      if (!formData.confNo) return alert("Missing Conf No");
      setStatus('Submitting...');
      try { 
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, diningSeatType: formData.seatType }) });
          if (!res.ok) throw new Error("Check-in failed"); 
          
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
      } catch (err) { setStatus(`❌ ${err.message}`); } 
  };

  const searchResults = participants.filter(p => {
      if (!searchTerm) return false;
      if (p.status === 'Attending' || p.status === 'Cancelled') return false; 
      const term = searchTerm.toLowerCase();
      return p.full_name.toLowerCase().includes(term) || (p.conf_no || '').toLowerCase().includes(term);
  });

  return ( 
      <div style={styles.card}> 
          {/* HEADER */}
          <div className="no-print" style={{
              display:'flex', justifyContent:'space-between', alignItems:'center', 
              marginBottom:'25px', borderBottom:'1px solid #eee', paddingBottom:'15px'
          }}>
              <div>
                  <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'22px'}}>
                      <User size={24} color="#007bff"/> Check-In Console
                  </h2>
                  <p style={{margin:'5px 0 0 35px', color:'#666', fontSize:'13px'}}>Process new arrivals and assign assets</p>
              </div>
              {status && (
                  <div style={{
                      padding:'8px 20px', 
                      background: status.includes('Success')?'#d4edda':'#f8d7da', 
                      color: status.includes('Success')?'#155724':'#721c24', 
                      borderRadius:'30px', fontWeight:'bold', fontSize:'14px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'8px'
                  }}>
                      {status.includes('Success') ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                      {status}
                  </div>
              )}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px'}}>
              {/* --- LEFT: FORM --- */}
              <form onSubmit={handleSubmit}>
                  
                  {/* 1. SELECTION & SEARCH */}
                  <div style={{
                      background:'linear-gradient(to bottom right, #f8f9fa, #ffffff)', 
                      padding:'20px', borderRadius:'12px', marginBottom:'25px', 
                      border:'1px solid #e9ecef', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                      <div style={{marginBottom:'15px'}}>
                          <label style={{...styles.label, color:'#007bff'}}>1. SELECT COURSE</label>
                          <select style={{...styles.input, fontSize:'14px', padding:'10px'}} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}>
                              <option value="">-- Select Active Course --</option>
                              {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                          </select>
                      </div>

                      <div style={{position:'relative'}}>
                          <label style={{...styles.label, color:'#007bff'}}>2. FIND STUDENT</label>
                          <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                              <Search size={18} style={{position:'absolute', left:'12px', color:'#999'}}/>
                              <input 
                                  ref={searchInputRef}
                                  style={{...styles.input, padding:'12px 12px 12px 40px', fontSize:'15px', fontWeight:'500'}} 
                                  placeholder="Type Name or Conf No..." 
                                  value={searchTerm}
                                  onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }}
                                  disabled={!formData.courseId}
                                  onFocus={() => setIsSearching(true)}
                              />
                              {searchTerm && (
                                  <button type="button" onClick={()=>{setSearchTerm(''); setSelectedStudent(null);}} 
                                      style={{position:'absolute', right:'12px', background:'none', border:'none', cursor:'pointer', color:'#999'}}>
                                      <X size={16}/>
                                  </button>
                              )}
                          </div>
                          
                          {/* DROPDOWN RESULTS */}
                          {isSearching && searchTerm && (
                              <div style={{
                                  position:'absolute', top:'110%', left:0, right:0, 
                                  background:'white', border:'1px solid #eee', borderRadius:'8px', 
                                  boxShadow:'0 10px 25px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'300px', overflowY:'auto'
                              }}>
                                  {searchResults.length === 0 ? <div style={{padding:'15px', color:'#999', textAlign:'center'}}>No matches found.</div> : 
                                  searchResults.map(p => (
                                      <div key={p.participant_id} onClick={() => selectStudent(p)} 
                                          style={{
                                              padding:'12px 15px', borderBottom:'1px solid #f9f9f9', cursor:'pointer', 
                                              display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background 0.2s',
                                              ':hover': {background: '#f8f9fa'}
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                          <div>
                                              <div style={{fontWeight:'bold', color:'#333'}}>{p.full_name}</div>
                                              <div style={{fontSize:'12px', color:'#777'}}>{p.conf_no} • {p.gender}</div>
                                          </div>
                                          <div style={{background:'#eee', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold'}}>{p.age} Yrs</div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* 2. STUDENT DETAILS CARD */}
                  {selectedStudent && (
                      <div style={{marginBottom:'25px', animation:'fadeIn 0.3s ease'}}>
                          {selectedStudent.medical_info && (
                              <div style={{
                                  background:'#fff3cd', borderLeft:'4px solid #ffc107', 
                                  padding:'15px', borderRadius:'6px', marginBottom:'15px', 
                                  display:'flex', gap:'12px', alignItems:'start', color:'#856404'
                              }}>
                                  <AlertTriangle size={20} style={{marginTop:'2px'}}/>
                                  <div>
                                      <strong style={{display:'block', marginBottom:'2px'}}>Medical Alert</strong> 
                                      <span style={{fontSize:'14px'}}>{selectedStudent.medical_info}</span>
                                  </div>
                              </div>
                          )}
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                              <div><label style={styles.label}>Conf No</label><div style={{...styles.input, background:'#e9ecef', color:'#555', fontWeight:'bold'}}>{formData.confNo}</div></div>
                              <div><label style={styles.label}>Age</label><div style={{...styles.input, background:'#e9ecef', color:'#555', fontWeight:'bold'}}>{selectedStudent.age}</div></div>
                              <div>
                                  <label style={styles.label}>Gender</label>
                                  <div style={{
                                      padding:'10px', background: themeColor, color:'white', 
                                      borderRadius:'6px', textAlign:'center', fontWeight:'bold', fontSize:'14px',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                  }}>
                                      {selectedStudent.gender}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* 3. ASSIGNMENT SECTION */}
                  <div style={{
                      display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', 
                      opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none', transition:'opacity 0.3s'
                  }}>
                      {/* ACCOMMODATION */}
                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #f0f0f0', paddingBottom:'10px'}}>
                              <MapPin size={18} color="#007bff"/> Accommodation
                          </h4>
                          <div style={{marginBottom:'15px'}}>
                              <label style={styles.label}>Room / Bed</label>
                              <button type="button" onClick={() => setShowVisualRoom(true)} 
                                  style={{
                                      ...styles.input, textAlign:'left', 
                                      background: formData.roomNo ? '#e3f2fd' : 'white', 
                                      color: formData.roomNo ? '#0d47a1' : '#555', 
                                      borderColor: formData.roomNo ? '#90caf9' : '#ddd',
                                      fontWeight: formData.roomNo ? 'bold' : 'normal', 
                                      cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'
                                  }}>
                                  {formData.roomNo || "Select Room"}
                                  {formData.roomNo ? <CheckCircle size={18} color="#28a745"/> : <ArrowRight size={16} color="#ccc"/>}
                              </button>
                          </div>
                          <div>
                              <label style={styles.label}>Laundry Token</label>
                              <input style={styles.input} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Optional Token #" />
                          </div>
                      </div>

                      {/* DINING & LOCKERS */}
                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'8px', borderBottom:'1px solid #f0f0f0', paddingBottom:'10px'}}>
                              <Coffee size={18} color="#e91e63"/> Dining & Lockers
                          </h4>
                          <div style={{marginBottom:'15px'}}>
                              <label style={styles.label}>Dining Seat</label>
                              <div style={{display:'flex', gap:'8px'}}>
                                  <select style={{...styles.input, width:'80px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}>
                                      <option>Chair</option><option>Floor</option>
                                  </select>
                                  <button type="button" onClick={() => setShowVisualDining(true)} 
                                      style={{
                                          ...styles.input, textAlign:'left', flex:1,
                                          background: formData.seatNo ? '#e3f2fd' : 'white', 
                                          color: formData.seatNo ? '#0d47a1' : '#555', 
                                          fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer'
                                      }}>
                                      {formData.seatNo || "Select Seat"}
                                  </button>
                              </div>
                          </div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                              <div>
                                  <label style={{fontSize:'11px', color:'#777', fontWeight:'bold', display:'flex', gap:'4px'}}><Lock size={12}/> Mobile</label>
                                  <select style={styles.input} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}>
                                      <option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label style={{fontSize:'11px', color:'#777', fontWeight:'bold', display:'flex', gap:'4px'}}><Key size={12}/> Valuables</label>
                                  <select style={styles.input} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}>
                                      <option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* 4. EXTRAS */}
                  <div style={{
                      marginTop:'25px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', 
                      opacity: selectedStudent ? 1 : 0.5, transition:'opacity 0.3s'
                  }}>
                      <div><label style={styles.label}>Language</label><select style={styles.input} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                      <div><label style={styles.label}>Pagoda Cell</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, textAlign:'left', cursor:'pointer'}}>{formData.pagodaCell || "None"}</button></div>
                      <div><label style={styles.label}>Special Seating</label><select style={styles.input} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
                  </div>

                  {/* 5. ACTIONS */}
                  <div style={{marginTop:'35px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'15px'}}>
                      <button type="button" onClick={triggerReprint} disabled={!selectedStudent} 
                          style={{
                              ...styles.btn(false), background:'white', border:'1px solid #ccc', color:'#555', 
                              display:'flex', alignItems:'center', gap:'8px', padding:'12px 20px'
                          }}>
                          <Printer size={18}/> Reprint Pass
                      </button>
                      <button type="submit" disabled={!selectedStudent} 
                          style={{
                              ...styles.btn(true), 
                              background: selectedStudent ? 'linear-gradient(45deg, #28a745, #218838)' : '#e0e0e0', 
                              color: selectedStudent ? 'white' : '#999', 
                              padding:'12px 40px', fontSize:'16px', borderRadius:'30px',
                              boxShadow: selectedStudent ? '0 4px 15px rgba(40,167,69,0.3)' : 'none',
                              cursor: selectedStudent ? 'pointer' : 'not-allowed',
                              display:'flex', alignItems:'center', gap:'10px'
                          }}>
                          <CheckCircle size={20}/> Confirm Check-In
                      </button>
                  </div>
              </form>

              {/* --- RIGHT: LIVE PREVIEW CARD --- */}
              <div style={{
                  background:'white', borderRadius:'16px', 
                  boxShadow:'0 10px 30px rgba(0,0,0,0.08)', padding:'0', 
                  height:'fit-content', overflow:'hidden', position:'sticky', top:'20px'
              }}>
                  <div style={{background: themeColor, padding:'15px', textAlign:'center', color:'white'}}>
                      <h3 style={{margin:0, fontSize:'16px', letterSpacing:'1px', textTransform:'uppercase'}}>Arrival Pass</h3>
                      <div style={{fontSize:'11px', opacity:0.8, marginTop:'4px'}}>LIVE PREVIEW</div>
                  </div>
                  
                  {selectedStudent ? (
                      <div style={{padding:'25px'}}>
                          <div style={{textAlign:'center', marginBottom:'20px'}}>
                              <div style={{fontWeight:'800', fontSize:'20px', color:'#333', lineHeight:'1.2'}}>{selectedStudent.full_name}</div>
                              <div style={{fontSize:'13px', color:'#777', marginTop:'5px'}}>{formData.confNo}</div>
                          </div>
                          
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#eee', border:'1px solid #eee', borderRadius:'10px', overflow:'hidden', marginBottom:'20px'}}>
                              <div style={{background:'white', padding:'15px', textAlign:'center'}}>
                                  <div style={{fontSize:'10px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Room</div>
                                  <div style={{fontWeight:'900', fontSize:'24px', color:'#333'}}>{formData.roomNo || '-'}</div>
                              </div>
                              <div style={{background:'white', padding:'15px', textAlign:'center'}}>
                                  <div style={{fontSize:'10px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Dining</div>
                                  <div style={{fontWeight:'900', fontSize:'24px', color:'#333'}}>{formData.seatNo || '-'}</div>
                              </div>
                              <div style={{background:'white', padding:'15px', textAlign:'center'}}>
                                  <div style={{fontSize:'10px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Mobile</div>
                                  <div style={{fontWeight:'bold', fontSize:'16px', color:'#555'}}>{formData.mobileLocker || '-'}</div>
                              </div>
                              <div style={{background:'white', padding:'15px', textAlign:'center'}}>
                                  <div style={{fontSize:'10px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Valuables</div>
                                  <div style={{fontWeight:'bold', fontSize:'16px', color:'#555'}}>{formData.valuablesLocker || '-'}</div>
                              </div>
                          </div>
                          
                          <div style={{textAlign:'center', fontSize:'12px', color:'#aaa', fontStyle:'italic'}}>
                              {formData.language} • {selectedStudent.age} Yrs • {selectedStudent.gender}
                          </div>
                      </div>
                  ) : (
                      <div style={{padding:'50px 20px', textAlign:'center', color:'#ccc'}}>
                          <User size={40} style={{opacity:0.2, marginBottom:'10px'}}/>
                          <div>Select a student to preview pass.</div>
                      </div>
                  )}
                  {selectedStudent && <div style={{height:'8px', background: `repeating-linear-gradient(45deg, ${themeColor}, ${themeColor} 10px, white 10px, white 20px)`}}></div>}
              </div>
          </div>

          {/* VISUAL MODALS */}
          {showVisualDining && <DiningLayout gender={currentGenderLabel} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
          {showVisualPagoda && <PagodaLayout gender={currentGenderLabel} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
          
          {/* VISUAL ROOM MAP */}
          {showVisualRoom && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
                  <div style={{background:'white', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1200px', margin:'0 auto', width:'100%'}}>
                      <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <h3 style={{margin:0}}>📍 Select Bed for {selectedStudent ? selectedStudent.full_name : 'Student'} ({isFemale ? 'Female' : 'Male'})</h3>
                          <button onClick={()=>setShowVisualRoom(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button>
                      </div>
                      <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>
                          {isFemale ? (
                              <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />
                          ) : (
                              <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* --- INVISIBLE PRINT SECTION --- */}
          {printReceiptData && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}>
                  <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}>
                      <button onClick={()=>setPrintReceiptData(null)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button>
                      
                      <div id="receipt-print-area" style={{padding:'5px', border:'3px solid black', borderRadius:'8px', fontFamily:'Helvetica, Arial, sans-serif', color:'black', width:'70mm', margin:'0 auto', boxSizing:'border-box'}}>
                          {/* HEADER */}
                          <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'5px'}}>
                              <div style={{fontSize:'16px'}}>VIPASSANA</div>
                              <div style={{fontSize:'10px'}}>International Meditation Center</div>
                              <div style={{fontSize:'12px'}}>Dhamma Nagajjuna 2</div>
                          </div>
                          
                          <div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div>
                          
                          {/* ALIGNED INFO TABLE */}
                          <table style={{width:'100%', fontSize:'11px', marginBottom:'5px', lineHeight:'1.3'}}>
                             <tbody>
                                 <tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Course:</td><td>{printReceiptData.courseName}</td></tr>
                                 <tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Teacher:</td><td>{printReceiptData.teacherName}</td></tr>
                                 <tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Date:</td><td>{printReceiptData.from} to {printReceiptData.to}</td></tr>
                             </tbody>
                          </table>

                          <div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div>

                          {/* MAIN CONTENT */}
                          <div style={{textAlign:'center'}}>
                              <div style={{fontSize:'14px', fontWeight:'900', textTransform:'uppercase', margin:'5px 0'}}>CHECK-IN PASS</div>
                              <div style={{fontSize:'45px', fontWeight:'900', lineHeight:'1', margin:'5px 0'}}>{printReceiptData.roomNo || '-'}</div>
                              <div style={{fontSize:'14px', fontWeight:'bold', margin:'5px 0', wordWrap:'break-word', lineHeight:'1.2'}}>{printReceiptData.studentName}</div>
                              <div style={{fontSize:'12px', fontWeight:'bold'}}>{printReceiptData.confNo}</div>
                          </div>

                          {/* GRID BOX */}
                          <table style={{width:'100%', borderCollapse:'collapse', marginTop:'10px', border:'2px solid black'}}>
                              <tbody>
                                  <tr>
                                      <td style={{border:'1px solid black', padding:'4px', width:'50%', fontSize:'11px'}}>Dining: <strong>{printReceiptData.seatNo || '-'}</strong></td>
                                      <td style={{border:'1px solid black', padding:'4px', width:'50%', fontSize:'11px'}}>Mobile: <strong>{printReceiptData.mobile}</strong></td>
                                  </tr>
                                  <tr>
                                      <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Valuables: <strong>{printReceiptData.valuables}</strong></td>
                                      <td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Lang: <strong>{printReceiptData.language}</strong></td>
                                  </tr>
                                  {(printReceiptData.laundry || printReceiptData.pagoda) && (
                                      <tr>
                                          <td colSpan="2" style={{border:'1px solid black', padding:'4px', fontSize:'11px', fontWeight:'bold', textAlign:'center', background:'#f0f0f0'}}>
                                              {printReceiptData.laundry && <span style={{marginRight:'10px'}}>Laundry: {printReceiptData.laundry}</span>}
                                              {printReceiptData.pagoda && <span>Pagoda: {printReceiptData.pagoda}</span>}
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>

                          <div style={{textAlign:'center', fontSize:'9px', fontStyle:'italic', marginTop:'5px'}}>*** Student Copy ***</div>
                      </div>

                      <div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                          <button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button>
                      </div>
                  </div>
                  {/* CSS: Force Single Page & Remove Margins */}
                  <style>{`
                    @media print { 
                        @page { size: 72mm auto; margin: 0; } 
                        html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; }
                        body * { visibility: hidden; } 
                        #receipt-print-area, #receipt-print-area * { visibility: visible; } 
                        #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; page-break-after: avoid; } 
                    }
                  `}</style>
              </div>
          )}
          
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
      </div> 
  );
}
