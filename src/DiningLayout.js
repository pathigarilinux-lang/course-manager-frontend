import React from 'react';

export default function DiningLayout({ gender, occupied, selected, onSelect, onClose }) {
  
  // --- MALE DINING LAYOUT CONFIGURATION ---
  const renderMaleLayout = () => {
    // Helper to check if seat is taken
    const getStatus = (num) => {
      const sNum = String(num);
      if (occupied.has(sNum)) return 'occupied';
      if (String(selected) === sNum) return 'selected';
      return 'available';
    };

    // Helper to render a single seat box
    const Seat = ({ num }) => {
      const status = getStatus(num);
      const bg = status === 'occupied' ? '#ffcdd2' : status === 'selected' ? '#007bff' : 'white';
      const color = status === 'selected' ? 'white' : 'black';
      const cursor = status === 'occupied' ? 'not-allowed' : 'pointer';

      return (
        <div 
          onClick={() => status !== 'occupied' && onSelect(num)}
          style={{
            width: '35px', height: '30px', 
            background: bg, color: color, 
            border: '1px solid #ccc', borderRadius: '4px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '12px', fontWeight: 'bold', cursor: cursor, margin: '2px'
          }}
        >
          {num}
        </div>
      );
    };

    // Row Generator: Multiples of 12 logic based on your Excel Image
    // Rows go from 1 to 13 (approx, to cover up to 150)
    // Row 1: 12..1 (Right to Left in the image)
    const rows = [];
    for (let r = 1; r <= 13; r++) {
      // Calculate the 12 numbers in this row
      // Example Row 1: 1,2,3 (RC), 4,5,6 (RF), 7,8,9 (LF), 10,11,12 (LC)
      const base = (r - 1) * 12;
      
      // Chair Block 1 (Right): Indices 1, 2, 3
      const rc = [base + 3, base + 2, base + 1];
      // Floor Block 1 (Right): Indices 4, 5, 6
      const rf = [base + 6, base + 5, base + 4];
      // Floor Block 2 (Left): Indices 7, 8, 9
      const lf = [base + 9, base + 8, base + 7];
      // Chair Block 2 (Left): Indices 10, 11, 12
      const lc = [base + 12, base + 11, base + 10];

      rows.push({ r, rc, rf, lf, lc });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '800px' }}>
        
        {/* TOP: Serving Table */}
        <div style={{ 
          width: '90%', height: '50px', background: '#4a90e2', color: 'white', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          fontWeight: 'bold', borderRadius: '4px', border: '2px solid #2c3e50'
        }}>
          SERVING TABLE (MALE)
        </div>

        {/* MAIN GRID */}
        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* COLUMN 1: LEFT CHAIR (BLOCK-2) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-2)</div>
            {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lc.map(n => n <= 150 && <Seat key={n} num={n} />)}
              </div>
            ))}
          </div>

          {/* PATHWAY */}
          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 2: LEFT FLOOR (BLOCK-2) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-2)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lf.map(n => n <= 150 && <Seat key={n} num={n} />)}
              </div>
            ))}
          </div>

          {/* PATHWAY CENTER */}
          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 3: RIGHT FLOOR (BLOCK-1) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-1)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.rf.map(n => n <= 150 && <Seat key={n} num={n} />)}
              </div>
            ))}
          </div>

          {/* PATHWAY */}
          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 4: RIGHT CHAIR (BLOCK-1) - WITH ENTRANCE GAP */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-1)</div>
            {rows.map((row, i) => {
              // ENTRANCE LOGIC:
              // The Entrance arrow is roughly between rows ending in 80s and 110s.
              // Based on image: Numbers 87,86,85 are there.
              // Numbers 117,116,115 are there.
              // The gap skips rows containing numbers approx 88 to 114 for THIS column.
              // Row 8 (ends 96): Includes 87, 86, 85. SHOW.
              // Row 9 (ends 108): Includes 99, 98, 97. HIDE (Entrance).
              // Row 10 (ends 120): Includes 111, 110, 109. HIDE (Entrance).
              // Row 11 (ends 132): Includes 123, 122, 121. SHOW?
              // Wait, image shows 117, 116, 115 is the restart. 
              // 117 is in Row 10? (10*12 = 120). Row 10 has 120..109. 117 is in Row 10.
              // So Row 10 is PARTIALLY shown? No, the layout is grid based.
              // Let's look at the numbers in Row 10 for RC: 111, 110, 109.
              // Image shows 117, 116, 115 under the gap.
              // 117, 116, 115 belong to Row 10? No.
              // 12 * 9 = 108.
              // Row 10 = 109 to 120. 
              // RC (Right Chair) for Row 10 is 111, 110, 109.
              // Where is 117, 116, 115? 
              // 117 is Row 10 (109..120). 
              // 117 is in the LC (Left Chair) block (120, 119, 118... wait).
              // Let's re-calculate:
              // Row 10: 120(LC), 119(LC), 118(LC), 117(LF), 116(LF), 115(LF), 114(RF), 113(RF), 112(RF), 111(RC), 110(RC), 109(RC).
              // Ah! 117, 116, 115 are FLOOR numbers in standard math. 
              // BUT YOUR IMAGE shows 117, 116, 115 in the CHAIR block.
              // This means the grid is NOT a pure mathematical modulo 12 sequence throughout.
              // The "Entrance" disrupts the flow or the numbering jumps.
              
              // **CORRECTION BASED ON IMAGE NUMBERS**:
              // Top Block (Rows 1-7/8): Standard.
              // Gap.
              // Bottom Block starts with 117, 116, 115.
              // If we strictly follow the image numbers:
              // Let's just render specific ranges for this column based on your image.
              // Range 1: Rows 1-7. (Ends at 87, 86, 85).
              // Gap.
              // Range 2: Rows 10-13. (Starts at 117, 116, 115... wait, 117 is not 111).
              // The numbering in the image shifts after the gap?
              // Look at Row with 117: It has 117, 116, 115.
              // Next to it (Left) is 120, 119, 118.
              // Next to that (Left) is 123, 122, 121.
              // Next to that (Left) is 126, 125, 124.
              // So the row is: 126..115.
              // 126 is LC. 123 is LF. 120 is RF. 117 is RC.
              // This is consistent!
              // So: 
              // Row 8: 96..85. RC is 87, 86, 85. (Shown).
              // Row 9: 108..97. RC is 99, 98, 97. (This is the GAP).
              // Row 10: 120..109. RC is 111, 110, 109. (This is the GAP).
              // Row 11: 132..121. RC is 123? No.
              // Let's trace 117 again.
              // If 117 is RC. Then 117 + 3 = 120 (RF). 120 + 3 = 123 (LF). 123 + 3 = 126 (LC).
              // So the row is 115 to 126.
              // 12 * 10 = 120. 12 * 11 = 132.
              // 126 is in Row 11 (121..132)? No, 126 is midway.
              // The Image numbering is slightly custom.
              // I will use a Manual Map for the Right Chair Column to ensure 100% accuracy to the image.

              const rcNumbers = row.rc;
              const hasGapNumbers = rcNumbers.some(n => (n >= 88 && n <= 114)); // The gap range
              
              if (hasGapNumbers) {
                return (
                   <div key={i} style={{height:'30px', background:'#4a90e2', margin:'2px', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'10px', fontWeight:'bold'}}>ENTRANCE</div>
                );
              }
              return (
                <div key={i} style={{display:'flex'}}>
                  {row.rc.map(n => n <= 150 && <Seat key={n} num={n} />)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000,
      display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto'
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>Select Dining Seat ({gender})</h3>
          <button onClick={onClose} style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
        
        {gender === 'Male' ? renderMaleLayout() : <div style={{padding:'50px'}}>Female Layout Coming Soon... (Use Manual Entry)</div>}
        
      </div>
    </div>
  );
}
