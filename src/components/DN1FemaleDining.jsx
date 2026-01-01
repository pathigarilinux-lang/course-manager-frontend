import React from 'react';

export default function DN1FemaleDining({ occupiedMap, selected, onSelect }) {
  
  const chairRows = [
    [1, 2, 3, 4, 5, 6],
    [31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42]
  ];

  const floorRows = [
    [5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28],
    [29, 30] 
  ];

  const renderCell = (num, type) => {
      const numStr = String(num);
      const isOccupied = occupiedMap && occupiedMap.has(numStr);
      const isSelected = String(selected) === numStr;
      
      let bg = 'white';
      let color = '#333';
      let border = '1px solid #ccc';
      let cursor = 'pointer';

      if (isOccupied) {
          bg = '#fce4ec'; color = '#880e4f'; border = '1px solid #f48fb1'; cursor = 'not-allowed';
      } else if (isSelected) {
          bg = '#e91e63'; color = 'white'; border = '1px solid #c2185b';
      }

      return (
          <div 
              key={`${type}-${num}`}
              onClick={() => !isOccupied && onSelect(numStr, type)}
              style={{
                  width: '40px', height: '40px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg, color: color, border: border,
                  borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                  cursor: cursor, boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.1s'
              }}
              title={isOccupied ? "Occupied" : `${type} ${num}`}
          >
              {num}
          </div>
      );
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: '#fff9fa' }}>
      <h3 style={{ color: '#ad1457', margin: '0 0 20px 0', borderBottom:'2px solid #f8bbd0', display:'inline-block', paddingBottom:'5px' }}>
        DN1 Female Dining
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        {/* FLOOR SECTION */}
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#558b2f', background:'#f1f8e9', padding:'6px', borderRadius:'6px' }}>FLOOR (5-30)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {floorRows.flat().map(n => renderCell(n, 'Floor'))}
            </div>
        </div>

        {/* CHAIR SECTION */}
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#ad1457', background:'#fce4ec', padding:'6px', borderRadius:'6px' }}>CHAIRS (1-6, 31-42)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {chairRows.flat().map(n => renderCell(n, 'Chair'))}
            </div>
        </div>
      </div>
    </div>
  );
}
