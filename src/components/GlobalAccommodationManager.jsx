import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react'; // Removed unused icons
// 👇 UPDATE THIS LINE TO INCLUDE MISSING FUNCTIONS
import { API_URL, styles, PROTECTED_ROOMS, getSmartShortName } from '../config';

export default function GlobalAccommodationManager({ courses, onRoomClick }) {
  // ... (Paste full implementation from previous response)
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [editingRoom, setEditingRoom] = useState(null);

  const loadData = () => { 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); 
  };
  
  useEffect(loadData, []);

  const handleAddRoom = async () => { 
      if (!newRoom.roomNo) return alert("Enter Room Number"); 
      try {
          const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) });
          if(res.ok) {
              setNewRoom({ ...newRoom, roomNo: '' }); 
              loadData(); 
          } else {
              const err = await res.json();
              alert(`Error: ${err.error || "Failed to add room"}`);
          }
      } catch(err) { console.error(err); alert("Network Error"); }
  };

  const handleDeleteRoom = async (id, name) => { 
      if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Room ${name} is protected.`); return; }
      if(window.confirm(`Delete room ${name}?`)) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } 
  };

  const handleSwapSave = async () => { 
      if (!editingRoom || !editingRoom.p) return;
      const targetRoomNo = editingRoom.newRoomNo.trim();
      if(!targetRoomNo) return alert("Enter Target Room.");
      const normalize = (s) => s ? s.toString().trim().toUpperCase() : '';
      const targetNorm = normalize(targetRoomNo);
      const currentNorm = normalize(editingRoom.p.room_no);
      if (targetNorm === currentNorm) { alert("Same room!"); return; }
      const targetOccupant = occupancy.find(p => p.room_no && normalize(p.room_no) === targetNorm);
      const currentStudent = editingRoom.p;
      
      if(targetOccupant) {
          if(!window.confirm(`⚠️ Swap ${currentStudent.full_name} <-> ${targetOccupant.full_name}?`)) return;
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: currentStudent.room_no }) });
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: targetRoomNo }) });
      } else {
          await fetch(`${API_URL}/participants/${currentStudent.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...currentStudent, room_no: targetRoomNo }) });
      }
      setEditingRoom(null); 
      loadData();
  };

  const normalize = (str) => str ? str.toString().trim().toUpperCase() : '';
  const courseGroups = {};
  courses.forEach(c => { courseGroups[c.course_id] = { name: c.course_name, males: [], females: [], stats: { old: 0, new: 0, total: 0 } }; });
  const occupiedSet = new Set();
  occupancy.forEach(p => {
      if (p.room_no) {
          occupiedSet.add(normalize(p.room_no));
          const cId = p.course_id; 
          const group = courseGroups[cId]; 
          if (group) {
              const isOld = p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
              group.stats.total++;
              if (isOld) group.stats.old++; else group.stats.new++;
              if ((p.gender||'').toLowerCase().startsWith('f')) group.females.push(p); else group.males.push(p);
          }
      }
  });

  const availableRooms = rooms.filter(r => !occupiedSet.has(normalize(r.room_no)));
  const maleAvailable = availableRooms.filter(r => r.gender_type === 'Male');
  const femaleAvailable = availableRooms.filter(r => r.gender_type === 'Female');

  const RoomCard = ({ r, p, type }) => {
      const isOld = p && p.conf_no && (p.conf_no.startsWith('O') || p.conf_no.startsWith('S'));
      const bgColor = type === 'available' ? 'white' : (isOld ? '#e1bee7' : '#c8e6c9'); 
      const borderColor = type === 'available' ? '#ccc' : (isOld ? '#8e24aa' : '#2e7d32');
      const genderBorder = r.gender_type === 'Female' ? '4px solid #e91e63' : '4px solid #007bff';
      return (
          <div onClick={() => type === 'occupied' ? setEditingRoom({ p, newRoomNo: '' }) : onRoomClick(r.room_no)}
            style={{ border: `1px solid ${borderColor}`, borderLeft: genderBorder, background: bgColor, borderRadius: '4px', padding: '5px', minHeight: '60px', fontSize: '11px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <div style={{fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
                  {r.room_no}
                  {type === 'available' && <button onClick={(e)=>{e.stopPropagation(); handleDeleteRoom(r.room_id, r.room_no)}} style={{border:'none', background:'none', color:'#ccc', cursor:'pointer'}}>×</button>}
              </div>
              {type === 'occupied' && (<div style={{marginTop:'2px'}}><div style={{fontWeight:'bold', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div><div style={{display:'flex', justifyContent:'space-between', marginTop:'2px'}}><span style={{fontWeight:'bold', color:'#333'}}>{p.conf_no || '-'}</span><span style={{color:'#666'}}>{p.age}</span></div></div>)}
          </div>
      );
  };

  return ( 
    <div style={cardStyle}> 
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}> 
        <h2 style={{margin:0}}>🛏️ Global Accommodation</h2> 
        <div style={{display:'flex', gap:'5px', background:'#f9f9f9', padding:'5px', borderRadius:'5px'}}> 
            <input style={{...inputStyle, width:'60px', padding:'5px'}} placeholder="Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} /> 
            <select style={{...inputStyle, width:'80px', padding:'5px'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select> 
            <button onClick={handleAddRoom} style={{...toolBtn('#007bff')}}>+ Add Room</button> 
        </div>
        <button onClick={loadData} style={{...btnStyle(false), fontSize:'12px'}}>↻ Refresh</button> 
      </div> 
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', overflowX:'auto', paddingBottom:'10px'}}>
          {Object.values(courseGroups).map((g, i) => (
              <div key={i} style={{background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', minWidth:'180px', borderTop:'4px solid #28a745'}}>
                  <div style={{fontWeight:'bold', fontSize:'13px', marginBottom:'5px'}}>{getSmartShortName(g.name)}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}><span>Old: <b>{g.stats.old}</b></span><span>New: <b>{g.stats.new}</b></span><span>Total: <b>{g.stats.total}</b></span></div>
              </div>
          ))}
          <div style={{background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', minWidth:'180px', borderTop:'4px solid #6c757d'}}>
              <div style={{fontWeight:'bold', fontSize:'13px', marginBottom:'5px'}}>Available Pool</div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>
                  <span style={{color:'#007bff'}}>Male: <b>{maleAvailable.length}</b></span>
                  <span style={{color:'#e91e63'}}>Female: <b>{femaleAvailable.length}</b></span>
              </div>
          </div>
      </div>
      {Object.values(courseGroups).map((g, i) => ( g.stats.total > 0 &&
          <div key={i} style={{marginBottom:'20px', border:'1px solid #ccc', borderRadius:'8px', overflow:'hidden'}}>
              <div style={{background:'#333', color:'white', padding:'10px', fontWeight:'bold'}}>{getSmartShortName(g.name)} (Allocated)</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
                  <div style={{padding:'10px', borderRight:'1px solid #eee'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#007bff', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>MALE ({g.males.length})</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>{g.males.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (<RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Male'}} p={p} type="occupied" />))}</div>
                  </div>
                  <div style={{padding:'10px'}}>
                      <div style={{fontSize:'13px', fontWeight:'bold', color:'white', background:'#e91e63', padding:'5px 10px', borderRadius:'4px', marginBottom:'10px'}}>FEMALE ({g.females.length})</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'5px'}}>{g.females.sort((a,b)=>a.room_no.localeCompare(b.room_no)).map(p => (<RoomCard key={p.room_no} r={{room_no: p.room_no, gender_type: 'Female'}} p={p} type="occupied" />))}</div>
                  </div>
              </div>
          </div>
      ))}
      <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'10px'}}>
          <div style={{textAlign:'center', fontWeight:'bold', color:'#777', marginBottom:'10px'}}>🟢 AVAILABLE POOL</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              <div><h4 style={{margin:'0 0 10px 0', color:'#007bff', borderBottom:'2px solid #007bff'}}>MALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{maleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}</div></div>
              <div><h4 style={{margin:'0 0 10px 0', color:'#e91e63', borderBottom:'2px solid #e91e63'}}>FEMALE WING</h4><div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'5px'}}>{femaleAvailable.map(r => <RoomCard key={r.room_id} r={r} type="available" />)}</div></div>
          </div>
      </div>
      {editingRoom && ( <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}> <div style={{background:'white', padding:'25px', borderRadius:'10px', width:'350px'}}> <h3>🔄 Change/Swap Room</h3> <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'5px', marginBottom:'15px'}}> <p style={{margin:'5px 0'}}>Student: <strong>{editingRoom.p.full_name}</strong></p> <p style={{margin:'5px 0', fontSize:'12px'}}>Current Room: <strong>{editingRoom.p.room_no}</strong></p> </div> <label style={labelStyle}>New Room Number:</label> <input style={inputStyle} value={editingRoom.newRoomNo} onChange={e => setEditingRoom({...editingRoom, newRoomNo: e.target.value})} placeholder="Enter target room no" /> <div style={{marginTop:'20px', display:'flex', gap:'10px'}}> <button onClick={handleSwapSave} style={{...btnStyle(true), background:'#28a745', color:'white', flex:1}}>Update / Swap</button> <button onClick={() => setEditingRoom(null)} style={{...btnStyle(false), flex:1}}>Cancel</button> </div> </div> </div> )} 
    </div> 
  );
}
