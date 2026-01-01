import React from 'react';

export default function DN1MaleDining({ occupiedMap, selected, onSelect, onClose }) {
  
  // --- CONFIGURATION ---
  // MALE CHAIR: 1-6 and 31-42
  const chairRows1 = [[1, 2, 3, 4, 5, 6]];
  const chairRows2 = [
    [31, 32, 33, 34, 35, 36],
    [37, 38, 39, 40, 41, 42]
  ];

  // MALE FLOOR: 5-30
  const floorRows = [
    [5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28],
    [29, 30] 
  ];

  // --- HELPER TO RENDER SEATS ---
  const renderCell = (num, type) => {
      const numStr = String(num);
      const isOccupied = occupiedMap.has(numStr); // Check if seat is taken
      const isSelected = selected === numStr;
      
      let bg = 'white';
      let color = '#333';
      let cursor = 'pointer';
      let border = '1px solid #ccc';

      if (isOccupied) {
          bg = '#ffebee'; // Light Red
          color = '#c62828'; // Dark Red
          cursor = 'not-allowed';
          border = '1px solid #ffcdd2';
      } else if (isSelected) {
          bg = '#2196f3'; // Blue
          color = 'white';
          border = '1px solid #1976d2';
      }

      return (
          <div 
              key={`${type}-${num}`}
              onClick={() => !isOccupied && onSelect(numStr, type)}
              style={{
                  width: '35px', height: '35px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg, color: color, border: border,
                  borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                  cursor: cursor, boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
              title={isOccupied ? "Occupied" : `${type} Seat ${num}`}
          >
              {num}
          </div>
      );
  };

  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <h3 style={{ color: '#0d47a1', marginBottom: '20px' }}>DN1 Male Dining Hall</h3>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* LEFT SECTION: CHAIRS (1-6) */}
        <div>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#555', background:'#e3f2fd', padding:'5px', borderRadius:'4px' }}>CHAIRS (1-6)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {chairRows1.flat().map(n => renderCell(n, 'Chair'))}
            </div>
        </div>

        {/* CENTER SECTION: FLOOR (5-30) */}
        <div>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#555', background:'#e8f5e9', padding:'5px', borderRadius:'4px' }}>FLOOR (5-30)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {floorRows.flat().map(n => renderCell(n, 'Floor'))}
            </div>
        </div>

        {/* RIGHT SECTION: CHAIRS (31-42) */}
        <div>
            <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#555', background:'#e3f2fd', padding:'5px', borderRadius:'4px' }}>CHAIRS (31-42)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                {chairRows2.flat().map(n => renderCell(n, 'Chair'))}
            </div>
        </div>

      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '12px', color: '#666' }}>
        <span style={{ marginRight: '15px' }}>🟦 Selected</span>
        <span style={{ marginRight: '15px' }}>⬜ Available</span>
        <span style={{ color: '#c62828' }}>🟥 Occupied</span>
      </div>
    </div>
  );
}
