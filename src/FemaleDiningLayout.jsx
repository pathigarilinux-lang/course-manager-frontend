import React from 'react';

export default function FemaleDiningLayout({ occupied, selected, onSelect, onClose }) {
  // CONFIG: Female Dining Hall (e.g., 80 Seats)
  const totalSeats = 80; 
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e91e63', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#e91e63' }}>🍽️ Female Dining Hall</h3>
          <button onClick={onClose} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight:'bold' }}>Close</button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {seats.map(seatNum => {
            const sNum = String(seatNum);
            const isOcc = occupied.has(sNum);
            const isSel = String(selected) === sNum;

            return (
              <button
                key={seatNum}
                type="button"
                onClick={() => !isOcc && onSelect(sNum, 'Chair')} 
                disabled={isOcc}
                style={{
                  padding: '10px', borderRadius: '8px', border: isSel ? '2px solid #e91e63' : '1px solid #ccc',
                  background: isOcc ? '#ffebee' : isSel ? '#e91e63' : 'white',
                  color: isOcc ? '#ccc' : isSel ? 'white' : '#333',
                  fontWeight: 'bold', cursor: isOcc ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {seatNum}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          * Clicking a seat auto-assigns it as "Chair"
        </div>
      </div>
    </div>
  );
}
