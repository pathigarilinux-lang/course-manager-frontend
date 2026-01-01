import React, { useMemo } from 'react';

export default function DN1MaleDining({ occupiedData, selected, onSelect }) {
  
  // 1. SAFE DATA PROCESSING
  // Convert raw API data into a simple Set of seat numbers inside the component
  const occupiedSet = useMemo(() => {
      const set = new Set();
      if (Array.isArray(occupiedData)) {
          occupiedData.forEach(item => {
              if (item && item.seat) set.add(String(item.seat));
          });
      }
      return set;
  }, [occupiedData]);

  // 2. LAYOUT CONFIGURATION
  const chairRows = [[1, 2, 3, 4, 5, 6], [31, 32, 33, 34, 35, 36], [37, 38, 39, 40, 41, 42]];
  const floorRows = [[5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16], [17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28], [29, 30]];

  const renderCell = (num, type) => {
      const numStr = String(num);
      const isOccupied = occupiedSet.has(numStr); // Simple lookup
      const isSelected = String(selected) === numStr;
      
      return (
          <div 
              key={`${type}-${num}`}
              onClick={() => !isOccupied && onSelect(numStr, type)}
              style={{
                  width: '40px', height: '40px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isOccupied ? '#ffebee' : (isSelected ? '#2196f3' : 'white'),
                  color: isOccupied ? '#c62828' : (isSelected ? 'white' : '#333'),
                  border: isOccupied ? '1px solid #ffcdd2' : (isSelected ? '1px solid #1976d2' : '1px solid #ccc'),
                  borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                  cursor: isOccupied ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.1s'
              }}
              title={isOccupied ? "Occupied" : `${type} ${num}`}
          >
              {num}
          </div>
      );
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa' }}>
      <h3 style={{ color: '#1565c0', margin: '0 0 20px 0', borderBottom:'2px solid #e3f2fd', display:'inline-block', paddingBottom:'5px' }}>DN1 Male Dining</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#2e7d32', background:'#e8f5e9', padding:'6px', borderRadius:'6px' }}>FLOOR (5-30)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>{floorRows.flat().map(n => renderCell(n, 'Floor'))}</div>
        </div>
        <div style={{background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#1565c0', background:'#e3f2fd', padding:'6px', borderRadius:'6px' }}>CHAIRS (1-6, 31-42)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>{chairRows.flat().map(n => renderCell(n, 'Chair'))}</div>
        </div>
      </div>
    </div>
  );
}
