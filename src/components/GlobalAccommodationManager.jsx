import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, BedDouble, PlusCircle, Trash2, Printer, X, PieChart as PieIcon, BarChart3, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout';
import AutoAllocationTool from './AutoAllocationTool';

const COLORS = { 
    male: '#007bff', female: '#e91e63', 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32',
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae',
    empty: '#e0e0e0'
};

// ✅ CORE SYSTEM BLOCKS (Protected from Deletion)
const PROTECTED_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'ISO'];

export default function GlobalAccommodationManager() {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [activeTab, setActiveTab] = useState('Male'); 
  const [moveMode, setMoveMode] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Tools
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ room_no: '', gender: 'Male', capacity: 1, floor: 'Ground', block: 'TEMP' });
  const [deleteRoomNo, setDeleteRoomNo] = useState('');
  const [showAutoTool, setShowAutoTool] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(''); 
  const [courses, setCourses] = useState([]); 

  // --- DATA LOADING ---
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
        
        if(cList.length > 0 && !selectedCourse) setSelectedCourse(cList[0].course_id);

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

      occupancy.forEach(p => {
          const g = (p.gender || '').toLowerCase();
          const isMale = g.startsWith('m');
          const conf = (p.conf_no || '').toUpperCase();
          const type = conf.startsWith('S') ? 'S' : (conf.startsWith('O') ? 'O' : 'N');

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

      const courseMap = {};
      courses.forEach(c => {
          const name = c.course_name.split('/')[0].substring(0, 15);
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
      // This function handles clicking on rooms in the layout
      // Logic preserved from original file logic or delegated to layout components
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
      // Mapping fields to match backend expectations (roomNo vs room_no)
      if (!newRoomData.room_no.trim()) return alert("Room Number is required");
      try {
          const res = await fetch(`${API_URL}/rooms`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ 
                  roomNo: newRoomData.room_no.trim().toUpperCase(), 
                  type: newRoomData.gender,
                  capacity: newRoomData.capacity,
                  floor: newRoomData.floor,
                  block: newRoomData.block
              }) 
          });
          if (res.ok) { 
              alert("✅ Room Added!"); 
              setShowAddRoom(false); 
              setNewRoomData({ room_no: '', gender: activeTab, capacity: 1, floor: 'Ground', block: 'TEMP' }); 
              loadData(); 
          } 
          else { 
              const err = await res.json(); 
              alert("❌ Error: " + err.error); 
          }
      } catch (err) { alert("❌ Network Error"); }
  };

  // ✅ DELETE PROTECTION LOGIC
  const isRoomProtected = (roomNo) => {
      if(!roomNo) return false;
      const upper = roomNo.toUpperCase();
      return PROTECTED_PREFIXES.some(prefix => {
          return upper.startsWith(prefix + '-') || (upper.startsWith(prefix) && !isNaN(parseInt(upper.replace(prefix, '').charAt(0))));
      });
  };

  const handleDeleteRoom = async () => {
      if (!deleteRoomNo.trim()) return;
      const room = rooms.find(r => r.room_no === deleteRoomNo.trim().toUpperCase());
      
      if (!room) return alert("❌ Room not found.");
      
      // ✅ SAFETY CHECK 1: Core Protection
      if (isRoomProtected(room.room_no)) {
          alert(`⛔ ACTION DENIED\n\nRoom '${room.room_no}' is a Core System Room.\nYou can only delete manually added rooms (e.g. TEMP, TENT, HALL).`);
          return;
      }

      // ✅ SAFETY CHECK 2: Occupancy
      const isOccupied = occupancy.some(p => p.room_no === room.room_no);
      if (isOccupied) return alert(`⛔ Cannot delete ${room.room_no}. It is occupied! Move student first.`);

      if (!window.confirm(`🗑️ PERMANENTLY DELETE Room ${room.room_no}?`)) return;

      try {
          const res = await fetch(`${API_URL}/rooms/${room.room_id}`, { method: 'DELETE' });
          if (res.ok) { alert("✅ Room Deleted"); setShowDeleteRoom(false); setDeleteRoomNo(''); loadData(); }
          else { alert("Failed to delete"); }
      } catch(err) { console.error(err); }
  };

  const handlePrintEmpty = () => {
      const occupiedSet = new Set(occupancy.map(p => p.room_no));
      const emptyMales = rooms.filter(r => r.gender_type === 'Male' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();
      const emptyFemales = rooms.filter(r => r.gender_type === 'Female' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();

      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(`
        <html>
          <head><title>Empty Rooms</title><style>body{font-family:sans-serif;padding:20px}.col{width:45%;float:left;padding:10px;border:1px solid #ccc}.room{display:inline-block;padding:5px;border:1px solid #eee;margin:2px;font-size:11px}</style></head>
          <body><h1>Empty Rooms Report</h1>
            <div class="col" style="border-top:4px solid blue"><h3>MALE</h3>${emptyMales.map(r=>`<span class="room">${r}</span>`).join('')}</div>
            <div class="col" style="border-top:4px solid pink"><h3>FEMALE</h3>${emptyFemales.map(r=>`<span class="room">${r}</span>`).join('')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
  };

  const searchResult = searchQuery ? occupancy.find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  // Chart Data
  const malePieData = [ { name: 'Old', value: stats.male.OM, color: COLORS.om }, { name: 'New', value: stats.male.NM, color: COLORS.nm }, { name: 'Server', value: stats.male.SM, color: COLORS.sm } ].filter(d => d.value > 0);
  const femalePieData = [ { name: 'Old', value: stats.female.OF, color: COLORS.of }, { name: 'New', value: stats.female.NF, color: COLORS.nf }, { name: 'Server', value: stats.female.SF, color: COLORS.sf } ].filter(d => d.value > 0);

  return (
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f4f6f8'}}>
      
      {/* 1. HEADER & STATS */}
      <div className="no-print" style={{padding: '20px', background: 'white', borderBottom:'1px solid #eee'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'24px'}}>
                  <BedDouble size={28} color="#0d47a1"/> Global Accommodation
              </h2>
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
                      <ResponsiveContainer><PieChart><Pie data={malePieData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value">{malePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer>
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
                      <ResponsiveContainer><PieChart><Pie data={femalePieData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={2} dataKey="value">{femalePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer>
                  </div>
              </div>
              {/* Chart */}
              <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px'}}>
                  <div style={{fontSize:'12px', fontWeight:'bold', color:'#555', marginBottom:'5px'}}>COURSE DISTRIBUTION</div>
                  <div style={{width:'100%', height:'80px'}}>
                      <ResponsiveContainer><BarChart data={stats.courseData} layout="vertical" margin={{top:0, left:0, right:10, bottom:0}}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{fontSize:10}} /><Tooltip /><Bar dataKey="Male" stackId="a" fill="#007bff" radius={[0, 4, 4, 0]} barSize={15} /><Bar dataKey="Female" stackId="a" fill="#e91e63" radius={[0, 4, 4, 0]} barSize={15} /></BarChart></ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. CONTROLS BAR */}
      <div className="no-print" style={{ background: 'white', padding: '10px 20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{display:'flex', gap:'10px'}}>
              {['Male', 'Female'].map(gender => (
                  <button key={gender} onClick={() => { setActiveTab(gender); setNewRoomData(prev => ({...prev, gender: gender})); }} 
                          style={{ padding:'8px 20px', borderRadius:'20px', border:'none', background: activeTab === gender ? (gender === 'Male' ? '#e3f2fd' : '#fce4ec') : '#f5f5f5', color: activeTab === gender ? (gender === 'Male' ? '#007bff' : '#e91e63') : '#666', fontWeight: 'bold', cursor:'pointer' }}>
                          {gender.toUpperCase()} BLOCK
                  </button>
              ))}
          </div>

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
              
              <button onClick={() => setShowAddRoom(true)} style={{background:'#28a745', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}><PlusCircle size={16}/> Add Room</button>
              <button onClick={() => setShowDeleteRoom(true)} style={{background:'#dc3545', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}><Trash2 size={16}/> Del Room</button>
              <button onClick={loadData} style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', color:'#555'}} title="Refresh"><RefreshCw size={16}/></button>
          </div>
      </div>

      {/* 3. VISUAL LAYOUTS */}
      <div style={{background:'#f8f9fa', padding:'20px', borderRadius:'12px', border:'1px solid #eee', minHeight:'500px', overflowX:'auto'}}>
          {activeTab === 'Male' ? (
              <MaleBlockLayout occupancy={occupancy} onRefresh={loadData} moveMode={moveMode} setMoveMode={setMoveMode} />
          ) : (
              <FemaleBlockLayout occupancy={occupancy} onRefresh={loadData} moveMode={moveMode} setMoveMode={setMoveMode} />
          )}
      </div>

      {/* --- SCROLLABLE MODAL FIX: ADD ROOM --- */}
      {showAddRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'50px 20px', overflowY:'auto'}}>
              <div style={{background:'white', padding:'30px', borderRadius:'12px', width:'400px', boxShadow:'0 10px 40px rgba(0,0,0,0.3)', position:'relative', marginTop:'20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0}}>Add Manual Room</h3>
                      <button onClick={()=>setShowAddRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20}/></button>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                      <div>
                          <label style={styles.label}>Room Number (Unique)</label>
                          <input placeholder="e.g. TENT-1" value={newRoomData.room_no} onChange={e=>setNewRoomData({...newRoomData, room_no: e.target.value.toUpperCase()})} style={styles.input} autoFocus />
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                          <div>
                              <label style={styles.label}>Gender Block</label>
                              <select value={newRoomData.gender} onChange={e=>setNewRoomData({...newRoomData, gender:e.target.value})} style={styles.input}>
                                  <option>Male</option><option>Female</option>
                              </select>
                          </div>
                          <div>
                              <label style={styles.label}>Capacity</label>
                              <input type="number" value={newRoomData.capacity} onChange={e=>setNewRoomData({...newRoomData, capacity:parseInt(e.target.value)})} style={styles.input} />
                          </div>
                      </div>
                      <div>
                          <label style={styles.label}>Block / Zone</label>
                          <select value={newRoomData.block} onChange={e=>setNewRoomData({...newRoomData, block:e.target.value})} style={styles.input}>
                              <option value="TEMP">Temporary / Overflow</option>
                              <option value="ISO">Isolation</option>
                              <option value="O">Other</option>
                          </select>
                      </div>
                      
                      <div style={{marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                          <button onClick={() => setShowAutoTool(true)} style={{display:'flex', alignItems:'center', justifyContent:'center', width:'100%', gap:'6px', background:'linear-gradient(45deg, #6a11cb, #2575fc)', color:'white', border:'none', padding:'10px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', boxShadow:'0 4px 10px rgba(106, 17, 203, 0.2)'}}>✨ Launch Auto-Allocator</button>
                      </div>

                      <button onClick={handleAddRoom} style={{...styles.btn(true), background:'#28a745', color:'white', padding:'12px', marginTop:'10px'}}>CREATE ROOM</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SCROLLABLE MODAL FIX: DELETE ROOM (WITH PROTECTION) --- */}
      {showDeleteRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'50px 20px', overflowY:'auto'}}>
              <div style={{background:'white', padding:'30px', borderRadius:'12px', width:'400px', boxShadow:'0 10px 40px rgba(0,0,0,0.3)', borderTop:'5px solid #dc3545', marginTop:'20px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0, color:'#dc3545'}}>Delete Room</h3>
                      <button onClick={()=>setShowDeleteRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#999"/></button>
                  </div>
                  
                  <div style={{background:'#fff5f5', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #ffcdd2'}}>
                      <div style={{display:'flex', gap:'10px', alignItems:'center', color:'#c62828', fontWeight:'bold', marginBottom:'5px'}}>
                          <AlertTriangle size={18}/> RESTRICTED ACTION
                      </div>
                      <p style={{margin:0, fontSize:'12px', color:'#b71c1c'}}>
                          You can only delete <strong>Manually Added</strong> rooms (e.g. Tent, Hall). 
                          Core blocks (A-N, ISO) are protected.
                      </p>
                  </div>

                  <input 
                      autoFocus 
                      placeholder="Enter Room No (e.g. TENT-1)" 
                      value={deleteRoomNo} 
                      onChange={e => setDeleteRoomNo(e.target.value.toUpperCase())} 
                      style={{width:'100%', padding:'12px', border:'1px solid #dc3545', borderRadius:'6px', marginBottom:'20px', fontSize:'16px', fontWeight:'bold'}} 
                  />
                  
                  <button onClick={handleDeleteRoom} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', fontWeight:'bold', cursor:'pointer', fontSize:'14px'}}>
                      PERMANENTLY DELETE
                  </button>
              </div>
          </div>
      )}

      {showAutoTool && (
        <AutoAllocationTool 
            courseId={selectedCourse} 
            onClose={() => setShowAutoTool(false)} 
            onSuccess={() => { loadData(); }} 
        />
      )}
    </div>
  );
}
