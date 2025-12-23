import React from 'react';

// --- CONFIGURATION ---
// 1. Indian Commode List (Fixed & Verified)
const INDIAN_COMMODES = new Set([
    ...Array.from({length: 6}, (_, i) => 301 + i), // 301-306
    ...Array.from({length: 4}, (_, i) => 317 + i), // 317-320
    ...Array.from({length: 7}, (_, i) => 329 + i), // 329-335
    349, 350, 351, 362, 363
]);

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- HELPER: Identify Toilet Type ---
    const getToiletInfo = (roomNumStr) => {
        const numMatch = roomNumStr.match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        
        // VISUAL UPDATE: Stronger Colors
        if (INDIAN_COMMODES.has(num)) {
            return { type: 'Indian', icon: '🟤', color: '#D84315', label: 'IND' }; // Vibrant Deep Orange
        }
        return { type: 'Western', icon: '🚽', color: '#0277bd', label: 'WES' }; // Strong Blue
    };

    // --- DATA PROCESSOR ---
    const processBlocks = () => {
        const blocks = {
            A: { title: 'BLOCK A (Double Bed)', rooms: [] }, // 301-320
            B: { title: 'BLOCK B (Single Bed)', rooms: [] }, // 321-343
            C: { title: 'BLOCK C (Double Bed)', rooms: [] }, // 344-363 (Updated start)
            Other: { title: 'Other Male Rooms', rooms: [] }
        };

        const roomGroups = {};

        rooms.filter(r => r.gender_type === 'Male').forEach(r => {
            const numMatch = r.room_no.match(/(\d{3})/);
            const baseNum = numMatch ? parseInt(numMatch[1]) : 0;
            const key = baseNum || r.room_no;

            if (!roomGroups[key]) {
                roomGroups[key] = { baseNum, beds: [], toilet: getToiletInfo(r.room_no) };
            }
            
            const occupant = occupancy.find(p => p.room_no === r.room_no);
            roomGroups[key].beds.push({ ...r, occupant });
        });

        Object.values(roomGroups).forEach(group => {
            const n = group.baseNum;
            // LOGIC UPDATE: Block C starts at 344
            if (n >= 301 && n <= 320) blocks.A.rooms.push(group);
            else if (n >= 321 && n <= 343) blocks.B.rooms.push(group);
            else if (n >= 344 && n <= 363) blocks.C.rooms.push(group); 
            else blocks.Other.rooms.push(group);
        });

        return blocks;
    };

    const blocks = processBlocks();

    // --- RENDER: Single Bed ---
    const SingleBedBox = ({ group }) => {
        const bed = group.beds[0];
        if (!bed) return null;
        
        const p = bed.occupant;
        const isOcc = !!p;
        const isOld = p && (p.conf_no || '').match(/^(O|S)/i);
        
        // Color Logic: Old Student (Purple), New (Green), Empty (White)
        const bg = isOcc ? (isOld ? '#e1bee7' : '#c8e6c9') : 'white';
        const border = isOcc ? (isOld ? '#8e24aa' : '#2e7d32') : '#ddd';

        return (
            <div onClick={() => onRoomClick(bed)}
                 style={{
                     border: `2px solid ${border}`,
                     borderRadius: '8px',
                     background: bg,
                     padding: '6px',
                     cursor: 'pointer',
                     minHeight: '75px',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'space-between',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                 }}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:'4px', marginBottom:'4px'}}>
                    <span style={{fontWeight:'900', fontSize:'14px', color:'#333'}}>{group.baseNum}</span>
                    <span style={{fontSize:'10px', background: group.toilet.color, color:'white', padding:'1px 4px', borderRadius:'3px', fontWeight:'bold'}}>
                        {group.toilet.label}
                    </span>
                </div>
                {isOcc ? (
                    <div style={{fontSize:'11px', lineHeight:'1.2'}}>
                        <div style={{fontWeight:'bold', color:'#000', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div>
                        <div style={{fontSize:'10px', color:'#444'}}>{p.conf_no} | Age:{p.age}</div>
                    </div>
                ) : (
                    <div style={{fontSize:'10px', color:'#ccc', textAlign:'center', marginTop:'5px'}}>EMPTY</div>
                )}
            </div>
        );
    };

    // --- RENDER: Double Bed (Split Colors) ---
    const DoubleBedBox = ({ group }) => {
        const sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));

        return (
            <div style={{border: '1px solid #999', borderRadius: '8px', overflow:'hidden', background:'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                {/* Header */}
                <div style={{background:'#eee', padding:'4px 6px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc'}}>
                    <span style={{fontWeight:'900', fontSize:'13px'}}>{group.baseNum}</span>
                    <span style={{fontSize:'9px', background: group.toilet.color, color:'white', padding:'1px 4px', borderRadius:'3px', fontWeight:'bold'}}>
                        {group.toilet.label}
                    </span>
                </div>

                {/* Split Beds */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, index) => {
                        const p = bed.occupant;
                        const isOcc = !!p;
                        const isOld = p && (p.conf_no || '').match(/^(O|S)/i);
                        const suffix = bed.room_no.slice(-1); 

                        // VISUAL: Separate Bed Colors when Empty
                        // Bed 1 (Index 0): Light Blue Tint
                        // Bed 2 (Index 1): Light Yellow Tint
                        let bg = index === 0 ? '#f0f8ff' : '#fffde7'; 
                        
                        // Override if Occupied
                        if (isOcc) bg = isOld ? '#e1bee7' : '#c8e6c9';

                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                 style={{
                                     background: bg,
                                     padding: '5px',
                                     cursor: 'pointer',
                                     minHeight: '55px',
                                     display: 'flex', 
                                     flexDirection: 'column', 
                                     justifyContent: 'center',
                                     transition: 'background 0.2s'
                                 }}>
                                <div style={{fontSize:'9px', fontWeight:'bold', color:'#777', marginBottom:'2px', textAlign:'center'}}>Bed {suffix}</div>
                                {isOcc ? (
                                    <div style={{textAlign:'center'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', lineHeight:'1.1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name.split(' ')[0]}</div>
                                        <div style={{fontSize:'9px', color:'#444'}}>{p.conf_no}</div>
                                    </div>
                                ) : (
                                    <div style={{fontSize:'16px', color:'rgba(0,0,0,0.1)', textAlign:'center', lineHeight:'1'}}>🛏️</div>
                                )}
                            </div>
                        );
                    })}
                    {sortedBeds.length < 2 && <div style={{background:'#f5f5f5'}}></div>}
                </div>
            </div>
        );
    };

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            
            {/* BLOCK A */}
            <div style={{border:'2px solid #007bff', borderRadius:'10px', padding:'10px', background:'#f0f8ff'}}>
                <h3 style={{marginTop:0, color:'#0056b3', borderBottom:'1px solid #cce5ff', paddingBottom:'5px', fontSize:'16px'}}>{blocks.A.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'8px'}}>
                    {blocks.A.rooms.map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* BLOCK B */}
            <div style={{border:'2px solid #ffca28', borderRadius:'10px', padding:'10px', background:'#fff8e1'}}>
                <h3 style={{marginTop:0, color:'#f57f17', borderBottom:'1px solid #ffe082', paddingBottom:'5px', fontSize:'16px'}}>{blocks.B.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:'8px'}}>
                    {blocks.B.rooms.map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* BLOCK C */}
            <div style={{border:'2px solid #4caf50', borderRadius:'10px', padding:'10px', background:'#f1f8e9'}}>
                <h3 style={{marginTop:0, color:'#2e7d32', borderBottom:'1px solid #c8e6c9', paddingBottom:'5px', fontSize:'16px'}}>{blocks.C.title}</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'8px'}}>
                    {blocks.C.rooms.map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </div>

            {/* Other */}
            {blocks.Other.rooms.length > 0 && (
                <div style={{border:'1px solid #999', borderRadius:'10px', padding:'10px'}}>
                    <h3 style={{marginTop:0, color:'#555', fontSize:'16px'}}>Other Rooms</h3>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:'8px'}}>
                        {blocks.Other.rooms.map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
