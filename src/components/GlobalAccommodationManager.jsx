import React, { useState, useEffect } from 'react';
import { Home, Search, RefreshCw, Users, Plus } from 'lucide-react';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout'; 

export default function GlobalAccommodationManager() {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [activeTab, setActiveTab] = useState('Male'); // 'Male' or 'Female'
  const [moveMode, setMoveMode] = useState(null); 
  
  // Stats & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ mOcc: 0, mTot: 0, fOcc: 0, fTot: 0 });

  // --- LOADING ---
  const loadData = () => { 
    fetch(`${API_URL}/rooms`).then(res => res.json()).then(data => {
        const rList = Array.isArray(data) ? data : [];
        setRooms(rList);
        calculateStats(rList, occupancy); // Recalc stats when rooms load
    }); 
    fetch(`${API_URL}/rooms/occupancy`).then(res => res.json()).then(data => {
        const oList = Array.isArray(data) ? data : [];
        setOccupancy(oList);
        calculateStats(rooms, oList); // Recalc stats when occupancy loads
    }); 
  };
  
  useEffect(() => { loadData(); }, []);

  // --- STATS ENGINE ---
  const calculateStats = (rList, oList) => {
      // Male Stats
      const mRooms = rList.filter(r => r.gender_type === 'Male');
      const mBeds = mRooms.length; // Simplified (assuming 1 bed/room for quick stats, or refine logic if needed)
      // Better logic: count actual beds if you have bed data, but strictly speaking:
      // We can count total occupancy entries for M vs F
      
      // Count Occupants
      const mOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const fOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
      
      // Count Total Capacity (Approximate based on Layouts)
      // Male: 301-363 = ~63 rooms. Some double. Let's just use Occupancy vs Room Count for now.
      
      setStats({
          mOcc: mOccCount,
          fOcc: fOccCount,
          total: mOccCount + fOccCount
      });
  };

  // --- ACTIONS ---
  const handleRoomInteraction = async (targetRoomData) => {
      // Logic to handle clicking a room (Move/Swap/View)
      const targetRoomNo = targetRoomData.room_no;
      const targetOccupant = occupancy.find(p => p.room_no === targetRoomNo);

      if (!moveMode) {
          if (targetOccupant) {
              setMoveMode({ student: targetOccupant, sourceRoom: targetRoomNo });
          } else {
              // Just show info if empty
              // alert(`Room ${targetRoomNo} is available.`);
          }
          return;
      }

      // EXECUTE MOVE
      const { student, sourceRoom } = moveMode;
      
      // Gender Safety Check
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoomData.gender_type || '').toLowerCase();
      
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} student to ${targetRoomData.gender_type} room. Proceed?`)) return;
      }

      if (targetOccupant) {
          if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
          // Swap Logic
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      } else {
          if (!window.confirm(`Move ${student.full_name} to ${targetRoomNo}?`)) return;
          // Move Logic
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      }
      
      setMoveMode(null);
      loadData();
  };

  // --- SEARCH FINDER ---
  const searchResult = searchQuery ? occupancy.find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  return (
    <div style={styles.card}>
      {/* HEADER & STATS */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Home size={24}/> Global Accommodation</h2>
              <div style={{fontSize:'13px', color:'#666', marginTop:'5px', display:'flex', gap:'15px'}}>
                  <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Users size={14}/> Total Students: <strong>{stats.total}</strong></span>
                  <span style={{color:'#007bff'}}>Male: <strong>{stats.mOcc}</strong></span>
                  <span style={{color:'#e91e63'}}>Female: <strong>{stats.fOcc}</strong></span>
              </div>
          </div>

          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              {/* STUDENT FINDER */}
              <div style={{position:'relative'}}>
                  <div style={{display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:'20px', padding:'5px 10px', background:'white'}}>
                      <Search size={16} color="#999"/>
                      <input 
                          placeholder="Find Student..." 
                          value={searchQuery}
                          onChange={e=>setSearchQuery(e.target.value)}
                          style={{border:'none', outline:'none', marginLeft:'8px', fontSize:'13px', width:'150px'}}
                      />
                      {searchQuery && <button onClick={()=>setSearchQuery('')} style={{border:'none', background:'none', cursor:'pointer'}}><Users size={12}/></button>}
                  </div>
                  {/* SEARCH DROPDOWN RESULT */}
                  {searchQuery && (
                      <div style={{position:'absolute', top:'110%', right:0, width:'250px', background:'white', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', borderRadius:'8px', padding:'10px', zIndex:100, border:'1px solid #eee'}}>
                          {searchResult ? (
                              <div>
                                  <div style={{fontWeight:'bold', color:'#333'}}>{searchResult.full_name}</div>
                                  <div style={{fontSize:'12px', color:'#666'}}>{searchResult.conf_no}</div>
                                  <div style={{marginTop:'5px', paddingTop:'5px', borderTop:'1px solid #eee', color: searchResult.room_no ? '#28a745' : '#dc3545', fontWeight:'bold'}}>
                                      {searchResult.room_no ? `📍 Room ${searchResult.room_no}` : 'No Room Assigned'}
                                  </div>
                              </div>
                          ) : <div style={{color:'#999', fontSize:'12px'}}>No match found.</div>}
                      </div>
                  )}
              </div>

              {moveMode && (
                  <div style={{background:'#fff3cd', padding:'8px 15px', borderRadius:'20px', border:'1px solid #ffeeba', fontSize:'13px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                      <span>🚀 Moving: <b>{moveMode.student.full_name}</b></span>
                      <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'none', cursor:'pointer', fontWeight:'bold', color:'#856404'}}>✕</button>
                  </div>
              )}
              
              <button onClick={loadData} style={{...styles.quickBtn(false), display:'flex', alignItems:'center', gap:'5px'}}><RefreshCw size={14}/> Refresh</button>
          </div>
      </div>

      {/* TABS */}
      <div style={{display:'flex', gap:'5px', marginBottom:'0'}}>
          <button onClick={() => setActiveTab('Male')} style={{padding:'12px 25px', borderRadius:'8px 8px 0 0', border:'none', background: activeTab==='Male'?'#007bff':'#f1f3f5', color: activeTab==='Male'?'white':'#666', fontWeight:'bold', cursor:'pointer', borderBottom: activeTab==='Male'?'none':'1px solid #ddd', boxShadow: activeTab==='Male'?'0 -2px 5px rgba(0,0,0,0.05)':'none'}}>
              MALE BLOCKS
          </button>
          <button onClick={() => setActiveTab('Female')} style={{padding:'12px 25px', borderRadius:'8px 8px 0 0', border:'none', background: activeTab==='Female'?'#e91e63':'#f1f3f5', color: activeTab==='Female'?'white':'#666', fontWeight:'bold', cursor:'pointer', borderBottom: activeTab==='Female'?'none':'1px solid #ddd', boxShadow: activeTab==='Female'?'0 -2px 5px rgba(0,0,0,0.05)':'none'}}>
              FEMALE BLOCKS
          </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{background: 'white', padding:'25px', borderRadius:'0 8px 8px 8px', border:'1px solid #ddd', boxShadow:'0 2px 10px rgba(0,0,0,0.02)', minHeight:'500px'}}>
          {activeTab === 'Male' ? (
              <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />
          ) : (
              <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />
          )}
      </div>
    </div>
  );
}
