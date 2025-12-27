import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, BedDouble, PlusCircle, Trash2, Printer, X, PieChart as PieIcon, BarChart3, User } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_URL, styles } from '../config';
import MaleBlockLayout from './MaleBlockLayout';     
import FemaleBlockLayout from './FemaleBlockLayout';

// ✅ COLORS for Dhamma Codes
const COLORS = { 
    male: '#007bff', female: '#e91e63', 
    om: '#0d47a1', nm: '#64b5f6', sm: '#2e7d32', // Old, New, Server (Male)
    of: '#880e4f', nf: '#f06292', sf: '#69f0ae', // Old, New, Server (Female)
    empty: '#e0e0e0'
};

export default function GlobalAccommodationManager() {
  const [rooms, setRooms] = useState([]); 
  const [occupancy, setOccupancy] = useState([]); 
  const [courses, setCourses] = useState([]); // List of courses for filter
  const [selectedCourse, setSelectedCourse] = useState(''); // Filter State
  const [activeTab, setActiveTab] = useState('Male'); 
  const [searchQuery, setSearchQuery] = useState('');

  // Room Management States
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ no: '', gender: 'Male', type: 'Dorm', capacity: 1 });
  const [deleteRoomNo, setDeleteRoomNo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetch(`${API_URL}/courses`).then(res => res.json()).then(setCourses).catch(console.error);
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [resRooms, resOcc] = await Promise.all([
              fetch(`${API_URL}/rooms`),
              fetch(`${API_URL}/rooms/occupancy`)
          ]);
          setRooms(await resRooms.json());
          setOccupancy(await resOcc.json());
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  // --- HANDLERS ---
  const handleAddRoom = async () => {
      if(!newRoomData.no) return alert("Room Number required");
      try {
          const res = await fetch(`${API_URL}/rooms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  roomNo: newRoomData.no,
                  genderType: newRoomData.gender,
                  roomType: newRoomData.type,
                  capacity: newRoomData.capacity
              })
          });
          if(res.ok) { 
              alert("✅ Room Created!"); 
              setShowAddRoom(false); 
              fetchData(); 
              setNewRoomData({ no: '', gender: 'Male', type: 'Dorm', capacity: 1 });
          } else { alert("Failed to create room."); }
      } catch(e) { alert("Error"); }
  };

  const handleDeleteRoom = async () => {
      if(!deleteRoomNo) return;
      if(!window.confirm(`Permanently delete Room ${deleteRoomNo}?`)) return;
      try {
          const res = await fetch(`${API_URL}/rooms/${deleteRoomNo}`, { method: 'DELETE' });
          if(res.ok) { 
              alert("🗑️ Room Deleted."); 
              setShowDeleteRoom(false); 
              fetchData(); 
              setDeleteRoomNo('');
          } else { alert("Could not delete. Check if occupied."); }
      } catch(e) { alert("Error"); }
  };

  const handleRoomClick = async (room) => {
      if (room.occupant) {
          if(window.confirm(`Unassign ${room.occupant.full_name} from ${room.room_no}?`)) {
               await fetch(`${API_URL}/check-in`, {
                   method: 'POST',
                   headers: {'Content-Type':'application/json'},
                   body: JSON.stringify({ participantId: room.occupant.participant_id, roomNo: null, courseId: room.occupant.course_id })
               });
               fetchData();
          }
      } else {
          alert("To assign a student, please go to the 'Courses' tab and use the Check-In button.");
      }
  };

  // --- ✅ FILTER LOGIC ---
  const filteredOccupancy = useMemo(() => {
      let data = occupancy;
      
      // 1. Course Filter
      if (selectedCourse) {
          data = data.filter(o => String(o.course_id) === String(selectedCourse));
      }

      // 2. Search Filter
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(o => 
              (o.full_name && o.full_name.toLowerCase().includes(q)) || 
              (o.room_no && o.room_no.toLowerCase().includes(q)) ||
              (o.conf_no && o.conf_no.toLowerCase().includes(q))
          );
      }
      return data;
  }, [occupancy, selectedCourse, searchQuery]);


  // --- ✅ ADVANCED STATS CALCULATION ---
  const stats = useMemo(() => {
      const total = 235; 
      const occ = filteredOccupancy.length;
      
      // Basic Gender Split
      const male = filteredOccupancy.filter(p => (p.gender||'').toLowerCase().startsWith('m')).length;
      const female = filteredOccupancy.filter(p => (p.gender||'').toLowerCase().startsWith('f')).length;

      // Detailed Dhamma Codes (OM, NM, SM, OF, NF, SF)
      const getCount = (prefix) => filteredOccupancy.filter(p => (p.conf_no||'').toUpperCase().startsWith(prefix)).length;

      const om = getCount('OM');
      const nm = getCount('NM');
      const sm = getCount('SM'); // Server Male
      const of = getCount('OF');
      const nf = getCount('NF');
      const sf = getCount('SF'); // Server Female
      
      // Data for Charts
      const pieData = [
          { name: 'Male', value: male, color: COLORS.male },
          { name: 'Female', value: female, color: COLORS.female },
          { name: 'Empty', value: Math.max(0, total - occ), color: COLORS.empty }
      ];

      const barData = [
          { name: 'Old Male', count: om, fill: COLORS.om },
          { name: 'New Male', count: nm, fill: COLORS.nm },
          { name: 'Server M', count: sm, fill: COLORS.sm },
          { name: 'Old Female', count: of, fill: COLORS.of },
          { name: 'New Female', count: nf, fill: COLORS.nf },
          { name: 'Server F', count: sf, fill: COLORS.sf },
      ];
      
      return { total, occ, male, female, pieData, barData };
  }, [filteredOccupancy]);


  return (
    <div style={{...styles.card, maxWidth:'100%', height:'90vh', display:'flex', flexDirection:'column', padding:0, overflow:'hidden', background:'#f4f6f8'}}>
      
      {/* --- HEADER --- */}
      <div style={{padding:'15px 25px', background:'white', borderBottom:'1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', zIndex:10}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <div style={{background:'#007bff', padding:'10px', borderRadius:'10px', color:'white', boxShadow:'0 4px 10px rgba(0,123,255,0.3)'}}>
                  <BedDouble size={24}/>
              </div>
              <div>
                  <h2 style={{margin:0, fontSize:'20px', color:'#2c3e50', fontWeight:'800'}}>Accommodation Manager</h2>
                  <div style={{fontSize:'12px', color:'#777', fontWeight:'600'}}>Global Room Overview & Controls</div>
              </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
             
             {/* Course Filter Dropdown */}
             <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{...styles.input, padding:'8px', borderRadius:'20px', width:'200px', fontWeight:'bold', borderColor:'#007bff', background:'#f0f8ff'}}
             >
                 <option value="">-- All Courses --</option>
                 {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
             </select>

             <div style={{position:'relative'}}>
                 <Search size={16} color="#999" style={{position:'absolute', left:'10px', top:'10px'}}/>
                 <input 
                    placeholder="Search Room / Student / Conf..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{...styles.input, paddingLeft:'35px', width:'220px', borderRadius:'20px', background:'#f8f9fa'}}
                 />
             </div>
             
             <button onClick={fetchData} style={{background:'white', border:'1px solid #ddd', padding:'8px', borderRadius:'50%', cursor:'pointer', color:'#666'}} title="Refresh Data">
                 <RefreshCw size={18} className={loading ? "spin" : ""} />
             </button>

             <div style={{height:'30px', width:'1px', background:'#ddd'}}></div>

             <button onClick={()=>setShowAddRoom(true)} style={{display:'flex', gap:'6px', background:'#e3f2fd', color:'#0d47a1', border:'none', padding:'8px 15px', borderRadius:'20px', fontWeight:'bold', cursor:'pointer'}}>
                 <PlusCircle size={16}/> Add Room
             </button>
             <button onClick={()=>setShowDeleteRoom(true)} style={{display:'flex', gap:'6px', background:'#ffebee', color:'#c62828', border:'none', padding:'8px 15px', borderRadius:'20px', fontWeight:'bold', cursor:'pointer'}}>
                 <Trash2 size={16}/> Delete Room
             </button>
             <button onClick={()=>window.print()} style={{background:'none', border:'none', cursor:'pointer', color:'#666'}}>
                 <Printer size={20}/>
             </button>
          </div>
      </div>

      {/* --- ✅ DASHBOARD AREA (Charts) --- */}
      <div style={{padding:'20px', display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px', height:'260px'}}>
          
          {/* 1. Pie Chart Card (Occupancy) */}
          <div style={{background:'white', borderRadius:'12px', padding:'15px', display:'flex', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
              <div style={{flex:1}}>
                  <div style={{fontSize:'12px', color:'#888', fontWeight:'bold', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'5px'}}>
                      <PieIcon size={14}/> Total Occupancy
                  </div>
                  <div style={{fontSize:'36px', fontWeight:'800', color:'#333', marginTop:'5px'}}>{Math.round(stats.occ/stats.total*100)}%</div>
                  <div style={{fontSize:'12px', color:'#666'}}>{stats.occ} / {stats.total} Beds</div>
                  
                  <div style={{marginTop:'15px', display:'flex', gap:'15px'}}>
                     <div style={{fontSize:'11px'}}><span style={{color:COLORS.male}}>●</span> M: {stats.male}</div>
                     <div style={{fontSize:'11px'}}><span style={{color:COLORS.female}}>●</span> F: {stats.female}</div>
                  </div>
              </div>
              <div style={{width:'140px', height:'140px'}}>
                  <ResponsiveContainer>
                      <PieChart>
                          <Pie data={stats.pieData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                              {stats.pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 2. Bar Chart Card (Dhamma Code Categories) */}
          <div style={{background:'white', borderRadius:'12px', padding:'15px', display:'flex', flexDirection:'column', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                  <div style={{fontSize:'12px', color:'#888', fontWeight:'bold', textTransform:'uppercase', display:'flex', alignItems:'center', gap:'5px'}}>
                      <BarChart3 size={14}/> Student Distribution (By Category)
                  </div>
                  
                  {/* Tab Switcher */}
                  <div style={{background:'#f1f3f5', padding:'3px', borderRadius:'20px', display:'flex'}}>
                      <button onClick={()=>setActiveTab('Male')} style={{padding:'4px 15px', borderRadius:'16px', border:'none', background: activeTab==='Male' ? 'white' : 'transparent', color: activeTab==='Male' ? COLORS.male : '#888', fontWeight:'bold', boxShadow: activeTab==='Male' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', fontSize:'11px', transition:'0.2s'}}>Male Block</button>
                      <button onClick={()=>setActiveTab('Female')} style={{padding:'4px 15px', borderRadius:'16px', border:'none', background: activeTab==='Female' ? 'white' : 'transparent', color: activeTab==='Female' ? COLORS.female : '#888', fontWeight:'bold', boxShadow: activeTab==='Female' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', fontSize:'11px', transition:'0.2s'}}>Female Block</button>
                  </div>
              </div>

              <div style={{flex:1, width:'100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.barData} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {stats.barData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div style={{flex:1, overflowY:'auto', padding:'0 20px 20px 20px'}}>
         {activeTab === 'Male' 
            ? <MaleBlockLayout rooms={rooms} occupancy={filteredOccupancy} onRoomClick={handleRoomClick}/>
            : <FemaleBlockLayout rooms={rooms} occupancy={filteredOccupancy} onRoomClick={handleRoomClick}/>
         }
      </div>

      {/* --- MODALS (Add/Delete Room) --- */}
      {showAddRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000}}>
              <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'350px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0, color:'#007bff'}}>Add New Room</h3>
                      <button onClick={()=>setShowAddRoom(false)} style={{border:'none', background:'none', cursor:'pointer'}}><X size={20} color="#999"/></button>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                      <div>
                          <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Room Number</label>
                          <input placeholder="e.g. M-101" value={newRoomData.no} onChange={e => setNewRoomData({...newRoomData, no:e.target.value})} style={styles.input} />
                      </div>
                      <div>
                          <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Block / Gender</label>
                          <select value={newRoomData.gender} onChange={e => setNewRoomData({...newRoomData, gender:e.target.value})} style={styles.input}>
                              <option value="Male">Male Block</option>
                              <option value="Female">Female Block</option>
                          </select>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                          <div>
                            <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Type</label>
                            <select value={newRoomData.type} onChange={e => setNewRoomData({...newRoomData, type:e.target.value})} style={styles.input}>
                                <option>Dorm</option>
                                <option>Single</option>
                                <option>Double</option>
                                <option>Cell</option>
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Capacity</label>
                            <input type="number" min="1" value={newRoomData.capacity} onChange={e => setNewRoomData({...newRoomData, capacity:parseInt(e.target.value)})} style={styles.input} />
                          </div>
                      </div>
                      <button onClick={handleAddRoom} style={{...styles.btn(true), background:'#007bff', color:'white', justifyContent:'center', padding:'12px', marginTop:'10px'}}>Create Room</button>
                  </div>
              </div>
          </div>
      )}

      {showDeleteRoom && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:3000}}>
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
