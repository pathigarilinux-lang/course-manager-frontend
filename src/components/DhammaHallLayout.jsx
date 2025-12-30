import React, { useState } from 'react';
import { X, Armchair, Info } from 'lucide-react';

export default function DhammaHallLayout({ 
  participants = [], 
  maleCols = [],   
  femaleCols = [], 
  rows = 10,
  onSeatClick, 
  onClose 
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // --- SAFETY CHECK ---
  if (!maleCols.length || !femaleCols.length) {
      return null; 
  }

  // --- DATA PREPARATION ---
  const getStudentAtSeat = (seatId, sideGender) => {
    return participants.find(p => 
      p.status === 'Attending' && 
      p.dhamma_hall_seat_no === seatId && 
      (p.gender || '').toLowerCase().startsWith(sideGender.toLowerCase().charAt(0))
    );
  };

  const getCategory = (conf) => {
    if (!conf) return 'N';
    const s = conf.toUpperCase();
    return (s.startsWith('O') || s.startsWith('S')) ? 'O' : 'N';
  };

  const Seat = ({ id, sideGender }) => {
    const student = getStudentAtSeat(id, sideGender);
    const isOccupied = !!student;
    const category = student ? getCategory(student.conf_no) : null;
    const isChowky = id.startsWith('CW'); // ✅ 3. Identify Chowky
    
    // Theme Colors
    const isFemaleSide = sideGender === 'Female';
    const baseColor = isFemaleSide ? '#e91e63' : '#007bff'; // Pink vs Blue
    
    let bg = 'white';
    let border = '1px solid #ccc';
    let shadow = 'none';
    let labelColor = '#999';

    if (isOccupied) {
      // ✅ 1. Female Highlight Logic
      if (category === 'O') {
        // Old Student: Darker Shade
        bg = isFemaleSide ? '#fce4ec' : '#e3f2fd'; 
        border = `1px solid ${isFemaleSide ? '#f48fb1' : '#90caf9'}`; 
        labelColor = isFemaleSide ? '#880e4f' : '#0d47a1'; 
      } else {
        // New Student: Lighter Shade / Yellowish mix
        bg = isFemaleSide ? '#fff0f6' : '#fff9c4'; 
        border = `1px solid ${isFemaleSide ? '#f8bbd0' : '#ffe082'}`; 
        labelColor = isFemaleSide ? '#c2185b' : '#856404'; 
      }
      shadow = '0 2px 4px rgba(0,0,0,0.1)';
    }

    // ✅ 3. Chowky Distinct Color (Override background if it's a Chowky)
    if (isChowky) {
        border = `2px solid ${isFemaleSide ? '#d81b60' : '#e65100'}`; // Thicker border
        if (!isOccupied) bg = '#fff8e1'; // Light cream for empty chowky
    }

    return (
      <div 
        onClick={() => onSeatClick && onSeatClick(id, student, sideGender)}
        onMouseEnter={() => setHoveredSeat(student)}
        onMouseLeave={() => setHoveredSeat(null)}
        style={{
          width: '40px',
          height: '40px',
          margin: '3px',
          background: bg,
          border: border,
          borderRadius: isChowky ? '8px' : '4px', // Rounded for Chowky (Chair-like)
          boxShadow: shadow,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'transform 0.1s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ fontSize: '9px', fontWeight: 'bold', color: labelColor }}>
          {id.replace('CW-', '')} {/* Hide CW prefix for cleaner look */}
        </div>
        
        {/* Status Dot */}
        {isOccupied && (
          <div style={{
            width:'6px', height:'6px', borderRadius:'50%', 
            background: category === 'O' ? baseColor : '#ffc107',
            marginTop: '2px'
          }}></div>
        )}
        
        {/* Chowky Indicator Icon (Optional) */}
        {isChowky && !isOccupied && <div style={{fontSize:'8px', color:'#ccc'}}>🪑</div>}
      </div>
    );
  };

  const SeatGrid = ({ title, cols, rowsCount, color, gender }) => {
    const gridRows = [];
    
    // Prepare columns with Visual Gaps
    // ✅ 2. PATHWAY LOGIC (Inject Gaps visually)
    // Male: Gap after 'D' and 'H'. Female: Gap after 'C' and 'F'.
    const renderRowSeats = (r) => {
        return cols.map((c, idx) => {
            if(c === 'GAP') return <div key={`gap-${r}-${idx}`} style={{width:'30px'}}></div>;
            
            const seatComp = <Seat key={`${c}${r}`} id={`${c}${r}`} sideGender={gender} />;
            
            // Inject Margin After Specific Columns
            const isMale = gender === 'Male';
            const colLetter = c.replace('CW-', ''); // Handle CW-A as A
            
            let extraMargin = 0;
            if (isMale && (colLetter === 'D' || colLetter === 'H')) extraMargin = 30;
            if (!isMale && (colLetter === 'C' || colLetter === 'F')) extraMargin = 30;

            if (extraMargin > 0) {
                return <div key={`${c}${r}-wrap`} style={{display:'flex', marginRight:`${extraMargin}px`}}>{seatComp}</div>;
            }
            return seatComp;
        });
    };

    for (let r = rowsCount; r >= 1; r--) {
      gridRows.push(
        <div key={r} style={{ display: 'flex', justifyContent: 'center' }}>{renderRowSeats(r)}</div>
      );
    }

    return (
      <div style={{ padding: '20px', background: `${color}08`, borderRadius: '12px', border: `1px solid ${color}30`, display:'flex', flexDirection:'column', height:'100%', alignItems:'center' }}>
        <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', color: color, textTransform: 'uppercase', fontSize: '12px', letterSpacing:'1px' }}>{title}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex:1, justifyContent:'flex-end' }}>{gridRows}</div>
        
        {/* ✅ 1. TEACHER SEAT (Centered inside the grid container) */}
        <div style={{ 
            marginTop: '30px', 
            border: `2px dashed ${color}`, 
            background: `${color}10`, // Very light tint
            color: color, 
            padding: '15px 30px', 
            borderRadius: '8px', 
            fontWeight: '900', 
            fontSize: '14px', 
            letterSpacing: '1px', 
            minWidth: '180px', 
            textAlign: 'center' 
        }}>
            {gender.toUpperCase()} TEACHER
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(240,242,245,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'white', padding: '15px 30px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div><h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50' }}><Armchair size={24} /> Dhamma Hall Manager</h2></div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#e3f2fd', border: '1px solid #90caf9' }}></div> Old</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#fff9c4', border: '1px solid #ffe082' }}></div> New</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'white', border: '1px solid #ccc' }}></div> Free</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#fff8e1', border: '1px solid #e65100', borderRadius:'4px' }}></div> Chowky</div>
        </div>
        <button onClick={onClose} style={{ background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} color="#333" /></button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '100px', marginBottom: '20px', fontWeight: 'bold', fontSize: '12px', color: '#999', textTransform:'uppercase' }}>
           <div>← Female Entrance</div><div>Male Entrance →</div>
        </div>
        
        {/* Main Hall Layout */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          {/* Female Side */}
          <SeatGrid title="Female Side" cols={femaleCols} rowsCount={rows} color="#e91e63" gender="Female" />
          
          {/* Divider */}
          <div style={{width:'2px', background:'#ddd', alignSelf:'stretch'}}></div>

          {/* Male Side */}
          <SeatGrid title="Male Side" cols={maleCols} rowsCount={rows} color="#007bff" gender="Male" />
        </div>
      </div>

      {/* Footer Info Panel */}
      <div style={{ background: 'white', borderTop: '1px solid #ddd', padding: '15px 30px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hoveredSeat ? (
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', animation: 'slideUp 0.2s' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{hoveredSeat.full_name}</div>
            <div style={{ padding: '4px 10px', background: '#f1f3f5', borderRadius: '6px', fontSize: '13px' }}><strong>ID:</strong> {hoveredSeat.conf_no}</div>
            <div style={{ padding: '4px 10px', background: '#f1f3f5', borderRadius: '6px', fontSize: '13px' }}><strong>Room:</strong> {hoveredSeat.room_no || '-'}</div>
            {hoveredSeat.medical_info && <div style={{ color: 'red', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={16}/> {hoveredSeat.medical_info}</div>}
          </div>
        ) : (<div style={{ color: '#ccc', fontStyle: 'italic' }}>Hover over a seat to view details...</div>)}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
