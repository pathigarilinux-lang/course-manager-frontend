import React, { useState, useEffect, useMemo } from 'react';
import { Home, User, LayoutGrid } from 'lucide-react';
import { API_URL, styles, PROTECTED_ROOMS } from '../config';
import MaleBlockLayout from './MaleBlockLayout'; // ✅ Import new component

export default function GlobalAccommodationManager({ courses, onRoomClick }) {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [newRoom, setNewRoom] = useState({ roomNo: '', type: 'Male' }); 
  const [activeTab, setActiveTab] = useState('Male'); // 'Male' or 'Female'
  const [moveMode, setMoveMode] = useState(null); 

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

  // --- SMART MOVE LOGIC (Passed to Layout) ---
  const handleRoomInteraction = async (targetRoomData) => {
      // If `targetRoomData` comes from MaleLayout, it might be the room object itself
      // We ensure we have the occupant info
      const targetRoomNo = targetRoomData.room_no;
      const targetOccupant = occupancy.find(p => p.room_no === targetRoomNo);

      if (!moveMode) {
          if (targetOccupant) {
              // Start Move
              setMoveMode({ student: targetOccupant, sourceRoom: targetRoomNo });
          } else {
              alert(`Room ${targetRoomNo} is empty. Click an occupied room to start moving a student.`);
          }
          return;
      }

      // 2. EXECUTE MOVE
      const { student, sourceRoom } = moveMode;
      
      // Gender Check
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoomData.gender_type || '').toLowerCase();
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} student to ${targetRoomData.gender_type} room. Proceed?`)) return;
      }

      if (targetOccupant) {
          // SWAP
          if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      } else {
          // MOVE TO EMPTY
          if (!window.confirm(`Move ${student.full_name} to ${targetRoomNo}?`)) return;
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      }
      
      setMoveMode(null);
      loadData();
  };

  // --- SIMPLE FEMALE RENDERER (Placeholder for now) ---
  const FemaleSimpleLayout = () => {
      const fRooms = rooms.filter(r => r.gender_type === 'Female');
      return (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px'}}>
              {fRooms.map(r => {
                  const occ = occupancy.find(p => p.room_no === r.room_no);
                  return (
                      <div key={r.room_id} onClick={() => handleRoomInteraction(r)}
                           style={{border:'1px solid #e91e63', padding:'10px', borderRadius:'5px', background: occ ? '#fce4ec' : 'white', cursor:'pointer'}}>
                          <div style={{fontWeight:'bold', color:'#e91e63'}}>{r.room_no}</div>
                          {occ ? <div style={{fontSize:'11px'}}>{occ.full_name}</div> : <div style={{color:'#ccc', fontSize:'10px'}}>Empty</div>}
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Home size={24}/> Global Accommodation</h2>
              <div style={{fontSize:'12px', color:'#666', marginTop:'5px'}}>Manage all blocks and bed assignments visually.</div>
          </div>

          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              {moveMode && (
                  <div style={{background:'#fff3cd', padding:'8px 15px', borderRadius:'20px', border:'1px solid #ffeeba', fontSize:'13px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                      <span>🚀 Moving: <b>{moveMode.student.full_name}</b> (from {moveMode.sourceRoom})</span>
                      <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'none', cursor:'pointer', fontWeight:'bold', color:'#856404'}}>Cancel ✕</button>
                  </div>
              )}
              
              {/* Quick Add Room */}
              <div style={{display:'flex', gap:'0', background:'#f8f9fa', padding:'2px', borderRadius:'6px', border:'1px solid #ddd'}}>
                  <input style={{border:'none', padding:'8px', background:'transparent', width:'70px', fontSize:'13px'}} placeholder="New Room" value={newRoom.roomNo} onChange={e=>setNewRoom({...newRoom, roomNo:e.target.value})} />
                  <div style={{width:'1px', background:'#ddd', margin:'5px 0'}}></div>
                  <select style={{border:'none', padding:'8px', background:'transparent', fontSize:'13px', cursor:'pointer'}} value={newRoom.type} onChange={e=>setNewRoom({...newRoom, type:e.target.value})}><option>Male</option><option>Female</option></select>
                  <button onClick={handleAddRoom} style={{border:'none', background:'#28a745', color:'white', padding:'0 15px', borderRadius:'0 4px 4px 0', cursor:'pointer', fontWeight:'bold'}}>+</button>
              </div>
              <button onClick={loadData} style={styles.quickBtn(false)}>↻</button>
          </div>
      </div>

      {/* TABS */}
      <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
          <button onClick={() => setActiveTab('Male')} style={{padding:'10px 20px', borderRadius:'5px 5px 0 0', border:'none', background: activeTab==='Male'?'#007bff':'#eee', color: activeTab==='Male'?'white':'#555', fontWeight:'bold', cursor:'pointer'}}>MALE BLOCKS</button>
          <button onClick={() => setActiveTab('Female')} style={{padding:'10px 20px', borderRadius:'5px 5px 0 0', border:'none', background: activeTab==='Female'?'#e91e63':'#eee', color: activeTab==='Female'?'white':'#555', fontWeight:'bold', cursor:'pointer'}}>FEMALE BLOCKS</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{background: activeTab === 'Male' ? '#f0f8ff' : '#fff0f5', padding:'20px', borderRadius:'0 5px 5px 5px', border:`2px solid ${activeTab==='Male'?'#007bff':'#e91e63'}`}}>
          {activeTab === 'Male' ? (
              <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />
          ) : (
              <FemaleSimpleLayout />
          )}
      </div>
    </div>
  );
}
