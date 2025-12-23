import React from 'react';

// --- CONFIGURATION: Indian Commode Rooms (Female) ---
const INDIAN_COMMODES = new Set([
    201, 202, 203, 204, 205, 206, // Block A Left
    219, 220, 221, 222, 223, 224, // Block B Right
    240, 241,                     // Block C Partial
    243, 246, 248                 // Block D
]);

export default function FemaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- HELPER: Identify Toilet Type ---
    const getToiletInfo = (roomNumStr) => {
        const numMatch = (roomNumStr || '').match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        
        // Specific logic for Indian vs Western
        if (INDIAN_COMMODES.has(num)) {
            return { type: 'Indian', icon: '🟤', color: '#D84315', label: 'IND' }; 
        }
        return { type: 'Western', icon: '🚽', color: '#0277bd', label: 'WES' }; 
    };

    // --- DATA PROCESSOR ---
    const getRoomData = () => {
        const roomGroups = {};
        // 🔒 SECURITY: Strict Gender Filter
        const femaleRooms = rooms.filter(r => (r.gender_type || 'Female') === 'Female');

        femaleRooms.forEach(r => {
            // Extract Base Number (e.g. 201A -> 201) OR handle "FRC-1"
            let baseNum = 0;
            let key = r.room_no;

            const digitMatch = r.room_no.match(/(\d{3})/);
            const frcMatch = r.room_no.match(/FRC-(\d+)/i);

            if (digitMatch) {
                baseNum = parseInt(digitMatch[1]);
                key = baseNum;
            } else if (frcMatch) {
                baseNum = `FRC-${frcMatch[1]}`; // Keep FRC ID
                key = baseNum;
            }

            if (!roomGroups[key]) {
                roomGroups[key] = { baseNum: key, beds: [], toilet: getToiletInfo(r.room_no) };
            }
            
            const occupant = occupancy.find(p => p.room_no === r.room_no);
            roomGroups[key].beds.push({ ...r, occupant });
        });
        return roomGroups;
    };

    const allRooms = getRoomData();

    // --- HELPER: Get Room by Number ---
    const getRoom = (num) => allRooms[num] || null;

    // --- HELPER: Render Correct Box (Single vs Double Auto-Detect) ---
    const RoomBox = ({ num }) => {
        const group = getRoom(num);
        if (!group) return <div style={{background:'#f0f0f0', borderRadius:'4px', border:'1px dashed #ccc', height:'100%'}}></div>;

        // Auto-detect if Single or Double based on beds count
        const isDouble = group.beds.length > 1 || group.beds.some(b => b.room_no.match(/[AB]$/));
        
        const sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));

        // RENDER: Double Bed
        if (isDouble) {
            return (
                <div style={{border: '1px solid #999', borderRadius: '4px', overflow:'hidden', background:'white', height:'100%', display:'flex', flexDirection:'column'}}>
                    <div style={{background:'#eee', padding:'2px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc', fontSize:'10px'}}>
                        <span style={{fontWeight:'900'}}>{group.baseNum}</span>
                        <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'0 2px', borderRadius:'2px'}}>{group.toilet.label}</span>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', flex:1, gap:'1px', background:'#ccc'}}> 
                        {sortedBeds.map((bed, i) => {
                            const p = bed.occupant;
                            let bg = i === 0 ? '#fce4ec' : '#f3e5f5'; // Pink/Purple tints for Female
                            if (p) bg = (p.conf_no||'').startsWith('O') ? '#ce93d8' : '#a5d6a7'; // Old(Purple) vs New(Green)
                            
                            return (
                                <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                     style={{background: bg, cursor: 'pointer', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'2px'}}>
                                    {p ? (
                                        <div style={{textAlign:'center', lineHeight:'1'}}>
                                            <div style={{fontSize:'9px', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'40px'}}>{p.full_name.split(' ')[0]}</div>
                                            <div style={{fontSize:'7px', color:'#444'}}>{p.conf_no}</div>
                                        </div>
                                    ) : <div style={{fontSize:'8px', color:'#999'}}>Bed {bed.room_no.slice(-1)}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // RENDER: Single Bed
        const bed = group.beds[0];
        const p = bed?.occupant;
        let bg = p ? ((p.conf_no||'').startsWith('O') ? '#ce93d8' : '#a5d6a7') : 'white';

        return (
            <div onClick={() => onRoomClick(bed)}
                 style={{border: '1px solid #999', borderRadius: '4px', background: bg, height:'100%', padding:'4px', cursor: 'pointer', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', borderBottom:'1px solid rgba(0,0,0,0.1)'}}>
                    <span style={{fontWeight:'bold'}}>{group.baseNum}</span>
                    <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'0 2px', borderRadius:'2px'}}>{group.toilet.label}</span>
                </div>
                {p ? (
                    <div style={{fontSize:'10px', lineHeight:'1.1', marginTop:'2px'}}>
                        <div style={{fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.full_name}</div>
                        <div style={{fontSize:'9px'}}>{p.conf_no}</div>
                    </div>
                ) : <div style={{fontSize:'9px', color:'#ccc', textAlign:'center', marginTop:'5px'}}>FREE</div>}
            </div>
        );
    };

    // --- VISUAL COMPONENTS ---
    const Pathway = () => <div style={{writingMode:'vertical-rl', textAlign:'center', background:'#e0e0e0', color:'#777', fontSize:'10px', fontWeight:'bold', letterSpacing:'2px', padding:'2px'}}>PATHWAY</div>;

    const BlockContainer = ({ title, children }) => (
        <div style={{border:'2px solid #e91e63', borderRadius:'8px', padding:'10px', background:'#fff0f6'}}>
            <h4 style={{marginTop:0, color:'#c2185b', textAlign:'center', borderBottom:'1px solid #f8bbd0', paddingBottom:'5px'}}>{title}</h4>
            <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                {children}
            </div>
        </div>
    );

    const Column = ({ rooms }) => (
        <div style={{display:'grid', gridTemplateRows:`repeat(${rooms.length}, 60px)`, gap:'8px', width:'90px'}}>
            {rooms.map(num => <RoomBox key={num} num={num} />)}
        </div>
    );

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'20px', overflowX:'auto'}}>
            
            {/* ROW 1: BLOCKS A, B, C */}
            <div style={{display:'flex', gap:'20px'}}>
                
                {/* BLOCK A (201-212) */}
                <BlockContainer title="BLOCK A">
                    <Column rooms={[201, 202, 203, 204, 205, 206]} />
                    <Pathway />
                    <Column rooms={[207, 208, 209, 210, 211, 212]} />
                </BlockContainer>

                {/* BLOCK B (213-224) */}
                <BlockContainer title="BLOCK B">
                    <Column rooms={[213, 214, 215, 216, 217, 218]} />
                    <Pathway />
                    <Column rooms={[219, 220, 221, 222, 223, 224]} />
                </BlockContainer>

                {/* BLOCK C (225-242) */}
                <BlockContainer title="BLOCK C">
                    <Column rooms={[225, 226, 227, 228, 229, 230]} />
                    <Pathway />
                    <Column rooms={[231, 232, 233, 234, 235, 236]} />
                    <Pathway />
                    <Column rooms={[237, 238, 239, 240, 241, 242]} />
                </BlockContainer>
            </div>

            {/* ROW 2: BLOCKS F & D (Right Side Alignment) */}
            <div style={{display:'flex', gap:'20px', justifyContent:'flex-end'}}>
                
                {/* BLOCK F (FRC 1-6) */}
                <BlockContainer title="BLOCK F">
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num="FRC-1" />
                        <RoomBox num="FRC-2" />
                        <RoomBox num="FRC-3" />
                    </div>
                    <Pathway />
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num="FRC-6" /> {/* Order flipped to match image if needed, or keeping standard */}
                        <RoomBox num="FRC-5" />
                        <RoomBox num="FRC-4" />
                    </div>
                </BlockContainer>

                {/* BLOCK D (243-248) */}
                <BlockContainer title="BLOCK D">
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num={243} />
                        <RoomBox num={244} />
                        <RoomBox num={245} />
                    </div>
                    <Pathway />
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num={246} />
                        <RoomBox num={247} />
                        <RoomBox num={248} />
                    </div>
                </BlockContainer>
            </div>

            {/* MAIN PATHWAY FOOTER */}
            <div style={{background:'#1976d2', color:'white', textAlign:'center', padding:'8px', fontWeight:'bold', borderRadius:'4px', letterSpacing:'5px'}}>
                MAIN PATHWAY
            </div>
        </div>
    );
}
