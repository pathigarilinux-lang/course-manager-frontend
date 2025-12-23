import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Coffee, Lock, Key, AlertTriangle, CheckCircle, Search, X } from 'lucide-react';
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

  // ✅ SAFE FILTERING (Prevents Crash)
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
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><User size={24}/> Check-In Console</h2>
              {status && <div style={{padding:'5px 15px', background: status.includes('Success')?'#d4edda':'#f8d7da', color: status.includes('Success')?'#155724':'#721c24', borderRadius:'20px', fontWeight:'bold'}}>{status}</div>}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px'}}>
              {/* --- LEFT: FORM --- */}
              <form onSubmit={handleSubmit}>
                  {/* SELECTION */}
                  <div style={{background:'#f8f9fa', padding:'20px', borderRadius:'12px', marginBottom:'20px', border:'1px solid #e9ecef'}}>
                      <div style={{marginBottom:'15px'}}>
                          <label style={styles.label}>1. Select Course</label>
                          <select style={styles.input} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}>
                              <option value="">-- Select Active Course --</option>
                              {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                          </select>
                      </div>

                      <div style={{position:'relative'}}>
                          <label style={styles.label}>2. Find Student</label>
                          <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                              <Search size={18} style={{position:'absolute', left:'10px', color:'#999'}}/>
                              <input 
                                  ref={searchInputRef}
                                  style={{...styles.input, paddingLeft:'35px', fontWeight:'bold'}} 
                                  placeholder="Name or Conf No..." 
                                  value={searchTerm}
                                  onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }}
                                  disabled={!formData.courseId}
                                  onFocus={() => setIsSearching(true)}
                              />
                              {searchTerm && <button type="button" onClick={()=>{setSearchTerm(''); setSelectedStudent(null);}} style={{position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer'}}><X size={16}/></button>}
                          </div>
                          
                          {isSearching && searchTerm && (
                              <div style={{position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #ddd', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'300px', overflowY:'auto'}}>
                                  {searchResults.length === 0 ? <div style={{padding:'10px', color:'#999'}}>No matches.</div> : 
                                  searchResults.map(p => (
                                      <div key={p.participant_id} onClick={() => selectStudent(p)} style={{padding:'10px', borderBottom:'1px solid #f0f0f0', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                          <div>
                                              <div style={{fontWeight:'bold'}}>{p.full_name}</div>
                                              <div style={{fontSize:'12px', color:'#666'}}>{p.conf_no} | Age: {p.age}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* DETAILS */}
                  {selectedStudent && (
                      <div style={{marginBottom:'20px'}}>
                          {selectedStudent.medical_info && (
                              <div style={{background:'#fff3cd', border:'1px solid #ffeeba', color:'#856404', padding:'15px', borderRadius:'8px', marginBottom:'15px', display:'flex', gap:'10px', alignItems:'start'}}>
                                  <AlertTriangle size={20} style={{marginTop:'2px'}}/>
                                  <div><strong>Medical Alert:</strong> {selectedStudent.medical_info}</div>
                              </div>
                          )}
                          <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                              <div style={{flex:1}}><label style={styles.label}>Conf No</label><input style={{...styles.input, background:'#e9ecef'}} value={formData.confNo} readOnly /></div>
                              <div style={{flex:1}}><label style={styles.label}>Age</label><input style={{...styles.input, background:'#e9ecef'}} value={selectedStudent.age} readOnly /></div>
                              <div style={{flex:1}}><label style={styles.label}>Gender</label><div style={{padding:'10px', background: themeColor, color:'white', borderRadius:'6px', textAlign:'center', fontWeight:'bold'}}>{selectedStudent.gender}</div></div>
                          </div>
                      </div>
                  )}

                  {/* ASSIGNMENT */}
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none'}}>
                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'15px'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'5px'}}><MapPin size={16}/> Accommodation</h4>
                          <div style={{marginBottom:'10px'}}>
                              <label style={styles.label}>Room No</label>
                              <button type="button" onClick={() => setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  {formData.roomNo || "Select Room ->"}
                                  {formData.roomNo ? <CheckCircle size={16} color="#28a745"/> : <MapPin size={16} color="#007bff"/>}
                              </button>
                          </div>
                          <div><label style={styles.label}>Laundry Token</label><input style={styles.input} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token #" /></div>
                      </div>

                      <div style={{background:'white', border:'1px solid #eee', borderRadius:'10px', padding:'15px'}}>
                          <h4 style={{marginTop:0, color:'#555', display:'flex', alignItems:'center', gap:'5px'}}><Coffee size={16}/> Dining & Lockers</h4>
                          <div style={{marginBottom:'10px'}}>
                              <label style={styles.label}>Dining Seat</label>
                              <div style={{display:'flex', gap:'5px'}}>
                                  <select style={{...styles.input, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                                  <button type="button" onClick={() => setShowVisualDining(true)} style={{...styles.input, textAlign:'left', background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer', flex:1}}>{formData.seatNo || "Select Seat"}</button>
                              </div>
                          </div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                              <div><label style={{fontSize:'11px', color:'#777'}}>Mobile <Lock size={10}/></label><select style={styles.input} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                              <div><label style={{fontSize:'11px', color:'#777'}}>Valuables <Key size={10}/></label><select style={styles.input} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                          </div>
                      </div>
                  </div>

                  {/* EXTRAS */}
                  <div style={{marginTop:'20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', opacity: selectedStudent ? 1 : 0.5}}>
                      <div><label style={styles.label}>Language</label><select style={styles.input} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                      <div><label style={styles.label}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, textAlign:'left', cursor:'pointer'}}>{formData.pagodaCell || "None"}</button></div>
                      <div><label style={styles.label}>Special</label><select style={styles.input} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
                  </div>

                  <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                      <button type="button" onClick={triggerReprint} disabled={!selectedStudent} style={{...styles.btn(false), background:'#6c757d', color:'white'}}>🖨️ Reprint</button>
                      <button type="submit" disabled={!selectedStudent} style={{...styles.btn(true), background: selectedStudent ? '#28a745' : '#ccc', color:'white', padding:'12px 30px', fontSize:'16px'}}>Confirm Check-In</button>
                  </div>
              </form>

              {/* --- RIGHT: LIVE PREVIEW --- */}
              <div style={{background:'white', borderRadius:'15px', border:'2px dashed #ddd', padding:'20px', height:'fit-content'}}>
                  <div style={{textAlign:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'15px'}}>
                      <h3 style={{margin:0, color:'#333'}}>CHECK-IN PASS</h3>
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
                          <div style={{textAlign:'center', fontSize:'12px', color:'#aaa'}}>{formData.language} • {selectedStudent.age} Yrs</div>
                      </div>
                  ) : <div style={{textAlign:'center', color:'#ccc', padding:'40px 0'}}>Select a student</div>}
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
      </div> 
  );
}
