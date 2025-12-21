import React, { useState } from 'react';

export default function PagodaLayout({ gender, occupied, selected, onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState(gender === 'Female' ? 'Female' : 'Male');

  // CONFIGURATION FROM PROMPT
  const MALE_CIRCLES = [
    { name: 'Circle G (Outer)', range: [113, 123] },
    { name: 'Circle F (Outer)', range: [101, 112] },
    { name: 'Circle E', range: [89, 100] },
    { name: 'Circle D', range: [49, 64] },
    { name: 'Circle C', range: [31, 40] },
    { name: 'Circle B', range: [9, 30] },
    { name: 'Circle A', manual: [1, 2, 6, 7, 8] }
  ];

  const FEMALE_CIRCLES = [
    { name: 'Circle F (Outer)', range: [130, 140] },
    { name: 'Circle E', range: [65, 76] },
    { name: 'Circle D', range: [77, 88] },
    { name: 'Circle C', range: [41, 48] },
    { name: 'Circle B', range: [13, 20] },
    { name: 'Circle A', manual: [3, 5] }
  ];

  // Helper to generate numbers array from range or manual list
  const getNumbers = (config) => {
    if (config.manual) return config.manual;
    const [start, end] = config.range;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const currentConfig = activeTab === 'Male' ? MALE_CIRCLES : FEMALE_CIRCLES;
  const themeColor = activeTab === 'Male' ? '#007bff' : '#e91e63';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('Male')} 
              style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: activeTab === 'Male' ? '#007bff' : '#eee', color: activeTab === 'Male' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Male
            </button>
            <button 
              onClick={() => setActiveTab('Female')} 
              style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: activeTab === 'Female' ? '#e91e63' : '#eee', color: activeTab === 'Female' ? 'white' : '#555', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Female
            </button>
          </div>
          <button onClick={onClose} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>

        {/* Circles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {currentConfig.map((circle, idx) => (
            <div key={idx} style={{ border: `1px solid ${themeColor}40`, borderRadius: '8px', padding: '10px', background: `${themeColor}05` }}>
              <div style={{ color: themeColor, fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', borderBottom: `1px solid ${themeColor}20`, paddingBottom: '4px' }}>
                {circle.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getNumbers(circle).map(num => {
                  const sNum = String(num);
                  const isOcc = occupied.has(sNum);
                  const isSel = String(selected) === sNum;
                  
                  return (
                    <button
                      key={num}
                      onClick={() => !isOcc && onSelect(num)}
                      disabled={isOcc}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        border: isSel ? `2px solid ${themeColor}` : '1px solid #ccc',
                        background: isOcc ? '#ffebee' : isSel ? themeColor : 'white',
                        color: isOcc ? '#ccc' : isSel ? 'white' : '#333',
                        fontWeight: 'bold', cursor: isOcc ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
