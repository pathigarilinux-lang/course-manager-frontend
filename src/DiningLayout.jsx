import React, { useState, useMemo, useEffect } from 'react';

// ✅ IMPORT EXISTING LAYOUTS (Preserves Old Workflow)
import MaleDiningLayout from './MaleDiningLayout';
import FemaleDiningLayout from './FemaleDiningLayout';

// --- DN1 CONFIGURATION (New Layout Logic) ---
const DN1_CONFIG = {
  MALE: {
    color: '#1565c0', bg: '#e3f2fd',
    chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
    floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
  },
  FEMALE: {
    color: '#ad1457', bg: '#fce4ec',
    chairs: [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]],
    floor: [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]]
  }
};

export default function DiningLayout({ onSelect, occupied, currentGender, ...props }) {
  // ✅ STATE: Toggle between Standard (Old) and DN1 (New)
  const [hallType, setHallType] = useState('STANDARD'); // Options: 'STANDARD', 'DN1'
  
  // Logic to determine gender
  // Note: StudentForm passes 'currentGender', legacy might expect 'gender'
  const effectiveGender = currentGender || props.gender || ''; 
  const isFemale = effectiveGender.toLowerCase().startsWith('f');

  // --- DN1 RENDER LOGIC ---
  // Safe set generation for DN1
  const occupiedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(occupied)) {
      occupied.forEach(item => { if (item && item.seat) set.add(String(item.seat)); });
    }
    return set;
  }, [occupied]);

  const renderDN1Cell = (num, type, config) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const isSelected = props.selected === numStr; // Check if selected (if prop passed)

    return (
      <div
        key={`DN1-${type}-${num}`}
        onClick={() => !isOccupied && onSelect(numStr, type)}
        style={{
          width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOccupied ? '#ffebee' : (isSelected ? config.color : 'white'),
          color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'),
          border: isOccupied ? '1px solid #ffcdd2' : '1px solid #ccc',
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          cursor: isOccupied ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        title={isOccupied ? `Occupied` : `${type} ${num}`}
      >
        {num}
      </div>
    );
  };

  const renderDN1Layout = () => {
    const config = isFemale ? DN1_CONFIG.FEMALE : DN1_CONFIG.MALE;
    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* DN1 FLOOR */}
          <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', color: '#2e7d32', background: '#e8f5e9', padding: '4px', borderRadius: '4px' }}>FLOOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {config.floor.flat().map(n => renderDN1Cell(n, 'Floor', config))}
            </div>
          </div>
          {/* DN1 CHAIRS */}
          <div style={{ background: config.bg, padding: '10px', borderRadius: '8px', border: `1px solid ${config.color}30` }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', color: config.color, background: 'white', padding: '4px', borderRadius: '4px' }}>CHAIRS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {config.chairs.flat().map(n => renderDN1Cell(n, 'Chair', config))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* --- HALL SELECTOR TABS --- */}
      <div style={{ display: 'flex', background: '#f1f3f5', borderBottom: '1px solid #ddd', padding: '5px' }}>
        <button 
          type="button" // Prevent form submission
          onClick={() => setHallType('STANDARD')}
          style={{
            flex: 1, padding: '10px', border: 'none', background: hallType === 'STANDARD' ? 'white' : 'transparent',
            fontWeight: 'bold', color: hallType === 'STANDARD' ? '#333' : '#777', cursor: 'pointer', borderRadius: '6px 6px 0 0',
            borderBottom: hallType === 'STANDARD' ? '3px solid #007bff' : 'none'
          }}
        >
          Main Hall (Standard)
        </button>
        <button 
          type="button" // Prevent form submission
          onClick={() => setHallType('DN1')}
          style={{
            flex: 1, padding: '10px', border: 'none', background: hallType === 'DN1' ? 'white' : 'transparent',
            fontWeight: 'bold', color: hallType === 'DN1' ? (isFemale ? '#ad1457' : '#1565c0') : '#777', cursor: 'pointer', borderRadius: '6px 6px 0 0',
            borderBottom: hallType === 'DN1' ? `3px solid ${isFemale ? '#ad1457' : '#1565c0'}` : 'none'
          }}
        >
          DN1 Hall
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {hallType === 'STANDARD' ? (
          // ✅ RENDER OLD LAYOUTS
          isFemale ? 
            <FemaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} /> : 
            <MaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} />
        ) : (
          // ✅ RENDER NEW DN1 LAYOUT
          renderDN1Layout()
        )}
      </div>
    </div>
  );
}
