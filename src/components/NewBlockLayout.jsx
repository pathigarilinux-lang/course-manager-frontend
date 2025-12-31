import React from 'react';
import { BedDouble, Users } from 'lucide-react';

const getTagStyle = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t === '10D') return { bg: '#e3f2fd', color: '#0d47a1', border: '1px solid #2196f3' };
    if (t === 'SAT') return { bg: '#fff3e0', color: '#e65100', border: '1px solid #ff9800' };
    return { bg: '#eeeeee', color: '#424242', border: '1px solid #9e9e9e' };
};

const getCourseTag = (courseName) => {
    if (!courseName) return '';
    const match = courseName.match(/(\d+)/);
    return match ? `${match[1]}D` : courseName.substring(0, 3).toUpperCase();
};

export default function NewBlockLayout({ rooms, occupancy, onRoomClick }) {

    // --- HELPER: Find Occupant by RoomNo (Exact Match) ---
    const getOccupant = (id) => occupancy.find(p => p.room_no === id);

    // --- HELPER: Stats ---
    const getStats = (prefix, total) => {
        const count = occupancy.filter(p => p.room_no && p.room_no.startsWith(prefix)).length;
        return { text: `${count}/${total}`, isFull: count === total };
    };

    // --- COMPONENT: 6-Bed Dorm Box ---
    const DormBox = ({ num }) => {
        const base = `Dormitory-${num}`;
        const suffixes = ['A', 'B', 'C', 'D', 'E', 'F']; // Matches DB Suffixes

        return (
            <div style={{border: '1px solid #999', borderRadius: '8px', overflow:'hidden', background:'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                <div style={{background:'#3f51b5', color:'white', padding:'4px 8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontWeight:'bold', fontSize:'13px'}}>Dorm {num}</span>
                    <span style={{fontSize:'10px', background:'rgba(255,255,255,0.2)', padding:'1px 5px', borderRadius:'4px'}}>6-BED</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1px', background:'#ccc', padding:'1px'}}> 
                    {suffixes.map((suffix) => {
                        const bedId = `${base}${suffix}`; // e.g., Dormitory-21A
                        const p = getOccupant(bedId);
                        const isOcc = !!p;
                        
                        let bg = isOcc ? '#e8f5e9' : 'white';
                        let badgeText = isOcc && (p.conf_no || '').startsWith('O') ? 'O' : 'N';
                        let badgeColor = badgeText === 'O' ? '#007bff' : '#ffc107';
                        const courseTag = isOcc ? getCourseTag(p.course_name) : '';
                        const tagStyle = getTagStyle(courseTag);

                        return (
                            <div key={bedId} onClick={() => onRoomClick({ room_no: bedId, occupant: p })}
                                 style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative', border:'1px solid #f0f0f0' }}>
                                {isOcc ? (
                                    <div style={{textAlign:'center', lineHeight:'1.1'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name.split(' ')[0]}</div>
                                        {courseTag && <span style={{fontSize:'8px', background:tagStyle.bg, color:tagStyle.color, border:tagStyle.border, padding:'0 2px', borderRadius:'3px'}}>{courseTag}</span>}
                                    </div>
                                ) : (
                                    <div style={{textAlign:'center'}}>
                                        <div style={{fontSize:'10px', color:'#777', fontWeight:'bold'}}>{suffix}</div>
                                        <div style={{fontSize:'12px', color:'#eee'}}>🛏️</div>
                                    </div>
                                )}
                                {isOcc && <div style={{position:'absolute', top:'2px', right:'2px', width:'12px', height:'12px', borderRadius:'50%', background:badgeColor, color:badgeText==='N'?'black':'white', fontSize:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>{badgeText}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- COMPONENT: 2-Bed Room Box ---
    const RoomBox = ({ char }) => {
        const base = `Room-${char}`;
        const suffixes = ['A', 'B']; // Matches Room-AA, Room-AB

        return (
            <div style={{border: '1px solid #999', borderRadius: '6px', overflow:'hidden', background:'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                <div style={{background:'#5d4037', color:'white', padding:'2px 5px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontWeight:'900', fontSize:'13px'}}>Room {char}</span>
                    <span style={{fontSize:'9px', color:'#d7ccc8'}}>2-BED</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {suffixes.map((suffix) => {
                        const bedId = `${base}${suffix}`; // e.g., Room-AA
                        const p = getOccupant(bedId);
                        const isOcc = !!p;
                        
                        let bg = isOcc ? '#fff3e0' : 'white';
                        let badgeText = isOcc && (p.conf_no || '').startsWith('O') ? 'O' : 'N';
                        let badgeColor = badgeText === 'O' ? '#007bff' : '#ffc107';

                        return (
                            <div key={bedId} onClick={() => onRoomClick({ room_no: bedId, occupant: p })}
                                 style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative' }}>
                                {isOcc ? (
                                    <div style={{textAlign:'center'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name.split(' ')[0]}</div>
                                    </div>
                                ) : <div style={{fontSize:'10px', color:'#ccc', textAlign:'center', fontWeight:'bold'}}>{suffix}</div>}
                                {isOcc && <div style={{position:'absolute', top:'2px', right:'2px', width:'14px', height:'14px', borderRadius:'50%', background:badgeColor, color:badgeText==='N'?'black':'white', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center'}}>{badgeText}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const dormStats = getStats('Dormitory', 48);
    const roomStats = getStats('Room', 6);

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            <div style={{border:'2px solid #3f51b5', borderRadius:'10px', padding:'15px', background: '#f5f5f5'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <h3 style={{margin:0, color:'#3f51b5', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}><Users size={18}/> DORMITORY BLOCK</h3>
                    <span style={{fontSize:'12px', fontWeight:'bold', background:'#3f51b5', color:'white', padding:'2px 8px', borderRadius:'12px'}}>{dormStats.text}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px'}}>
                    {Array.from({length: 8}, (_, i) => 21 + i).map(num => <DormBox key={num} num={num} />)}
                </div>
            </div>

            <div style={{border:'2px solid #5d4037', borderRadius:'10px', padding:'15px', background: '#fff'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <h3 style={{margin:0, color:'#5d4037', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}><BedDouble size={18}/> INDIVIDUAL ROOMS</h3>
                    <span style={{fontSize:'12px', fontWeight:'bold', background:'#5d4037', color:'white', padding:'2px 8px', borderRadius:'12px'}}>{roomStats.text}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'15px'}}>
                    {['A', 'B', 'C'].map(char => <RoomBox key={char} char={char} />)}
                </div>
            </div>
        </div>
    );
}
