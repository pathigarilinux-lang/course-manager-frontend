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
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ DASHBOARD STATE
  const [dashboard, setDashboard] = useState({
      courses: [], 
      pool: { male: 0, female: 0 } 
  });

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

        const safeRooms = Array.isArray(rList) ? rList : [];
        const safeOcc = Array.isArray(oList) ? oList : [];
        const safeCourses = Array.isArray(cList) ? cList : [];

        setRooms(safeRooms);
        setOccupancy(safeOcc);
        
        const courseMap = {};
        safeCourses.forEach(c => {
            const shortName = c.course_name.split('/')[0].trim();
            courseMap[c.course_id] = shortName;
        });

        calculateDashboard(safeRooms, safeOcc, courseMap);

    } catch (err) {
        console.error("Error loading data:", err);
    }
  };
  
  useEffect(() => { loadData(); }, []);

  // --- DASHBOARD CALCULATION (With Gender Split) ---
  const calculateDashboard = (rList, oList, courseMap) => {
      // 1. Calculate Total Capacity
      let mCap = 0, fCap = 0;
      rList.forEach(r => {
          const cap = parseInt(r.capacity) || 1; 
          const gender = (r.gender_type || '').toLowerCase();
          if (gender.startsWith('m')) mCap += cap;
          else if (gender.startsWith('f')) fCap += cap;
      });

      // 2. Calculate Occupancy & Detailed Course Breakdown
      let mOcc = 0, fOcc = 0;
      const courseStats = {}; 

      oList.forEach(p => {
          const gender = (p.gender || '').toLowerCase();
          const isMale = gender.startsWith('m');
          
          if (isMale) mOcc++; else fOcc++;

          const cId = p.course_id;
          if (cId && courseMap[cId]) {
              const cName = courseMap[cId];
              
              if (!courseStats[cName]) {
                  courseStats[cName] = { name: cName, old: 0, new: 0, total: 0, male: 0, female: 0 };
              }

              // Gender Count
              if (isMale) courseStats[cName].male++;
              else courseStats[cName].female++;

              // Old/New Count
              const conf = (p.conf_no || '').toUpperCase();
              const isOld = conf.startsWith('O') || conf.startsWith('S');
              
              if (isOld) courseStats[cName].old++;
              else courseStats[cName].new++;
              
              courseStats[cName].total++;
          }
      });

      setDashboard({
          courses: Object.values(courseStats).sort((a,b) => b.total - a.total), 
          pool: {
              male: mCap - mOcc,   
              female: fCap - fOcc 
          }
      });
  };

  // --- ACTIONS ---
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
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f4f6f8'}}>
      
      {/* 1. DASHBOARD HEADER */}
      <div className="no-print" style={{padding: '20px 30px 10px 30px', background: 'white'}}>
          <h2 style={{margin:'0 0 15px 0', display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'24px'}}>
              <BedDouble size={28} color="#0d47a1"/> Global Accommodation
          </h2>

          <div style={{display:'flex', gap:'15px', flexWrap:'wrap'}}>
              
              {/* COURSE CARDS (Separated by Gender) */}
              {dashboard.courses.map(c => (
                  <div key={c.name} style={{
                      background:'white', borderRadius:'10px', padding:'10px 15px', minWidth:'180px',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.08)', borderTop:'4px solid #2e7d32', 
                      display:'flex', flexDirection:'column'
                  }}>
                      <div style={{fontWeight:'bold', fontSize:'16px', marginBottom:'8px', color:'#333', borderBottom:'1px solid #eee', paddingBottom:'4px', display:'flex', justifyContent:'space-between'}}>
                          <span>{c.name}</span>
                          <span style={{color:'#333'}}>Total: {c.total}</span>
                      </div>
                      
                      {/* Gender Breakdown Row */}
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px', marginBottom:'6px', fontWeight:'bold'}}>
                          <span style={{color:'#007bff'}}>M: {c.male}</span>
                          <span style={{color:'#e91e63'}}>F: {c.female}</span>
                      </div>

                      {/* Old/New Breakdown Row */}
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#666'}}>
                          <span>Old: {c.old}</span>
                          <span>New: {c.new}</span>
                      </div>
                  </div>
              ))}

              {/* AVAILABLE POOL CARDS (Male & Female Separated) */}
              <div style={{
                  background:'#e3f2fd', borderRadius:'10px', padding:'10px 15px', minWidth:'140px',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)', borderTop:'4px solid #007bff',
                  display:'flex', flexDirection:'column', justifyContent:'center'
              }}>
                  <div style={{fontSize:'12px', color:'#0d47a1', fontWeight:'bold', textTransform:'uppercase'}}>Pool Male</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#007bff'}}>{dashboard.pool.male}</div>
                  <div style={{fontSize:'11px', color:'#555'}}>Beds Available</div>
              </div>

              <div style={{
                  background:'#fce4ec', borderRadius:'10px', padding:'10px 15px', minWidth:'140px',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)', borderTop:'4px solid #e91e63',
                  display:'flex', flexDirection:'column', justifyContent:'center'
              }}>
                  <div style={{fontSize:'12px', color:'#880e4f', fontWeight:'bold', textTransform:'uppercase'}}>Pool Female</div>
                  <div style={{fontSize:'24px', fontWeight:'900', color:'#e91e63'}}>{dashboard.pool.female}</div>
                  <div style={{fontSize:'11px', color:'#555'}}>Beds Available</div>
              </div>

          </div>
      </div>

      {/* 2. CONTROLS BAR */}
      <div className="no-print" style={{
          background: 'white', 
          padding: '10px 30px 20px 30px', 
          borderBottom: '1px solid #eaeaea',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
          {/* TABS */}
          <div style={{display:'flex', gap:'10px'}}>
              {['Male', 'Female'].map(gender => {
                  const isActive = activeTab === gender;
                  return (
                      <button 
                          key={gender}
                          onClick={() => setActiveTab(gender)} 
                          style={{
                              padding:'8px 20px', borderRadius:'20px', border:'none', 
                              background: isActive ? (gender === 'Male' ? '#e3f2fd' : '#fce4ec') : '#f5f5f5',
                              color: isActive ? (gender === 'Male' ? '#007bff' : '#e91e63') : '#666',
                              fontWeight: 'bold', cursor:'pointer', transition:'all 0.2s'
                          }}
                      >
                          {gender.toUpperCase()} BLOCK
                      </button>
                  );
              })}
          </div>

          {/* SEARCH & REFRESH */}
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
              {moveMode && (
                  <div style={{background:'#fff3cd', color:'#856404', padding:'6px 12px', borderRadius:'6px', fontSize:'13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', border:'1px solid #ffeeba'}}>
                      <span>🚀 Moving: {moveMode.student.full_name}</span>
                      <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontWeight:'bold'}}>✕</button>
                  </div>
              )}

              <div style={{position:'relative'}}>
                  <div style={{display:'flex', alignItems:'center', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'6px', padding:'6px 12px', width:'220px'}}>
                      <Search size={16} color="#aaa"/>
                      <input placeholder="Find Student..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{border:'none', outline:'none', marginLeft:'10px', fontSize:'13px', width:'100%', background:'transparent'}} />
                  </div>
                  {searchResult && (
                      <div style={{position:'absolute', top:'110%', right:0, width:'250px', background:'white', boxShadow:'0 4px 15px rgba(0,0,0,0.1)', borderRadius:'8px', padding:'10px', zIndex:100, border:'1px solid #eee'}}>
                          <div style={{fontWeight:'bold', color:'#333'}}>{searchResult.full_name}</div>
                          <div style={{fontSize:'12px', color:'#666'}}>{searchResult.conf_no}</div>
                          <div style={{marginTop:'5px', padding:'4px', borderRadius:'4px', fontSize:'12px', textAlign:'center', fontWeight:'bold', background: searchResult.room_no ? '#e8f5e9' : '#ffebee', color: searchResult.room_no ? '#2e7d32' : '#c62828'}}>
                              {searchResult.room_no ? `📍 Room ${searchResult.room_no}` : '⚠️ No Room Assigned'}
                          </div>
                      </div>
                  )}
              </div>

              <button onClick={loadData} style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', color:'#555', display:'flex', alignItems:'center', gap:'5px'}} title="Refresh Data">
                  <RefreshCw size={16}/> Refresh
              </button>
          </div>
      </div>

      {/* 3. CANVAS */}
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
