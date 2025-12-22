import React from 'react';

export default function PagodaLayout({ gender, occupied, selected, onSelect, onClose }) {
  // STRICT GENDER: No switching tabs. Use the prop passed from App.jsx
  // Default to Male if undefined, but logic usually ensures strict 'Male'/'Female'
  const isFemale = (gender || '').toLowerCase().startsWith('f');
  const currentGender = isFemale ? 'Female' : 'Male';
  const themeColor = isFemale ? '#e91e63' : '#007bff';

  // CONFIGURATION
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

  // Select Configuration based on Strict Gender
  const currentConfig = isFemale ? FEMALE_CIRCLES : MALE_CIRCLES;

  // Helper to generate numbers array
  const getNumbers = (config) => {
    if (config.manual) return config.manual;
    const [start, end] = config.range;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header - No Tabs, Just Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${themeColor}`, paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: themeColor, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛖 Pagoda Selection ({currentGender})
          </h3>
          <button onClick={onClose} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', marginBottom: '15px', color: '#555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '15px', height: '15px', borderRadius: '50%', border: `2px solid ${themeColor}` }}></div> Selected</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#ffebee', border: '1px solid #ccc' }}></div> Occupied</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '1px solid #ccc' }}></div> Available</div>
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
                      type="button"
                      onClick={() => !isOcc && onSelect(num)}
                      disabled={isOcc}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        border: isSel ? `3px solid ${themeColor}` : '1px solid #ccc',
                        background: isOcc ? '#ffebee' : isSel ? 'white' : 'white',
                        color: isOcc ? '#ccc' : isSel ? themeColor : '#333',
                        fontWeight: 'bold', cursor: isOcc ? 'not-allowed' : 'pointer',
                        boxShadow: isSel ? `0 0 10px ${themeColor}60` : '0 2px 4px rgba(0,0,0,0.05)',
                        fontSize: '13px'
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
