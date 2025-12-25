import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Users, BedDouble, Calendar } from 'lucide-react';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout'; 

export default function GlobalAccommodationManager() {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [activeTab, setActiveTab] = useState('Male'); 
  const [moveMode, setMoveMode] = useState(null); 
  
  // Stats & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ mOcc: 0, mTot: 0, fOcc: 0, fTot: 0, total: 0, breakdown: {} });

  // ✅ SIMPLE STATE for Manual Add
  const [newRoom, setNewRoom] = useState({ room_no: '', gender_type: 'Male' });

  // --- LOADING ---
  const loadData = async () => { 
    try {
        const t = Date.now(); 
        const [roomsRes, occRes, coursesRes] = await Promise.all([
            fetch(`${API_URL}/rooms?t=${t}`),
            fetch(`${API_URL}/rooms/occupancy?t=${t}`),
            fetch(`${API_URL}/courses`) 
        ]);

        const rList = await roomsRes.json();
        const oList = await occRes.json();
        const cList = await coursesRes.json();

        setRooms(Array.isArray(rList) ? rList : []);
        setOccupancy(Array.isArray(oList) ? oList : []);
        
        const courseMap = {};
        if (Array.isArray(cList)) {
            cList.forEach(c => {
                const shortName = c.course_name.split('/')[0].trim();
                courseMap[c.course_id] = shortName;
            });
        }
        calculateStats(Array.isArray(rList) ? rList : [], Array.isArray(oList) ? oList : [], courseMap);
    } catch (err) { console.error(err); }
  };
  
  useEffect(() => { loadData(); }, []);

  const calculateStats = (rList, oList, courseMap) => {
      const mOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const fOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
      const breakdown = {};
      oList.forEach(p => {
          if (p.course_id && courseMap[p.course_id]) breakdown[courseMap[p.course_id]] = (breakdown[courseMap[p.course_id]] || 0) + 1;
          else if (p.course_id) breakdown['Other'] = (breakdown['Other'] || 0) + 1;
      });
      setStats({ mOcc: mOccCount, fOcc: fOccCount, total: mOccCount + fOccCount, breakdown });
  };

  // ✅ YOUR SIMPLE LOGIC (Adding Room)
  const handleAddRoom = async () => { 
      if (!newRoom.room_no) return alert("Enter Room Number"); 
      try {
          const res = await fetch(`${API_URL}/rooms`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(newRoom) 
          });
          
          if(res.ok) {
              setNewRoom({ ...newRoom, room_no: '' }); 
              loadData(); 
              alert("Room Added!");
          } else {
              const err = await res.json();
              alert(`Error: ${err.message || err.error || "Failed to add room"}`);
          }
      } catch(err) { console.error(err); alert("Network Error"); }
  };

  // ✅ YOUR LOGIC (Deleting Room - passed to children)
  const PROTECTED_ROOMS = new Set(['201','202','301','302']); // Example protected list
  const handleDeleteRoom = async (id, name) => { 
      if (PROTECTED_ROOMS.has(name)) { alert(`🚫 Room ${name} is protected.`); return; }
      if(window.confirm(`Delete room ${name}?`)) { 
          await fetch(`${API_URL}/rooms/${id}`, { method: 'DELETE' }); 
          loadData(); 
      } 
  };

  // --- INTERACTION ---
  const handleRoomInteraction = async (targetRoomData) => {
      const targetRoomNo = targetRoomData.room_no;
      const targetOccupant = occupancy.find(p => p.room_no === targetRoomNo);

      if (!moveMode) {
          if (targetOccupant) setMoveMode({ student: targetOccupant, sourceRoom: targetRoomNo });
          return;
      }

      const { student, sourceRoom } = moveMode;
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoomData.gender_type || '').toLowerCase();
      
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} to ${targetRoomData.gender_type} room?`)) return;
      }

      if (targetOccupant) {
          if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      } else {
          if (!window.confirm(`Move ${student.full_name} to ${targetRoomNo}?`)) return;
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      }
      setMoveMode(null);
      loadData();
  };

  const searchResult = searchQuery ? occupancy.find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  return (
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
      
      {/* HEADER */}
      <div className="no-print" style={{background: 'linear-gradient(to right, #f8f9fa, #ffffff)', padding: '20px 30px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'22px'}}><BedDouble size={24} color="#007bff"/> Accommodation Manager</h2>
              <div style={{fontSize:'13px', color:'#666', marginTop:'6px', display:'flex', gap:'20px', fontWeight:'500'}}>
                  <span style={{color:'#007bff'}}>Male: <b>{stats.mOcc}</b></span><span style={{color:'#e91e63'}}>Female: <b>{stats.fOcc}</b></span>
              </div>
          </div>

          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
              
              {/* ✅ SIMPLE MANUAL ADD ROOM UI (Replaces Modal) */}
              <div style={{display:'flex', gap:'5px', background:'white', padding:'5px', borderRadius:'8px', border:'1px solid #ddd', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                  <input 
                    placeholder="Room No" 
                    value={newRoom.room_no} 
                    onChange={e => setNewRoom({...newRoom, room_no: e.target.value})}
                    style={{border:'1px solid #ccc', borderRadius:'4px', padding:'6px', width:'80px', fontSize:'13px'}}
                  />
                  <select 
                    value={newRoom.gender_type} 
                    onChange={e => setNewRoom({...newRoom, gender_type: e.target.value})}
                    style={{border:'1px solid #ccc', borderRadius:'4px', padding:'6px', fontSize:'13px', background:'#f9f9f9'}}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <button onClick={handleAddRoom} style={{background:'#007bff', color:'white', border:'none', borderRadius:'4px', padding:'6px 12px', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}>
                    + Add
                  </button>
              </div>

              {/* SEARCH */}
              <div style={{position:'relative'}}>
                  <div style={{display:'flex', alignItems:'center', background:'white', border:'1px solid #e0e0e0', borderRadius:'30px', padding:'8px 15px', width:'220px'}}><Search size={16} color="#aaa"/><input placeholder="Find Student..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{border:'none', outline:'none', marginLeft:'10px', fontSize:'13px', width:'100%'}} /></div>
                  {searchResult && (<div style={{position:'absolute', top:'120%', right:0, width:'280px', background:'white', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', borderRadius:'12px', padding:'15px', zIndex:100, border:'1px solid #eee'}}><div style={{fontWeight:'bold'}}>{searchResult.full_name}</div><div style={{fontSize:'12px'}}>{searchResult.room_no ? `📍 ${searchResult.room_no}` : 'No Room'}</div></div>)}
              </div>

              <button onClick={loadData} style={{background:'#f1f3f5', border:'none', borderRadius:'50%', width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><RefreshCw size={16}/></button>
          </div>
      </div>

      {/* TABS */}
      <div style={{background:'#f8f9fa', padding:'0 30px', borderBottom:'1px solid #e0e0e0', display:'flex', gap:'30px'}}>
          {['Male', 'Female'].map(gender => (<button key={gender} onClick={() => setActiveTab(gender)} style={{padding:'15px 5px', background:'transparent', border:'none', borderBottom: activeTab === gender ? `3px solid ${gender==='Male'?'#007bff':'#e91e63'}` : '3px solid transparent', color: activeTab === gender ? '#333' : '#666', fontWeight:'bold', cursor:'pointer'}}>{gender.toUpperCase()} BLOCKS</button>))}
      </div>

      {/* CANVAS - Passing delete function down */}
      <div style={{padding:'30px', background:'white', minHeight:'600px', overflowX:'auto'}}>
          {activeTab === 'Male' 
            ? <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} onDeleteRoom={handleDeleteRoom} /> 
            : <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} onDeleteRoom={handleDeleteRoom} />}
      </div>
    </div>
  );
}
