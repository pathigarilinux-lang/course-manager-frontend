import React, { useState, useEffect } from 'react';
import { Save, X, User, MapPin, Search } from 'lucide-react';
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
    laptop_locker_no: '', // ✅ Added Laptop
    laundry_token_no: '',
    discourse_language: 'Hindi', // ✅ Added Lang
    special_seating: 'None',     // ✅ Added Special Set
    status: 'Attending'          // Hidden default
  });

  // Resources
  const [mobileOptions, setMobileOptions] = useState([]);
  const [valuablesOptions, setValuablesOptions] = useState([]);
  const [laundryOptions, setLaundryOptions] = useState([]);
  const [participants, setParticipants] = useState([]); 
  const [courseInfo, setCourseInfo] = useState(null);

  // Visual Map State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomsData, setRoomsData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (student) setFormData(prev => ({ ...prev, ...student }));
    if (courseId) {
        fetchCourseAndResources();
        fetchRoomData(); 
    }
  }, [courseId, student]);

  // --- FETCH LOGIC ---
  const fetchCourseAndResources = async () => {
      try {
          // 1. Course Info
          const cRes = await fetch(`${API_URL}/courses`);
          const cData = await cRes.json();
          setCourseInfo(cData.find(c => c.course_id == courseId));

          // 2. Participants (For Name Search & Laundry Calc)
          const pRes = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const pData = await pRes.json();
          setParticipants(pData);

          // 3. Lockers
          const lRes = await fetch(`${API_URL}/courses/${courseId}/available-lockers`);
          const lockers = await lRes.json();
          setMobileOptions(lockers.mobile || []);
          setValuablesOptions(lockers.valuables || []);
          // Note: Laptop lockers would be fetched here if API supported, else manual input

          // 4. Smart Laundry Logic
          const allLaundry = Array.from({length: 200}, (_, i) => String(i + 1));
          const usedLaundry = new Set(pData.map(p => String(p.laundry_token_no)));
          const availableLaundry = allLaundry.filter(t => !usedLaundry.has(t) || (student && String(student.laundry_token_no) === t));
          setLaundryOptions(availableLaundry);

      } catch (err) { console.error(err); }
  };

  const fetchRoomData = async () => {
      try {
          const rRes = await fetch(`${API_URL}/rooms`);
          const oRes = await fetch(`${API_URL}/rooms/occupancy`);
          setRoomsData(await rRes.json());
          setOccupancyData(await oRes.json());
      } catch (err) { console.error(err); }
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // AUTO-POPULATE: Name Search
    if (name === 'full_name') {
        const found = participants.find(p => p.full_name.toLowerCase() === value.toLowerCase());
        if (found) {
            setFormData(prev => ({
                ...prev,
                age: found.age,
                conf_no: found.conf_no,
                gender: found.gender
            }));
        }
    }
  };

  const handleRoomSelect = (roomObj) => {
      if (roomObj.occupant) return alert("⛔ This bed is occupied!");
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
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
        <div>
            <h2 style={{margin:0}}>{student ? 'Edit Student' : 'New Student Check-In'}</h2>
            {courseInfo && <div style={{fontSize:'13px', color:'#007bff', fontWeight:'bold', marginTop:'5px'}}>{courseInfo.course_name}</div>}
        </div>
        <button onClick={onCancel} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="no-print">
        
        {/* ROW 1: Name, Conf, Age, Gender */}
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
            <div>
                <label style={styles.label}>Full Name (Search)</label>
                <div style={{display:'flex', alignItems:'center', border:'1px solid #ddd', borderRadius:'4px', padding:'0 5px'}}>
                    <Search size={16} color="#666"/>
                    <input list="s-list" name="full_name" value={formData.full_name} onChange={handleChange} style={{...styles.input, border:'none'}} required placeholder="Search..." autoComplete="off"/>
                    <datalist id="s-list">{participants.map(p=><option key={p.participant_id} value={p.full_name}/>)}</datalist>
                </div>
            </div>
            <div><label style={styles.label}>Conf No</label><input name="conf_no" value={formData.conf_no} onChange={handleChange} style={styles.input} /></div>
            <div><label style={styles.label}>Age</label><input name="age" type="number" value={formData.age} onChange={handleChange} style={styles.input} /></div>
            <div><label style={styles.label}>Gender</label><select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}><option>Male</option><option>Female</option></select></div>
        </div>

        {/* ROW 2: Allocation (Room, Pagoda, Dining) */}
        <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', border:'1px solid #eee', marginBottom:'20px'}}>
            <h4 style={{marginTop:0, color:'#555', fontSize:'12px', textTransform:'uppercase'}}>Allocation</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                <div>
                    <label style={styles.label}>Room / Bed</label>
                    <div style={{display:'flex', gap:'5px'}}>
                        <input value={formData.room_no} readOnly style={{...styles.input, background:'white', fontWeight:'bold'}} placeholder="Select ->" />
                        <button type="button" onClick={() => setShowRoomModal(true)} style={{...styles.toolBtn('#007bff'), padding:'0 10px'}} title="Map"><MapPin size={16}/></button>
                    </div>
                </div>
                <div><label style={styles.label}>Pagoda Cell</label><input name="pagoda_cell_no" value={formData.pagoda_cell_no} onChange={handleChange} style={styles.input} /></div>
                <div><label style={styles.label}>Dining Seat</label><input name="dining_seat_no" value={formData.dining_seat_no} onChange={handleChange} style={styles.input} /></div>
            </div>
        </div>

        {/* ROW 3: Lockers & Laundry */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}>
            <div><label style={styles.label}>Mobile Locker</label><select name="mobile_locker_no" value={formData.mobile_locker_no} onChange={handleChange} style={styles.input}><option value="">-- Assign --</option>{mobileOptions.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            <div><label style={styles.label}>Valuables</label><select name="valuables_locker_no" value={formData.valuables_locker_no} onChange={handleChange} style={styles.input}><option value="">-- Assign --</option>{valuablesOptions.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
            <div><label style={styles.label}>Laptop Locker</label><input name="laptop_locker_no" value={formData.laptop_locker_no} onChange={handleChange} style={styles.input} placeholder="Locker #" /></div>
            <div><label style={styles.label}>Laundry Token</label><select name="laundry_token_no" value={formData.laundry_token_no} onChange={handleChange} style={styles.input}><option value="">-- Assign --</option>{laundryOptions.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        </div>

        {/* ROW 4: Extra Info */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'20px'}}>
             <div>
                <label style={styles.label}>Language</label>
                <select name="discourse_language" value={formData.discourse_language} onChange={handleChange} style={styles.input}>
                    <option>Hindi</option><option>English</option><option>Telugu</option><option>Tamil</option><option>Other</option>
                </select>
            </div>
            <div>
                <label style={styles.label}>Special Seating</label>
                <select name="special_seating" value={formData.special_seating} onChange={handleChange} style={styles.input}>
                    <option>None</option><option>Chair</option><option>Chowky</option><option>BackRest</option>
                </select>
            </div>
        </div>

        {/* Actions */}
        <div style={{textAlign:'right', borderTop:'1px solid #eee', paddingTop:'15px'}}>
            <button type="button" onClick={onCancel} style={{...styles.btn(false), marginRight:'10px'}}>Cancel</button>
            <button type="submit" style={{...styles.btn(true), background:'#28a745', color:'white'}}><Save size={16} style={{marginRight:'5px'}}/> CHECK-IN</button>
        </div>
      </form>

      {/* --- VISUAL ROOM MODAL --- */}
      {showRoomModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}>
              <div style={{background:'white', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1200px', margin:'0 auto', width:'100%'}}>
                  <div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{margin:0}}>📍 Select Bed</h3>
                      <button onClick={()=>setShowRoomModal(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button>
                  </div>
                  <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>
                      <MaleBlockLayout rooms={roomsData} occupancy={occupancyData} onRoomClick={handleRoomSelect} />
                  </div>
              </div>
          </div>
      )}

      {/* --- RECEIPT (Updated with all fields) --- */}
      <div id="print-section">
          <div className="receipt-box">
              <div style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px', marginBottom:'10px'}}>
                  <div style={{fontSize:'18px', fontWeight:'900', textTransform:'uppercase'}}>Dhamma Nagajjuna</div>
                  <div style={{fontSize:'12px'}}>Vipassana International Academy</div>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'10px', borderBottom:'1px dashed #000', paddingBottom:'5px'}}>
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <div style={{textAlign:'center', marginBottom:'15px'}}>
                  <div style={{fontSize:'16px', fontWeight:'bold'}}>{formData.full_name}</div>
                  <div style={{fontSize:'14px', background:'#eee', display:'inline-block', padding:'2px 8px', borderRadius:'4px'}}>{formData.conf_no}</div>
              </div>
              
              {/* Main Allocations */}
              <table style={{width:'100%', borderCollapse:'collapse', border:'2px solid black', marginBottom:'5px'}}>
                  <tbody>
                      <tr>
                          <td style={{border:'1px solid black', padding:'8px', textAlign:'center', width:'50%'}}>
                              <div style={{fontSize:'10px', color:'#555'}}>ROOM / BED</div>
                              <div style={{fontSize:'22px', fontWeight:'900'}}>{formData.room_no || '-'}</div>
                          </td>
                          <td style={{border:'1px solid black', padding:'8px', textAlign:'center', width:'50%'}}>
                              <div style={{fontSize:'10px', color:'#555'}}>DINING</div>
                              <div style={{fontSize:'22px', fontWeight:'900'}}>{formData.dining_seat_no || '-'}</div>
                          </td>
                      </tr>
                  </tbody>
              </table>

              {/* Lockers Row */}
              <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid black', marginBottom:'5px'}}>
                  <tbody>
                      <tr>
                          <td style={{border:'1px solid black', padding:'5px', textAlign:'center', width:'25%'}}>
                              <div style={{fontSize:'8px', color:'#555'}}>MOBILE</div>
                              <div style={{fontSize:'13px', fontWeight:'bold'}}>{formData.mobile_locker_no || '-'}</div>
                          </td>
                          <td style={{border:'1px solid black', padding:'5px', textAlign:'center', width:'25%'}}>
                              <div style={{fontSize:'8px', color:'#555'}}>VALUABLE</div>
                              <div style={{fontSize:'13px', fontWeight:'bold'}}>{formData.valuables_locker_no || '-'}</div>
                          </td>
                          <td style={{border:'1px solid black', padding:'5px', textAlign:'center', width:'25%'}}>
                              <div style={{fontSize:'8px', color:'#555'}}>LAPTOP</div>
                              <div style={{fontSize:'13px', fontWeight:'bold'}}>{formData.laptop_locker_no || '-'}</div>
                          </td>
                          <td style={{border:'1px solid black', padding:'5px', textAlign:'center', width:'25%'}}>
                              <div style={{fontSize:'8px', color:'#555'}}>LAUNDRY</div>
                              <div style={{fontSize:'13px', fontWeight:'bold'}}>{formData.laundry_token_no || '-'}</div>
                          </td>
                      </tr>
                  </tbody>
              </table>

              {/* Extras Row */}
              <div style={{border:'1px solid black', padding:'5px', fontSize:'11px', background:'#f8f9fa'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span>Pagoda: <strong>{formData.pagoda_cell_no || '-'}</strong></span>
                      <span>Lang: <strong>{formData.discourse_language}</strong></span>
                      <span>Seat: <strong>{formData.special_seating}</strong></span>
                  </div>
              </div>

              <div style={{textAlign:'center', fontSize:'10px', marginTop:'10px', fontStyle:'italic'}}>Be Happy!</div>
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
