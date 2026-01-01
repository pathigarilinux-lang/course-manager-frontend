import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, MapPin, Coffee, AlertTriangle, CheckCircle, Search, X, Printer, ArrowRight, RotateCcw } from 'lucide-react';

// ✅ IMPORT LEGACY LAYOUTS (Assuming they are in src/components/ alongside this file)
import MaleDiningLayout from './MaleDiningLayout'; 
import FemaleDiningLayout from './FemaleDiningLayout';
import PagodaLayout from '../PagodaLayout';
import MaleBlockLayout from './MaleBlockLayout'; 
import FemaleBlockLayout from './FemaleBlockLayout'; 
import NewBlockLayout from './NewBlockLayout'; 

import { API_URL, LANGUAGES, styles } from '../config';

const NUMBER_OPTIONS = Array.from({ length: 200 }, (_, i) => String(i + 1));

// --- 🔹 INTERNAL COMPONENT: DINING SYSTEM WITH TABS 🔹 ---
// We define this HERE to avoid file path issues.
const DiningSystem = ({ onSelect, occupied, currentGender, selected }) => {
  const [activeTab, setActiveTab] = useState('STANDARD'); 
  const isFemaleStd = (currentGender || '').toLowerCase().startsWith('f');

  // DN1 Data
  const DN1_CONFIG = {
    MALE: { color: '#1565c0', bg: '#e3f2fd', title: 'DN1 Male' },
    FEMALE: { color: '#ad1457', bg: '#fce4ec', title: 'DN1 Female' }
  };

  const occupiedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(occupied)) occupied.forEach(i => i?.seat && set.add(String(i.seat)));
    return set;
  }, [occupied]);

  const renderCell = (num) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const isSelected = String(selected) === numStr;
    return (
      <div key={num} onClick={() => !isOccupied && onSelect(numStr, 'Chair')}
        style={{
          width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center',
          background: isOccupied ? '#ffebee' : (isSelected ? '#333' : 'white'),
          color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'),
          border: '1px solid #ccc', borderRadius:'6px', cursor: isOccupied ? 'not-allowed' : 'pointer', fontWeight:'bold'
        }}>
        {num}
      </div>
    );
  };

  const renderGrid = (type) => {
    const conf = DN1_CONFIG[type];
    // Hardcoded seats for DN1
    const floor = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
    const chairs = [1,2,3,4,5,6,31,32,33,34,35,36,37,38,39,40,41,42];

    return (
      <div style={{textAlign:'center', padding:'10px', background: conf.bg, borderRadius:'8px'}}>
        <h4 style={{color: conf.color}}>{conf.title} Hall</h4>
        <div style={{display:'flex', justifyContent:'center', gap:'20px'}}>
          <div><strong style={{fontSize:'10px'}}>FLOOR</strong><div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{floor.map(renderCell)}</div></div>
          <div><strong style={{fontSize:'10px'}}>CHAIRS</strong><div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'5px'}}>{chairs.map(renderCell)}</div></div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* TABS */}
      <div style={{display:'flex', background:'#333', padding:'5px', borderRadius:'6px 6px 0 0'}}>
        {['STANDARD', 'MALE', 'FEMALE'].map(t => (
          <button key={t} type="button" onClick={()=>setActiveTab(t)} 
            style={{flex:1, padding:'8px', background: activeTab===t ? 'white' : 'transparent', color: activeTab===t ? 'black' : 'white', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'12px'}}>
            {t === 'STANDARD' ? 'Main Hall' : `DN1 ${t}`}
          </button>
        ))}
      </div>
      {/* CONTENT */}
      <div style={{padding:'10px', border:'1px solid #ccc', borderTop:'none'}}>
        {activeTab === 'STANDARD' && (
           isFemaleStd ? <FemaleDiningLayout onSelect={onSelect} occupied={occupied} selected={selected}/> : <MaleDiningLayout onSelect={onSelect} occupied={occupied} selected={selected}/>
        )}
        {activeTab === 'MALE' && renderGrid('MALE')}
        {activeTab === 'FEMALE' && renderGrid('FEMALE')}
      </div>
    </div>
  );
};
// --- 🔹 END INTERNAL COMPONENT 🔹 ---


// --- MAIN FORM COMPONENT ---
export default function StudentForm({ courses, preSelectedRoom, clearRoom, userRole }) {
  const [participants, setParticipants] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]); 
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [globalOccupied, setGlobalOccupied] = useState({ dining: [], pagoda: [] });

  const [formData, setFormData] = useState({ 
      courseId: '', courseName: '', participantId: '', roomNo: '', seatNo: '', 
      laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', 
      pagodaCell: '', laptop: 'No', confNo: '', specialSeating: 'None', seatType: 'Chair'
  });
  
  const [printReceiptData, setPrintReceiptData] = useState(null);
  const [showVisualRoom, setShowVisualRoom] = useState(false);
  const [showVisualDining, setShowVisualDining] = useState(false);
  const [showVisualPagoda, setShowVisualPagoda] = useState(false);
  const [roomModalTab, setRoomModalTab] = useState('Male'); 

  // Initial Data
  useEffect(() => { 
      fetch(`${API_URL}/rooms`).then(r=>r.json()).then(d=>setRooms(Array.isArray(d)?d:[])).catch(()=>setRooms([])); 
  }, []);

  // Sync Logic
  useEffect(() => { 
      if (formData.courseId) {
          const sync = () => {
              fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(r=>r.json()).then(d=>setParticipants(Array.isArray(d)?d:[]));
              fetch(`${API_URL}/courses/${formData.courseId}/global-occupied`).then(r=>r.json()).then(d=>setGlobalOccupied({dining:d.dining||[], pagoda:d.pagoda||[]})).catch(()=>setGlobalOccupied({dining:[], pagoda:[]}));
              fetch(`${API_URL}/rooms/occupancy`).then(r=>r.json()).then(d=>setOccupancy(Array.isArray(d)?d:[]));
          };
          sync(); const i = setInterval(sync, 5000); return () => clearInterval(i);
      }
  }, [formData.courseId]);

  // Handlers
  const selectStudent = (s) => {
      setSelectedStudent(s);
      setFormData(prev => ({ ...prev, participantId: s.participant_id, confNo: s.conf_no||'', courseId: s.courseId||prev.courseId }));
      setSearchTerm(s.full_name); setIsSearching(false);
  };

  const handleDiningSelect = (seat, type) => {
      // Simple conflict check
      if (globalOccupied.dining.some(x => String(x.seat) === String(seat))) return alert("Seat Occupied!");
      setFormData(prev => ({...prev, seatNo: String(seat), seatType: type}));
      setShowVisualDining(false);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setStatus('Saving...');
      try {
          await fetch(`${API_URL}/check-in`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...formData, gender: selectedStudent?.gender}) });
          setPrintReceiptData({...formData, name: selectedStudent.full_name, date: new Date().toLocaleDateString()});
          setTimeout(()=>window.print(), 500);
          setStatus('✅ Done');
          setFormData({...formData, participantId:'', roomNo:'', seatNo:'', laundryToken:''});
          setSelectedStudent(null); setSearchTerm('');
      } catch(err) { setStatus('❌ Error'); alert(err.message); }
  };

  const searchResults = participants.filter(p => !searchTerm ? false : p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
      <div style={styles.card}>
          {/* HEADER */}
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <h3>Check-In Console</h3>
              {status && <span style={{color:'green', fontWeight:'bold'}}>{status}</span>}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              <form onSubmit={handleSubmit}>
                  {/* SEARCH */}
                  <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'8px', marginBottom:'15px'}}>
                      <label style={styles.label}>Select Course</label>
                      <select style={{...styles.input, marginBottom:'10px'}} onChange={e=>setFormData({...formData, courseId:e.target.value})} value={formData.courseId}>
                          <option value="">-- Select --</option>{courses?.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                      </select>
                      
                      <label style={styles.label}>Find Student</label>
                      <input style={styles.input} placeholder="Search Name..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value); setIsSearching(true)}} />
                      {isSearching && searchTerm && (
                          <div style={{background:'white', border:'1px solid #ccc', maxHeight:'200px', overflowY:'auto'}}>
                              {searchResults.map(p => (
                                  <div key={p.participant_id} onClick={()=>selectStudent(p)} style={{padding:'8px', borderBottom:'1px solid #eee', cursor:'pointer'}}>
                                      <b>{p.full_name}</b> ({p.conf_no})
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {selectedStudent && (
                      <div style={{animation:'fadeIn 0.3s'}}>
                          <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                              <span style={{background:'#eee', padding:'5px 10px', borderRadius:'4px'}}>ID: {formData.confNo}</span>
                              <span style={{background:'#eee', padding:'5px 10px', borderRadius:'4px'}}>{selectedStudent.gender}</span>
                          </div>

                          {/* SELECTION BUTTONS */}
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
                              {/* ROOM */}
                              <div style={{border:'1px solid #ccc', padding:'10px', borderRadius:'8px'}}>
                                  <h5>Room</h5>
                                  <button type="button" onClick={()=>{setShowVisualRoom(true)}} style={{...styles.btn(false), width:'100%', textAlign:'left'}}>
                                      {formData.roomNo || "Select Room"}
                                  </button>
                              </div>

                              {/* DINING */}
                              <div style={{border:'1px solid #ccc', padding:'10px', borderRadius:'8px'}}>
                                  <h5>Dining</h5>
                                  <button type="button" onClick={()=>setShowVisualDining(true)} style={{...styles.btn(false), width:'100%', textAlign:'left'}}>
                                      {formData.seatNo || "Select Seat"}
                                  </button>
                              </div>
                          </div>

                          <button type="submit" style={{...styles.btn(true), width:'100%', padding:'15px'}}>CONFIRM CHECK-IN</button>
                      </div>
                  )}
              </form>

              {/* RECEIPT PREVIEW */}
              {selectedStudent && (
                  <div className="no-print" style={{border:'2px solid #333', padding:'20px', borderRadius:'8px'}}>
                      <h4 style={{textAlign:'center', margin:0}}>Receipt Preview</h4>
                      <hr/>
                      <p><b>Name:</b> {selectedStudent.full_name}</p>
                      <p><b>Room:</b> {formData.roomNo}</p>
                      <p><b>Dining:</b> {formData.seatNo}</p>
                  </div>
              )}
          </div>

          {/* --- VISUAL MODALS --- */}
          
          {/* DINING MODAL (Uses Internal Component) */}
          {showVisualDining && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
                  <div style={{background:'white', flex:1, borderRadius:'8px', overflow:'hidden', display:'flex', flexDirection:'column'}}>
                      <div style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                          <h3>Select Dining</h3>
                          <button onClick={()=>setShowVisualDining(false)}><X/></button>
                      </div>
                      <div style={{flex:1, overflow:'auto'}}>
                          <DiningSystem 
                              onSelect={handleDiningSelect} 
                              occupied={globalOccupied.dining} 
                              currentGender={selectedStudent?.gender}
                              selected={formData.seatNo}
                          />
                      </div>
                  </div>
              </div>
          )}

          {/* ROOM MODAL (Standard) */}
          {showVisualRoom && (
              <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', padding:'20px'}}>
                  <div style={{background:'white', flex:1, borderRadius:'8px', overflow:'auto', padding:'20px'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}><h3>Select Room</h3><button onClick={()=>setShowVisualRoom(false)}><X/></button></div>
                      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                          {['Male','Female','New Block'].map(t=><button key={t} onClick={()=>setRoomModalTab(t)} style={{padding:'10px', borderBottom: roomModalTab===t?'2px solid blue':'1px solid #ccc'}}>{t}</button>)}
                      </div>
                      {roomModalTab === 'Male' && <MaleBlockLayout onSelect={(r)=>{setFormData(p=>({...p, roomNo:r.room_no})); setShowVisualRoom(false)}} occupied={occupancy} />}
                      {roomModalTab === 'Female' && <FemaleBlockLayout onSelect={(r)=>{setFormData(p=>({...p, roomNo:r.room_no})); setShowVisualRoom(false)}} occupied={occupancy} />}
                      {roomModalTab === 'New Block' && <NewBlockLayout onSelect={(r)=>{setFormData(p=>({...p, roomNo:r.room_no})); setShowVisualRoom(false)}} occupied={occupancy} />}
                  </div>
              </div>
          )}
      </div>
  );
}
