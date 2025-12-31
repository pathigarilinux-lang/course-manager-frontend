import React from 'react';
import { AlertCircle, BedDouble, Users } from 'lucide-react';

// --- CONFIGURATION & STYLES (Copied from MaleBlockLayout for consistency) ---
const getTagStyle = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t === '10D') return { bg: '#e3f2fd', color: '#0d47a1', border: '1px solid #2196f3' };
    if (t === 'SAT') return { bg: '#fff3e0', color: '#e65100', border: '1px solid #ff9800' };
    if (['20D','30D','45D','60D'].includes(t)) return { bg: '#f3e5f5', color: '#4a148c', border: '1px solid #9c27b0' };
    if (['TSC','STM','SER'].includes(t)) return { bg: '#e8f5e9', color: '#1b5e20', border: '1px solid #4caf50' };
    return { bg: '#eeeeee', color: '#424242', border: '1px solid #9e9e9e' };
};

const getCourseTag = (courseName) => {
    if (!courseName) return '';
    const match = courseName.match(/(\d+)/);
    return match ? `${match[1]}D` : courseName.substring(0, 3).toUpperCase();
};

export default function NewBlockLayout({ rooms, occupancy, onRoomClick }) {

    // --- HELPER: Get Occupants for a Room ---
    // Finds all students assigned to this specific room number
    const getOccupants = (roomNo) => {
        return occupancy.filter(p => p.room_no === roomNo);
    };

    // --- HELPER: Calculate Stats ---
    const getStats = (roomPrefix, count, capacityPerRoom) => {
        const totalBeds = count * capacityPerRoom;
        let occupiedCount = 0;
        
        // Count occupants in these rooms
        occupancy.forEach(p => {
            if (p.room_no && p.room_no.startsWith(roomPrefix)) {
                occupiedCount++;
            }
        });

        return { 
            text: `${occupiedCount}/${totalBeds}`, 
            isFull: totalBeds > 0 && totalBeds === occupiedCount,
            hasRooms: true
        };
    };

    // --- COMPONENT: 6-Bed Dorm Box ---
    const DormBox = ({ roomNo, label }) => {
        const roomOccupants = getOccupants(roomNo);
        const capacity = 6;
        
        // Create 6 slots
        const slots = Array.from({ length: capacity }, (_, i) => {
            return roomOccupants[i] || null; // occupant or null
        });

        return (
            <div style={{border: '1px solid #999', borderRadius: '8px', overflow:'hidden', background:'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                {/* Header */}
                <div style={{background:'#3f51b5', color:'white', padding:'4px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #303f9f'}}>
                    <span style={{fontWeight:'bold', fontSize:'13px'}}>{label || roomNo}</span>
                    <span style={{fontSize:'10px', background:'rgba(255,255,255,0.2)', padding:'1px 5px', borderRadius:'4px'}}>DORM</span>
                </div>
                
                {/* 6-Bed Grid (3x2) */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1px', background:'#ccc', padding:'1px'}}> 
                    {slots.map((p, index) => {
                        const isOcc = !!p;
                        const bedLabel = `Bed ${index + 1}`;
                        
                        let bg = isOcc ? '#e8f5e9' : 'white'; 
                        let badgeColor = null;
                        let badgeText = null;
                        let courseTag = '';
                        let tagStyle = {};

                        if (isOcc) {
                            const conf = (p.conf_no || '').toUpperCase();
                            const isOld = conf.startsWith('O') || conf.startsWith('S');
                            badgeText = isOld ? 'O' : 'N';
                            badgeColor = isOld ? '#007bff' : '#ffc107';
                            courseTag = getCourseTag(p.course_name);
                            tagStyle = getTagStyle(courseTag);
                        }

                        return (
                            <div key={index} onClick={() => onRoomClick({ room_no: roomNo, occupant: p, bedIndex: index + 1 })}
                                 style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative', border:'1px solid #f0f0f0' }}>
                                
                                {isOcc ? (
                                    <div style={{textAlign:'center', lineHeight:'1.1'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'2px'}}>{p.full_name.split(' ')[0]}</div>
                                        {courseTag && (
                                            <div style={{display:'flex', justifyContent:'center'}}>
                                                <span style={{fontSize:'8px', fontWeight:'bold', background: tagStyle.bg, color: tagStyle.color, border: tagStyle.border, padding:'0 3px', borderRadius:'3px'}}>
                                                    {courseTag}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{textAlign:'center'}}>
                                        <div style={{fontSize:'8px', color:'#aaa', fontWeight:'bold'}}>{bedLabel}</div>
                                        <div style={{fontSize:'12px', color:'#eee'}}>🛏️</div>
                                    </div>
                                )}

                                {isOcc && (
                                    <div style={{position: 'absolute', top: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: badgeColor, color: badgeText === 'N' ? 'black' : 'white', fontSize: '8px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        {badgeText}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- COMPONENT: 2-Bed Room Box ---
    const RoomBox = ({ roomNo, label }) => {
        const roomOccupants = getOccupants(roomNo);
        const capacity = 2;
        const slots = Array.from({ length: capacity }, (_, i) => roomOccupants[i] || null);

        return (
            <div style={{border: '1px solid #999', borderRadius: '6px', overflow:'hidden', background:'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                <div style={{background:'#5d4037', color:'white', padding:'2px 5px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #4e342e'}}>
                    <span style={{fontWeight:'900', fontSize:'13px'}}>{label || roomNo}</span>
                    <span style={{fontSize:'9px', color:'#d7ccc8'}}>ROOM</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {slots.map((p, index) => {
                        const isOcc = !!p;
                        const bedLabel = index === 0 ? 'A' : 'B';
                        let bg = isOcc ? '#fff3e0' : 'white'; 

                        let badgeColor, badgeText, courseTag, tagStyle;
                        if (isOcc) {
                            const conf = (p.conf_no || '').toUpperCase();
                            const isOld = conf.startsWith('O') || conf.startsWith('S');
                            badgeText = isOld ? 'O' : 'N';
                            badgeColor = isOld ? '#007bff' : '#ffc107';
                            courseTag = getCourseTag(p.course_name);
                            tagStyle = getTagStyle(courseTag);
                        }

                        return (
                            <div key={index} onClick={() => onRoomClick({ room_no: roomNo, occupant: p })}
                                 style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative' }}>
                                {isOcc ? (
                                    <div style={{textAlign:'center', lineHeight:'1'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'3px'}}>{p.full_name.split(' ')[0]}</div>
                                        {courseTag && <span style={{fontSize:'9px', fontWeight:'bold', background: tagStyle.bg, color: tagStyle.color, border: tagStyle.border, padding:'0 4px', borderRadius:'3px'}}>{courseTag}</span>}
                                    </div>
                                ) : <div style={{fontSize:'10px', color:'#ccc', textAlign:'center', fontWeight:'bold'}}>{bedLabel}</div>}

                                {isOcc && (
                                    <div style={{position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: badgeColor, color: badgeText === 'N' ? 'black' : 'white', fontSize: '9px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white'}}>
                                        {badgeText}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- Block Stats ---
    const dormStats = getStats('Dormitory', 8, 6);
    const roomStats = getStats('Room', 3, 2);

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            
            {/* SECTION 1: 8 DORMITORIES (21-28) */}
            <div style={{border:'2px solid #3f51b5', borderRadius:'10px', padding:'15px', background: '#f5f5f5'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #3f51b544', paddingBottom:'5px', marginBottom:'15px'}}>
                    <h3 style={{margin:0, color:'#3f51b5', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <Users size={18}/> DORMITORY BLOCK (6 Beds)
                    </h3>
                    <span style={{fontSize:'12px', fontWeight:'bold', background:'#3f51b5', color:'white', padding:'2px 8px', borderRadius:'12px'}}>
                        {dormStats.text}
                    </span>
                </div>
                
                {/* Grid of 8 Dorms */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'15px'}}>
                    {/* Generates Dormitory-21 to Dormitory-28 */}
                    {Array.from({length: 8}, (_, i) => 21 + i).map(num => (
                        <DormBox key={`dorm-${num}`} roomNo={`Dormitory-${num}`} label={`Dormitory ${num}`} />
                    ))}
                </div>
            </div>

            {/* SECTION 2: 3 INDIVIDUAL ROOMS (A-C) */}
            <div style={{border:'2px solid #5d4037', borderRadius:'10px', padding:'15px', background: '#fff'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #5d403744', paddingBottom:'5px', marginBottom:'15px'}}>
                    <h3 style={{margin:0, color:'#5d4037', fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
                        <BedDouble size={18}/> INDIVIDUAL ROOMS (2 Beds)
                    </h3>
                    <span style={{fontSize:'12px', fontWeight:'bold', background:'#5d4037', color:'white', padding:'2px 8px', borderRadius:'12px'}}>
                        {roomStats.text}
                    </span>
                </div>

                {/* Grid of 3 Rooms */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'15px'}}>
                    {['A', 'B', 'C'].map(suffix => (
                        <RoomBox key={`room-${suffix}`} roomNo={`Room-${suffix}`} label={`Room ${suffix}`} />
                    ))}
                </div>
            </div>

        </div>
    );
}
