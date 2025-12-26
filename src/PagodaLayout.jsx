import React from 'react';

export default function PagodaLayout({ gender, occupied, occupiedData, selected, onSelect, onClose }) {
  const isFemale = (gender || '').toLowerCase().startsWith('f');
  const currentGender = isFemale ? 'Female' : 'Male';
  const themeColor = isFemale ? '#e91e63' : '#007bff';

  // CONFIGURATION
  const MALE_CIRCLES = [
    { name: 'Circle G (Outer)', range: [124, 128] },
    { name: 'Circle G (Outer)', range: [113, 123] },
    { name: 'Circle F (Outer)', range: [101, 112] },
    { name: 'Circle E', range: [89, 100] },
    { name: 'Circle D', range: [49, 64] },
    { name: 'Circle C', range: [31, 40] },
    { name: 'Circle B', range: [9, 11, 12, 13,[21, 30] },
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

  const currentConfig = isFemale ? FEMALE_CIRCLES : MALE_CIRCLES;

  const getNumbers = (config) => {
    if (config.manual) return config.manual;
    const [start, end] = config.range;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `2px solid ${themeColor}`, paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: themeColor, display: 'flex', alignItems: 'center', gap: '10px' }}>🛖 Pagoda Selection ({currentGender})</h3>
          <button onClick={onClose} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', marginBottom: '15px', justifyContent:'center', background:'#f9f9f9', padding:'10px', borderRadius:'8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${themeColor}`, background:'white' }}></div> Free</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e3f2fd', border: '1px solid #90caf9', color:'#0d47a1', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px' }}>O</div> Old</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff3cd', border: '1px solid #ffeeba', color:'#856404', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px' }}>N</div> New</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {currentConfig.map((circle, idx) => (
            <div key={idx} style={{ border: `1px solid ${themeColor}40`, borderRadius: '8px', padding: '10px', background: `${themeColor}05` }}>
              <div style={{ color: themeColor, fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', borderBottom: `1px solid ${themeColor}20`, paddingBottom: '4px' }}>{circle.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getNumbers(circle).map(num => {
                  const sNum = String(num);
                  const isOcc = occupied.has(sNum);
                  const occupantCat = occupiedData ? occupiedData[sNum] : null; // 'O' or 'N'
                  const isSel = String(selected) === sNum;
                  
                  // Style Logic
                  let bg = 'white';
                  let border = '1px solid #ccc';
                  let textColor = '#333';
                  let badgeBg = 'transparent';
                  let badgeColor = 'transparent';

                  if (isSel) {
                      bg = 'white'; border = `3px solid ${themeColor}`; textColor = themeColor;
                  } else if (isOcc) {
                      bg = '#f5f5f5'; textColor = '#aaa'; // Dim the main button
                      if (occupantCat === 'O') { badgeBg = '#007bff'; badgeColor = 'white'; }
                      else if (occupantCat === 'N') { badgeBg = '#ffc107'; badgeColor = 'black'; }
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => !isOcc && onSelect(num)}
                      disabled={isOcc}
                      style={{
                        width: '45px', height: '45px', borderRadius: '50%',
                        border: border, background: bg, color: textColor,
                        fontWeight: 'bold', cursor: isOcc ? 'not-allowed' : 'pointer',
                        boxShadow: isSel ? `0 0 10px ${themeColor}60` : '0 2px 4px rgba(0,0,0,0.05)',
                        fontSize: '14px', display:'flex', alignItems:'center', justifyContent:'center',
                        position: 'relative' // Essential for the badge
                      }}
                    >
                      {num}
                      
                      {/* THE SMALL BADGE */}
                      {isOcc && occupantCat && (
                          <div style={{
                              position: 'absolute', top: '-2px', right: '-2px',
                              width: '16px', height: '16px', borderRadius: '50%',
                              background: badgeBg, color: badgeColor,
                              fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}>
                              {occupantCat}
                          </div>
                      )}
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
