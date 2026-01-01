import React, { useState, useMemo } from 'react';

// ✅ CORRECT IMPORTS: Since this file is in 'src/components/', 
// and the layouts are also there, we use './' to point to neighbors.
import MaleDiningLayout from './MaleDiningLayout'; 
import FemaleDiningLayout from './FemaleDiningLayout';

// --- DN1 CONFIGURATION ---
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

export default function DiningSystem({ onSelect, occupied, currentGender, ...props }) {
  const [activeTab, setActiveTab] = useState('STANDARD'); 

  // Gender Helper
  const effectiveGender = currentGender || props.gender || ''; 
  const isFemaleStd = effectiveGender.toLowerCase().startsWith('f');

  // Safe Data Handling
  const occupiedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(occupied)) {
      occupied.forEach(item => { if (item && item.seat) set.add(String(item.seat)); });
    }
    return set;
  }, [occupied]);

  // DN1 Renderers
  const renderDN1Cell = (num, type, config) => {
    const numStr = String(num);
    const isOccupied = occupiedSet.has(numStr);
    const isSelected = String(props.selected) === numStr; 

    return (
      <div
        key={`DN1-${type}-${num}`}
        onClick={() => !isOccupied && onSelect(numStr, type)}
        style={{
          width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOccupied ? '#ffebee' : (isSelected ? config.color : 'white'),
          color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'),
          border: isOccupied ? '1px solid #ffcdd2' : (isSelected ? `2px solid ${config.color}` : '1px solid #ccc'),
          borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
          cursor: isOccupied ? 'not-allowed' : 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
        title={isOccupied ? `Occupied` : `${type} ${num}`}
      >
        {num}
      </div>
    );
  };

  const renderDN1Grid = (configKey) => {
    const config = DN1_CONFIG[configKey];
    return (
      <div style={{ textAlign: 'center', padding: '15px', background: '#fff', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: config.color, borderBottom:`2px solid ${config.color}30`, display:'inline-block', paddingBottom:'5px' }}>
          {configKey} HALL LAYOUT
        </h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* FLOOR */}
          <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', color: '#2e7d32', background: '#e8f5e9', padding: '4px', borderRadius: '4px' }}>FLOOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>{config.floor.flat().map(n => renderDN1Cell(n, 'Floor', config))}</div>
          </div>
          {/* CHAIRS */}
          <div style={{ background: config.bg, padding: '10px', borderRadius: '8px', border: `1px solid ${config.color}30` }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', color: config.color, background: 'white', padding: '4px', borderRadius: '4px' }}>CHAIRS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>{config.chairs.flat().map(n => renderDN1Cell(n, 'Chair', config))}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight:'400px', border:'3px solid #007bff' }}>
      
      {/* --- TABS --- */}
      <div style={{ display: 'flex', background: '#343a40', padding: '10px 10px 0' }}>
        <button type="button" onClick={() => setActiveTab('STANDARD')} style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize:'13px', background: activeTab === 'STANDARD' ? '#f8f9fa' : 'transparent', color: activeTab === 'STANDARD' ? '#333' : '#adb5bd', borderRadius: '8px 8px 0 0' }}>Main Hall</button>
        <button type="button" onClick={() => setActiveTab('DN1_MALE')} style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize:'13px', background: activeTab === 'DN1_MALE' ? '#e3f2fd' : 'transparent', color: activeTab === 'DN1_MALE' ? '#1565c0' : '#adb5bd', borderRadius: '8px 8px 0 0' }}>DN1 Male</button>
        <button type="button" onClick={() => setActiveTab('DN1_FEMALE')} style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize:'13px', background: activeTab === 'DN1_FEMALE' ? '#fce4ec' : 'transparent', color: activeTab === 'DN1_FEMALE' ? '#ad1457' : '#adb5bd', borderRadius: '8px 8px 0 0' }}>DN1 Female</button>
      </div>

      {/* --- CONTENT --- */}
      <div style={{ flex: 1, overflow: 'auto', padding: '15px', background: '#f8f9fa' }}>
        {activeTab === 'STANDARD' && (
          <div style={{ textAlign:'center' }}>
            <div style={{marginBottom:'10px', color:'#666', fontSize:'12px', fontStyle:'italic'}}>Standard {isFemaleStd ? 'Female' : 'Male'} Layout</div>
            {isFemaleStd ? <FemaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} /> : <MaleDiningLayout onSelect={onSelect} occupied={occupied} {...props} />}
          </div>
        )}
        {activeTab === 'DN1_MALE' && renderDN1Grid('MALE')}
        {activeTab === 'DN1_FEMALE' && renderDN1Grid('FEMALE')}
      </div>
    </div>
  );
}
