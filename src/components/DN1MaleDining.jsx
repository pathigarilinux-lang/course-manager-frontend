import React from 'react';

export default function DN1MaleDining({ occupiedMap, selected, onSelect }) {
  // CONFIGURATION: ROWS OF 6
  // CHAIR: 1-6 (Row 1), 31-36 (Row 2), 37-42 (Row 3)
  const chairRows = [
    [1, 2, 3, 4, 5, 6],
    [31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42]
  ];

  // FLOOR: 5-30 (Broken into rows of 6)
  const floorRows = [
    [5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28],
    [29, 30] 
  ];

  const renderCell = (num, type) => {
      const numStr = String(num);
      // SAFETY CHECK: Ensure occupiedMap exists before calling .has()
      const isOccupied = occupiedMap && occupiedMap.has(numStr);
      const isSelected = String(selected) === numStr;
      
      let bg = 'white';
      let color = '#333';
      let border = '1px solid #ccc';
      let cursor = 'pointer';

      if (isOccupied) {
          bg = '#ffebee'; color = '#c62828'; border = '1px solid #ffcdd2'; cursor = 'not-allowed';
      } else if (isSelected) {
          bg = '#2196f3'; color = 'white'; border = '1px solid #1976d2';
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
    <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa' }}>
      <h3 style={{ color: '#1565c0', margin: '0 0 20px 0', borderBottom:'2px solid #e3f2fd', display:'inline-block', paddingBottom:'5px' }}>
        DN1 Male Dining
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        {/* FLOOR SECTION */}
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#2e7d32', background:'#e8f5e9', padding:'6px', borderRadius:'6px' }}>FLOOR (5-30)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {floorRows.flat().map(n => renderCell(n, 'Floor'))}
            </div>
        </div>

        {/* CHAIR SECTION */}
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#1565c0', background:'#e3f2fd', padding:'6px', borderRadius:'6px' }}>CHAIRS (1-6, 31-42)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                {chairRows.flat().map(n => renderCell(n, 'Chair'))}
            </div>
        </div>
      </div>
    </div>
  );
}
