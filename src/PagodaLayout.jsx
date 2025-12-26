import React from 'react';

export default function PagodaLayout({ gender, occupied, occupiedData, selected, onSelect, onClose }) {
  const isFemale = (gender || '').toLowerCase().startsWith('f');
  const currentGender = isFemale ? 'Female' : 'Male';
  const themeColor = isFemale ? '#e91e63' : '#007bff';

  // --- CONFIGURATION ---
  
  const MALE_CIRCLES = [
    { name: 'Circle G (Outer)', range: [124, 128] },
    { name: 'Circle G (Outer)', range: [113, 123] },
    { name: 'Circle F (Outer)', range: [101, 112] },
    { name: 'Circle E', range: [89, 100] },
    { name: 'Circle D', range: [49, 64] },
    { name: 'Circle C', range: [31, 40] },
    // Circle B: 9-12 AND 21-30 (Skipping 13-20)
    { name: 'Circle B', manual: [9, 10, 11, 12, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    { name: 'Circle A', manual: [1, 2, 6, 7, 8] } // 1, 2 are Teachers
  ];

  const FEMALE_CIRCLES = [
    { name: 'Circle F (Outer)', range: [130, 140] },
    { name: 'Circle E', range: [65, 76] },
    { name: 'Circle D', range: [77, 88] },
    { name: 'Circle C', range: [41, 48] },
    { name: 'Circle B', range: [13, 20] }, 
    { name: 'Circle A', manual: [3, 4, 5] } // ✅ Added 4. (3, 4, 5 are Teachers)
  ];

  const currentConfig = isFemale ? FEMALE_CIRCLES : MALE_CIRCLES;

  // ✅ TEACHER CELL LOGIC
  const isTeacherCell = (num) => {
      if (isFemale) return [3, 4, 5].includes(num);
      return [1, 2].includes(num);
  };

  const getNumbers = (config) => {
    if (config.manual) return config.manual;
    const [start, end] = config.range;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)'}}>
      <div style={{ background: 'white', padding: '0', borderRadius: '16px', width: '95%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>
        
        {/* HEADER */}
        <div style={{ padding: '20px', background: `linear-gradient(135deg, ${themeColor}, ${isFemale?'#ff80ab':'#4fc3f7'})`, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🛖 Pagoda Map</h2>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>{currentGender} Side • Select a Cell</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width:'32px', height:'32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* LEGEND */}
        <div style={{ display: 'flex', gap: '20px', padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #eee', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #ccc', background: 'white' }}></div> Available</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#bbdefb', border: '1px solid #90caf9', color: '#0d47a1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px' }}>O</div> Old Student</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff9c4', border: '1px solid #ffe082', color: '#856404', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px' }}>N</div> New Student</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f3e5f5', border: '1px solid #9c27b0', color: '#6a1b9a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px' }}>T</div> Teacher</div>
        </div>

        {/* CELLS GRID */}
        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {currentConfig.map((circle, idx) => (
            <div key={idx} style={{ position: 'relative', borderTop: '1px dashed #ddd', paddingTop: '15px' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'white', padding: '0 10px', fontSize: '12px', fontWeight: 'bold', color: themeColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {circle.name}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
                {getNumbers(circle).map(num => {
                  const sNum = String(num);
                  const isOcc = occupied.has(sNum);
                  const occupantCat = occupiedData ? occupiedData[sNum] : null; 
                  const isSel = String(selected) === sNum;
                  const isTeacher = isTeacherCell(num);
                  
                  // --- VISUAL LOGIC ---
                  let bg = 'white';
                  let border = '2px solid #e0e0e0';
                  let color = '#555';
                  let shadow = 'inset 0 -3px 0 rgba(0,0,0,0.05)'; 
                  let cursor = 'pointer';
                  let transform = 'none';

                  // Teacher Override
                  if (isTeacher) {
                      bg = '#f3e5f5'; border = '2px solid #ab47bc'; color = '#6a1b9a';
                  }

                  if (isSel) {
                      bg = 'white';
                      border = `3px solid ${themeColor}`;
                      color = themeColor;
                      shadow = `0 0 0 4px ${themeColor}20`; 
                      transform = 'scale(1.1)';
                  } else if (isOcc) {
                      cursor = 'not-allowed';
                      if (occupantCat === 'O') {
                          bg = '#e3f2fd'; border = '2px solid #90caf9'; color = '#0d47a1'; 
                      } else if (occupantCat === 'N') {
                          bg = '#fff9c4'; border = '2px solid #ffe082'; color = '#f57f17'; 
                      } else {
                          bg = '#f5f5f5'; color = '#aaa'; 
                      }
                  }

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => !isOcc && onSelect(num)}
                      disabled={isOcc}
                      style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        border: border, background: bg, color: color,
                        fontWeight: '800', fontSize: '14px', cursor: cursor,
                        boxShadow: shadow, transform: transform,
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => !isOcc && !isSel ? e.currentTarget.style.transform = 'translateY(-3px)' : null}
                      onMouseLeave={(e) => !isOcc && !isSel ? e.currentTarget.style.transform = 'none' : null}
                    >
                      {num}
                      {/* Teacher Badge */}
                      {isTeacher && !isOcc && <span style={{fontSize:'8px', lineHeight:'1', marginTop:'-2px', fontWeight:'bold'}}>TCHR</span>}
                      
                      {/* Occupant Badge */}
                      {isOcc && occupantCat && <span style={{fontSize:'8px', lineHeight:'1', marginTop:'-2px', opacity:0.8}}>{occupantCat === 'O' ? 'OLD' : 'NEW'}</span>}
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
