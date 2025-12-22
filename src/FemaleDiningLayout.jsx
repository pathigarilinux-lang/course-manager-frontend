import React from 'react';

export default function FemaleDiningLayout({ occupied, selected, onSelect, onClose }) {
  // CONFIGURATION: Female Hall
  const CHAIR_RANGE = [1, 60];  
  const FLOOR_RANGE = [61, 80]; 

  const generateSeats = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const chairs = generateSeats(CHAIR_RANGE[0], CHAIR_RANGE[1]);
  const floor = generateSeats(FLOOR_RANGE[0], FLOOR_RANGE[1]);

  const renderSeat = (num, type) => {
    const sNum = String(num);
    const isOcc = occupied.has(sNum);
    const isSel = String(selected) === sNum;
    
    // Styles
    const baseStyle = {
      padding: '10px', borderRadius: '4px', cursor: isOcc ? 'not-allowed' : 'pointer',
      fontWeight: 'bold', fontSize: '12px', textAlign: 'center',
      border: isSel ? '2px solid #e91e63' : '1px solid #ccc',
      color: isOcc ? '#aaa' : isSel ? 'white' : '#333'
    };

    let bg = 'white';
    if (isOcc) bg = '#f8d7da'; 
    else if (isSel) bg = '#e91e63'; 
    else if (type === 'Floor') bg = '#fff3cd'; 

    return (
      <button
        key={num}
        type="button"
        disabled={isOcc}
        onClick={() => onSelect(sNum, type)}
        style={{ ...baseStyle, background: bg }}
      >
        {num}
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #e91e63', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#e91e63' }}>🍽️ FEMALE Dining Hall</h3>
          <div style={{display:'flex', gap:'15px', fontSize:'12px', alignItems:'center'}}>
             <span style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12, height:12, background:'white', border:'1px solid #ccc'}}></div> Chair</span>
             <span style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12, height:12, background:'#fff3cd', border:'1px solid #ccc'}}></div> Floor</span>
             <span style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:12, height:12, background:'#f8d7da', border:'1px solid #ccc'}}></div> Occupied</span>
          </div>
          <button onClick={onClose} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* SECTION 1: CHAIRS */}
          <div style={{ flex: 2, borderRight: '1px dashed #ccc', paddingRight: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', background:'#fce4ec', padding:'5px' }}>🪑 Dining Tables (Chairs)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px' }}>
              {chairs.map(n => renderSeat(n, 'Chair'))}
            </div>
          </div>

          {/* SECTION 2: FLOOR */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', background:'#fff3cd', padding:'5px' }}>🧘 Floor Seating</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px' }}>
              {floor.map(n => renderSeat(n, 'Floor'))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
