import React from 'react';
import { User } from 'lucide-react';

// --- CONFIGURATION ---
const INDIAN_COMMODES = new Set([
    ...Array.from({length: 6}, (_, i) => 301 + i), // 301-306
    ...Array.from({length: 4}, (_, i) => 317 + i), // 317-320
    ...Array.from({length: 7}, (_, i) => 329 + i), // 329-335
    349, 350, 351, 362, 363
]);

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- HELPER: Identify Toilet Type ---
    const getToiletInfo = (roomNumStr) => {
        // Extract number (e.g. "DN2-301A" -> 301)
        const numMatch = roomNumStr.match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        
        if (INDIAN_COMMODES.has(num)) {
            return { type: 'Indian', icon: '🟤', color: '#8d6e63', label: 'IND' }; // Brown
        }
        return { type: 'Western', icon: '🚽', color: '#007bff', label: 'WES' }; // Blue
    };

    // --- DATA PROCESSOR: Group by Block & Consolidate Beds ---
    const processBlocks = () => {
        const blocks = {
            A: { title: 'BLOCK A (Double Bed)', rooms: [] }, // 301-320
            B: { title: 'BLOCK B (Single Bed)', rooms: [] }, // 321-343
            C: { title: 'BLOCK C (Double Bed)', rooms: [] }, // 346-363
            Other: { title: 'Other Male Rooms', rooms: [] }
        };

        // 1. Group Raw Rooms by their "Base Number" (e.g. 301A & 301B -> 301)
        const roomGroups = {};

        rooms.filter(r => r.gender_type === 'Male').forEach(r => {
            const numMatch = r.room_no.match(/(\d{3})/);
            const baseNum = numMatch ? parseInt(numMatch[1]) : 0;
            const key = baseNum || r.room_no; // Fallback if no number

            if (!roomGroups[key]) {
                roomGroups[key] = { baseNum, beds: [], toilet: getToiletInfo(r.room_no) };
            }
            
            // Attach Occupant
            const occupant = occupancy.find(p => p.room_no === r.room_no);
            roomGroups[key].beds.push({ ...r, occupant });
        });

        // 2. Sort into Blocks
        Object.values(roomGroups).forEach(group => {
            const n = group.baseNum;
            if (n >= 301 && n <= 320) blocks.A.rooms.push(group);
            else if (n >= 321 && n <= 343) blocks.B.rooms.push(group);
            else if (n >= 346 && n <= 363) blocks.C.rooms.push(group);
            else blocks.Other.rooms.push(group);
        });

        return blocks;
    };

    const blocks = processBlocks();

    // --- RENDER COMPONENT: Single Bed Box ---
    const SingleBedBox = ({ group }) => {
        const bed = group.beds[0]; // Assuming only 1 bed for Block B
        if (!bed) return null;
        
        const p = bed.occupant;
        const isOcc = !!p;
        
        return (
            <div onClick={() => onRoomClick(bed)}
                 style={{
                     border: `2px solid ${isOcc ? '#28a745' : '#ddd'}`,
                     borderRadius: '8px',
                     background: isOcc ? '#e8f5e9' : 'white',
                     padding: '8px',
                     cursor: 'pointer',
                     position: 'relative',
                     minHeight: '80px',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'space-between'
                 }}>
                {/* Header: Room No + Toilet Icon */}
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'4px', marginBottom:'4px'}}>
                    <span style={{fontWeight:'900', fontSize:'14px', color:'#333'}}>{group.baseNum}</span>
                    <span title={`${group.toilet.type} Commode`} style={{fontSize:'12px', background: group.toilet.color, color:'white', padding:'1px 4px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'2px'}}>
                        {group.toilet.icon} <span style={{fontSize:'8px'}}>{group.toilet.label}</span>
                    </span>
                </div>

                {/* Occupant Info */}
                {isOcc ? (
                    <div style={{fontSize:'11px', lineHeight:'1.2'}}>
                        <div style={{fontWeight:'bold', color:'#000'}}>{p.full_name}</div>
                        <div style={{fontSize:'10px', color:'#555', marginTop:'2px'}}>{p.conf_no} | Age:{p.age}</div>
                    </div>
                ) : (
                    <div style={{fontSize:'10px', color:'#ccc', fontStyle:'italic', textAlign:'center', marginTop:'10px'}}>Empty</div>
                )}
            </div>
        );
    };

    // --- RENDER COMPONENT: Double Bed Box (Split View) ---
    const DoubleBedBox = ({ group }) => {
        // Sort beds so A is left/top, B is right/bottom
        const sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));

        return (
            <div style={{border: '1px solid #999', borderRadius: '8px', overflow:'hidden', background:'#f8f9fa'}}>
                {/* Room Header */}
                <div style={{background:'#eee', padding:'4px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc'}}>
                    <span style={{fontWeight:'900', fontSize:'14px'}}>{group.baseNum}</span>
                    <span title={`${group.toilet.type} Commode`} style={{fontSize:'10px', background: group.toilet.color, color:'white', padding:'1px 4px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'2px'}}>
                        {group.toilet.icon} {group.toilet.label}
                    </span>
                </div>

                {/* Split Beds */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map(bed => {
                        const p = bed.occupant;
                        const isOcc = !!p;
                        // Bed Suffix (A or B) extracted from room number
                        const suffix = bed.room_no.slice(-1); 

                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                 style={{
                                     background: isOcc ? '#e8f5e9' : 'white',
                                     padding: '6px',
                                     cursor: 'pointer',
                                     minHeight: '60px',
                                     display: 'flex', 
                                     flexDirection: 'column', 
                                     justifyContent: 'center'
                                 }}>
                                <div style={{fontSize:'9px', fontWeight:'bold', color:'#777', marginBottom:'2px'}}>Bed {suffix}</div>
                                {isOcc ? (
                                    <>
                                        <div style={{fontSize:'10px', fontWeight:'bold', lineHeight:'1.1', overflow:'hidden', textOverflow:'ellipsis'}}>{p.full_name.split(' ')[0]}...</div>
                                        <div style={{fontSize:'9px', color:'#555'}}>{p.conf_no}</div>
                                    </>
                                ) : (
                                    <div style={{fontSize:'9px', color:'#ccc', textAlign:'center'}}>Free</div>
                                )}
                            </div>
                        );
                    })}
                    {/* Fill empty slot if room only has 1 bed defined in DB but is logically double */}
                    {sortedBeds.length < 2 && <div style={{background:'#f0f0f0', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'9px', color:'#aaa'}}>No Data</div>}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            
            {/* BLOCK A (Double) */}
            <div style={{border:'2px solid #007bff', borderRadius:'10px', padding:'15px', background:'#f0f8ff'}}>
                <h3 style={{marginTop:0, color:'#0056b3', borderBottom:'1px solid #cce5ff', paddingBottom:'5px'}}>{blocks.A.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'10px'}}>
                    {blocks.A.rooms.map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* BLOCK B (Single) */}
            <div style={{border:'2px solid #ffc107', borderRadius:'10px', padding:'15px', background:'#fff9db'}}>
                <h3 style={{marginTop:0, color:'#856404', borderBottom:'1px solid #ffeeba', paddingBottom:'5px'}}>{blocks.B.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'10px'}}>
                    {blocks.B.rooms.map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* BLOCK C (Double) */}
            <div style={{border:'2px solid #28a745', borderRadius:'10px', padding:'15px', background:'#f1f8e9'}}>
                <h3 style={{marginTop:0, color:'#2e7d32', borderBottom:'1px solid #c8e6c9', paddingBottom:'5px'}}>{blocks.C.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'10px'}}>
                    {blocks.C.rooms.map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* Other Rooms (Fallback) */}
            {blocks.Other.rooms.length > 0 && (
                <div style={{border:'1px solid #999', borderRadius:'10px', padding:'15px'}}>
                    <h3 style={{marginTop:0, color:'#555'}}>Other Male Rooms</h3>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px'}}>
                        {blocks.Other.rooms.map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
