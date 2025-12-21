import React from 'react';

export default function DiningLayout({ gender, occupied, selected, onSelect, onClose }) {
  
  // ==============================================================================
  // 1. MALE DINING LAYOUT (Original - Untouched)
  // ==============================================================================
  const renderMaleLayout = () => {
    const getStatus = (num) => {
      const sNum = String(num);
      if (occupied.has(sNum)) return 'occupied';
      if (String(selected) === sNum) return 'selected';
      return 'available';
    };

    const Seat = ({ num, type }) => {
      const status = getStatus(num);
      const bg = status === 'occupied' ? '#ffcdd2' : status === 'selected' ? '#007bff' : 'white';
      const color = status === 'selected' ? 'white' : 'black';
      const cursor = status === 'occupied' ? 'not-allowed' : 'pointer';

      return (
        <div 
          onClick={() => status !== 'occupied' && onSelect(num, type)}
          style={{
            width: '35px', height: '30px', 
            background: bg, color: color, 
            border: '1px solid #ccc', borderRadius: '4px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '12px', fontWeight: 'bold', cursor: cursor, margin: '2px'
          }}
          title={`${type} Seat ${num}`}
        >
          {num}
        </div>
      );
    };

    const rows = [];
    for (let r = 1; r <= 13; r++) {
      const base = (r - 1) * 12;
      const rc = [base + 3, base + 2, base + 1];
      const rf = [base + 6, base + 5, base + 4];
      const lf = [base + 9, base + 8, base + 7];
      const lc = [base + 12, base + 11, base + 10];
      rows.push({ r, rc, rf, lf, lc });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '800px' }}>
        <div style={{ width: '90%', height: '50px', background: '#4a90e2', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', borderRadius: '4px', border: '2px solid #2c3e50' }}>
          SERVING TABLE (MALE)
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          
          {/* COLUMN 1: LEFT CHAIR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-2)</div>
            {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lc.map(n => n <= 150 && <Seat key={n} num={n} type="Chair" />)}
              </div>
            ))}
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 2: LEFT FLOOR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-2)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lf.map(n => n <= 150 && <Seat key={n} num={n} type="Floor" />)}
              </div>
            ))}
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 3: RIGHT FLOOR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-1)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.rf.map(n => n <= 150 && <Seat key={n} num={n} type="Floor" />)}
              </div>
            ))}
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 4: RIGHT CHAIR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-1)</div>
            {rows.map((row, i) => {
              const rcNumbers = row.rc;
              const hasGapNumbers = rcNumbers.some(n => (n >= 88 && n <= 114));
              
              if (hasGapNumbers) {
                return <div key={i} style={{height:'30px', background:'#4a90e2', margin:'2px', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'10px', fontWeight:'bold'}}>ENTRANCE</div>;
              }
              return (
                <div key={i} style={{display:'flex'}}>
                  {row.rc.map(n => n <= 150 && <Seat key={n} num={n} type="Chair" />)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ==============================================================================
  // 2. FEMALE DINING LAYOUT (Strictly Separated - Based on Diagram)
  // Grid: 3 (Chair) | 2 (Floor) | 4 (Floor) | 3 (Chair)
  // ==============================================================================
  const renderFemaleLayout = () => {
    const getStatus = (num) => {
      const sNum = String(num);
      if (occupied.has(sNum)) return 'occupied';
      if (String(selected) === sNum) return 'selected';
      return 'available';
    };

    // Re-defining Seat here to ensure NO shared logic dependency
    const Seat = ({ num, type }) => {
      const status = getStatus(num);
      const bg = status === 'occupied' ? '#ffcdd2' : status === 'selected' ? '#007bff' : 'white';
      const color = status === 'selected' ? 'white' : 'black';
      const cursor = status === 'occupied' ? 'not-allowed' : 'pointer';

      return (
        <div 
          onClick={() => status !== 'occupied' && onSelect(num, type)}
          style={{
            width: '35px', height: '30px', 
            background: bg, color: color, 
            border: '1px solid #ccc', borderRadius: '4px',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '12px', fontWeight: 'bold', cursor: cursor, margin: '2px'
          }}
          title={`${type} Seat ${num}`}
        >
          {num}
        </div>
      );
    };

    const rows = [];
    // Generating rows. 200 seats / 12 = ~17 rows.
    for (let r = 1; r <= 17; r++) {
      const base = (r - 1) * 12;
      // FEMALE MAPPING (3 | 2 | 4 | 3)
      const rc = [base + 3, base + 2, base + 1];          // Chair Block-1 (3 seats)
      const rf = [base + 7, base + 6, base + 5, base + 4]; // Floor Block-1 (4 seats)
      const lf = [base + 9, base + 8];                     // Floor Block-2 (2 seats)
      const lc = [base + 12, base + 11, base + 10];        // Chair Block-2 (3 seats)
      rows.push({ r, rc, rf, lf, lc });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '850px' }}>
        
        {/* FEMALE HEADER (Orange Box + Blue Box) */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%'}}>
            <div style={{ background: '#f39c12', color: 'white', padding: '5px 20px', fontWeight: 'bold', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', border: '2px solid #e67e22', borderBottom: 'none' }}>
                FEMALE DINING SEAT LAYOUT
            </div>
            <div style={{ width: '100%', height: '50px', background: '#4a90e2', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', borderRadius: '4px', border: '2px solid #2c3e50' }}>
                SERVING TABLE
            </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          
          {/* COLUMN 1: LEFT CHAIR (BLOCK-2) [3 seats] + ENTRANCE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-2)</div>
            {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lc.map(n => n <= 200 && <Seat key={n} num={n} type="Chair" />)}
              </div>
            ))}
            {/* Visual Entrance Arrow for Female Side (Left) */}
            <div style={{marginTop: '10px', background:'#4a90e2', padding: '5px 10px', color:'white', fontWeight:'bold', borderRadius:'4px', display:'flex', alignItems:'center'}}>
               ENTRANCE ➜
            </div>
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 2: LEFT FLOOR (BLOCK-2) [2 seats] */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-2)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.lf.map(n => n <= 200 && <Seat key={n} num={n} type="Floor" />)}
              </div>
            ))}
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 3: RIGHT FLOOR (BLOCK-1) [4 seats] */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{fontWeight:'bold', marginBottom:'5px', color:'#27ae60'}}>FLOOR (BLK-1)</div>
             {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.rf.map(n => n <= 200 && <Seat key={n} num={n} type="Floor" />)}
              </div>
            ))}
          </div>

          <div style={{ width: '40px', background: '#b0bec5', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontWeight: 'bold', color: 'white', borderRadius: '4px' }}>PATHWAY</div>

          {/* COLUMN 4: RIGHT CHAIR (BLOCK-1) [3 seats] */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{fontWeight:'bold', marginBottom:'5px', color:'#d35400'}}>CHAIR (BLK-1)</div>
            {rows.map((row, i) => (
              <div key={i} style={{display:'flex'}}>
                {row.rc.map(n => n <= 200 && <Seat key={n} num={n} type="Chair" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3>Select Dining Seat ({gender})</h3>
          <button onClick={onClose} style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
        {/* STRICT SEPARATION OF RENDER LOGIC */}
        {gender === 'Male' ? renderMaleLayout() : renderFemaleLayout()}
      </div>
    </div>
  );
}
