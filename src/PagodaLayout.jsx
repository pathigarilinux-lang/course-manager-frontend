import React, { useState, useEffect } from 'react';
import { Grid, RefreshCw, Lock } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function PagodaLayout({ courseId, onAssign }) {
  const [assignments, setAssignments] = useState({}); // CellID -> Student
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Total Cells Configuration (Adjust as per your center)
  const TOTAL_CELLS = 100; 

  // --- DATA SYNC ENGINE ---
  useEffect(() => {
    if (!courseId) return;

    const fetchPagodaData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        else setIsSyncing(true);

        try {
            const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
            const data = await res.json();
            
            if (Array.isArray(data)) {
                const map = {};
                data.forEach(p => {
                    // Only map if they have a cell assigned and are not cancelled
                    if (p.pagoda_cell_no && p.status !== 'Cancelled') {
                        map[p.pagoda_cell_no] = p;
                    }
                });
                setAssignments(map);
            }
        } catch (e) {
            console.error("Pagoda Sync Error:", e);
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    fetchPagodaData();
    
    // ✅ POLL EVERY 5 SECONDS
    const interval = setInterval(() => fetchPagodaData(true), 5000);
    return () => clearInterval(interval);

  }, [courseId]);

  // --- RENDER CELL ---
  const renderCell = (cellId) => {
      const student = assignments[cellId];
      const isOccupied = !!student;

      return (
          <div 
              key={cellId}
              onClick={() => onAssign && onAssign(cellId, student)}
              style={{
                  width: '50px', height: '50px',
                  background: isOccupied ? '#ffebee' : '#e8f5e9',
                  border: isOccupied ? '1px solid #ef5350' : '1px solid #66bb6a',
                  borderRadius: '6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                  fontSize: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title={isOccupied ? `Occupied by: ${student.full_name}` : `Cell ${cellId} Empty`}
          >
              <div style={{fontWeight:'bold', color: isOccupied?'#c62828':'#2e7d32', fontSize:'12px'}}>{cellId}</div>
              
              {isOccupied ? (
                  <div style={{fontSize:'8px', textAlign:'center', overflow:'hidden', whiteSpace:'nowrap', width:'100%', padding:'0 2px'}}>
                      {student.full_name.split(' ')[0]}
                  </div>
              ) : (
                  <div style={{fontSize:'8px', color:'#a5d6a7'}}>Free</div>
              )}
          </div>
      );
  };

  return (
      <div style={styles.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', paddingBottom:'10px', borderBottom:'1px solid #eee'}}>
             <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>🛖 Pagoda Allocation</h3>
             <div style={{textAlign:'right'}}>
                 <div style={{fontSize:'11px', color: isSyncing ? '#ff9800' : '#28a745', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px', justifyContent:'flex-end'}}>
                    {isSyncing ? <RefreshCw size={10} className="spin"/> : <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#28a745'}}></div>}
                    {isSyncing ? 'Syncing...' : 'Live'}
                 </div>
                 <div style={{fontSize:'10px', color:'#666', marginTop:'2px'}}>
                     Occupied: <strong>{Object.keys(assignments).length}</strong> / {TOTAL_CELLS}
                 </div>
             </div>
          </div>

          {loading ? <div style={{textAlign:'center', padding:'30px', color:'#999'}}>Loading Pagoda Map...</div> : (
              <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                  gap: '10px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  padding: '5px'
              }}>
                  {Array.from({ length: TOTAL_CELLS }, (_, i) => renderCell(i + 1))}
              </div>
          )}
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
  );
}
