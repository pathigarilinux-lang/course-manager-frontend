import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, BedDouble, PlusCircle, Trash2, Printer, X, PieChart as PieIcon, BarChart3, Home, User } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Room Management States
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ no: '', gender: 'Male', type: 'Dorm', capacity: 1 });
  const [deleteRoomNo, setDeleteRoomNo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
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

  // --- STATS CALC ---
  const stats = useMemo(() => {
      const total = 235; // Or rooms.reduce((acc, r) => acc + r.capacity, 0);
      const occ = occupancy.length;
      const male = occupancy.filter(p => (p.gender||'').toLowerCase().startsWith('m')).length;
      const female = occupancy.filter(p => (p.gender||'').toLowerCase().startsWith('f')).length;
      
      const pieData = [
          { name: 'Male', value: male, color: COLORS.male },
          { name: 'Female', value: female, color: COLORS.female },
          { name: 'Empty', value: total - occ, color: COLORS.empty }
      ];
      
      return { total, occ, male, female, pieData };
  }, [rooms, occupancy]);

  // Filter for Layouts
  const filteredOccupancy = searchQuery 
    ? occupancy.filter(o => o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.room_no.toLowerCase().includes(searchQuery.toLowerCase()))
    : occupancy;

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
             <div style={{position:'relative'}}>
                 <Search size={16} color="#999" style={{position:'absolute', left:'10px', top:'10px'}}/>
                 <input 
                    placeholder="Search Room or Student..." 
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

      {/* --- STATS DASHBOARD --- */}
      <div style={{padding:'20px', display:'grid', gridTemplateColumns:'1fr 3fr', gap:'20px', height:'180px'}}>
          {/* Pie Chart Card */}
          <div style={{background:'white', borderRadius:'12px', padding:'15px', display:'flex', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
              <div style={{flex:1}}>
                  <div style={{fontSize:'12px', color:'#888', fontWeight:'bold', textTransform:'uppercase'}}>Total Occupancy</div>
                  <div style={{fontSize:'32px', fontWeight:'800', color:'#333', marginTop:'5px'}}>{Math.round(stats.occ/stats.total*100)}%</div>
                  <div style={{fontSize:'12px', color:'#666'}}>{stats.occ} / {stats.total} Beds</div>
              </div>
              <div style={{width:'100px', height:'100px'}}>
                  <ResponsiveContainer>
                      <PieChart>
                          <Pie data={stats.pieData} innerRadius={30} outerRadius={45} paddingAngle={2} dataKey="value">
                              {stats.pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Controls & Legend */}
          <div style={{background:'white', borderRadius:'12px', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.03)'}}>
              <div style={{display:'flex', gap:'30px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                       <div style={{padding:'8px', borderRadius:'8px', background:'#e3f2fd', color: COLORS.male}}><User size={20}/></div>
                       <div><div style={{fontSize:'12px', color:'#888'}}>Male</div><div style={{fontSize:'18px', fontWeight:'bold'}}>{stats.male}</div></div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                       <div style={{padding:'8px', borderRadius:'8px', background:'#fce4ec', color: COLORS.female}}><User size={20}/></div>
                       <div><div style={{fontSize:'12px', color:'#888'}}>Female</div><div style={{fontSize:'18px', fontWeight:'bold'}}>{stats.female}</div></div>
                  </div>
              </div>
              
              <div style={{background:'#f1f3f5', padding:'5px', borderRadius:'25px', display:'flex'}}>
                  <button onClick={()=>setActiveTab('Male')} style={{padding:'8px 25px', borderRadius:'20px', border:'none', background: activeTab==='Male' ? 'white' : 'transparent', color: activeTab==='Male' ? COLORS.male : '#888', fontWeight:'bold', boxShadow: activeTab==='Male' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', transition:'0.2s'}}>Male Block</button>
                  <button onClick={()=>setActiveTab('Female')} style={{padding:'8px 25px', borderRadius:'20px', border:'none', background: activeTab==='Female' ? 'white' : 'transparent', color: activeTab==='Female' ? COLORS.female : '#888', fontWeight:'bold', boxShadow: activeTab==='Female' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', cursor:'pointer', transition:'0.2s'}}>Female Block</button>
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

      {/* --- MODALS --- */}
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
