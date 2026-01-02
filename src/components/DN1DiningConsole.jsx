import React, { useState, useEffect, useMemo } from 'react';
// ✅ FIX: Aliased 'Map' to 'MapIcon' to avoid conflict with JS Map
import { RefreshCw, Map as MapIcon, User, CheckCircle, Search, AlertCircle } from 'lucide-react'; 
import { API_URL } from '../config'; 

export default function DN1DiningConsole({ courses = [] }) {
  // --- STATE ---
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [occupiedData, setOccupiedData] = useState([]); 
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('MALE'); 
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignStatus, setAssignStatus] = useState('');

  // --- CONFIGURATION ---
  const CONFIG = {
    MALE: {
      theme: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
      chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
      floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
    },
    FEMALE: {
      theme: { bg: '#fce4ec', color: '#ad1457', border: '#f48fb1' },
      chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
      floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
    }
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const occRes = await fetch(`${API_URL}/courses/${selectedCourseId}/global-occupied`);
      if (!occRes.ok) throw new Error("Failed to fetch occupancy");
      const occData = await occRes.json();
      setOccupiedData(occData.dining || []);

      const partRes = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
      if (!partRes.ok) throw new Error("Failed to fetch participants");
      const partData = await partRes.json();
      setParticipants(Array.isArray(partData) ? partData : []);

    } catch (error) {
      console.error("Failed to load data", error);
      setParticipants([]); 
      setOccupiedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedStudent(null); 
  }, [selectedCourseId]);

  // --- HELPERS ---
  const pendingStudents = useMemo(() => {
    if (!Array.isArray(participants)) return [];
    
    const targetChar = activeTab === 'MALE' ? 'm' : 'f';
    return participants.filter(p => {
      if (!p) return false;
      const g = (p.gender || '').toLowerCase();
      return g.startsWith(targetChar) && (!p.dining_seat_no || p.dining_seat_no === '');
    });
  }, [participants, activeTab]);

  const occupiedSet = useMemo(() => {
    // ✅ FIX: Now 'Map' refers to Javascript Map, because we renamed the icon
    const map = new Map(); 
    if (Array.isArray(occupiedData)) {
        occupiedData.forEach(item => {
          if (item && item.seat) map.set(String(item.seat), item);
        });
    }
    return map;
  }, [occupiedData]);

  // --- ASSIGN SEAT ---
  const handleAssignSeat = async (seatNum, type) => {
    if (!selectedStudent) {
      alert("Please select a student from the left list first.");
      return;
    }

    if (occupiedSet.has(String(seatNum))) {
      alert("This seat is already occupied!");
      return;
    }

    if (!window.confirm(`Assign Seat ${seatNum} (${type}) to ${selectedStudent.full_name}?`)) return;

    setAssignStatus('Saving...');
    try {
      const payload = {
        courseId: selectedCourseId,
        participantId: selectedStudent.participant_id,
        seatNo: String(seatNum),
        diningSeatType: type, 
        confNo: selectedStudent.conf_no,
        gender: selectedStudent.gender
      };

      const res = await fetch(`${API_URL}/check-in`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });

      if (!res.ok) throw new Error("Update failed");

      setAssignStatus('✅ Assigned');
      setTimeout(() => setAssignStatus(''), 2000);
      
      await fetchData();
      setSelectedStudent(null); 

    } catch (err) {
      alert("Error assigning seat: " + err.message);
      setAssignStatus('');
    }
  };

  // --- RENDERERS ---
  const renderCell = (num, type) => {
    const numStr = String(num);
    const occupant = occupiedSet.get(numStr); 
    const isOccupied = !!occupant;
    const theme = CONFIG[activeTab].theme;

    let bg = 'white';
    let cursor = 'pointer';
    let border = `1px solid ${theme.border}`;
    let title = isOccupied ? `Occupied` : `Assign to ${selectedStudent ? selectedStudent.full_name : 'Student'}`;

    if (isOccupied) {
      bg = '#ffebee'; 
      cursor = 'not-allowed';
      border = '1px solid #ef5350';
      title = `Occupied (Seat ${num})`;
    } else if (selectedStudent) {
      bg = '#e8f5e9'; 
      border = '2px dashed #4caf50';
    }

    return (
      <div 
        key={`${type}-${num}`}
        onClick={() => !isOccupied && handleAssignSeat(numStr, type)}
        style={{
          width: '38px', height: '38px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg,
          color: isOccupied ? '#c62828' : '#333',
          border: border,
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          cursor: cursor, position: 'relative', margin: '2px',
          transition: 'transform 0.1s'
        }}
        title={title}
      >
        {num}
      </div>
    );
  };

  const activeConfig = CONFIG[activeTab];

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)', padding: '10px' }}>
      
      {/* LEFT PANEL */}
      <div style={{ width: '300px', background: 'white', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px', display:'flex', alignItems:'center', gap:'8px' }}>
          <User size={18} /> Pending Students
        </h3>

        <select 
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px', width: '100%' }}
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
        >
          <option value="">-- Select Course --</option>
          {courses && courses.map(c => (
            <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
          ))}
        </select>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedCourseId ? (
            <div style={{color:'#999', fontSize:'13px', textAlign:'center', marginTop:'20px'}}>Please select a course to view students.</div>
          ) : pendingStudents.length === 0 ? (
            <div style={{padding:'20px', textAlign:'center', color:'#28a745'}}>
              <CheckCircle size={24} style={{margin:'0 auto 10px auto'}}/>
              <div>All {activeTab.toLowerCase()} students assigned!</div>
            </div>
          ) : (
            pendingStudents.map(p => (
              <div 
                key={p.participant_id}
                onClick={() => setSelectedStudent(p)}
                style={{
                  padding: '10px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                  background: selectedStudent?.participant_id === p.participant_id ? activeConfig.theme.bg : 'white',
                  borderLeft: selectedStudent?.participant_id === p.participant_id ? `4px solid ${activeConfig.theme.color}` : '4px solid transparent',
                  borderRadius: '4px'
                }}
              >
                <div style={{fontWeight:'bold', fontSize:'13px'}}>{p.full_name}</div>
                <div style={{fontSize:'11px', color:'#666'}}>{p.conf_no} • {p.age} Yrs</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>DN1 Dining Map</h2>
            <div style={{fontSize:'13px', color: selectedStudent ? '#e65100' : '#666', marginTop:'5px', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px'}}>
               {selectedStudent ? <AlertCircle size={14}/> : null}
               {selectedStudent 
                ? `Assigning seat for: ${selectedStudent.full_name}` 
                : "Select a student from the list to start assigning"}
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f3f5', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setActiveTab('MALE')} style={{ padding: '8px 15px', border: 'none', background: activeTab === 'MALE' ? 'white' : 'transparent', color: activeTab === 'MALE' ? '#1565c0' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'MALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Male</button>
            <button onClick={() => setActiveTab('FEMALE')} style={{ padding: '8px 15px', border: 'none', background: activeTab === 'FEMALE' ? 'white' : 'transparent', color: activeTab === 'FEMALE' ? '#ad1457' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'FEMALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Female</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: activeConfig.theme.bg, borderRadius: '12px', padding: '20px', border: `1px solid ${activeConfig.theme.border}` }}>
          {assignStatus && <div style={{textAlign:'center', marginBottom:'15px', padding:'10px', background:'white', borderRadius:'8px', fontWeight:'bold', color:'green', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>{assignStatus}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '11px', background: '#f5f5f5', padding: '4px', borderRadius: '4px' }}>FLOOR</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {activeConfig.floor.flat().map(n => renderCell(n, 'Floor'))}
              </div>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '11px', background: '#f5f5f5', padding: '4px', borderRadius: '4px' }}>CHAIRS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                {activeConfig.chairs.flat().map(n => renderCell(n, 'Chair'))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
