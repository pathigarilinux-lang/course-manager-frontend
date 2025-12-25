import React, { useState, useEffect } from 'react';
import { Home, Search, RefreshCw, Users, ArrowRight, BedDouble, Calendar } from 'lucide-react';
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

  // --- LOADING ---
  const loadData = async () => { 
    try {
        const [roomsRes, occRes, coursesRes] = await Promise.all([
            fetch(`${API_URL}/rooms`),
            fetch(`${API_URL}/rooms/occupancy`),
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

    } catch (err) {
        console.error("Error loading accommodation data:", err);
    }
  };
  
  useEffect(() => { loadData(); }, []);

  // --- STATS ENGINE ---
  const calculateStats = (rList, oList, courseMap) => {
      const mOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('m')).length;
      const fOccCount = oList.filter(p => (p.gender || '').toLowerCase().startsWith('f')).length;
      
      const breakdown = {};
      oList.forEach(p => {
          if (p.course_id && courseMap[p.course_id]) {
              const name = courseMap[p.course_id];
              breakdown[name] = (breakdown[name] || 0) + 1;
          } else if (p.course_id) {
              breakdown['Other'] = (breakdown['Other'] || 0) + 1;
          }
      });

      setStats({
          mOcc: mOccCount,
          fOcc: fOccCount,
          total: mOccCount + fOccCount,
          breakdown: breakdown 
      });
  };

  // --- ACTIONS (Move / Swap) ---
  const handleRoomInteraction = async (targetRoomData) => {
      const targetRoomNo = targetRoomData.room_no;
      const targetOccupant = occupancy.find(p => p.room_no === targetRoomNo);

      if (!moveMode) {
          if (targetOccupant) {
              setMoveMode({ student: targetOccupant, sourceRoom: targetRoomNo });
          }
          return;
      }

      // EXECUTE MOVE
      const { student, sourceRoom } = moveMode;
      
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoomData.gender_type || '').toLowerCase();
      
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} student to ${targetRoomData.gender_type} room. Proceed?`)) return;
      }

      if (targetOccupant) {
          if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
          // Swap logic
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
          await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      } else {
          if (!window.confirm(`Move ${student.full_name} to ${targetRoomNo}?`)) return;
          // Move logic
          await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
      }
      
      setMoveMode(null);
      loadData();
  };

  const searchResult = searchQuery ? occupancy.find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  return (
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
      
      {/* 1. RICH HEADER */}
      <div className="no-print" style={{
          background: 'linear-gradient(to right, #f8f9fa, #ffffff)', 
          padding: '20px 30px', 
          borderBottom: '1px solid #eaeaea'
      }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                  <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'22px'}}>
                      <BedDouble size={24} color="#007bff"/> Accommodation Manager
                  </h2>
                  
                  {/* MAIN STATS */}
                  <div style={{fontSize:'13px', color:'#666', marginTop:'6px', display:'flex', gap:'20px', fontWeight:'500'}}>
                      <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Users size={14}/> Total Occupied: <span style={{color:'#333', fontWeight:'bold'}}>{stats.total}</span></span>
                      <span style={{color:'#007bff'}}>Male: <b>{stats.mOcc}</b></span>
                      <span style={{color:'#e91e63'}}>Female: <b>{stats.fOcc}</b></span>
                  </div>

                  {/* COURSE BREAKDOWN TAGS */}
                  <div style={{marginTop:'10px', display:'flex', gap:'10px', flexWrap:'wrap'}}>
                      {Object.keys(stats.breakdown).length > 0 && Object.entries(stats.breakdown).map(([name, count]) => (
                          <div key={name} style={{
                              display:'flex', alignItems:'center', gap:'6px',
                              background:'white', border:'1px solid #ddd', 
                              padding:'4px 10px', borderRadius:'15px', fontSize:'11px', 
                              fontWeight:'bold', color:'#555', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'
                          }}>
                              <Calendar size={12} color="#007bff"/>
                              {name}: <span style={{color:'#007bff'}}>{count}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* CONTROLS */}
              <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                  
                  {moveMode && (
                      <div style={{
                          background:'#fff3cd', color:'#856404', 
                          padding:'8px 16px', borderRadius:'30px', 
                          fontSize:'13px', fontWeight:'bold', 
                          display:'flex', alignItems:'center', gap:'10px',
                          boxShadow:'0 2px 5px rgba(0,0,0,0.05)', border:'1px solid #ffeeba'
                      }}>
                          <span>🚀 Moving: {moveMode.student.full_name}</span>
                          <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontWeight:'bold', fontSize:'14px', color:'#856404'}}>✕</button>
                      </div>
                  )}

                  {/* SEARCH */}
                  <div style={{position:'relative'}}>
                      <div style={{
                          display:'flex', alignItems:'center', 
                          background:'white', border:'1px solid #e0e0e0', 
                          borderRadius:'30px', padding:'8px 15px', 
                          boxShadow:'0 2px 5px rgba(0,0,0,0.02)', width:'220px', transition:'all 0.2s'
                      }}>
                          <Search size={16} color="#aaa"/>
                          <input 
                              placeholder="Find Student..." 
                              value={searchQuery}
                              onChange={e=>setSearchQuery(e.target.value)}
                              style={{border:'none', outline:'none', marginLeft:'10px', fontSize:'13px', width:'100%'}}
                          />
                      </div>
                      {searchQuery && (
                          <div style={{
                              position:'absolute', top:'120%', right:0, width:'280px', 
                              background:'white', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', 
                              borderRadius:'12px', padding:'15px', zIndex:100, border:'1px solid #eee'
                          }}>
                              {searchResult ? (
                                  <div>
                                      <div style={{fontWeight:'bold', color:'#333', fontSize:'14px'}}>{searchResult.full_name}</div>
                                      <div style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>{searchResult.conf_no}</div>
                                      <div style={{
                                          padding:'8px', borderRadius:'6px', fontSize:'12px', fontWeight:'bold', textAlign:'center',
                                          background: searchResult.room_no ? '#e8f5e9' : '#ffebee',
                                          color: searchResult.room_no ? '#2e7d32' : '#c62828'
                                      }}>
                                          {searchResult.room_no ? `📍 Currently in Room ${searchResult.room_no}` : '⚠️ No Room Assigned'}
                                      </div>
                                  </div>
                              ) : <div style={{color:'#999', fontSize:'13px', textAlign:'center'}}>No match found.</div>}
                          </div>
                      )}
                  </div>

                  <button onClick={loadData} style={{
                      background:'#f1f3f5', border:'none', borderRadius:'50%', 
                      width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center', 
                      cursor:'pointer', transition:'0.2s', color:'#555'
                  }} title="Refresh Data">
                      <RefreshCw size={16}/>
                  </button>
              </div>
          </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div style={{background:'#f8f9fa', padding:'0 30px', borderBottom:'1px solid #e0e0e0', display:'flex', gap:'30px'}}>
          {['Male', 'Female'].map(gender => {
              const isActive = activeTab === gender;
              const color = gender === 'Male' ? '#007bff' : '#e91e63';
              return (
                  <button 
                      key={gender}
                      onClick={() => setActiveTab(gender)} 
                      style={{
                          padding:'15px 5px', background:'transparent', border:'none', 
                          borderBottom: isActive ? `3px solid ${color}` : '3px solid transparent',
                          color: isActive ? color : '#666', fontWeight: isActive ? '700' : '500',
                          fontSize:'14px', cursor:'pointer', transition:'all 0.2s'
                      }}
                  >
                      {gender.toUpperCase()} BLOCKS
                  </button>
              );
          })}
      </div>

      {/* 3. CANVAS AREA */}
      <div style={{padding:'30px', background:'white', minHeight:'600px', overflowX:'auto'}}>
          {activeTab === 'Male' ? (
              <div style={{animation:'fadeIn 0.3s ease-in'}}>
                  <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />
              </div>
          ) : (
              <div style={{animation:'fadeIn 0.3s ease-in'}}>
                  <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />
              </div>
          )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
