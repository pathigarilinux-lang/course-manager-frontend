import React, { useState, useEffect } from 'react';
import DiningLayout from '../DiningLayout';
import PagodaLayout from '../PagodaLayout';
import { API_URL, LANGUAGES, NUMBER_OPTIONS, styles } from '../config';

export default function StudentForm({ courses, preSelectedRoom, clearRoom }) {
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [printData, setPrintData] = useState(null);
  
  const [formData, setFormData] = useState({ 
      courseId: '', participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', 
      language: 'English', pagodaCell: '', laptop: 'No', 
      confNo: '', specialSeating: 'None', seatType: 'Chair', dhammaSeat: '' 
  });
  
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);

  useEffect(() => { fetch(`${API_URL}/rooms`).then(res=>res.json()).then(setRooms); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); }, []);
  useEffect(() => { if (preSelectedRoom) { setFormData(prev => ({ ...prev, roomNo: preSelectedRoom })); if (courses.length > 0 && !formData.courseId) setFormData(prev => ({ ...prev, courseId: courses[0].course_id })); } }, [preSelectedRoom, courses]);
  useEffect(() => { if (formData.courseId) fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); }, [formData.courseId]);

  const normalize = (str) => str ? str.toString().replace(/[\s-]+/g, '').toUpperCase() : '';
  const cleanNum = (val) => val ? String(val).trim() : '';
  const currentGenderRaw = selectedStudent?.gender ? selectedStudent.gender.toLowerCase() : '';
  const isMale = currentGenderRaw.startsWith('m');
  const isFemale = currentGenderRaw.startsWith('f');
  const currentGenderLabel = isMale ? 'Male' : (isFemale ? 'Female' : 'Male');

  const occupiedRoomsSet = new Set(occupancy.map(p => p.room_no ? normalize(p.room_no) : ''));
  let availableRooms = rooms.filter(r => !occupiedRoomsSet.has(normalize(r.room_no)));
  if (isMale) availableRooms = availableRooms.filter(r => r.gender_type === 'Male'); 
  else if (isFemale) availableRooms = availableRooms.filter(r => r.gender_type === 'Female');

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

  const handleStudentChange = (e) => { 
      const selectedId = e.target.value; 
      const student = participants.find(p => p.participant_id == selectedId); 
      setSelectedStudent(student);
      setFormData(prev => ({ ...prev, participantId: selectedId, confNo: student ? (student.conf_no || '') : '', seatNo: '' })); 
  };

  const handleDiningSeatChange = (val, typeVal) => { 
      const lockerVal = (!usedMobiles.has(val) && !usedValuables.has(val)) ? val : '';
      setFormData(prev => ({ ...prev, seatNo: val, seatType: typeVal, mobileLocker: lockerVal, valuablesLocker: lockerVal })); 
      setShowVisualDining(false);
  };

  const handlePagodaSelect = (val) => { setFormData(prev => ({ ...prev, pagodaCell: val })); setShowVisualPagoda(false); };
  const triggerPrint = () => { setShowReceipt(true); setTimeout(() => { window.print(); }, 500); };

  const VisualSelector = ({ title, options, occupied, selected, onSelect, onClose }) => ( <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'80%', maxHeight:'80vh', overflowY:'auto'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h3>Select {title}</h3><button onClick={onClose}>Close</button></div><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px'}}>{options.map(opt => { const isOcc = occupied.has(String(opt)); return (<button key={opt} type="button" onClick={() => !isOcc && onSelect(opt)} disabled={isOcc} style={{padding:'10px', borderRadius:'5px', border:'none', cursor: isOcc?'not-allowed':'pointer', background: isOcc ? '#ffcdd2' : (String(selected)===String(opt) ? '#007bff' : '#c8e6c9'), color: (String(selected)===String(opt) ? 'white' : 'black'), fontWeight:'bold'}}>{opt}</button>); })}</div></div></div> );

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
          let cleanName = courseObj?.course_name || 'Unknown';
          cleanName = cleanName.replace(/-[A-Za-z]{3}-\d{2,4}.*$/g, '').replace(/\/.*$/, '').trim();
          setPrintData({ courseName: cleanName, teacherName: courseObj?.teacher_name || 'Goenka Ji', from: courseObj ? new Date(courseObj.start_date).toLocaleDateString() : '', to: courseObj ? new Date(courseObj.end_date).toLocaleDateString() : '', studentName: selectedStudent?.full_name, confNo: formData.confNo, roomNo: formData.roomNo, seatNo: formData.seatNo, lockers: formData.mobileLocker, language: formData.language, pagoda: (formData.pagodaCell && formData.pagodaCell !== 'None') ? formData.pagodaCell : null, special: (formData.specialSeating && formData.specialSeating !== 'None') ? formData.specialSeating : null });
          setShowReceipt(true);
          setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Floor', dhammaSeat: '' }));
          setSelectedStudent(null); clearRoom(); fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(setParticipants); fetch(`${API_URL}/rooms/occupancy`).then(res=>res.json()).then(setOccupancy); setTimeout(() => setStatus(''), 5000);
      } catch (err) { setStatus(`❌ ${err.message}`); } 
  };

  return ( 
      <div style={styles.card}><h2>📝 Student Onboarding</h2> {status && <div style={{padding:'10px', background:'#d4edda', color:'#155724', borderRadius:'6px', textAlign:'center', marginBottom:'15px'}}>{status}</div>} <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}> <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', marginBottom:'20px'}}> <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px'}}> <div><label style={styles.label}>1. Select Course</label><select style={styles.input} onChange={e => setFormData({...formData, courseId: e.target.value})} value={formData.courseId}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div> <div><label style={styles.label}>2. Select Student</label><select style={styles.input} onChange={handleStudentChange} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select --</option>{participants.filter(p=>p.status!=='Attending').map(p => <option key={p.participant_id} value={p.participant_id}>{p.status === 'Gate Check-In' ? '⚠️ AT GATE: ' : ''}{p.full_name} ({p.conf_no||'No ID'})</option>)}</select></div> </div> {selectedStudent && (selectedStudent.evening_food || selectedStudent.medical_info) && (<div style={{marginTop:'15px', padding:'10px', background:'#fff3e0', border:'1px solid #ffb74d', borderRadius:'5px', color:'#e65100'}}><strong>⚠️ ATTENTION:</strong> {selectedStudent.evening_food} {selectedStudent.medical_info}</div>)} </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:'15px'}}> <div><label style={styles.label}>🆔 Conf No</label><input style={{...styles.input}} value={formData.confNo} onChange={e => setFormData({...formData, confNo: e.target.value})} /></div> <div><label style={styles.label}>Age</label><input style={{...styles.input, background:'#e9ecef'}} value={selectedStudent?.age || ''} disabled /></div><div><label style={styles.label}>Room</label><button type="button" onClick={() => setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', background: formData.roomNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.roomNo || "Select Room (Grid)"}</button></div> <div><label style={styles.label}>Dining ({currentGenderLabel})</label><div style={{display:'flex', gap:'5px'}}><select style={{...styles.input, width:'70px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select><button type="button" onClick={() => setShowVisualDining(true)} style={{...styles.input, textAlign:'left', background: formData.seatNo ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.seatNo || "--"}</button></div></div> </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> <div><label style={styles.label}>Mobile</label><select style={styles.input} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}</select></div> <div><label style={styles.label}>Valuables</label><select style={styles.input} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}</select></div> <div><label style={styles.label}>Laundry</label><input style={{...styles.input}} value={formData.laundryToken} onChange={e=>setFormData({...formData, laundryToken:e.target.value})} placeholder="Token" /></div> <div><label style={styles.label}>Laptop</label><select style={styles.input} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})}><option>No</option><option>Yes</option></select></div> </div> <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'20px', marginTop:'15px'}}> <div><label style={styles.label}>Lang</label><select style={styles.input} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div> <div><label style={styles.label}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, textAlign:'left', background: formData.pagodaCell ? '#e8f5e9' : 'white', cursor:'pointer'}}>{formData.pagodaCell || "Select Cell"}</button></div><div><label style={styles.label}>DS Seat</label><input style={styles.input} value={formData.dhammaSeat} onChange={e => setFormData({...formData, dhammaSeat: e.target.value})} /></div><div><label style={styles.label}>Special</label><select style={styles.input} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option>Chowky</option><option>Chair</option><option>BackRest</option></select></div> </div> <div style={{marginTop:'30px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}><button type="button" onClick={triggerPrint} disabled={!selectedStudent} style={{padding:'12px 20px', background:'#6c757d', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>🖨️ Reprint</button><button type="submit" style={{padding:'12px 30px', background:'#007bff', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Confirm & Save</button></div> </form> {showVisualDining && <DiningLayout gender={currentGenderLabel} occupied={usedDining} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />} {showVisualPagoda && <PagodaLayout gender={currentGenderLabel} occupied={usedPagoda} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />} {showVisualRoom && <VisualSelector title="Room" options={availableRooms.map(r=>r.room_no)} occupied={occupiedRoomsSet} selected={formData.roomNo} onSelect={(val)=>{setFormData({...formData, roomNo:val}); setShowVisualRoom(false)}} onClose={()=>setShowVisualRoom(false)} />} {showReceipt && printData && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={() => setShowReceipt(false)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button><div id="receipt-print-area" style={{padding:'10px', border:'1px dashed #ccc', fontFamily:'Helvetica, Arial, sans-serif', color:'black'}}><div style={{textAlign:'center', fontWeight:'bold', marginBottom:'8px'}}><div style={{fontSize:'18px'}}>VIPASSANA</div><div style={{fontSize:'12px'}}>International Meditation Center</div><div style={{fontSize:'14px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'10px 0'}}></div><div style={{fontSize:'12px', marginBottom:'10px'}}><div><strong>Course:</strong> {printData.courseName}</div><div><strong>Teacher:</strong> {printData.teacherName}</div><div><strong>Dates:</strong> {printData.from} to {printData.to}</div></div><div style={{borderBottom:'1px solid black', margin:'10px 0'}}></div><div style={{fontSize:'16px', fontWeight:'bold', margin:'10px 0'}}><div>{printData.studentName}</div><div style={{fontSize:'14px'}}>Conf: {printData.confNo}</div></div><table style={{width:'100%', fontSize:'14px', border:'1px solid black', borderCollapse:'collapse'}}><tbody><tr><td style={{border:'1px solid black', padding:'5px'}}>Room</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.roomNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Dining</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.seatNo}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lockers</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.lockers}</td></tr><tr><td style={{border:'1px solid black', padding:'5px'}}>Lang</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.language}</td></tr>{printData.pagoda && <tr><td style={{border:'1px solid black', padding:'5px'}}>Pagoda</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.pagoda}</td></tr>}{printData.special && <tr><td style={{border:'1px solid black', padding:'5px'}}>Special</td><td style={{border:'1px solid black', padding:'5px', fontWeight:'bold'}}>{printData.special}</td></tr>}</tbody></table><div style={{textAlign:'center', fontSize:'10px', fontStyle:'italic', marginTop:'10px'}}>*** Student Copy ***</div></div><div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button></div></div><style>{`@media print { body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; } @page { size: auto; margin: 0; } }`}</style></div>)} </div> );
}
