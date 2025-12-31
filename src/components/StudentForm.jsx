import React, { useState, useEffect } from 'react';
import { UserPlus, Save, X, Search, BedDouble, AlertCircle, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import { API_URL, styles } from '../config';

// --- LAYOUTS ---
import MaleBlockLayout from './MaleBlockLayout';
import FemaleBlockLayout from './FemaleBlockLayout';
import NewBlockLayout from './NewBlockLayout'; // ✅ 1. IMPORT NEW LAYOUT

// --- HELPERS ---
const getGenderColor = (g) => (g||'').toLowerCase().startsWith('m') ? '#007bff' : '#e91e63';

export default function StudentForm({ courses, fetchStats, refreshCourses, preSelectedRoom, clearRoom }) {
  // --- STATE ---
  const [formData, setFormData] = useState({
      full_name: '',
      gender: 'Male',
      age: '',
      mobile_no: '',
      email: '',
      city: '',
      occupation: '',
      room_no: '',
      course_id: '',
      conf_no: '', // Important for Old/New Logic
      status: 'Attending',
      remarks: ''
  });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ 2. NEW STATE FOR ROOM MODAL TABS
  const [roomModalTab, setRoomModalTab] = useState('Male'); // 'Male', 'Female', 'New Block'

  // --- INITIALIZATION ---
  useEffect(() => {
      if (courses.length > 0 && !formData.course_id) {
          setFormData(prev => ({ ...prev, course_id: courses[0].course_id }));
      }
  }, [courses]);

  useEffect(() => {
      if (preSelectedRoom) {
          setFormData(prev => ({ ...prev, room_no: preSelectedRoom }));
      }
  }, [preSelectedRoom]);

  // --- FETCH ROOM DATA (When Modal Opens) ---
  const loadRoomData = async () => {
      try {
          const t = Date.now();
          const [rRes, oRes] = await Promise.all([
              fetch(`${API_URL}/rooms?t=${t}`),
              fetch(`${API_URL}/rooms/occupancy?t=${t}`)
          ]);
          setRooms(await rRes.json());
          setOccupancy(await oRes.json());
      } catch (e) { console.error("Room fetch error", e); }
  };

  const handleOpenRoomModal = () => {
      // Auto-switch tab based on selected gender
      if(formData.gender === 'Female') setRoomModalTab('Female');
      else setRoomModalTab('Male');
      
      loadRoomData();
      setShowRoomModal(true);
  };

  // --- HANDLERS ---
  const handleRoomSelect = (bedData) => {
      // bedData comes from the Layouts (contains room_no, maybe bedIndex)
      // Check if occupied
      if (bedData.occupant) {
          alert(`⚠️ Bed occupied by ${bedData.occupant.full_name}`);
          return;
      }
      
      const selectedRoom = bedData.room_no || bedData.room_id; // Handle different data shapes
      
      setFormData({ ...formData, room_no: selectedRoom });
      setShowRoomModal(false);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const payload = { ...formData };
          // Basic Validation
          if (!payload.full_name || !payload.age) {
              alert("Name and Age are required.");
              setIsSubmitting(false);
              return;
          }

          const res = await fetch(`${API_URL}/check-in`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const result = await res.json();
          if (res.ok) {
              alert(`✅ Check-In Successful!\nName: ${result.data.full_name}\nID: ${result.data.conf_no}`);
              
              // Reset Form but keep Course/Gender for speed
              setFormData({
                  full_name: '',
                  gender: payload.gender,
                  age: '',
                  mobile_no: '',
                  email: '',
                  city: '',
                  occupation: '',
                  room_no: '',
                  course_id: payload.course_id,
                  conf_no: '',
                  status: 'Attending',
                  remarks: ''
              });
              if(clearRoom) clearRoom(); // Clear pre-selected room from dashboard
              if(fetchStats) fetchStats();
              if(refreshCourses) refreshCourses();
          } else {
              alert(`❌ Error: ${result.error || 'Unknown error'}`);
          }
      } catch (err) {
          alert("❌ Network Error. Check connection.");
      }
      setIsSubmitting(false);
  };

  const updateConfNo = (val) => {
      // Auto-Format to Uppercase
      setFormData({...formData, conf_no: val.toUpperCase()});
  };

  return (
    <div style={styles.card}>
      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <UserPlus size={24} color={getGenderColor(formData.gender)}/>
          <h2 style={{margin:0, color:'#333'}}>Student Check-In</h2>
      </div>

      <form onSubmit={handleSubmit} style={{display:'grid', gap:'20px'}}>
          
          {/* 1. COURSE & BASIC INFO */}
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'15px'}}>
              <div>
                  <label style={styles.label}>Select Course</label>
                  <select style={styles.input} value={formData.course_id} onChange={e=>setFormData({...formData, course_id:e.target.value})}>
                      {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                  </select>
              </div>
              <div>
                  <label style={styles.label}>Confirmation No / ID</label>
                  <input 
                      style={{...styles.input, fontWeight:'bold', letterSpacing:'1px', textTransform:'uppercase'}} 
                      placeholder="e.g. O-1234"
                      value={formData.conf_no}
                      onChange={e=>updateConfNo(e.target.value)}
                  />
                  <div style={{fontSize:'10px', color:'#777', marginTop:'3px'}}>* Starts with 'O' (Old) or 'N' (New)</div>
              </div>
          </div>

          {/* 2. PERSONAL DETAILS */}
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'15px'}}>
              <div>
                  <label style={styles.label}>Full Name</label>
                  <input required style={styles.input} value={formData.full_name} onChange={e=>setFormData({...formData, full_name:e.target.value})} placeholder="Student Name"/>
              </div>
              <div>
                  <label style={styles.label}>Gender</label>
                  <select style={styles.input} value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                  </select>
              </div>
              <div>
                  <label style={styles.label}>Age</label>
                  <input required type="number" style={styles.input} value={formData.age} onChange={e=>setFormData({...formData, age:e.target.value})} placeholder="Age"/>
              </div>
          </div>

          {/* 3. CONTACT & CITY */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <div>
                  <label style={styles.label}>Mobile No</label>
                  <input type="tel" style={styles.input} value={formData.mobile_no} onChange={e=>setFormData({...formData, mobile_no:e.target.value})} placeholder="Phone Number"/>
              </div>
              <div>
                  <label style={styles.label}>City / Location</label>
                  <input style={styles.input} value={formData.city} onChange={e=>setFormData({...formData, city:e.target.value})} placeholder="City"/>
              </div>
          </div>

          {/* 4. ROOM ALLOCATION (THE KEY PART) */}
          <div style={{background: formData.room_no ? '#e8f5e9' : '#fff3e0', padding:'15px', borderRadius:'8px', border: formData.room_no ? '1px solid #a5d6a7' : '1px solid #ffe0b2'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                      <label style={{...styles.label, color:'#333', marginBottom:'5px'}}>Accommodation</label>
                      <div style={{fontSize:'18px', fontWeight:'bold', color: formData.room_no ? '#2e7d32' : '#e65100', display:'flex', alignItems:'center', gap:'8px'}}>
                          <BedDouble size={20}/>
                          {formData.room_no || 'No Room Assigned'}
                      </div>
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                      {formData.room_no && (
                          <button type="button" onClick={()=>setFormData({...formData, room_no: ''})} style={{background:'white', border:'1px solid #d32f2f', color:'#d32f2f', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>
                              <X size={16}/> Clear
                          </button>
                      )}
                      <button type="button" onClick={handleOpenRoomModal} style={{background:'#007bff', color:'white', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px'}}>
                          <Search size={16}/> Select Room
                      </button>
                  </div>
              </div>
          </div>

          {/* 5. SUBMIT BUTTON */}
          <div style={{borderTop:'1px solid #eee', paddingTop:'20px', display:'flex', justifyContent:'flex-end'}}>
              <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                      background: isSubmitting ? '#ccc' : getGenderColor(formData.gender), 
                      color: 'white', 
                      border: 'none', 
                      padding: '12px 30px', 
                      borderRadius: '8px', 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap:'10px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
              >
                  {isSubmitting ? 'Processing...' : 'CONFIRM CHECK-IN'} 
                  {!isSubmitting && <ArrowRight size={20}/>}
              </button>
          </div>

      </form>

      {/* --- ROOM SELECTION MODAL --- */}
      {showRoomModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:3000, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'#f4f6f8', width:'95%', maxWidth:'1400px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                  
                  {/* Modal Header */}
                  <div style={{background:'white', padding:'15px 25px', borderBottom:'1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                          <BedDouble size={24} color="#0d47a1"/> Select Room for <span style={{color: getGenderColor(formData.gender)}}>{formData.full_name || 'Student'}</span>
                      </h3>
                      <button onClick={()=>setShowRoomModal(false)} style={{background:'#eee', border:'none', borderRadius:'50%', width:'35px', height:'35px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          <X size={20}/>
                      </button>
                  </div>

                  {/* ✅ 3. TABS FOR SWITCHING VIEWS */}
                  <div style={{padding:'10px 25px', background:'white', borderBottom:'1px solid #eee', display:'flex', gap:'15px'}}>
                      {['Male', 'Female', 'New Block'].map(tab => {
                          const isActive = roomModalTab === tab;
                          const activeColor = tab === 'Male' ? '#007bff' : (tab === 'Female' ? '#e91e63' : '#6f42c1');
                          
                          return (
                              <button 
                                  key={tab}
                                  onClick={() => setRoomModalTab(tab)}
                                  style={{
                                      padding: '8px 20px',
                                      borderRadius: '20px',
                                      border: isActive ? `2px solid ${activeColor}` : '1px solid #ddd',
                                      background: isActive ? `${activeColor}10` : 'white',
                                      color: isActive ? activeColor : '#666',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                  }}
                              >
                                  {tab.toUpperCase()} BLOCK
                              </button>
                          );
                      })}
                      
                      <button onClick={loadRoomData} style={{marginLeft:'auto', background:'none', border:'none', color:'#007bff', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                          <RefreshCw size={14}/> Refresh
                      </button>
                  </div>

                  {/* Modal Body (Scrollable Layout) */}
                  <div style={{flex:1, overflowY:'auto', padding:'25px'}}>
                      {roomModalTab === 'Male' && (
                          <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />
                      )}
                      
                      {roomModalTab === 'Female' && (
                          <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />
                      )}

                      {/* ✅ RENDER NEW BLOCK LAYOUT */}
                      {roomModalTab === 'New Block' && (
                          <NewBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />
                      )}
                  </div>

              </div>
          </div>
      )}
    </div>
  );
}
