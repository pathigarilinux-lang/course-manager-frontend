import React from 'react';

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- DATA PROCESSOR ---
    const getRoomData = () => {
        const roomGroups = {};
        // Filter for Male rooms
        const maleRooms = rooms.filter(r => (r.gender_type || 'Male') === 'Male');

        maleRooms.forEach(r => {
            // Normalize room numbers (e.g. 101A -> 101)
            const digitMatch = r.room_no.match(/(\d{3})/);
            const key = digitMatch ? parseInt(digitMatch[1]) : r.room_no;

            if (!roomGroups[key]) {
                roomGroups[key] = { baseNum: key, beds: [] };
            }
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

        const isDouble = group.beds.length > 1;
        const sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));

        return (
            <div style={{border: '1px solid #999', borderRadius: '4px', overflow:'hidden', background:'white', height:'100%', display:'flex', flexDirection:'column'}}>
                <div style={{background:'#eee', padding:'2px', textAlign:'center', borderBottom:'1px solid #ccc', fontSize:'10px', fontWeight:'900', color:'#333'}}>
                    {group.baseNum}
                </div>
                <div style={{display:'grid', gridTemplateColumns: isDouble ? '1fr 1fr' : '1fr', flex:1, gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, i) => {
                        const p = bed.occupant;
                        const bg = p ? ((p.conf_no||'').startsWith('O') ? '#90caf9' : '#a5d6a7') : 'white'; // Blue/Green for Male
                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                 style={{background: bg, cursor: 'pointer', display:'flex', justifyContent:'center', alignItems:'center', padding:'2px'}}>
                                {p ? (
                                    <div style={{textAlign:'center', lineHeight:'1', fontSize:'8px'}}>
                                        <div style={{fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'35px'}}>{p.full_name.split(' ')[0]}</div>
                                    </div>
                                ) : <div style={{fontSize:'7px', color:'#ccc'}}>{bed.room_no.slice(-1)}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const Pathway = () => <div style={{writingMode:'vertical-rl', textAlign:'center', background:'#e0e0e0', color:'#777', fontSize:'10px', fontWeight:'bold', letterSpacing:'2px', padding:'2px'}}>PATHWAY</div>;

    // Updated BlockContainer with Stats
    const BlockContainer = ({ title, roomsInBlock, children }) => {
        const stats = getBlockStats(roomsInBlock);
        return (
            <div style={{border:'2px solid #007bff', borderRadius:'8px', padding:'10px', background:'#f0f8ff'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #b3e5fc', paddingBottom:'5px', marginBottom:'8px'}}>
                    <h4 style={{margin:0, color:'#0056b3'}}>{title}</h4>
                    <span style={{fontSize:'11px', fontWeight:'bold', background: stats.isFull ? '#28a745' : '#fff', color: stats.isFull ? 'white' : '#007bff', padding:'2px 8px', borderRadius:'10px', border: stats.isFull ? 'none' : '1px solid #007bff'}}>
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
        <div style={{display:'grid', gridTemplateRows:`repeat(${rooms.length}, 50px)`, gap:'6px', width:'80px'}}>
            {rooms.map(num => <RoomBox key={num} num={num} />)}
        </div>
    );

    // Define Lists for Stats Calculation
    const blockA = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112];
    const blockB = [113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124];
    const blockC = [125, 126, 127, 128, 129, 130];

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'20px', overflowX:'auto'}}>
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
                    <Column rooms={blockC} />
                </BlockContainer>
            </div>
            <div style={{background:'#1565c0', color:'white', textAlign:'center', padding:'8px', fontWeight:'bold', borderRadius:'4px', letterSpacing:'5px'}}>
                MAIN PATHWAY
            </div>
        </div>
    );
}
