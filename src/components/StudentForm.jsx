import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Coffee, Lock, Key, AlertTriangle, CheckCircle, Printer, Search, X } from 'lucide-react';
import DiningLayout from '../DiningLayout';
import PagodaLayout from '../PagodaLayout';
import MaleBlockLayout from './MaleBlockLayout'; // ✅ ADDED THIS IMPORT
import { API_URL, LANGUAGES, NUMBER_OPTIONS, styles } from '../config';

export default function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  // --- STATE ---
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [printData, setPrintData] = useState(null);
  
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
  
  // Visual Modals
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
          setSearchTerm(''); // Reset search when course changes
      }
  }, [formData.courseId]);

  // --- LOGIC ENGINE ---
  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  
  const currentGenderRaw = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGenderRaw.startsWith('m');
  const isFemale = currentGenderRaw.startsWith('f');
  const currentGenderLabel = isMale ? 'Male' : (isFemale ? 'Female' : 'Male');
  const themeColor = isMale ? '#007bff' : (isFemale ? '#e91e63' : '#6c757d');

  // 1. Room Logic
  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  // Note: We use availableRooms for logic, but the Visual Map handles display
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
  else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

  // 2. Locker & Seat Logic
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
      const pIsMale = pGender.startsWith('m');
      const pIsFemale = pGender.startsWith('f');

      if ((isMale && pIsMale) || (isFemale && pIsFemale)) {
          if (p.dining_seat_no) usedDining.add(cleanNum(p.dining_seat_no)); 
          if (p.pagoda_cell_no) usedPagoda.add(cleanNum(p.pagoda_cell_no)); 
      }
  });

  const availableMobiles = NUMBER_OPTIONS.filter(n => !usedMobiles.has(String(n)) || String(n) === String(formData.mobileLocker));
  const availableValuables = NUMBER_OPTIONS.filter(n => !usedValuables.has(String(n)) || String(n) === String(formData.valuablesLocker));

  // --- HANDLERS ---
  const selectStudent = (student) => {
      setSelectedStudent(student);
      setFormData(prev => ({ 
          ...prev, 
          participantId: student.participant_id, 
          confNo: student.conf_no || '', 
          seatNo: '', 
          mobileLocker: '', 
          valuablesLocker: '' 
      }));
      setSearchTerm(student.full_name);
      setIsSearching(false);
  };

  // ✅ NEW HANDLER FOR VISUAL MAP
  const handleRoomSelect = (roomObj) => {
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      setFormData(prev => ({ ...prev, roomNo: roomObj.room_no }));
      setShowVisualRoom(false);
  };

  const handleDiningSeatChange = (val, typeVal) => { 
      const lockerVal = (!usedMobiles.has(val) && !usedValuables.has(val)) ? val : '';
      setFormData(prev => ({ 
          ...prev, 
          seatNo: val, 
          seatType: typeVal, 
          mobileLocker: lockerVal, 
          valuablesLocker: lockerVal 
      })); 
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => { setFormData(prev => ({ ...prev, pagodaCell: val })); setShowVisualPagoda(false); };

  const triggerPrint = () => { setShowReceipt(true); setTimeout(() => { window.print(); }, 500); };

  const handleSubmit = async (e) => { 
      e.preventDefault();
      if (!formData.confNo) return alert("Missing Conf No");
      setStatus('Submitting...');
      try { 
          const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, diningSeatType: formData.seatType }) });
          if (!res.ok) throw new Error("Check-in failed"); 
          
          await fetch(`${API_URL}/notify`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type:'arrival', participantId: formData.participantId }) });
          
          const courseObj = courses.find(c => c.course_id == formData.courseId);
          let cleanName = courseObj?.course_name || 'Unknown';
          cleanName = cleanName.replace(/-[A-Za-z]{3}-\d{2,4}.*$/g, '').replace(/\/.*$/, '').trim();

          setPrintData({ 
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
          });
          
          setStatus('✅ Success!'); 
          setShowReceipt(true);
          
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
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><User size={24}/> Check-In Console</h2>
              {status && <div style={{padding:'5px 15px', background: status.includes('Success')?'#d4edda':'#f8d7da', color: status.includes('Success')?'#155724':'#721c24', borderRadius:'20px', fontWeight:'bold'}}>{status}</div>}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px'}}>
              {/* --- LEFT COLUMN: INPUT FORM --- */}
              <form onSubmit={handleSubmit}>
                  {/* 1. SELECTION AREA */}
                  <div style={{background:'#f8f9fa', padding:'20px', borderRadius:'12px', marginBottom:'20px', border:'1px solid #e9ecef'}}>
                      <div style={{marginBottom:'15px'}}>
                          <label style={styles.label}>1. Select Course</label>
                          <select style={styles.input} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}>
                              <option value="">-- Select Active Course --</option>
                              {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                          </select>
                      </div>

                      <div style={{position:'relative'}}>
                          <label style={styles.label}>2. Find Student (Name or Conf No)</label>
                          <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                              <Search size={18} style={{position:'absolute', left:'10px', color:'#999'}}/>
                              <input 
                                  ref={searchInputRef}
                                  style={{...styles.input, paddingLeft:'35px', fontWeight:'bold'}} 
                                  placeholder="Type to search..." 
                                  value={searchTerm}
                                  onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }}
                                  disabled={!formData.courseId}
                                  onFocus={() => setIsSearching(true)}
                              />
                              {searchTerm && <button type="button" onClick={()=>{setSearchTerm(''); setSelectedStudent(null);}} style={{position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer'}}><X size={16}/></button>}
                          </div>
                          
                          {isSearching && searchTerm && (
                              <div style={{position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #ddd', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'300px', overflowY:'auto'}}>
                                  {searchResults.length === 0 ? <div style={{padding:'10px', color:'#999'}}>No matches found.</div> : 
                                  searchResults.map(p => (
                                      <div key={p.participant_id} onClick={() => selectStudent(p)} style={{padding:'10px', borderBottom:'1px solid #f0f0f0', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', hover:{background:'#f9f9f9'}}}>
                                          <div>
                                              <div style={{fontWeight:'bold'}}>{p.full_name}</div>
                                              <div style={{fontSize:'12px', color:'#666'}}>{p.conf_no} | Age: {p.age} | {p.gender}</div>
                                          </div>
                                          {p.status === 'Gate Check-In' && <span style={{background:'#ffc107', padding:'2px 6px', borderRadius:'4px', fontSize:'10px'}}>AT GATE</span>}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* 2. STUDENT DETAILS & ALERTS */}
                  {selectedStudent && (
                      <div style={{marginBottom:'20px'}}>
                          {selectedStudent.medical_info && (
                              <div style={{background:'#fff3cd', border:'1px solid #ffeeba', color:'#856404', padding:'15px', borderRadius:'8px', marginBottom:'15px', display:'flex', gap:'10px', alignItems:'start'}}>
                                  <AlertTriangle size={20} style={{marginTop:'2px'}}/>
                                  <div>
                                      <strong>Medical Alert:</strong>
                                      <p style={{margin:'5px 0 0 0', fontSize:'13px'}}>{selectedStudent.medical_info}</p>
                                  </div>
                              </div>
                          )}
                          
                          <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                              <div style={{flex:1}}><label style={styles.label}>Conf No</label><input style={{...styles.input, background:'#e9ecef'}} value={formData.confNo} readOnly /></div>
                              <div style={{flex:1}}><label style={styles.label}>Age</label><input style={{...styles.input, background:'#e9ecef'}} value={selectedStudent.age} readOnly /></div>
                              <div style={{flex:1}}><label style={styles.label}>Gender</label><div style={{padding:'10px', background: themeColor, color:'white', borderRadius:'6px', textAlign:'center', fontWeight:'bold'}}>{selectedStudent.gender}</div></div>
                          </div>
                      </div>
                  )}

                  {/* 3. ASSIGNMENT GRID */}
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none'}}>
                      
                      {/* ACCOMMODATION */}
                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'15px'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'5px'}}><MapPin size={16}/> Accommodation</h4>
                          <div style={{marginBottom:'10px'}}>
                              <label style={styles.label}>Room No</label>
                              {/* ✅ UPDATED TO OPEN VISUAL MAP */}
                              <button type="button" onClick={() => setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  {formData.roomNo || "Select Room ->"}
                                  {formData.roomNo ? <CheckCircle size={16} color="#28a745"/> : <MapPin size={16} color="#007bff"/>}
                              </button>
                          </div>
                          <div>
                              <label style={styles.label}>Laundry Token</label>
                              <input style={styles.input} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token #" />
                          </div>
                      </div>

                      {/* DINING & LOCKERS */}
                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'15px'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'5px'}}><Coffee size={16}/> Dining & Lockers</h4>
                          <div style={{marginBottom:'10px'}}>
                              <label style={styles.label}>Dining Seat</label>
                              <div style={{display:'flex', gap:'5px'}}>
                                  <select style={{...styles.input, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                                  <button type="button" onClick={() => setShowVisualDining(true)} style={{...styles.input, textAlign:'left', background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer', flex:1}}>
                                      {formData.seatNo || "Select Seat"}
                                  </button>
                              </div>
                          </div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                              <div>
                                  <label style={{fontSize:'11px', color:'#777'}}>Mobile <Lock size={10}/></label>
                                  <select style={styles.input} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}>
                                      <option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label style={{fontSize:'11px', color:'#777'}}>Valuables <Key size={10}/></label>
                                  <select style={styles.input} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}>
                                      <option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* 4. EXTRAS */}
                  <div style={{marginTop:'20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', opacity: selectedStudent ? 1 : 0.5}}>
                      <div><label style={styles.label}>Language</label><select style={styles.input} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                      <div><label style={styles.label}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, textAlign:'left', cursor:'pointer'}}>{formData.pagodaCell || "None"}</button></div>
                      <div><label style={styles.label}>Special</label><select style={styles.input} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
                  </div>

                  <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                      <button type="button" onClick={triggerPrint} disabled={!selectedStudent} style={{...styles.btn(false), background:'#6c757d', color:'white'}}>🖨️ Reprint Last</button>
                      <button type="submit" disabled={!selectedStudent} style={{...styles.btn(true), background: selectedStudent ? '#28a745' : '#ccc', color:'white', padding:'12px 30px', fontSize:'16px'}}>Confirm Check-In</button>
                  </div>
              </form>

              {/* --- RIGHT COLUMN: LIVE BOARDING PASS PREVIEW --- */}
              <div style={{background:'white', borderRadius:'15px', border:'2px dashed #ddd', padding:'20px', height:'fit-content', boxShadow:'0 10px 30px rgba(0,0,0,0.05)'}}>
                  <div style={{textAlign:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}>
                      <h3 style={{margin:0, color:'#333'}}>BOARDING PASS</h3>
                      <div style={{fontSize:'12px', color:'#999', marginTop:'5px'}}>LIVE PREVIEW</div>
                  </div>
                  
                  {selectedStudent ? (
                      <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                          <div style={{textAlign:'center'}}>
                              <div style={{fontWeight:'bold', fontSize:'18px', color: themeColor}}>{selectedStudent.full_name}</div>
                              <div style={{fontSize:'14px', color:'#666'}}>{formData.confNo}</div>
                          </div>
                          
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'#f8f9fa', padding:'15px', borderRadius:'10px'}}>
                              <div><div style={{fontSize:'11px', color:'#999'}}>ROOM</div><div style={{fontWeight:'bold', fontSize:'20px'}}>{formData.roomNo || '-'}</div></div>
                              <div><div style={{fontSize:'11px', color:'#999'}}>DINING</div><div style={{fontWeight:'bold', fontSize:'20px'}}>{formData.seatNo || '-'}</div></div>
                              <div><div style={{fontSize:'11px', color:'#999'}}>MOBILE</div><div style={{fontWeight:'bold', fontSize:'16px'}}>{formData.mobileLocker || '-'}</div></div>
                              <div><div style={{fontSize:'11px', color:'#999'}}>VALUABLES</div><div style={{fontWeight:'bold', fontSize:'16px'}}>{formData.valuablesLocker || '-'}</div></div>
                          </div>

                          <div style={{textAlign:'center', fontSize:'12px', color:'#aaa'}}>
                              {formData.language} • {selectedStudent.age} Yrs • {selectedStudent.gender}
                          </div>
                      </div>
                  ) : (
                      <div style={{textAlign:'center', color:'#ccc', padding:'40px 0'}}>
                          <User size={48} style={{marginBottom:'10px'}}/>
                          <div>Select a student to preview ticket</div>
                      </div>
                  )}
              </div>
          </div>

          {/* VISUAL MODALS */}
          {showVisualDining && <DiningLayout gender={currentGenderLabel} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
          {showVisualPagoda && <PagodaLayout gender={currentGenderLabel} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
          
          {/* ✅ INTEGRATED MALE MAP */}
          {showVisualRoom && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
                  <div style={{background:'white', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1200px', margin:'0 auto', width:'100%'}}>
                      <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <h3 style={{margin:0}}>📍 Select Bed for {selectedStudent ? selectedStudent.full_name : 'Student'}</h3>
                          <button onClick={()=>setShowVisualRoom(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button>
                      </div>
                      <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>
                          <MaleBlockLayout 
                              rooms={rooms} 
                              occupancy={occupancy} 
                              onRoomClick={handleRoomSelect} 
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* PRINT RECEIPT */}
          {showReceipt && printData && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
                  <div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}>
                      <button onClick={() => setShowReceipt(false)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button>
                      <div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}>
                          <div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div>
                          <div style={{fontSize:'12px', marginBottom:'10px'}}><div><strong>Course:</strong> {printData.courseName}</div><div><strong>Teacher:</strong> {printData.teacherName}</div><div><strong>Dates:</strong> {printData.from} to {printData.to}</div></div>
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
