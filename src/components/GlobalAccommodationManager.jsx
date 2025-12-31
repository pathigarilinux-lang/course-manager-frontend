import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, BedDouble, PlusCircle, Trash2, Printer, X, PieChart as PieIcon, BarChart3, AlertTriangle, ArrowRight, Wand2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout';
import AutoAllocationTool from './AutoAllocationTool';

// --- CONFIGURATION ---
const COLORS = { 
    male: '#007bff', female: '#e91e63', 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32',
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae',
    empty: '#e0e0e0'
};

// ✅ STRICT DELETION POLICY
// Added 'ROOM' so you can delete the individual rooms if needed
const ALLOWED_DELETE_PREFIXES = ['TENT', 'HALL', 'DORM', 'TEMP', 'EXTRA', 'OVR', 'ROOM'];

export default function GlobalAccommodationManager() {
  // --- STATE MANAGEMENT ---
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [courses, setCourses] = useState([]); 
  
  const [activeTab, setActiveTab] = useState('Male'); 
  const [moveMode, setMoveMode] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  // Tools & Modals
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [showBulkTool, setShowBulkTool] = useState(false); // ✅ New State
  
  // New Room Form State
  const [newRoomData, setNewRoomData] = useState({ 
      prefix: 'TENT', 
      suffix: '', 
      gender: 'Male', 
      capacity: 1, 
      floor: 'Ground' 
  });
  
  // Bulk Gen State
  const [bulkGender, setBulkGender] = useState('Male');

  const [deleteRoomNo, setDeleteRoomNo] = useState('');
  const [showAutoTool, setShowAutoTool] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(''); 

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
        
        if(Array.isArray(cList) && cList.length > 0 && !selectedCourse) {
            setSelectedCourse(cList[0].course_id);
        }

    } catch (err) { 
        console.error("Error loading data:", err); 
        setRooms([]);
        setOccupancy([]);
    }
  };
  
  useEffect(() => { loadData(); }, []);

  // --- STATISTICS ENGINE ---
  const stats = useMemo(() => {
      const breakdown = {
          male: { OM:0, NM:0, SM:0, Total:0 },
          female: { OF:0, NF:0, SF:0, Total:0 },
          courseData: []
      };

      if (!Array.isArray(occupancy)) return breakdown;

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
      (courses || []).forEach(c => {
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

  // --- INTERACTION HANDLERS ---
  
  const handleRoomInteraction = async (targetRoomData) => {
      const targetRoomNo = targetRoomData.room_no;
      const targetOccupant = occupancy.find(p => p.room_no === targetRoomNo);

      if (!moveMode) {
          if (targetOccupant) {
              setMoveMode({ student: targetOccupant, sourceRoom: targetRoomNo });
          }
          return;
      }

      const { student, sourceRoom } = moveMode;
      const studentGender = (student.gender || '').toLowerCase();
      const roomGender = (targetRoomData.gender_type || '').toLowerCase();
      
      if (!studentGender.startsWith(roomGender.charAt(0))) {
          if(!window.confirm(`⚠️ GENDER WARNING: Moving ${student.gender} to ${targetRoomData.gender_type} room?`)) return;
      }

      try {
          if (targetOccupant) {
              if (!window.confirm(`Swap ${student.full_name} <-> ${targetOccupant.full_name}?`)) return;
              await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: 'TEMP_SWAP' }) });
              await fetch(`${API_URL}/participants/${targetOccupant.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...targetOccupant, room_no: sourceRoom }) });
              await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
          } else {
              if (!window.confirm(`Move ${student.full_name} to ${targetRoomNo}?`)) return;
              await fetch(`${API_URL}/participants/${student.participant_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...student, room_no: targetRoomNo }) });
          }
      } catch (e) {
          alert("Move failed. Please refresh.");
      }
      
      setMoveMode(null);
      loadData();
  };

  const handleAddRoom = async () => {
      if (!newRoomData.suffix.trim()) return alert("Please enter a suffix (e.g., 1, 2, A)");
      const generatedRoomNo = `${newRoomData.prefix}-${newRoomData.suffix.trim().toUpperCase()}`;

      if(rooms.some(r => r.room_no === generatedRoomNo)) {
          return alert("Room Number already exists!");
      }

      try {
          const res = await fetch(`${API_URL}/rooms`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ 
                  roomNo: generatedRoomNo, 
                  type: newRoomData.gender,
                  capacity: newRoomData.capacity,
                  floor: newRoomData.floor,
                  block: 'TEMP' 
              }) 
          });
          
          if (res.ok) { 
              alert(`✅ Room ${generatedRoomNo} Added Successfully!`); 
              setNewRoomData(prev => ({ ...prev, suffix: '' })); 
              loadData(); 
          } else { 
              const err = await res.json(); 
              alert("❌ Error: " + err.error); 
          }
      } catch (err) { alert("❌ Network Error"); }
  };

  // ✅ NEW: BULK GENERATOR LOGIC
  const handleBulkGenerate = async () => {
      const msg = `⚠️ GENERATE NEW BLOCK?\n\nThis will create:\n- 8 Dormitories (DORMITORY-21 to 28) [6 Beds]\n- 3 Rooms (ROOM-A to C) [2 Beds]\n\nGender: ${bulkGender}`;
      if (!window.confirm(msg)) return;

      const newBlockRooms = [];

      // 1. Create 8 Dormitories (6 Beds)
      for (let i = 21; i <= 28; i++) {
          newBlockRooms.push({
              roomNo: `DORMITORY-${i}`,
              type: bulkGender,
              capacity: 6,
              floor: 'Ground',
              block: 'New Block'
          });
      }

      // 2. Create 3 Individual Rooms (2 Beds)
      ['A', 'B', 'C'].forEach(suffix => {
          newBlockRooms.push({
              roomNo: `ROOM-${suffix}`,
              type: bulkGender,
              capacity: 2,
              floor: 'Ground',
              block: 'New Block'
          });
      });

      let successCount = 0;
      for (const room of newBlockRooms) {
          // Skip if exists
          if (rooms.some(r => r.room_no === room.roomNo)) continue;
          
          try {
              await fetch(`${API_URL}/rooms`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(room)
              });
              successCount++;
          } catch(e) { console.error(e); }
      }

      alert(`✅ Created ${successCount} new rooms in "New Block".`);
      loadData();
      setShowBulkTool(false);
  };

  const isDeletable = (roomNo) => {
      if(!roomNo) return false;
      const upper = roomNo.toUpperCase();
      return ALLOWED_DELETE_PREFIXES.some(prefix => upper.startsWith(prefix));
  };

  const handleDeleteRoom = async () => {
      if (!deleteRoomNo.trim()) return;
      const room = (rooms || []).find(r => r.room_no === deleteRoomNo.trim().toUpperCase());
      
      if (!room) return alert("❌ Room not found.");
      
      if (!isDeletable(room.room_no)) {
          alert(`⛔ ACTION DENIED\n\nRoom '${room.room_no}' is a Core System Room.\nYou can ONLY delete rooms starting with: ${ALLOWED_DELETE_PREFIXES.join(', ')}`);
          return;
      }

      const isOccupied = (occupancy || []).some(p => p.room_no === room.room_no);
      if (isOccupied) return alert(`⛔ Cannot delete ${room.room_no}. It is occupied!`);

      if (!window.confirm(`🗑️ PERMANENTLY DELETE Room ${room.room_no}?`)) return;

      try {
          const res = await fetch(`${API_URL}/rooms/${room.room_id}`, { method: 'DELETE' });
          if (res.ok) { 
              alert("✅ Room Deleted"); 
              setShowDeleteRoom(false); 
              setDeleteRoomNo(''); 
              loadData(); 
          } else { 
              alert("Failed to delete"); 
          }
      } catch(err) { console.error(err); }
  };

  const handlePrintEmpty = () => {
      const occupiedSet = new Set((occupancy || []).map(p => p.room_no));
      const emptyMales = (rooms || []).filter(r => r.gender_type === 'Male' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();
      const emptyFemales = (rooms || []).filter(r => r.gender_type === 'Female' && !occupiedSet.has(r.room_no)).map(r => r.room_no).sort();

      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write(`
        <html><head><title>Empty Rooms</title><style>body{font-family:sans-serif;padding:20px}.col{width:45%;float:left;padding:10px;border:1px solid #ccc}.room{display:inline-block;padding:5px;border:1px solid #eee;margin:2px;font-size:11px}</style></head><body><h1>Empty Rooms Report</h1><div class="col" style="border-top:4px solid blue"><h3>MALE (${emptyMales.length})</h3>${emptyMales.map(r=>`<span class="room">${r}</span>`).join('')}</div><div class="col" style="border-top:4px solid pink"><h3>FEMALE (${emptyFemales.length})</h3>${emptyFemales.map(r=>`<span class="room">${r}</span>`).join('')}</div></body></html>
      `);
      printWindow.document.close();
  };

  const searchResult = searchQuery ? (occupancy || []).find(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.conf_no.toLowerCase().includes(searchQuery.toLowerCase())) : null;

  const malePieData = [ { name: 'Old', value: stats.male.OM, color: COLORS.om }, { name: 'New', value: stats.male.NM, color: COLORS.nm }, { name: 'Server', value: stats.male.SM, color: COLORS.sm } ].filter(d => d.value > 0);
  const femalePieData = [ { name: 'Old', value: stats.female.OF, color: COLORS.of }, { name: 'New', value: stats.female.NF, color: COLORS.nf }, { name: 'Server', value: stats.female.SF, color: COLORS.sf } ].filter(d => d.value > 0);

  const panelStyle = {
      position: 'fixed', bottom: '30px', right: '30px', 
      background: 'white', padding: '25px', borderRadius: '12px', 
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)', 
      width: '320px', zIndex: 2000, animation: 'slideUp 0.3s ease-out'
  };

  return (
    <div style={{...styles.card, padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f4f6f8'}}>
      
      {/* 1. VISUAL STATISTICS HEADER */}
      <div className="no-print" style={{padding: '20px', background: 'white', borderBottom:'1px solid #eee'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50', fontSize:'24px'}}>
                  <BedDouble size={28} color="#0d47a1"/> Global Accommodation
              </h2>
              <div style={{display:'flex', gap:'10px'}}>
                  {showAutoTool ? (
                      <button onClick={()=>setShowAutoTool(false)} style={{...styles.btn(false), background:'#eee'}}>Close Tool</button>
                  ) : (
                      <button onClick={()=>setShowAutoTool(true)} style={{...styles.btn(true), background:'#6a11cb', color:'white'}}>✨ Auto-Allocator</button>
                  )}
                  <button onClick={handlePrintEmpty} style={{background:'#6c757d', color:'white', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold'}}>
                      <Printer size={16}/> Print Empty List
                  </button>
              </div>
          </div>

          {/* CHARTS ROW */}
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

              {/* Bar Chart */}
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
                          <div style={{marginTop:'5px', padding:'4px', borderRadius:'4px', fontSize:'12px', textAlign:'center', fontWeight:'bold', background: searchResult.room_no ? '#e8f5e9' : '#ffebee', color: searchResult.room_no ? '#2e7d32' : '#c62828'}}>
                              {searchResult.room_no ? `📍 Room ${searchResult.room_no}` : '⚠️ No Room Assigned'}
                          </div>
                      </div>
                  )}
              </div>
              
              {/* Tool Toggles */}
              <button onClick={() => { setShowBulkTool(!showBulkTool); setShowAddRoom(false); setShowDeleteRoom(false); }} style={{background: showBulkTool ? '#333' : '#6f42c1', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}>
                  <Wand2 size={16}/> {showBulkTool ? 'Close' : 'Bulk Tools'}
              </button>

              <button onClick={() => { setShowAddRoom(!showAddRoom); setShowDeleteRoom(false); setShowBulkTool(false); }} style={{background: showAddRoom ? '#333' : '#28a745', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}>
                  <PlusCircle size={16}/> {showAddRoom ? 'Close' : 'Add Room'}
              </button>

              <button onClick={() => { setShowDeleteRoom(!showDeleteRoom); setShowAddRoom(false); setShowBulkTool(false); }} style={{background: showDeleteRoom ? '#333' : '#dc3545', border:'none', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', color:'white', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold'}}>
                  <Trash2 size={16}/> {showDeleteRoom ? 'Close' : 'Del Room'}
              </button>

              <button onClick={loadData} style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', padding:'6px 10px', cursor:'pointer', color:'#555'}} title="Refresh Data">
                  <RefreshCw size={16}/>
              </button>
          </div>
      </div>

      {/* 3. MAIN CANVAS AREA */}
      <div style={{padding:'30px', background:'white', minHeight:'600px', overflowX:'auto'}}>
          {activeTab === 'Male' ? (
              <MaleBlockLayout rooms={rooms || []} occupancy={occupancy || []} onRoomClick={handleRoomInteraction} />
          ) : (
              <FemaleBlockLayout rooms={rooms || []} occupancy={occupancy || []} onRoomClick={handleRoomInteraction} />
          )}
      </div>

      {/* --- BULK GENERATOR PANEL (NEW) --- */}
      {showBulkTool && (
          <div style={{...panelStyle, borderTop:'4px solid #6f42c1'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0, fontSize:'16px', color:'#6f42c1'}}>New Block Gen</h3>
                  <button onClick={()=>setShowBulkTool(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={18}/></button>
              </div>
              
              <div style={{background:'#f3e5f5', padding:'10px', borderRadius:'6px', marginBottom:'15px', border:'1px solid #e1bee7', fontSize:'12px', color:'#4a148c'}}>
                  <div style={{fontWeight:'bold', marginBottom:'5px'}}>Will Create:</div>
                  <ul style={{paddingLeft:'20px', margin:0}}>
                      <li>8 Dormitories (DORM-21 to 28) with 6 beds</li>
                      <li>3 Rooms (ROOM-A to C) with 2 beds</li>
                  </ul>
              </div>

              <div style={{marginBottom:'15px'}}>
                  <label style={styles.label}>Select Block Gender:</label>
                  <select value={bulkGender} onChange={e=>setBulkGender(e.target.value)} style={styles.input}>
                      <option value="Male">Male Block</option>
                      <option value="Female">Female Block</option>
                  </select>
              </div>
              
              <button onClick={handleBulkGenerate} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'none', background:'#6f42c1', color:'white', fontWeight:'bold', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                  <Wand2 size={16}/> GENERATE LAYOUT
              </button>
          </div>
      )}

      {/* --- ADD ROOM PANEL --- */}
      {showAddRoom && (
          <div style={panelStyle}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0, fontSize:'16px'}}>Add Manual Room</h3>
                  <button onClick={()=>setShowAddRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={18}/></button>
              </div>
              
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div>
                      <label style={styles.label}>Prefix & Suffix</label>
                      <div style={{display:'flex', gap:'5px'}}>
                          <select 
                              value={newRoomData.prefix} 
                              onChange={e=>setNewRoomData({...newRoomData, prefix: e.target.value})} 
                              style={{...styles.input, width:'100px', fontWeight:'bold', fontSize:'12px'}}
                          >
                              <option value="TENT">TENT</option>
                              <option value="HALL">HALL</option>
                              <option value="DORM">DORM</option>
                              <option value="TEMP">TEMP</option>
                              <option value="EXTRA">EXTRA</option>
                          </select>
                          <input 
                              placeholder="1, 2, A..." 
                              value={newRoomData.suffix} 
                              onChange={e=>setNewRoomData({...newRoomData, suffix: e.target.value.toUpperCase()})} 
                              style={{...styles.input, flex:1}} 
                              autoFocus 
                          />
                      </div>
                      <div style={{fontSize:'11px', color:'#777', marginTop:'4px'}}>
                          Creating: <strong>{newRoomData.prefix}-{newRoomData.suffix || '?'}</strong>
                      </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                      <div>
                          <label style={styles.label}>Gender</label>
                          <select value={newRoomData.gender} onChange={e=>setNewRoomData({...newRoomData, gender:e.target.value})} style={styles.input}>
                              <option>Male</option><option>Female</option>
                          </select>
                      </div>
                      <div>
                          <label style={styles.label}>Capacity</label>
                          <input type="number" value={newRoomData.capacity} onChange={e=>setNewRoomData({...newRoomData, capacity:parseInt(e.target.value)})} style={styles.input} />
                      </div>
                  </div>

                  <button onClick={handleAddRoom} style={{...styles.btn(true), background:'#28a745', color:'white', padding:'10px', marginTop:'5px'}}>
                      CREATE ROOM
                  </button>
              </div>
          </div>
      )}

      {/* --- DELETE ROOM PANEL --- */}
      {showDeleteRoom && (
          <div style={{...panelStyle, borderTop:'4px solid #dc3545'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0, fontSize:'16px', color:'#dc3545'}}>Delete Room</h3>
                  <button onClick={()=>setShowDeleteRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={18}/></button>
              </div>
              
              <div style={{background:'#fff5f5', padding:'10px', borderRadius:'6px', marginBottom:'15px', border:'1px solid #ffcdd2', fontSize:'11px', color:'#b71c1c'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'5px', marginBottom:'5px', fontWeight:'bold'}}>
                      <AlertTriangle size={14}/> RESTRICTED ACTION
                  </div>
                  You can ONLY delete manually added rooms (e.g. <strong>TENT-1, HALL-A</strong>). 
                  <br/><br/>
                  Core rooms (A-N, ISO) are protected.
              </div>

              <input 
                  autoFocus 
                  placeholder="Enter Room No (e.g. TENT-1)" 
                  value={deleteRoomNo} 
                  onChange={e => setDeleteRoomNo(e.target.value.toUpperCase())} 
                  style={{width:'100%', padding:'10px', border:'1px solid #dc3545', borderRadius:'6px', marginBottom:'15px', fontSize:'14px', fontWeight:'bold'}} 
              />
              
              <button onClick={handleDeleteRoom} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'none', background:'#dc3545', color:'white', fontWeight:'bold', cursor:'pointer', fontSize:'13px'}}>
                  PERMANENTLY DELETE
              </button>
          </div>
      )}

      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
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
