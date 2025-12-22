import React from 'react';

export default function MaleDiningLayout({ occupied, selected, onSelect, onClose }) {
  
  // --- MALE LAYOUT DATA MAPPING (From Excel Image) ---
  // Rows are defined as arrays of numbers [Left, Center, Right] visually
  
  // LEFT WING (Chair Block-2)
  const leftChairRows = [
    [12, 11, 10], [24, 23, 22], [36, 35, 34], [48, 47, 46], 
    [60, 59, 58], [72, 71, 70], [84, 83, 82], [96, 95, 94],
    [105, 104, 103], [114, 113, 112], [126, 125, 124], 
    [138, 137, 136], [144, 143, 142], [150, 149, 148]
  ];

  // CENTER LEFT (Floor Block-2)
  const centerFloorLeftRows = [
    [9, 8, 7], [21, 20, 19], [33, 32, 31], [45, 44, 43],
    [57, 56, 55], [69, 68, 67], [81, 80, 79], [93, 92, 91],
    [102, 101, 100], [111, 110, 109], [123, 122, 121], [135, 134, 133]
  ];

  // CENTER RIGHT (Floor Block-1)
  const centerFloorRightRows = [
    [6, 5, 4], [18, 17, 16], [30, 29, 28], [42, 41, 40],
    [54, 53, 52], [66, 65, 64], [78, 77, 76], [90, 89, 88],
    [99, 98, 97], [108, 107, 106], [120, 119, 118], [132, 131, 130]
  ];

  // RIGHT WING (Chair Block-1)
  const rightChairRows = [
    [3, 2, 1], [15, 14, 13], [27, 26, 25], [39, 38, 37],
    [51, 50, 49], [63, 62, 61], [75, 74, 73], [87, 86, 85],
    // GAP FOR ENTRANCE
    ['Gap'], 
    ['Gap'], 
    ['Gap'], 
    [117, 116, 115], [129, 128, 127], [141, 140, 139], [147, 146, 145]
  ];

  // --- RENDER HELPER ---
  const renderCell = (num, type) => {
    if (num === 'Gap') return <div style={{ height: '35px' }}></div>; // Empty space for Entrance
    
    const sNum = String(num);
    const isOcc = occupied.has(sNum);
    const isSel = String(selected) === sNum;
    
    // Style Logic
    let bg = 'white';
    let border = '1px solid #ccc';
    let color = '#333';

    if (isOcc) {
      bg = '#ffebee'; color = '#aaa'; border = '1px solid #ffcdd2';
    } else if (isSel) {
      bg = '#007bff'; color = 'white'; border = '2px solid #0056b3';
    } else if (type === 'Floor') {
      bg = '#fff9c4'; // Light Yellow for Floor
    }

    return (
      <button
        key={num}
        onClick={() => !isOcc && onSelect(sNum, type)}
        disabled={isOcc}
        style={{
          width: '100%', height: '35px', margin: '2px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg, border: border, color: color,
          borderRadius: '4px', cursor: isOcc ? 'not-allowed' : 'pointer',
          fontWeight: 'bold', fontSize: '13px'
        }}
      >
        {num}
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', width: '95%', maxWidth: '1100px', maxHeight: '95vh', overflowY: 'auto' }}>
        
        {/* TOP HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, color: '#d35400' }}>MALE DINING SEAT LAYOUT</h2>
          <button onClick={onClose} style={{ background: '#333', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor:'pointer' }}>Close</button>
        </div>

        {/* SERVING TABLE BAR */}
        <div style={{ background: '#4a90e2', color: 'white', textAlign: 'center', padding: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '15px' }}>
          SERVING TABLE
        </div>

        {/* MAIN LAYOUT GRID */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          
          {/* LEFT CHAIR BLOCK */}
          <div style={{ width: '200px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>CHAIR BLOCK-2</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
              {leftChairRows.flat().map(n => renderCell(n, 'Chair'))}
            </div>
            {/* Entrance Box */}
            <div style={{ marginTop: '20px', background: '#2c3e50', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}>
              ENTRANCE ➡
            </div>
          </div>

          {/* PATHWAY */}
          <div style={{ width: '30px', background: '#4a90e2', color:'white', writingMode: 'vertical-rl', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '4px' }}>
            PATHWAY
          </div>

          {/* FLOOR BLOCK LEFT */}
          <div style={{ width: '180px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>FLOOR BLOCK-2</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
              {centerFloorLeftRows.flat().map(n => renderCell(n, 'Floor'))}
            </div>
          </div>

          {/* FLOOR BLOCK RIGHT */}
          <div style={{ width: '180px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>FLOOR BLOCK-1</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
              {centerFloorRightRows.flat().map(n => renderCell(n, 'Floor'))}
            </div>
          </div>

          {/* PATHWAY */}
          <div style={{ width: '30px', background: '#4a90e2', color:'white', writingMode: 'vertical-rl', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '4px' }}>
            PATHWAY
          </div>

          {/* RIGHT CHAIR BLOCK */}
          <div style={{ width: '200px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>CHAIR BLOCK-1</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>
              {rightChairRows.flat().map((n, i) => renderCell(n, 'Chair'))}
            </div>
            <div style={{ marginTop: '55px', background: '#2c3e50', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}>
              ⬅ ENTRANCE
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
