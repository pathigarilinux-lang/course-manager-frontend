import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Map, Filter } from 'lucide-react'; 
import { API_URL } from '../config'; // Ensure this path is correct for your project

export default function DN1DiningConsole({ courses }) {
  // --- STATE ---
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [occupiedData, setOccupiedData] = useState([]);
  const [activeTab, setActiveTab] = useState('MALE'); // 'MALE' or 'FEMALE'

  // --- CONFIGURATION: DN1 SEAT MAPS ---
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
  const fetchOccupancy = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      // Fetch global occupied list for this course
      const res = await fetch(`${API_URL}/courses/${selectedCourseId}/global-occupied`);
      const data = await res.json();
      // Store dining data safely
      setOccupiedData(data.dining || []);
    } catch (error) {
      console.error("Failed to load dining data", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when course changes
  useEffect(() => {
    fetchOccupancy();
  }, [selectedCourseId]);

  // --- PROCESSED DATA ---
  const occupiedSet = useMemo(() => {
    const set = new Set();
    occupiedData.forEach(item => {
      // Only track seats matching the active tab's gender
      const itemGender = (item.gender || '').toLowerCase();
      const currentGenderChar = activeTab === 'MALE' ? 'm' : 'f';
      
      if (item.seat && itemGender.startsWith(currentGenderChar)) {
        set.add(String(item.seat));
      }
    });
    return set;
  }, [occupiedData, activeTab]);

  // --- RENDER HELPERS ---
  const renderCell = (num, type) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const theme = CONFIG[activeTab].theme;

    return (
      <div 
        key={`${type}-${num}`}
        style={{
          width: '40px', height: '40px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOccupied ? '#ffebee' : 'white',
          color: isOccupied ? '#c62828' : '#333',
          border: isOccupied ? '1px solid #ef5350' : `1px solid ${theme.border}`,
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          position: 'relative'
        }}
        title={isOccupied ? `Occupied` : `Free`}
      >
        {num}
        {isOccupied && <div style={{position:'absolute', bottom:'2px', fontSize:'8px'}}>❌</div>}
      </div>
    );
  };

  const activeConfig = CONFIG[activeTab];

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      
      {/* 1. HEADER & CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Map /> DN1 Dining Console
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {courses && courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
            ))}
          </select>
          
          <button onClick={fetchOccupancy} disabled={!selectedCourseId} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. TABS */}
      <div style={{ display: 'flex', marginBottom: '20px', background: '#f1f3f5', padding: '5px', borderRadius: '8px' }}>
        <button 
          onClick={() => setActiveTab('MALE')}
          style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'MALE' ? 'white' : 'transparent', color: activeTab === 'MALE' ? '#1565c0' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'MALE' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
        >
          DN1 MALE
        </button>
        <button 
          onClick={() => setActiveTab('FEMALE')}
          style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'FEMALE' ? 'white' : 'transparent', color: activeTab === 'FEMALE' ? '#ad1457' : '#777', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', boxShadow: activeTab === 'FEMALE' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
        >
          DN1 FEMALE
        </button>
      </div>

      {/* 3. VISUAL GRID */}
      {!selectedCourseId ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' }}>Please select a course to view occupancy.</div>
      ) : (
        <div style={{ background: activeConfig.theme.bg, padding: '20px', borderRadius: '12px', border: `1px solid ${activeConfig.theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            
            {/* FLOOR SECTION */}
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '12px', background: '#f5f5f5', padding: '5px', borderRadius: '4px' }}>FLOOR</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {activeConfig.floor.flat().map(n => renderCell(n, 'Floor'))}
              </div>
            </div>

            {/* CHAIR SECTION */}
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold', color: '#555', fontSize: '12px', background: '#f5f5f5', padding: '5px', borderRadius: '4px' }}>CHAIRS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {activeConfig.chairs.flat().map(n => renderCell(n, 'Chair'))}
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
