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
  // ✅ DEFAULT TAB: Standard (Old Layout)
  const [activeTab, setActiveTab] = useState('STANDARD'); // Options: 'STANDARD', 'DN1_MALE', 'DN1_FEMALE'

  // Helper: Detect gender for the Standard tab auto-switching
  const effectiveGender = currentGender || props.gender || ''; 
  const isFemaleStd = effectiveGender.toLowerCase().startsWith('f');

  // --- DN1 RENDER LOGIC ---
  // 1. Safe Conflict Check (Prevents Crashes)
  const occupiedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(occupied)) {
      occupied.forEach(item => { if (item && item.seat) set.add(String(item.seat)); });
    }
    return set;
  }, [occupied]);

  // 2. Render Single Seat for DN1
  const renderDN1Cell = (num, type, config) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const isSelected = props.selected === numStr; 

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

  // 3. Render Grid for DN1
  const renderDN1Grid = (configName) => {
    const config = DN1_CONFIG[configName];
    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* FLOOR */}
          <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', color: '#2e7d32', background: '#e8f5e9', padding: '4px', borderRadius: '4px' }}>FLOOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {config.floor.flat().map(n => renderDN1Cell(n, 'Floor', config))}
            </div>
          </div>
          {/* CHAIRS */}
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
      {/* --- TABS --- */}
      <div style={{ display: 'flex', background: '#f8f9fa', borderBottom: '1px solid #ddd', padding: '5px 5px 0' }}>
        {/* TAB 1: STANDARD (Existing) */}
        <button 
          type="button"
          onClick={() => setActiveTab('STANDARD')}
          style={{
            flex: 1, padding: '10px', border: 'none', background: activeTab === 'STANDARD' ? 'white' : 'transparent',
            fontWeight: 'bold', color: activeTab === 'STANDARD' ? '#333' : '#777', cursor: 'pointer', borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'STANDARD' ? '3px solid #666' : 'none'
          }}
        >
          Standard Hall
        </button>

        {/* TAB 2: DN1 MALE */}
        <button 
          type="button"
          onClick={() => setActiveTab('DN1_MALE')}
          style={{
            flex: 1, padding: '10px', border: 'none', background: activeTab === 'DN1_MALE' ? 'white' : 'transparent',
            fontWeight: 'bold', color: activeTab === 'DN1_MALE' ? '#1565c0' : '#777', cursor: 'pointer', borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'DN1_MALE' ? '3px solid #1565c0' : 'none'
          }}
        >
          DN1 Male
        </button>

        {/* TAB 3: DN1 FEMALE */}
        <button 
          type="button"
          onClick={() => setActiveTab('DN1_FEMALE')}
          style={{
            flex: 1, padding: '10px', border: 'none', background: activeTab === 'DN1_FEMALE' ? 'white' : 'transparent',
            fontWeight: 'bold', color: activeTab === 'DN1_FEMALE' ? '#ad1457' : '#777', cursor: 'pointer', borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'DN1_FEMALE' ? '3px solid #ad1457' : 'none'
          }}
        >
          DN1 Female
        </button>
      </div>

      {/* --- CONTENT --- */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
        {activeTab === 'STANDARD' && (
          // Renders Old Layouts (Auto-detects gender)
          isFemaleStd ? 
            <FemaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} /> : 
            <MaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} />
        )}

        {activeTab === 'DN1_MALE' && renderDN1Grid('MALE')}
        
        {activeTab === 'DN1_FEMALE' && renderDN1Grid('FEMALE')}
      </div>
    </div>
  );
}
