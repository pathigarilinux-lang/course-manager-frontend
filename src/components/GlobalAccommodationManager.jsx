import React, { useState, useEffect, useMemo } from 'react';
import { Home, User, ArrowRight, Trash2, Map, LayoutGrid, CheckCircle } from 'lucide-react';
import { API_URL, styles, PROTECTED_ROOMS, getSmartShortName } from '../config';

export default function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [moveMode, setMoveMode] = useState(null); // { student, sourceRoom }

  // --- LOADING ---
  const loadData = () => { 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => setRooms(Array.isArray(data) ? data : [])); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => setOccupancy(Array.isArray(data) ? data : [])); 
  };
  
  useEffect(loadData, []);

  // --- ACTIONS ---
  const handleAddRoom = async () => { 
      if (!newRoom.roomNo) return alert("Enter Room Number"); 
      try {
          const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom) });
          if(res.ok) { setNewRoom({ ...newRoom, roomNo: '' }); loadData(); } 
          else { const err = await res.json(); alert(`Error: ${err.error}`); }
      } catch(err) { alert("Network Error"); }
  };

  const handleDeleteRoom = async (id, name) => { 
      if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Room ${name} is protected.`); return; }
      if(window.confirm(`Delete room ${name}?`)) { await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); loadData(); } 
  };

  // --- SMART MOVE LOGIC ---
  const handleRoomClick = async (targetRoom) => {
      // 1. If no move in progress, just select room (or start move if occupied)
      const targetOccupant = occupancy.find(p => p.room_no === targetRoom.room_no);

      if (!moveMode) {
          if (targetOccupant) {
              setMoveMode({ student: targetOccupant, sourceRoom: targetRoom.room_no });
          } else {
              // Admin wants to edit/delete empty room?
              if(window.confirm(`Delete empty room ${targetRoom.room_no}?`)) handleDeleteRoom(targetRoom.room_id, targetRoom.room_no);
          }
          return;
      }

      // 2. MOVE IN PROGRESS
      const { student, sourceRoom } = moveMode;
      
      // Prevent Gender Mismatch
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoom.gender_type || '').toLowerCase();
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} student to ${targetRoom.gender_type} room. Proceed?`)) return;
      }

      if (targetOccupant) {
          // SWAP
          if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoom.room_no }) });
      } else {
          // MOVE TO EMPTY
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoom.room_no }) });
      }
      
      setMoveMode(null);
      loadData();
  };

  // --- DATA PROCESSING (Building Groups) ---
  const processedData = useMemo(() => {
      const buildings = {};
      const stats = { m: { total:0, occ:0 }, f: { total:0, occ:0 } };

      rooms.forEach(r => {
          // Identify Building Prefix (e.g. "DN2-101" -> "DN2")
          const prefix = r.room_no.includes('-') ? r.room_no.split('-')[0] : (r.room_no.match(/^[A-Za-z]+/) ? r.room_no.match(/^[A-Za-z]+/)[0] : 'General');
          
          if (!buildings[prefix]) buildings[prefix] = { name: prefix, m: [], f: [] };
          
          const occupant = occupancy.find(p => p.room_no === r.room_no);
          const roomObj = { ...r, occupant };

          if (r.gender_type === 'Male') {
              buildings[prefix].m.push(roomObj);
              stats.m.total++;
              if(occupant) stats.m.occ++;
          } else {
              buildings[prefix].f.push(roomObj);
              stats.f.total++;
              if(occupant) stats.f.occ++;
          }
      });

      return { buildings, stats };
  }, [rooms, occupancy]);

  // --- COMPONENT: ROOM BOX ---
  const RoomBox = ({ r }) => {
      const isOccupied = !!r.occupant;
      const isOld = isOccupied && (r.occupant.conf_no || '').match(/^(O|S)/i);
      const isMoveTarget = moveMode && !isOccupied;
      const isMoveSource = moveMode && moveMode.sourceRoom === r.room_no;

      let bg = 'white';
      if (isMoveSource) bg = '#fff3cd'; // Yellow (Moving from)
      else if (isMoveTarget) bg = '#e8f5e9'; // Green (Click to move here)
      else if (isOld) bg = '#e1bee7'; // Purple (Old Student)
      else if (isOccupied) bg = '#c8e6c9'; // Green (New Student)

      return (
          <div onClick={() => handleRoomClick(r)}
               style={{
                   border: `1px solid ${isOccupied ? '#999' : '#eee'}`,
                   borderRadius: '6px',
                   padding: '8px',
                   background: bg,
                   cursor: 'pointer',
                   transition: 'all 0.1s',
                   boxShadow: isOccupied ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                   opacity: (moveMode && !isMoveTarget && !isMoveSource && !isOccupied) ? 0.3 : 1,
                   minHeight: '70px',
                   display: 'flex',
                   flexDirection: 'column',
                   justifyContent: 'space-between',
                   position: 'relative'
               }}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', fontWeight:'bold', color: '#555', marginBottom:'2px'}}>
                  <span>{r.room_no}</span>
                  {isOccupied && <span style={{fontSize:'10px', color: isOld ? '#6a1b9a' : '#2e7d32'}}>{r.occupant.conf_no}</span>}
              </div>
              
              {isOccupied ? (
                  <div style={{fontSize:'12px', fontWeight:'bold', lineHeight:'1.2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {r.occupant.full_name}
                  </div>
              ) : (
                  <div style={{color:'#ccc', fontSize:'10px', fontStyle:'italic'}}>Empty</div>
              )}

              {/* Status Dot */}
              <div style={{
                  position: 'absolute', bottom:'5px', right:'5px', 
                  width:'8px', height:'8px', borderRadius:'50%', 
                  background: isOccupied ? (isOld ? '#8e24aa' : '#2e7d32') : '#e0e0e0'
              }}/>
          </div>
      );
  };

  return (
    <div style={styles.card}>
      {/* HEADER & CONTROLS */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Home size={24}/> Global Accommodation</h2>
              <div style={{fontSize:'12px', color:'#666', marginTop:'5px'}}>
                  <span style={{color:'#007bff', marginRight:'15px'}}>Male: {processedData.stats.m.occ} / {processedData.stats.m.total}</span>
                  <span style={{color:'#e91e63'}}>Female: {processedData.stats.f.occ} / {processedData.stats.f.total}</span>
              </div>
          </div>

          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              {moveMode && (
                  <div style={{background:'#fff3cd', padding:'5px 15px', borderRadius:'20px', border:'1px solid #ffeeba', fontSize:'13px', display:'flex', alignItems:'center', gap:'10px'}}>
                      <span>Moving: <b>{moveMode.student.full_name}</b></span>
                      <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Cancel ✕</button>
                  </div>
              )}
              
              <div style={{display:'flex', gap:'0', background:'#f8f9fa', padding:'2px', borderRadius:'6px', border:'1px solid #ddd'}}>
                  <input style={{border:'none', padding:'8px', background:'transparent', width:'70px', fontSize:'13px'}} placeholder="New Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} />
                  <div style={{width:'1px', background:'#ddd', margin:'5px 0'}}></div>
                  <select style={{border:'none', padding:'8px', background:'transparent', fontSize:'13px', cursor:'pointer'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select>
                  <button onClick={handleAddRoom} style={{border:'none', background:'#28a745', color:'white', padding:'0 15px', borderRadius:'0 4px 4px 0', cursor:'pointer', fontWeight:'bold'}}>+</button>
              </div>
              <button onClick={loadData} style={styles.quickBtn(false)}>↻</button>
          </div>
      </div>

      {/* BUILDING GRIDS */}
      <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
          {Object.values(processedData.buildings).map(b => (
              (b.m.length > 0 || b.f.length > 0) && (
                  <div key={b.name} style={{border:'1px solid #eee', borderRadius:'10px', overflow:'hidden'}}>
                      <div style={{background:'#f8f9fa', padding:'10px 15px', fontWeight:'bold', fontSize:'14px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:'10px'}}>
                          <LayoutGrid size={16} color="#555"/> {b.name === 'General' ? 'General Pool' : `Block ${b.name}`}
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
                          {/* MALE SIDE */}
                          <div style={{padding:'15px', borderRight:'1px solid #eee'}}>
                              {b.m.length > 0 && <div style={{fontSize:'10px', fontWeight:'bold', color:'#007bff', textTransform:'uppercase', marginBottom:'10px'}}>Male Wing</div>}
                              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px'}}>
                                  {b.m.sort((x,y)=>x.room_no.localeCompare(y.room_no, undefined, {numeric:true})).map(r => (
                                      <RoomBox key={r.room_id} r={r} />
                                  ))}
                              </div>
                          </div>
                          {/* FEMALE SIDE */}
                          <div style={{padding:'15px'}}>
                              {b.f.length > 0 && <div style={{fontSize:'10px', fontWeight:'bold', color:'#e91e63', textTransform:'uppercase', marginBottom:'10px'}}>Female Wing</div>}
                              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px'}}>
                                  {b.f.sort((x,y)=>x.room_no.localeCompare(y.room_no, undefined, {numeric:true})).map(r => (
                                      <RoomBox key={r.room_id} r={r} />
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )
          ))}
      </div>
      
      {rooms.length === 0 && <div style={{textAlign:'center', padding:'50px', color:'#999'}}>No rooms found. Add some above.</div>}
    </div>
  );
}
