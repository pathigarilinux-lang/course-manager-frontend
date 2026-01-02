import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Map, User, CheckCircle, Search, AlertCircle } from 'lucide-react'; 
import { API_URL } from '../config'; 

export default function DN1DiningConsole({ courses }) {
  // --- STATE ---
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [occupiedData, setOccupiedData] = useState([]); // Array of {seat, gender, studentName...}
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('MALE'); // 'MALE' or 'FEMALE'
  
  // Selection State for Assignment
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
      // 1. Get Occupancy (Who is sitting where?)
      const occRes = await fetch(`${API_URL}/courses/${selectedCourseId}/global-occupied`);
      const occData = await occRes.json();
      setOccupiedData(occData.dining || []);

      // 2. Get Participants (Who needs a seat?)
      const partRes = await fetch(`${API_URL}/courses/${selectedCourseId}/participants`);
      const partData = await partRes.json();
      setParticipants(Array.isArray(partData) ? partData : []);

    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedStudent(null); // Reset selection on course change
  }, [selectedCourseId]);

  // --- HELPERS ---
  
  // Filter Students: Only show those matching the Active Tab Gender & NO Seat assigned yet
  const pendingStudents = useMemo(() => {
    const targetChar = activeTab === 'MALE' ? 'm' : 'f';
    return participants.filter(p => {
      const g = (p.gender || '').toLowerCase();
      // Must match gender AND (have no seat OR have empty seat)
      return g.startsWith(targetChar) && (!p.dining_seat_no || p.dining_seat_no === '');
    });
  }, [participants, activeTab]);

  // Occupied Lookup Set
  const occupiedSet = useMemo(() => {
    const map = new Map(); // Store full info, not just existence
    occupiedData.forEach(item => {
      if (item.seat) map.set(String(item.seat), item);
    });
    return map;
  }, [occupiedData]);

  // --- ACTION: ASSIGN SEAT ---
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
      // Use existing Check-in API to update the seat
      // We send the existing student data + new dining info
      const payload = {
        courseId: selectedCourseId,
        participantId: selectedStudent.participant_id,
        seatNo: String(seatNum),
        diningSeatType: type, // 'Chair' or 'Floor'
        // Preserve other fields if needed, or backend handles partial updates
        // Assuming backend 'check-in' or 'update-participant' handles this. 
        // If you strictly use /check-in, ensure it doesn't wipe other data.
        // SAFE BET: specialized endpoint or simple update. 
        // Let's assume /check-in works for updates as per previous logic.
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
      
      // Refresh Data
      fetchData();
      setSelectedStudent(null); // Clear selection

    } catch (err) {
      alert("Error assigning seat: " + err.message);
      setAssignStatus('');
    }
  };

  // --- RENDERERS ---
  const renderCell = (num, type) => {
    const numStr = String(num);
    const occupant = occupiedSet.get(numStr); // Get occupant details if any
    const isOccupied = !!occupant;
    const theme = CONFIG[activeTab].theme;

    // Interaction Styles
    let bg = 'white';
    let cursor = 'pointer';
    let border = `1px solid ${theme.border}`;

    if (isOccupied) {
      bg = '#ffebee'; // Red background
      cursor = 'not-allowed';
      border = '1px solid #ef5350';
    } else if (selectedStudent) {
      // Highlight available seats when a student is selected
      bg = '#e8f5e9'; // Light Green hint
      border = '2px dashed #4caf50';
    }

    return (
      <div 
        key={`${type}-${num}`}
        onClick={() => !isOccupied && handleAssignSeat(numStr, type)}
        style={{
          width: '40px', height: '40px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg,
          color: isOccupied ? '#c62828' : '#333',
          border: border,
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          cursor: cursor, position: 'relative',
          transition: 'transform 0.1s'
        }}
        title={isOccupied ? `Occupied` : `Assign to ${selectedStudent ? selectedStudent.full_name : 'Student'}`}
      >
        {num}
      </div>
    );
  };

  const activeConfig = CONFIG[activeTab];

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)' }}>
      
      {/* --- LEFT PANEL: STUDENT LIST --- */}
      <div style={{ width: '300px', background: 'white', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <User size={16} style={{display:'inline', marginRight:'5px'}}/> 
          Pending Students
        </h3>

        {/* Course Selector */}
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

        {/* Pending List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedCourseId ? (
            <div style={{color:'#999', fontSize:'13px', textAlign:'center'}}>Select a course first</div>
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

      {/* --- RIGHT PANEL: DINING MAP --- */}
      <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>DN1 Dining Map</h2>
            <div style={{fontSize:'12px', color: selectedStudent ? '#e65100' : '#666', marginTop:'5px', fontWeight: 'bold'}}>
              {selectedStudent 
                ? `👉 Assigning seat for: ${selectedStudent.full_name}` 
                : "Select a student from the left list to assign"}
            </div>
          </div>

          <div style={{ display: 'flex', background: '#f1f3f5', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setActiveTab('MALE')} style={{ padding: '8px 15px', border: 'none', background: activeTab === 'MALE' ? 'white' : 'transparent', color: activeTab === 'MALE' ? '#1565c0' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'MALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Male</button>
            <button onClick={() => setActiveTab('FEMALE')} style={{ padding: '8px 15px', border: 'none', background: activeTab === 'FEMALE' ? 'white' : 'transparent', color: activeTab === 'FEMALE' ? '#ad1457' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'FEMALE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Female</button>
          </div>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, overflow: 'auto', background: activeConfig.theme.bg, borderRadius: '12px', padding: '20px', border: `1px solid ${activeConfig.theme.border}` }}>
          {assignStatus && <div style={{textAlign:'center', marginBottom:'10px', fontWeight:'bold', color:'green'}}>{assignStatus}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* FLOOR */}
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '11px', background: '#f5f5f5', padding: '4px', borderRadius: '4px' }}>FLOOR</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {activeConfig.floor.flat().map(n => renderCell(n, 'Floor'))}
              </div>
            </div>
            {/* CHAIRS */}
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '11px', background: '#f5f5f5', padding: '4px', borderRadius: '4px' }}>CHAIRS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {activeConfig.chairs.flat().map(n => renderCell(n, 'Chair'))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
