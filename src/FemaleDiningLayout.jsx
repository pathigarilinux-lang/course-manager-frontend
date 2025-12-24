import React from 'react';

export default function FemaleDiningLayout({ occupied, occupiedData, selected, onSelect, onClose }) {
  const leftChairRows = [[12, 11, 10], [24, 23, 22], [36, 35, 34], [48, 47, 46], [60, 59, 58], [72, 71, 70], [84, 83, 82], [96, 95, 94]];
  const centerFloorLeftRows = [[9, 8], [21, 20], [33, 32], [45, 44], [57, 56], [69, 68], [81, 80], [93, 92]];
  const centerFloorRightRows = [[7, 6, 5, 4], [19, 18, 17, 16], [31, 30, 29, 28], [43, 42, 41, 40], [55, 54, 53, 52], [67, 66, 65, 64], [79, 78, 77, 76], [91, 90, 89, 88]];
  const rightChairRows = [[3, 2, 1], [15, 14, 13], [27, 26, 25], [39, 38, 37], [51, 50, 49], [63, 62, 61], [75, 74, 73], [87, 86, 85], [99, 98, 97], [102, 101, 100], [105, 104, 103], [108, 107, 106], [111, 110, 109], [114, 113, 112]];

  const renderCell = (num, type) => {
    const sNum = String(num); 
    const isOcc = occupied.has(sNum); 
    const occupantCat = occupiedData ? occupiedData[sNum] : null; // 'O' or 'N'
    const isSel = String(selected) === sNum;
    
    // Style Logic
    let bg = 'white';
    let border = '1px solid #ccc';
    let color = '#333';

    if (isSel) {
        bg = '#e91e63'; color = 'white'; border = '1px solid #c2185b';
    } else if (isOcc) {
        if (occupantCat === 'O') { bg = '#e3f2fd'; border = '1px solid #90caf9'; color = '#0d47a1'; }
        else if (occupantCat === 'N') { bg = '#fff3cd'; border = '1px solid #ffeeba'; color = '#856404'; }
        else { bg = '#ffebee'; color = '#aaa'; } 
    } else if (type === 'Floor') {
        bg = '#fff9c4';
    }

    return (<button key={num} onClick={() => !isOcc && onSelect(sNum, type)} disabled={isOcc} style={{ width: '100%', height: '35px', margin: '2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border: border, borderRadius: '4px', cursor: isOcc ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px', color }}>{isOcc && occupantCat ? occupantCat : num}</button>);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', width: '95%', maxWidth: '1100px', maxHeight: '95vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><h2 style={{ margin: 0, color: '#e91e63' }}>FEMALE DINING SEAT LAYOUT</h2><button onClick={onClose} style={{ background: '#333', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor:'pointer' }}>Close</button></div>
        {/* LEGEND */}
        <div style={{ display: 'flex', gap: '15px', fontSize: '12px', marginBottom: '15px', justifyContent:'center', background:'#f8f9fa', padding:'10px', borderRadius:'6px' }}>
          <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:'15px', height:'15px', background:'#e3f2fd', border:'1px solid #90caf9', color:'#0d47a1', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>O</div> Old</div>
          <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:'15px', height:'15px', background:'#fff3cd', border:'1px solid #ffeeba', color:'#856404', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>N</div> New</div>
          <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:'15px', height:'15px', background:'#fff9c4', border:'1px solid #ccc'}}></div> Floor</div>
        </div>
        <div style={{ background: '#f06292', color: 'white', textAlign: 'center', padding: '10px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '15px' }}>SERVING TABLE</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <div style={{ width: '200px' }}><div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>CHAIR BLOCK-2</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>{leftChairRows.flat().map(n => renderCell(n, 'Chair'))}</div><div style={{ marginTop: '20px', background: '#880e4f', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}>ENTRANCE ➡</div></div>
          <div style={{ width: '30px', background: '#4a90e2', color:'white', writingMode: 'vertical-rl', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '4px' }}>PATHWAY</div>
          <div style={{ width: '120px' }}><div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>FLOOR 2</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>{centerFloorLeftRows.flat().map(n => renderCell(n, 'Floor'))}</div></div>
          <div style={{ width: '240px' }}><div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>FLOOR 1</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2px' }}>{centerFloorRightRows.flat().map(n => renderCell(n, 'Floor'))}</div></div>
          <div style={{ width: '30px', background: '#4a90e2', color:'white', writingMode: 'vertical-rl', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '4px' }}>PATHWAY</div>
          <div style={{ width: '200px' }}><div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '5px' }}>CHAIR BLOCK-1</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px' }}>{rightChairRows.flat().map(n => renderCell(n, 'Chair'))}</div></div>
        </div>
      </div>
    </div>
  );
}
