import React, { useState, useMemo, useEffect } from 'react';

// --- DN1 CONFIGURATION ---
const LAYOUTS = {
  MALE: {
    title: 'DN1 Male Dining',
    color: '#1565c0', // Blue
    bg: '#e3f2fd',
    chairs: [
      [1, 2, 3, 4, 5, 6],
      [31, 32, 33, 34, 35, 36],
      [37, 38, 39, 40, 41, 42]
    ],
    floor: [
      [5, 6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15, 16],
      [17, 18, 19, 20, 21, 22],
      [23, 24, 25, 26, 27, 28],
      [29, 30]
    ]
  },
  FEMALE: {
    title: 'DN1 Female Dining',
    color: '#ad1457', // Pink
    bg: '#fce4ec',
    chairs: [
      [1, 2, 3, 4, 5, 6],
      [31, 32, 33, 34, 35, 36],
      [37, 38, 39, 40, 41, 42]
    ],
    floor: [
      [5, 6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15, 16],
      [17, 18, 19, 20, 21, 22],
      [23, 24, 25, 26, 27, 28],
      [29, 30]
    ]
  }
};

// This component replaces your old wrapper and renders the DN1 grids directly.
export default function DiningLayout({ onSelect, occupied, currentGender }) {
  // 1. Determine active layout based on student gender (Default to Male)
  const [activeTab, setActiveTab] = useState('MALE');

  useEffect(() => {
    // If gender prop is passed (e.g. from StudentForm), auto-switch tab
    if (currentGender && currentGender.toLowerCase().startsWith('f')) {
      setActiveTab('FEMALE');
    } else {
      setActiveTab('MALE');
    }
  }, [currentGender]);

  // 2. Safe Global Conflict Check
  // Converts the API array [{seat: "1", ...}] into a simple Set for fast lookup
  const occupiedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(occupied)) {
      occupied.forEach(item => {
        if (item && item.seat) set.add(String(item.seat));
      });
    }
    return set;
  }, [occupied]);

  // 3. Render a Single Seat Cell
  const renderCell = (num, type, config) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);

    let bg = 'white';
    let color = '#333';
    let border = '1px solid #ccc';
    let cursor = 'pointer';

    if (isOccupied) {
      bg = '#ffebee';
      color = '#c62828';
      border = '1px solid #ffcdd2';
      cursor = 'not-allowed';
    } 

    return (
      <div
        key={`${type}-${num}`}
        onClick={() => {
          if (!isOccupied) onSelect(numStr, type);
        }}
        style={{
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          color: color,
          border: border,
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: cursor,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          transition: 'transform 0.1s'
        }}
        onMouseEnter={e => !isOccupied && (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title={isOccupied ? `Seat ${num} Occupied` : `Select ${type} ${num}`}
      >
        {num}
      </div>
    );
  };

  const config = LAYOUTS[activeTab];

  return (
    <div style={{ padding: '10px' }}>
      
      {/* --- TABS (To manually switch if needed) --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <button 
          type="button"
          onClick={() => setActiveTab('MALE')}
          style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
            background: activeTab === 'MALE' ? '#e3f2fd' : '#f5f5f5',
            color: activeTab === 'MALE' ? '#1565c0' : '#666',
            borderBottom: activeTab === 'MALE' ? '3px solid #1565c0' : 'none'
          }}
        >
          DN1 MALE
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('FEMALE')}
          style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
            background: activeTab === 'FEMALE' ? '#fce4ec' : '#f5f5f5',
            color: activeTab === 'FEMALE' ? '#ad1457' : '#666',
            borderBottom: activeTab === 'FEMALE' ? '3px solid #ad1457' : 'none'
          }}
        >
          DN1 FEMALE
        </button>
      </div>

      {/* --- VISUAL GRID --- */}
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ color: config.color, marginBottom: '15px' }}>{config.title}</h4>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* FLOOR SECTION */}
          <div style={{ background: '#fafafa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ 
                marginBottom: '10px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px',
                color: '#2e7d32', background: '#e8f5e9', padding: '5px', borderRadius: '4px' 
            }}>
              FLOOR (5-30)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {config.floor.flat().map(n => renderCell(n, 'Floor', config))}
            </div>
          </div>

          {/* CHAIR SECTION */}
          <div style={{ background: config.bg, padding: '15px', borderRadius: '12px', border: `1px solid ${config.color}30` }}>
            <div style={{ 
                marginBottom: '10px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px',
                color: config.color, background: 'white', padding: '5px', borderRadius: '4px' 
            }}>
              CHAIRS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {config.chairs.flat().map(n => renderCell(n, 'Chair', config))}
            </div>
          </div>

        </div>
      </div>

      {/* --- LEGEND --- */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: 'white', border: '1px solid #ccc', borderRadius: '2px' }}></div> Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', background: '#ffebee', border: '1px solid #c62828', borderRadius: '2px' }}></div> Occupied
        </span>
      </div>

    </div>
  );
}
