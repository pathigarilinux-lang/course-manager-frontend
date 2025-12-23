import React, { useState, useEffect } from 'react';
import { Save, X, User, MapPin, Smartphone, Key, LayoutGrid } from 'lucide-react'; // Icons
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout'; // ✅ Import the Visual Layout

export default function StudentForm({ courseId, student = null, onSave, onCancel }) {
  // --- STATE ---
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male', // Default to Male as per layout focus
    conf_no: '',
    room_no: '',
    dining_seat_no: '',
    mobile_locker_no: '',
    valuables_locker_no: '',
    laundry_token_no: '', // ✅ Added Laundry
    remarks: '',
    status: 'Attending'
  });

  const [mobileOptions, setMobileOptions] = useState([]);
  const [valuablesOptions, setValuablesOptions] = useState([]);
  const [laundryOptions, setLaundryOptions] = useState([]); // ✅ Laundry State
  
  // Visual Room Picker State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomsData, setRoomsData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (student) setFormData(student);
    if (courseId) {
        fetchAvailableResources();
        fetchRoomData(); // Load visual map data
    }
  }, [courseId, student]);

  // --- FETCH LOGIC ---
  const fetchAvailableResources = async () => {
      try {
          // 1. Get Course Participants to calculate used tokens
          const pRes = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const participants = await pRes.json();
          
          // 2. Get Locker Options (assuming API returns free lockers)
          const lRes = await fetch(`${API_URL}/courses/${courseId}/available-lockers`);
          const lockers = await lRes.json();
          setMobileOptions(lockers.mobile || []);
          setValuablesOptions(lockers.valuables || []);

          // 3. CALCULATE LAUNDRY (Client-Side Logic)
          // Define Total Range (e.g., 1 to 200)
          const allLaundry = Array.from({length: 200}, (_, i) => String(i + 1));
          const usedLaundry = new Set(participants.map(p => String(p.laundry_token_no)));
          
          // Filter: Available AND (Current Student's Token if editing)
          const availableLaundry = allLaundry.filter(t => !usedLaundry.has(t) || (student && String(student.laundry_token_no) === t));
          setLaundryOptions(availableLaundry);

      } catch (err) { console.error("Resource fetch error:", err); }
  };

  const fetchRoomData = async () => {
      // Fetch Data needed for MaleBlockLayout
      const rRes = await fetch(`${API_URL}/rooms`);
      const oRes = await fetch(`${API_URL}/rooms/occupancy`);
      setRoomsData(await rRes.json());
      setOccupancyData(await oRes.json());
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomSelect = (roomObj) => {
      if (roomObj.occupant) return alert("⛔ This bed is already occupied!");
      setFormData(prev => ({ ...prev, room_no: roomObj.room_no }));
      setShowRoomModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    // Auto-Print Receipt on Save (Optional)
    setTimeout(() => window.print(), 500); 
  };

  // --- RENDER ---
  return (
    <div style={styles.card}>
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0}}>{student ? 'Edit Student' : 'New Student Check-In'}</h2>
        <button onClick={onCancel} style={{background:'none', border:'none', cursor:'pointer'}}><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="no-print">
        {/* ROW 1: Basic Info */}
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
            <div>
                <label style={styles.label}>Full Name</label>
                <div style={{display:'flex', alignItems:'center', border:'1px solid #ddd', borderRadius:'4px', padding:'0 5px'}}>
                    <User size={16} color="#666"/>
                    <input name="full_name" value={formData.full_name} onChange={handleChange} style={{...styles.input, border:'none'}} required placeholder="Enter name" />
                </div>
            </div>
            <div>
                <label style={styles.label}>Conf No</label>
                <input name="conf_no" value={formData.conf_no} onChange={handleChange} style={styles.input} placeholder="e.g. OM12" />
            </div>
            <div>
                <label style={styles.label}>Age</label>
                <input name="age" type="number" value={formData.age} onChange={handleChange} style={styles.input} />
            </div>
        </div>

        {/* ROW 2: Allocation (Visual Room + Lockers) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'15px', background:'#f8f9fa', padding:'15px', borderRadius:'8px', border:'1px solid #eee'}}>
            
            {/* VISUAL ROOM SELECTOR */}
            <div>
                <label style={styles.label}>Room / Bed</label>
                <div style={{display:'flex', gap:'5px'}}>
                    <input value={formData.room_no} readOnly style={{...styles.input, background:'white', fontWeight:'bold'}} placeholder="Select ->" />
                    <button type="button" onClick={() => setShowRoomModal(true)} style={{...styles.toolBtn('#007bff'), padding:'0 10px'}} title="Open Map">
                        <MapPin size={16}/>
                    </button>
                </div>
            </div>

            {/* MOBILE LOCKER */}
            <div>
                <label style={styles.label}>Mobile Locker</label>
                <select name="mobile_locker_no" value={formData.mobile_locker_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {mobileOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* VALUABLES LOCKER */}
            <div>
                <label style={styles.label}>Valuables Locker</label>
                <select name="valuables_locker_no" value={formData.valuables_locker_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {valuablesOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            </div>

            {/* LAUNDRY TOKEN (New Logic) */}
            <div>
                <label style={styles.label}>Laundry Token</label>
                <select name="laundry_token_no" value={formData.laundry_token_no} onChange={handleChange} style={styles.input}>
                    <option value="">-- Assign --</option>
                    {laundryOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

        {/* ROW 3: Dining & Remarks */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 3fr', gap:'15px', marginBottom:'20px'}}>
            <div>
                <label style={styles.label}>Dining Seat</label>
                <input name="dining_seat_no" value={formData.dining_seat_no} onChange={handleChange} style={styles.input} />
            </div>
            <div>
                <label style={styles.label}>Remarks / Medical</label>
                <input name="remarks" value={formData.remarks} onChange={handleChange} style={styles.input} placeholder="Allergies, back problems..." />
            </div>
        </div>

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
                      <h3 style={{margin:0}}>📍 Select a Bed</h3>
                      <button onClick={()=>setShowRoomModal(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button>
                  </div>
                  <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>
                      <MaleBlockLayout rooms={roomsData} occupancy={occupancyData} onRoomClick={handleRoomSelect} />
                  </div>
              </div>
          </div>
      )}

      {/* --- PROFESSIONAL RECEIPT (Thermal Optimized) --- */}
      <div id="print-section">
          <div className="receipt-box">
              {/* HEADER */}
              <div style={{textAlign:'center', borderBottom:'2px solid black', paddingBottom:'10px', marginBottom:'10px'}}>
                  <div style={{fontSize:'18px', fontWeight:'900', textTransform:'uppercase'}}>Dhamma Nagajjuna</div>
                  <div style={{fontSize:'12px'}}>Vipassana International Academy</div>
                  <div style={{fontSize:'12px', marginTop:'5px'}}>Nagarjuna Sagar, Telangana</div>
              </div>

              {/* COURSE DETAILS */}
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'10px', borderBottom:'1px dashed #ccc', paddingBottom:'5px'}}>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                  <span><strong>Time:</strong> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              {/* STUDENT INFO */}
              <div style={{textAlign:'center', marginBottom:'15px'}}>
                  <div style={{fontSize:'16px', fontWeight:'bold'}}>{formData.full_name}</div>
                  <div style={{fontSize:'14px', background:'#eee', display:'inline-block', padding:'2px 8px', borderRadius:'4px', marginTop:'5px'}}>{formData.conf_no || 'No Conf #'}</div>
              </div>

              {/* ALLOCATION GRID */}
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
                  {/* Footer Message inside box */}
                  <div style={{padding:'5px', textAlign:'center', fontSize:'10px', background:'#f0f0f0'}}>
                      Please keep this slip safe.
                  </div>
              </div>

              {/* FOOTER */}
              <div style={{textAlign:'center', fontSize:'10px', marginTop:'15px', fontStyle:'italic'}}>
                  Be Happy!
              </div>
          </div>
      </div>

      {/* --- PRINT CSS --- */}
      <style>{`
        @media print {
            @page { size: 72mm auto; margin: 0; }
            body * { visibility: hidden; }
            #print-section, #print-section * { visibility: visible; }
            #print-section {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                padding-top: 5mm;
            }
            .receipt-box {
                width: 68mm; /* Safe thermal width */
                font-family: 'Helvetica', sans-serif;
                padding: 0 2mm;
            }
            .no-print { display: none !important; }
        }
        /* Screen View for Receipt (Hidden) */
        #print-section { display: none; } 
      `}</style>
    </div>
  );
}
