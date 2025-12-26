import React, { useState } from 'react';
import { X, Armchair, Info } from 'lucide-react';

export default function DhammaHallLayout({ 
  participants, 
  maleCols,   
  femaleCols, 
  rows = 10,
  onSeatClick, 
  onClose 
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // --- DATA PREPARATION ---
  const seatMap = {};
  participants.forEach(p => {
    if (p.status === 'Attending' && p.dhamma_hall_seat_no) {
      seatMap[p.dhamma_hall_seat_no] = p;
    }
  });

  const getCategory = (conf) => {
    if (!conf) return 'N';
    const s = conf.toUpperCase();
    return (s.startsWith('O') || s.startsWith('S')) ? 'O' : 'N';
  };

  // --- RENDER A SINGLE SEAT ---
  const Seat = ({ id, sideGender }) => {
    const student = seatMap[id];
    
    // 🛡️ GENDER GUARD: Only show student if their gender matches this side of the hall
    // This prevents "Male A1" from showing up on "Female A1" spot.
    const isOccupied = !!student && (student.gender || '').toLowerCase().startsWith(sideGender.toLowerCase().charAt(0));
    
    const displayStudent = isOccupied ? student : null;
    const category = displayStudent ? getCategory(displayStudent.conf_no) : null;
    const isTeacher = id === 'TEACHER';

    let bg = 'white';
    let border = '1px solid #ccc';
    let shadow = 'none';
    let labelColor = '#999';

    if (isTeacher) {
      bg = '#6f42c1'; border = '2px solid #5a32a3'; labelColor = 'white'; 
    } else if (isOccupied) {
      if (category === 'O') {
        bg = '#e3f2fd'; border = '1px solid #90caf9'; labelColor = '#0d47a1'; 
      } else {
        bg = '#fff9c4'; border = '1px solid #ffe082'; labelColor = '#856404'; 
      }
      shadow = '0 2px 4px rgba(0,0,0,0.1)';
    }

    return (
      <div 
        onClick={() => !isTeacher && onSeatClick(id, displayStudent, sideGender)} // Pass gender context
        onMouseEnter={() => setHoveredSeat(displayStudent)}
        onMouseLeave={() => setHoveredSeat(null)}
        style={{
          width: isTeacher ? '200px' : '40px',
          height: isTeacher ? '60px' : '40px',
          margin: '3px',
          background: bg,
          border: border,
          borderRadius: isTeacher ? '8px' : '4px',
          boxShadow: shadow,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isTeacher ? 'default' : 'pointer',
          position: 'relative',
          transition: 'transform 0.1s',
        }}
        onMouseOver={(e) => { if(!isTeacher) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseOut={(e) => { if(!isTeacher) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <div style={{ fontSize: isTeacher ? '14px' : '10px', fontWeight: 'bold', color: labelColor }}>
          {isTeacher ? 'TEACHER' : id}
        </div>
        {isOccupied && !isTeacher && (
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%', 
            background: category === 'O' ? '#007bff' : '#ffc107',
            marginTop: '2px'
          }}></div>
        )}
      </div>
    );
  };

  // --- RENDER A GRID BLOCK ---
  const SeatGrid = ({ title, cols, rowsCount, color, gender }) => {
    const gridRows = [];
    // Render Row 10 (Back) down to Row 1 (Front/Teacher)
    for (let r = rowsCount; r >= 1; r--) {
      const rowSeats = cols.map((c, idx) => {
          if(c === 'GAP') return <div key={`gap-${r}-${idx}`} style={{width:'30px', writingMode:'vertical-rl', fontSize:'9px', color:'#ccc', display:'flex', alignItems:'center', justifyContent:'center'}}>{r===Math.ceil(rowsCount/2) && "PATHWAY"}</div>;
          return <Seat key={`${c}${r}`} id={`${c}${r}`} sideGender={gender} />;
      });
      gridRows.push(
        <div key={r} style={{ display: 'flex', justifyContent: 'center' }}>
          {rowSeats}
        </div>
      );
    }
    return (
      <div style={{ padding: '20px', background: `${color}08`, borderRadius: '12px', border: `1px solid ${color}30` }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', color: color, textTransform: 'uppercase', fontSize: '12px', letterSpacing:'1px' }}>{title}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{gridRows}</div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(240,242,245,0.95)', zIndex: 2000, 
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* HEADER */}
      <div style={{ background: 'white', padding: '15px 30px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50' }}>
            <Armchair size={24} /> Dhamma Hall Manager
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#e3f2fd', border: '1px solid #90caf9' }}></div> Old</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#fff9c4', border: '1px solid #ffe082' }}></div> New</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'white', border: '1px solid #ccc' }}></div> Free</div>
        </div>
        <button onClick={onClose} style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#333" /></button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* ENTRANCE (AT THE TOP NOW) */}
        <div style={{ display: 'flex', gap: '100px', marginBottom: '20px', fontWeight: 'bold', fontSize: '12px', color: '#999', textTransform:'uppercase' }}>
           <div>← Female Entrance</div>
           <div>Male Entrance →</div>
        </div>

        {/* HALL SPLIT */}
        <div style={{ display: 'flex', gap: '60px', alignItems: 'flex-end' }}>
          {/* FEMALE SIDE (LEFT) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SeatGrid title="Female Side" cols={femaleCols} rowsCount={rows} color="#e91e63" gender="Female" />
          </div>
          {/* MALE SIDE (RIGHT) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SeatGrid title="Male Side" cols={maleCols} rowsCount={rows} color="#007bff" gender="Male" />
          </div>
        </div>

        {/* TEACHER SEAT (AT THE BOTTOM NOW) */}
        <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#999', marginBottom: '5px', textTransform: 'uppercase' }}>Dhamma Seat Platform</div>
          <div style={{ width: '400px', height: '6px', background: '#ccc', marginBottom: '15px', borderRadius: '3px' }}></div>
          <Seat id="TEACHER" />
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: 'white', borderTop: '1px solid #ddd', padding: '15px 30px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hoveredSeat ? (
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', animation: 'slideUp 0.2s' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{hoveredSeat.full_name}</div>
            <div style={{ padding: '4px 10px', background: '#f1f3f5', borderRadius: '6px', fontSize: '13px' }}><strong>ID:</strong> {hoveredSeat.conf_no}</div>
            <div style={{ padding: '4px 10px', background: '#f1f3f5', borderRadius: '6px', fontSize: '13px' }}><strong>Room:</strong> {hoveredSeat.room_no || '-'}</div>
            {hoveredSeat.medical_info && <div style={{ color: 'red', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={16}/> {hoveredSeat.medical_info}</div>}
          </div>
        ) : (
          <div style={{ color: '#ccc', fontStyle: 'italic' }}>Hover over a seat to view details...</div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
