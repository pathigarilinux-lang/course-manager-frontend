import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, BedDouble, PlusCircle, Trash2, Printer, X, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout'; 

const COLORS = { 
    male: '#007bff', female: '#e91e63', 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32',
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae',
    empty: '#e0e0e0'
};

export default function GlobalAccommodationManager() {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [activeTab, setActiveTab] = useState('Male'); 
  const [moveMode, setMoveMode] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ NEW STATES
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ roomNo: '', type: 'Male' });
  const [deleteRoomNo, setDeleteRoomNo] = useState('');
  const [courses, setCourses] = useState([]);

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
        setCourses(Array.isArray(cList) ? cList : []);

    } catch (err) { console.error("Error loading data:", err); }
  };
  
  useEffect(() => { loadData(); }, []);

  // --- STATISTICS ENGINE (Real-Time) ---
  const stats = useMemo(() => {
      const breakdown = {
          male: { OM:0, NM:0, SM:0, Total:0 },
          female: { OF:0, NF:0, SF:0, Total:0 },
          courseData: []
      };

      // 1. Calculate Occupancy Breakdown
      occupancy.forEach(p => {
          const g = (p.gender || '').toLowerCase();
          const isMale = g.startsWith('m');
          const conf = (p.conf_no || '').toUpperCase();
          const type = conf.startsWith('S') ? 'S' : (conf.startsWith('O') ? 'O' : 'N');
          const key = type + (isMale ? 'M' : 'F'); // OM, NM, SM...

          if (isMale) {
              if (type === 'S') breakdown.male.SM++;
              else if (type === 'O') breakdown.male.OM++;
              else breakdown.male.NM++;
              breakdown.male.Total++;
          } else {
              if (type === 'S') breakdown.female.SF++;
              else if (type === 'O') breakdown.female.OF++;
              else breakdown.female.NF++;
              breakdown.female.Total++;
          }
      });

      // 2. Calculate Course Data
      const courseMap = {};
      courses.forEach(c => {
          const name = c.course_name.split('/')[0].substring(0, 15); // Shorten name
          courseMap[c.course_id] = { name, Male: 0, Female: 0 };
      });
      occupancy.forEach(p => {
          if (p.course_id && courseMap[p.course_id]) {
              const g = (p.gender || '').toLowerCase();
              if (g.startsWith('m')) courseMap[p.course_id].Male++;
              else courseMap[p.course_id].Female++;
          }
      });
      breakdown.courseData = Object.values(courseMap);

      return breakdown;
  }, [occupancy, courses]);

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

      // Execute Move
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

  const handleAddRoom = async () => {
      if (!newRoomData.roomNo.trim()) return alert("Room Number is required");
      try {
          const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomNo: newRoomData.roomNo.trim().toUpperCase(), type: newRoomData.type }) });
          if (res.ok) { alert("✅ Room Added!"); setShowAddRoom(false); setNewRoomData({ roomNo: '', type: activeTab }); loadData(); } 
          else { const err = await res.json(); alert("❌ Error: " + err.error); }
      } catch (err) { alert("❌ Network Error"); }
  };

  // ✅ DELETE ROOM LOGIC
  const handleDeleteRoom = async () => {
      if (!deleteRoomNo.trim()) return;
      const room = rooms.find(r => r.room_no === deleteRoomNo.trim().toUpperCase());
      
      if (!room) return alert("❌ Room not found.");
      
      // Safety Check: Is it occupied?
      const isOccupied = occupancy.some(p => p.room_no === room.room_no);
      if (isOccupied) return alert(`⛔ Cannot delete ${room.room_no}. It is occupied! Move student first.`);

      if (!window.confirm(`🗑️ PERMANENTLY DELETE Room ${room.room_no}?`)) return;

      try {
          const res = await fetch(`${API_URL}/rooms/${room.room_id}`, { method: 'DELETE' });
          if (res.ok) { alert("✅ Room Deleted"); setShowDeleteRoom(false); setDeleteRoomNo(''); loadData(); }
          else { alert("Failed to delete"); }
      } catch(err) { console.error(err); }
  };

  // ✅ PRINT EMPTY ROOMS LOGIC
  const handlePrintEmpty = () => {
      const occupiedSet = new Set(occupancy.map(p => p.room_no));
      const emptyMales = rooms.filter(r => r.gender_type === 'Male' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();
      const emptyFemales = rooms.filter(r => r.gender_type === 'Female' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();

      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(`
        <html>
          <head>
            <title>Empty Rooms Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .container { display: flex; gap: 20px; }
              .column { flex: 1; border: 1px solid #ccc; padding: 15px; border-radius: 8px; }
              .male { border-top: 5px solid #007bff; }
              .female { border-top: 5px solid #e91e63; }
              h2 { margin-top: 0; }
              .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; font-size: 12px; }
              .room { border: 1px solid #eee; padding: 5px; text-align: center; font-weight: bold; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <h1>Available / Empty Rooms Report</h1>
            <p style="text-align:center">Generated: ${new Date().toLocaleString()}</p>
            <div class="container">
              <div class="column male">
                <h2 style="color:#007bff">MALE BLOCK (${emptyMales.length} Available)</h2>
                <div class="grid">
                  ${emptyMales.map(r => `<div class="room">${r}</div>`).join('')}
                </div>
              </div>
              <div class="column female">
                <h2 style="color:#e91e63">FEMALE BLOCK (${emptyFemales.length} Available)</h2>
                <div class="grid">
                  ${emptyFemales.map(r => `<div class="room">${r}</div>`).join('')}
                </div>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
  };

  const searchResult = searchQuery ? occupancy.find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  // Chart Data Preparation
  const malePieData = [
    { name: 'Old', value: stats.male.OM, color: COLORS.om },
    { name: 'New', value: stats.male.NM, color: COLORS.nm },
    { name: 'Server', value: stats.male.SM, color: COLORS.sm },
  ].filter(d => d.value > 0);

  const femalePieData = [
    { name: 'Old', value: stats.female.OF, color: COLORS.of },
    { name: 'New', value: stats.female.NF, color: COLORS.nf },
    { name: 'Server', value: stats.female.SF, color: COLORS.sf },
  ].filter(d => d.value > 0);

  return (
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f4f6f8'}}>
      
      {/* 1. VISUAL STATISTICS HEADER */}
      <div className="no-print" style={{padding: '20px', background: 'white', borderBottom:'1px solid #eee'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'24px'}}>
                  <BedDouble size={28} color="#0d47a1"/> Global Accommodation
              </h2>
              {/* PRINT EMPTY BUTTON */}
              <button onClick={handlePrintEmpty} style={{background:'#6c757d', color:'white', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold'}}>
                  <Printer size={16}/> Print Empty List
              </button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:'20px'}}>
              
              {/* Male Pie */}
              <div style={{background:'#e3f2fd', borderRadius:'12px', padding:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:'5px solid #007bff'}}>
                  <div>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#007bff'}}>MALE OCCUPANCY</div>
                      <div style={{fontSize:'28px', fontWeight:'900', color:'#0d47a1'}}>{stats.male.Total}</div>
                      <div style={{fontSize:'10px', color:'#555'}}>OM:{stats.male.OM} | NM:{stats.male.NM} | SM:{stats.male.SM}</div>
                  </div>
                  <div style={{width:'80px', height:'80px'}}>
                      <ResponsiveContainer>
                          <PieChart>
                              <Pie data={malePieData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value">
                                  {malePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Female Pie */}
              <div style={{background:'#fce4ec', borderRadius:'12px', padding:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:'5px solid #e91e63'}}>
                  <div>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#e91e63'}}>FEMALE OCCUPANCY</div>
                      <div style={{fontSize:'28px', fontWeight:'900', color:'#880e4f'}}>{stats.female.Total}</div>
                      <div style={{fontSize:'10px', color:'#555'}}>OF:{stats.female.OF} | NF:{stats.female.NF} | SF:{stats.female.SF}</div>
                  </div>
                  <div style={{width:'80px', height:'80px'}}>
                      <ResponsiveContainer>
                          <PieChart>
                              <Pie data={femalePieData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value">
                                  {femalePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Course Bar Chart */}
              <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px'}}>
                  <div style={{fontSize:'12px', fontWeight:'bold', color:'#555', marginBottom:'5px'}}>COURSE DISTRIBUTION</div>
                  <div style={{width:'100%', height:'80px'}}>
                      <ResponsiveContainer>
                          <BarChart data={stats.courseData} layout="vertical" margin={{top:0, left:0, right:10, bottom:0}}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} tick={{fontSize:10}} />
                              <Tooltip />
                              <Bar dataKey="Male" stackId="a" fill="#007bff" radius={[0, 4, 4, 0]} barSize={15} />
                              <Bar dataKey="Female" stackId="a" fill="#e91e63" radius={[0, 4, 4, 0]} barSize={15} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. CONTROLS BAR */}
      <div className="no-print" style={{ background: 'white', padding: '10px 20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* TABS */}
          <div style={{display:'flex', gap:'10px'}}>
              {['Male', 'Female'].map(gender => (
                  <button key={gender} onClick={() => { setActiveTab(gender); setNewRoomData(prev => ({...prev, type: gender})); }} 
                          style={{ padding:'8px 20px', borderRadius:'20px', border:'none', background: activeTab === gender ? (gender === 'Male' ? '#e3f2fd' : '#fce4ec') : '#f5f5f5', color: activeTab === gender ? (gender === 'Male' ? '#007bff' : '#e91e63') : '#666', fontWeight: 'bold', cursor:'pointer' }}>
                          {gender.toUpperCase()} BLOCK
                  </button>
              ))}
          </div>

          {/* ACTIONS */}
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
              {moveMode && (
                  <div style={{background:'#fff3cd', color:'#856404', padding:'6px 12px', borderRadius:'6px', fontSize:'13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', border:'1px solid #ffeeba'}}>
                      <span>🚀 Moving: {moveMode.student.full_name}</span>
                      <button onClick={()=>setMoveMode(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontWeight:'bold'}}>✕</button>
                  </div>
              )}

              {/* Search */}
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
              
              {/* Add Room */}
              <button onClick={() => setShowAddRoom(true)} style={{background:'#28a745', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}>
                  <PlusCircle size={16}/> Add Room
              </button>

              {/* Delete Room */}
              <button onClick={() => setShowDeleteRoom(true)} style={{background:'#dc3545', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}>
                  <Trash2 size={16}/> Del Room
              </button>

              <button onClick={loadData} style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', color:'#555'}} title="Refresh">
                  <RefreshCw size={16}/>
              </button>
          </div>
      </div>

      {/* 3. CANVAS */}
      <div style={{padding:'30px', background:'white', minHeight:'600px', overflowX:'auto'}}>
          {activeTab === 'Male' ? <MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} /> : <FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomInteraction} />}
      </div>

      {/* ADD ROOM MODAL */}
      {showAddRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'350px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0, color:'#333'}}>Add Manual Room</h3>
                      <button onClick={()=>setShowAddRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#999"/></button>
                  </div>
                  <input autoFocus placeholder="Room Number (e.g. ISO-1)" value={newRoomData.roomNo} onChange={e => setNewRoomData({...newRoomData, roomNo: e.target.value})} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', marginBottom:'15px'}} />
                  <select value={newRoomData.type} onChange={e => setNewRoomData({...newRoomData, type: e.target.value})} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', marginBottom:'20px'}}>
                      <option value="Male">Male Block</option>
                      <option value="Female">Female Block</option>
                  </select>
                  <button onClick={handleAddRoom} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'none', background:'#007bff', color:'white', fontWeight:'bold', cursor:'pointer'}}>Save Room</button>
              </div>
          </div>
      )}

      {/* DELETE ROOM MODAL */}
      {showDeleteRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'350px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0, color:'#dc3545'}}>Delete Room</h3>
                      <button onClick={()=>setShowDeleteRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#999"/></button>
                  </div>
                  <p style={{fontSize:'13px', color:'#666', marginBottom:'15px'}}>Enter the Room Number to delete. <br/><strong>Warning:</strong> Must be empty first.</p>
                  <input autoFocus placeholder="Enter Room No (e.g. ISO-1)" value={deleteRoomNo} onChange={e => setDeleteRoomNo(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #dc3545', borderRadius:'6px', marginBottom:'20px'}} />
                  <button onClick={handleDeleteRoom} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', fontWeight:'bold', cursor:'pointer'}}>Permanently Delete</button>
              </div>
          </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
