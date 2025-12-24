import React from 'react';
import { AlertCircle } from 'lucide-react'; // Added icon for medical rooms

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
  
  // --- CONFIGURATION: MALE RESIDENCE BLOCKS ---
  const BLOCKS = [
    {
      id: 'block-a',
      name: 'BLOCK A (Rooms 101-110)',
      rooms: Array.from({ length: 10 }, (_, i) => ({ id: `10${i}`, label: `10${i}`, capacity: 2 }))
    },
    {
      id: 'block-b',
      name: 'BLOCK B (Rooms 201-220)',
      rooms: Array.from({ length: 20 }, (_, i) => ({ 
          id: `2${i < 9 ? '0' + (i+1) : i+1}`, 
          label: `2${i < 9 ? '0' + (i+1) : i+1}`, 
          capacity: 3 
      }))
    },
    {
      id: 'block-c',
      name: 'CELL BLOCK (Rooms 301-365)',
      rooms: [
          ...Array.from({ length: 60 }, (_, i) => ({ id: `3${i < 9 ? '0' + (i+1) : i+1}`, label: `3${i < 9 ? '0' + (i+1) : i+1}`, capacity: 1 })),
          // Specific Overrides for 360 series
          { id: '361', label: '361', capacity: 2 },
          { id: '362', label: '362', capacity: 2 },
          { id: '363', label: '363', capacity: 2 }, 
          { id: '364', label: '364', capacity: 2 },
          { id: '365', label: '365', capacity: 2 },
      ]
    }
  ];

  // --- RENDER HELPERS ---
  const getOccupants = (roomNo) => occupancy.filter(p => p.room_no === roomNo);

  const renderBed = (roomNo, bedIndex, capacity) => {
    const occupants = getOccupants(roomNo);
    const occupant = occupants[bedIndex]; 
    const isOcc = !!occupant;
    
    // Status Logic
    let bg = '#f8f9fa'; 
    let border = '1px solid #ddd';
    let content = null;
    let title = 'Empty Bed';

    if (isOcc) {
        // Determine Category
        const conf = (occupant.conf_no || '').toUpperCase();
        const isOld = conf.startsWith('O') || conf.startsWith('S');
        const courseName = occupant.course_name ? occupant.course_name.split('/')[0] : '';

        // Colors
        if (isOld) { bg = '#e3f2fd'; border = '1px solid #90caf9'; } // Blue for Old
        else { bg = '#fff3cd'; border = '1px solid #ffeeba'; } // Yellow for New

        // Badge Content
        content = (
            <div style={{textAlign:'center'}}>
                <div style={{fontWeight:'bold', fontSize:'10px', color: isOld ? '#0d47a1' : '#856404'}}>
                    {isOld ? 'O' : 'N'}
                </div>
                <div style={{fontSize:'8px', color:'#666', marginTop:'-2px'}}>{occupant.age}</div>
            </div>
        );
        title = `${occupant.full_name} (${isOld ? 'Old' : 'New'})\n${courseName}`;
    }

    return (
        <div 
            key={`${roomNo}-${bedIndex}`}
            title={title}
            style={{
                width: '30px', height: '30px', 
                background: bg, border: border, borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '1px', cursor: isOcc ? 'pointer' : 'default'
            }}
        >
            {content}
        </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {BLOCKS.map(block => (
        <div key={block.id} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '20px', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#007bff', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
            {block.name}
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
            {block.rooms.map(room => {
              const occupants = getOccupants(room.label);
              const isFull = occupants.length >= room.capacity;
              
              // ✅ LOGIC: Identify Medical Rooms (321-328)
              const roomNum = parseInt(room.label);
              const isMedical = roomNum >= 321 && roomNum <= 328;

              return (
                <div 
                    key={room.id} 
                    onClick={() => onRoomClick({ room_no: room.label, gender_type: 'Male', capacity: room.capacity })}
                    title={isMedical ? "Reserved for Medical / Senior Citizen" : ""}
                    style={{ 
                        border: isFull ? '1px solid #b3e5fc' : (isMedical ? '1px solid #ffcc80' : '1px solid #eee'), // Orange border for medical
                        borderRadius: '8px', padding: '10px', 
                        background: isFull ? '#e1f5fe' : (isMedical ? '#fff8e1' : 'white'), // Light yellow bg for medical
                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                        ':hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }
                    }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                        {room.label}
                        {/* ✅ VISUAL TAG FOR MEDICAL */}
                        {isMedical && <AlertCircle size={12} color="#f57c00" />} 
                    </div>
                    <span style={{ fontSize: '10px', background: '#eee', padding: '1px 5px', borderRadius: '4px' }}>{occupants.length}/{room.capacity}</span>
                  </div>
                  
                  {/* Bed Grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {Array.from({ length: room.capacity }).map((_, i) => renderBed(room.label, i, room.capacity))}
                  </div>
                  
                  {/* ✅ TEXT LABEL FOR MEDICAL */}
                  {isMedical && (
                      <div style={{
                          fontSize:'9px', color:'#e65100', marginTop:'4px', 
                          textAlign:'center', fontWeight:'bold', background:'rgba(255,167,38,0.1)', 
                          borderRadius:'4px', padding:'2px'
                      }}>
                          MED / SR
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
