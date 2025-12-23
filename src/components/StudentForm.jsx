import React, { useState, useEffect } from 'react';
import { Save, X, User, MapPin, Smartphone, Key, LayoutGrid, Info, CheckCircle } from 'lucide-react';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout'; 

export default function StudentForm({ courseId, student = null, onSave, onCancel }) {
  // --- STATE ---
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    conf_no: '',
    room_no: '',
    pagoda_cell_no: '',
    dining_seat_no: '',
    mobile_locker_no: '',
    valuables_locker_no: '',
    laundry_token_no: '',
    discourse_language: 'Hindi'
  });

  // Resources & Data
  const [mobileOptions, setMobileOptions] = useState([]);
  const [valuablesOptions, setValuablesOptions] = useState([]);
  const [laundryOptions, setLaundryOptions] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  
  // Student Search Data
  const [existingStudents, setExistingStudents] = useState([]);
  
  // Visual Map State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomsData, setRoomsData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (student) {
        setFormData(prev => ({ ...prev, ...student }));
    }

    if (courseId) {
        fetchCourseDetails();
        fetchResourcesAndStudents();
        fetchRoomData();
    }
  }, [courseId, student]);

  // --- FETCH LOGIC ---
  const fetchCourseDetails = async () => {
      try {
          const res = await fetch(`${API_URL}/courses`);
          const data = await res.json();
          const c = data.find(x => x.course_id == courseId);
          setCourseInfo(c);
      } catch(e) { console.error(e); }
  };

  const fetchResourcesAndStudents = async () => {
      try {
          // 1. Get Participants (for Search & Laundry Logic)
          const pRes = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const participants = await pRes.json();
          setExistingStudents(participants); // For Auto-fill Search
          
          // 2. Get Lockers
          const lRes = await fetch(`${API_URL}/courses/${courseId}/available-lockers`);
          const lockers = await lRes.json();
          setMobileOptions(lockers.mobile || []);
          setValuablesOptions(lockers.valuables || []);

          // 3. Smart Laundry Logic
          const allLaundry = Array.from({length: 200}, (_, i) => String(i + 1));
          const usedLaundry = new Set(participants.map(p => String(p.laundry_token_no)));
          // Filter: Available OR (Current Student's Token if editing)
          const availableLaundry = allLaundry.filter(t => !usedLaundry.has(t) || (student && String(student.laundry_token_no) === t));
          setLaundryOptions(availableLaundry);

      } catch (err) { console.error("Resource error:", err); }
  };

  const fetchRoomData = async () => {
      try {
          const rRes = await fetch(`${API_URL}/rooms`);
          const oRes = await fetch(`${API_URL}/rooms/occupancy`);
          setRoomsData(await rRes.json());
          setOccupancyData(await oRes.json());
      } catch(e) { console.error(e); }
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // AUTO-POPULATE LOGIC
    if (name === 'full_name') {
        const found = existingStudents.find(s => s.full_name.toLowerCase() === value.toLowerCase());
        if (found) {
            setFormData(prev => ({
                ...prev,
                full_name: found.full_name,
                age: found.age,
                conf_no: found.conf_no,
                gender: found.gender
            }));
        }
    }
  };

  const handleRoomSelect = (roomObj) => {
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      setFormData(prev => ({ ...prev, room_no: roomObj.room_no }));
      setShowRoomModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setTimeout(() => window.print(), 500); 
  };

  // --- RENDER ---
  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
        <div>
            <h2 style={{margin:0}}>{student ? 'Edit Student' : 'New Student Check-In'}</h2>
            {courseInfo && <div style={{fontSize:'13px', color:'#007bff', fontWeight:'bold', marginTop:'5px'}}>{courseInfo.course_name} ({new Date(courseInfo.start_date).toLocaleDateString()})</div>}
        </div>
        <button onClick={onCancel} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="no-print">
        
        {/* ROW 1: SEARCHABLE NAME & BASIC INFO */}
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}>
            <div>
                <label style={styles.label}>Full Name (Search)</label>
                <div style={{display:'flex', alignItems:'center', border:'1px solid #ddd', borderRadius:'4px', padding:'0 5px'}}>
                    <User size={16} color="#666"/>
                    <input 
                        list="student-list" 
                        name="full_name" 
                        value={formData.full_name} 
                        onChange={handleChange} 
                        style={{...styles.input, border:'none'}} 
                        required 
                        placeholder="Type to search..." 
                        autoComplete="off"
                    />
                    <datalist id="student-list">
                        {existingStudents.map(s => <option key={s.participant_id} value={s.full_name} />)}
                    </datalist>
                </div>
            </div>
            <div>
                <label style={styles.label}>Conf No</label>
                <input name="conf_no" value={formData.conf_no} onChange={handleChange} style={styles.input} placeholder="OM12" />
            </div>
            <div>
                <label style={styles.label}>Age</label>
                <input name="age" type="number" value={formData.age} onChange={handleChange} style={styles.input} />
            </div>
            <div>
                <label style={styles.label}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
                    <option>Male</option>
                    <option>Female</option>
                </select>
            </div>
        </div>

        {/* ROW 2: ACCOMMODATION (Visual Map) */}
        <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', border:'1px solid #eee', marginBottom:'20px'}}>
            <h4 style={{marginTop:0, color:'#555', fontSize:'12px', textTransform:'uppercase'}}>Accommodation & Dining</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                {/* ROOM */}
                <div>
                    <label style={styles.label}>Room / Bed</label>
                    <div style={{display:'flex', gap:'5px'}}>
                        <input value={formData.room_no} readOnly style={{...styles.input, background:'white', fontWeight:'bold'}} placeholder="Select ->" />
                        <button type="button" onClick={() => setShowRoomModal(true)} style={{...styles.toolBtn('#007bff'), padding:'0 10px'}} title="Open Map">
                            <MapPin size={16}/>
                        </button>
                    </div>
                </div>
                {/* PAGODA */}
                <div>
                    <label style={styles.label}>Pagoda Cell</label>
                    <input name="pagoda_cell_no" value={formData.pagoda_cell_no} onChange={handleChange} style={styles.input} />
                </div>
                {/* DINING */}
                <div>
                    <label style={styles.label}>Dining Seat</label>
                    <input name="dining_seat_no" value={formData.dining_seat_no} onChange={handleChange} style={styles.input} />
                </div>
            </div>
        </div>

        {/* ROW 3: LOCKERS & LAUNDRY */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}>
            <div>
                <label style={styles.label}>Mobile Locker</label>
                <select name="mobile_locker_no" value={formData.mobile_locker_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {mobileOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Valuables Locker</label>
                <select name="valuables_locker_no" value={formData.valuables_locker_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {valuablesOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>
            <div>
                <label style={styles.label}>Laundry Token</label>
                <select name="laundry_token_no" value={formData.laundry_token_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {laundryOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

        {/* ACTIONS */}
        <div style={{textAlign:'right', borderTop:'1px solid #eee', paddingTop:'15px'}}>
            <button type="button" onClick={onCancel} style={{...styles.btn(false), marginRight:'10px'}}>Cancel</button>
            <button type="submit" style={{...styles.btn(true), background:'#28a745', color:'white'}}>
                <Save size={16} style={{marginRight:'5px'}}/> CHECK-IN & PRINT
            </button>
        </div>
      </form>

      {/* --- VISUAL ROOM MODAL --- */}
      {showRoomModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
              <div style={{background:'white', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1200px', margin:'0 auto', width:'100%'}}>
                  <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{margin:0}}>📍 Select Bed for {formData.full_name}</h3>
                      <button onClick={()=>setShowRoomModal(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button>
                  </div>
                  <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>
                      <MaleBlockLayout rooms={roomsData} occupancy={occupancyData} onRoomClick={handleRoomSelect} />
                  </div>
              </div>
          </div>
      )}

      {/* --- RECEIPT (Same as before) --- */}
      <div id="print-section">
          <div className="receipt-box">
              <div style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px', marginBottom:'10px'}}>
                  <div style={{fontSize:'18px', fontWeight:'900', textTransform:'uppercase'}}>Dhamma Nagajjuna</div>
                  <div style={{fontSize:'12px'}}>Vipassana International Academy</div>
                  <div style={{fontSize:'12px', marginTop:'5px'}}>Nagarjuna Sagar, Telangana</div>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'10px', borderBottom:'1px dashed #ccc', paddingBottom:'5px'}}>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                  <span><strong>Time:</strong> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              <div style={{textAlign:'center', marginBottom:'15px'}}>
                  <div style={{fontSize:'16px', fontWeight:'bold'}}>{formData.full_name}</div>
                  <div style={{fontSize:'14px', background:'#eee', display:'inline-block', padding:'2px 8px', borderRadius:'4px', marginTop:'5px'}}>{formData.conf_no || 'No Conf #'}</div>
              </div>

              <div style={{border:'2px solid black', borderRadius:'6px', overflow:'hidden'}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid black'}}>
                      <div style={{padding:'8px', borderRight:'1px solid black', textAlign:'center'}}>
                          <div style={{fontSize:'10px', textTransform:'uppercase', color:'#555'}}>Room / Bed</div>
                          <div style={{fontSize:'18px', fontWeight:'900'}}>{formData.room_no || '-'}</div>
                      </div>
                      <div style={{padding:'8px', textAlign:'center'}}>
                          <div style={{fontSize:'10px', textTransform:'uppercase', color:'#555'}}>Dining Seat</div>
                          <div style={{fontSize:'18px', fontWeight:'900'}}>{formData.dining_seat_no || '-'}</div>
                      </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr'}}>
                      <div style={{padding:'5px', borderRight:'1px solid black', textAlign:'center', borderBottom:'1px solid black'}}>
                          <div style={{fontSize:'9px', color:'#555'}}>Mobile</div>
                          <div style={{fontSize:'14px', fontWeight:'bold'}}>{formData.mobile_locker_no || '-'}</div>
                      </div>
                      <div style={{padding:'5px', borderRight:'1px solid black', textAlign:'center', borderBottom:'1px solid black'}}>
                          <div style={{fontSize:'9px', color:'#555'}}>Valuables</div>
                          <div style={{fontSize:'14px', fontWeight:'bold'}}>{formData.valuables_locker_no || '-'}</div>
                      </div>
                      <div style={{padding:'5px', textAlign:'center', borderBottom:'1px solid black'}}>
                          <div style={{fontSize:'9px', color:'#555'}}>Laundry</div>
                          <div style={{fontSize:'14px', fontWeight:'bold'}}>{formData.laundry_token_no || '-'}</div>
                      </div>
                  </div>
                  <div style={{padding:'5px', textAlign:'center', fontSize:'10px', background:'#f0f0f0'}}>
                      Pagoda: <strong>{formData.pagoda_cell_no || '-'}</strong> | Please keep this slip safe.
                  </div>
              </div>

              <div style={{textAlign:'center', fontSize:'10px', marginTop:'15px', fontStyle:'italic'}}>
                  Be Happy!
              </div>
          </div>
      </div>

      <style>{`
        @media print {
            @page { size: 72mm auto; margin: 0; }
            body * { visibility: hidden; }
            #print-section, #print-section * { visibility: visible; }
            #print-section { position: fixed; left: 0; top: 0; width: 100%; display: flex; justify-content: center; padding-top: 5mm; }
            .receipt-box { width: 68mm; font-family: 'Helvetica', sans-serif; padding: 0 2mm; }
            .no-print { display: none !important; }
        }
        #print-section { display: none; } 
      `}</style>
    </div>
  );
}
