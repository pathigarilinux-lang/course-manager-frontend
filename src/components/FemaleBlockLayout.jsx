import React from 'react';

// --- CONFIGURATION: Indian Commode Rooms (Female) ---
const INDIAN_COMMODES = new Set([
    201, 202, 203, 204, 205, 206, 
    219, 220, 221, 222, 223, 224, 
    240, 241, 243, 246, 248                 
]);

export default function FemaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- HELPER ---
    const getToiletInfo = (roomNumStr) => {
        const numMatch = (roomNumStr || '').match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        if (INDIAN_COMMODES.has(num)) return { type: 'Indian', icon: '🟤', color: '#D84315', label: 'IND' }; 
        return { type: 'Western', icon: '🚽', color: '#0277bd', label: 'WES' }; 
    };

    // --- DATA PROCESSOR ---
    const getRoomData = () => {
        const roomGroups = {};
        rooms.forEach(r => {
            let key = r.room_no;
            const digitMatch = r.room_no.match(/(\d{3})/);
            const frcMatch = r.room_no.match(/(?:FRC|F)[-\s]?(\d+)/i);

            if (digitMatch) key = parseInt(digitMatch[1]);
            else if (frcMatch) key = `FRC-${frcMatch[1]}`;

            if (!roomGroups[key]) roomGroups[key] = { baseNum: key, beds: [], toilet: getToiletInfo(r.room_no) };
            
            const occupant = occupancy.find(p => p.room_no === r.room_no);
            roomGroups[key].beds.push({ ...r, occupant });
        });
        return roomGroups;
    };

    const allRooms = getRoomData();
    const getRoom = (num) => allRooms[num] || null;

    // --- STATS CALCULATOR ---
    const getBlockStats = (roomList) => {
        let totalBeds = 0;
        let occupiedBeds = 0;

        roomList.forEach(num => {
            const group = getRoom(num);
            if (group) {
                totalBeds += group.beds.length;
                occupiedBeds += group.beds.filter(b => b.occupant).length;
            }
        });

        const isFull = totalBeds > 0 && totalBeds === occupiedBeds;
        return { text: `${occupiedBeds}/${totalBeds}`, isFull };
    };

    // --- VISUAL COMPONENTS ---
    const RoomBox = ({ num }) => {
        const group = getRoom(num);
        if (!group) return <div style={{background:'#f9f9f9', borderRadius:'4px', border:'1px dashed #ddd', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#ccc'}}>{num}</div>;

        const isDouble = group.beds.length > 1 || group.beds.some(b => b.room_no.match(/[AB]$/));
        const sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));
        const wrongGender = group.beds.some(b => (b.gender_type || 'Female') === 'Male');
        const boxBorder = wrongGender ? '2px solid red' : '1px solid #999';

        return (
            <div style={{border: boxBorder, borderRadius: '4px', overflow:'hidden', background:'white', height:'100%', display:'flex', flexDirection:'column'}}>
                <div style={{background:'#eee', padding:'2px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc', fontSize:'10px'}}>
                    <span style={{fontWeight:'900'}}>{group.baseNum} {wrongGender && '⚠️'}</span>
                    <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'0 2px', borderRadius:'2px'}}>{group.toilet.label}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns: isDouble ? '1fr 1fr' : '1fr', flex:1, gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, i) => {
                        const p = bed.occupant;
                        let bg = i === 0 ? '#fce4ec' : '#f3e5f5'; 
                        if (p) bg = (p.conf_no||'').startsWith('O') ? '#ce93d8' : '#a5d6a7'; 
                        
                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                 style={{background: bg, cursor: 'pointer', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'2px'}}>
                                {p ? (
                                    <div style={{textAlign:'center', lineHeight:'1'}}>
                                        <div style={{fontSize:'9px', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'40px'}}>{p.full_name.split(' ')[0]}</div>
                                    </div>
                                ) : <div style={{fontSize:'8px', color:'#999'}}>{bed.room_no.slice(-1)}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const Pathway = () => <div style={{writingMode:'vertical-rl', textAlign:'center', background:'#e0e0e0', color:'#777', fontSize:'10px', fontWeight:'bold', letterSpacing:'2px', padding:'2px'}}>PATHWAY</div>;

    const BlockContainer = ({ title, roomsInBlock, children }) => {
        const stats = getBlockStats(roomsInBlock);
        return (
            <div style={{border:'2px solid #e91e63', borderRadius:'8px', padding:'10px', background:'#fff0f6'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f8bbd0', paddingBottom:'5px', marginBottom:'8px'}}>
                    <h4 style={{margin:0, color:'#c2185b'}}>{title}</h4>
                    <span style={{fontSize:'11px', fontWeight:'bold', background: stats.isFull ? '#e91e63' : '#fff', color: stats.isFull ? 'white' : '#e91e63', padding:'2px 8px', borderRadius:'10px', border: stats.isFull ? 'none' : '1px solid #e91e63'}}>
                        {stats.text}
                    </span>
                </div>
                <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
                    {children}
                </div>
            </div>
        );
    };

    const Column = ({ rooms }) => (
        <div style={{display:'grid', gridTemplateRows:`repeat(${rooms.length}, 60px)`, gap:'8px', width:'90px'}}>
            {rooms.map(num => <RoomBox key={num} num={num} />)}
        </div>
    );

    // --- BLOCK DEFINITIONS ---
    const blockA = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212];
    const blockB = [213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224];
    const blockC = [225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242];
    const blockF = ["FRC-1", "FRC-2", "FRC-3", "FRC-4", "FRC-5", "FRC-6"];
    const blockD = [243, 244, 245, 246, 247, 248];

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'20px', overflowX:'auto'}}>
            {/* ROW 1 */}
            <div style={{display:'flex', gap:'20px'}}>
                <BlockContainer title="BLOCK A" roomsInBlock={blockA}>
                    <Column rooms={blockA.slice(0,6)} />
                    <Pathway />
                    <Column rooms={blockA.slice(6,12)} />
                </BlockContainer>

                <BlockContainer title="BLOCK B" roomsInBlock={blockB}>
                    <Column rooms={blockB.slice(0,6)} />
                    <Pathway />
                    <Column rooms={blockB.slice(6,12)} />
                </BlockContainer>

                <BlockContainer title="BLOCK C" roomsInBlock={blockC}>
                    <Column rooms={blockC.slice(0,6)} />
                    <Pathway />
                    <Column rooms={blockC.slice(6,12)} />
                    <Pathway />
                    <Column rooms={blockC.slice(12,18)} />
                </BlockContainer>
            </div>

            {/* ROW 2 */}
            <div style={{display:'flex', gap:'20px', justifyContent:'flex-end'}}>
                <BlockContainer title="BLOCK F" roomsInBlock={blockF}>
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num="FRC-1" />
                        <RoomBox num="FRC-2" />
                        <RoomBox num="FRC-3" />
                    </div>
                    <Pathway />
                    <div style={{display:'grid', gridTemplateRows:'repeat(3, 60px)', gap:'8px', width:'90px'}}>
                        <RoomBox num="FRC-6" />
                        <RoomBox num="FRC-5" />
                        <RoomBox num="FRC-4" />
                    </div>
                </BlockContainer>

                <BlockContainer title="BLOCK D" roomsInBlock={blockD}>
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

            <div style={{background:'#1976d2', color:'white', textAlign:'center', padding:'8px', fontWeight:'bold', borderRadius:'4px', letterSpacing:'5px'}}>
                MAIN PATHWAY
            </div>
        </div>
    );
}
