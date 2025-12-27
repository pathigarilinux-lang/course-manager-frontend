import React from 'react';
import { AlertCircle } from 'lucide-react'; 

// --- CONFIGURATION ---
const INDIAN_COMMODES = new Set([
    201, 202, 203, 204, 205, 206, 
    219, 220, 221, 222, 223, 224, 
    240, 241, 243, 246, 248                 
]);

// --- NEW: HIGH VISIBILITY TAG STYLES ---
const getTagStyle = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t === '10D') return { bg: '#e3f2fd', color: '#0d47a1', border: '1px solid #2196f3' }; // Blue
    if (t === 'SAT') return { bg: '#fff3e0', color: '#e65100', border: '1px solid #ff9800' }; // Orange
    if (['20D','30D','45D','60D'].includes(t)) return { bg: '#f3e5f5', color: '#4a148c', border: '1px solid #9c27b0' }; // Purple
    if (['TSC','STM','SER'].includes(t)) return { bg: '#e8f5e9', color: '#1b5e20', border: '1px solid #4caf50' }; // Green
    return { bg: '#eeeeee', color: '#424242', border: '1px solid #9e9e9e' }; // Grey Default
};

const getCourseTag = (courseName) => {
    if (!courseName) return '';
    const match = courseName.match(/(\d+)/);
    return match ? `${match[1]}D` : courseName.substring(0, 3).toUpperCase();
};

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
        const femaleRoomsOnly = rooms.filter(r => r.gender_type === 'Female');

        femaleRoomsOnly.forEach(r => {
            let key = r.room_no;
            const digitMatch = String(r.room_no).match(/^(\d{3})[A-Za-z]*$/);
            if (digitMatch) {
                const num = parseInt(digitMatch[1]);
                key = isNaN(num) ? r.room_no : num;
            }
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
        
        const isMedical = String(group.baseNum).toString().toUpperCase().startsWith('FRC') || String(group.baseNum).toString().toUpperCase().startsWith('ISO');

        let boxBorder = wrongGender ? '2px solid red' : '1px solid #999';
        if (isMedical) boxBorder = '2px solid #ffcc80'; 

        return (
            <div 
                onClick={() => isDouble ? null : onRoomClick(group.beds[0])} 
                title={isMedical ? "Reserved for Medical / Senior Citizen" : ""}
                style={{
                    border: boxBorder, 
                    borderRadius: '4px', overflow:'hidden', 
                    background: isMedical ? '#fff8e1' : 'white', 
                    height:'100%', minHeight:'65px', // slightly taller
                    display:'flex', flexDirection:'column'
                }}>
                
                <div style={{background: isMedical ? '#ffe0b2' : '#eee', padding:'2px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc', fontSize:'10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'2px'}}>
                        <span style={{fontWeight:'900', color: isMedical ? '#e65100' : '#333'}}>{group.baseNum} {wrongGender && '⚠️'}</span>
                        {isMedical && <AlertCircle size={10} color="#e65100" />}
                    </div>
                    <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'0 2px', borderRadius:'2px'}}>{group.toilet.label}</span>
                </div>

                <div style={{display:'grid', gridTemplateColumns: isDouble ? '1fr 1fr' : '1fr', flex:1, gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, i) => {
                        const p = bed.occupant;
                        let bg = i === 0 ? '#fce4ec' : '#f3e5f5'; 
                        if (p) bg = (p.conf_no||'').startsWith('O') ? '#ce93d8' : '#a5d6a7'; 
                        if (!p && isMedical) bg = '#fff3e0'; 
                        
                        // Tag Logic
                        let courseTag = '';
                        let tagStyle = {};
                        if (p) {
                            courseTag = getCourseTag(p.course_name);
                            tagStyle = getTagStyle(courseTag);
                        }

                        return (
                            <div key={bed.room_id} onClick={(e) => { e.stopPropagation(); onRoomClick(bed); }}
                                 style={{background: bg, cursor: 'pointer', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'2px', minHeight:'30px'}}>
                                {p ? (
                                    <div style={{textAlign:'center', lineHeight:'1'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'40px', marginBottom:'2px'}}>{p.full_name.split(' ')[0]}</div>
                                        
                                        {/* ✅ BIG VISIBLE TAG */}
                                        {courseTag && (
                                            <div style={{
                                                fontSize:'9px', 
                                                fontWeight:'bold', 
                                                background: tagStyle.bg, 
                                                color: tagStyle.color,
                                                border: tagStyle.border,
                                                padding:'0 3px', 
                                                borderRadius:'3px',
                                                display: 'inline-block'
                                            }}>
                                                {courseTag}
                                            </div>
                                        )}
                                    </div>
                                ) : <div style={{fontSize:'8px', color:'#999'}}>{bed.room_no.slice(-1)}</div>}
                            </div>
                        );
                    })}
                </div>

                {isMedical && (
                    <div style={{fontSize:'8px', color:'#e65100', textAlign:'center', fontWeight:'bold', background:'#fff3e0', padding:'1px'}}>MED/SR</div>
                )}
            </div>
        );
    };

    const Pathway = () => <div style={{writingMode:'vertical-rl', textAlign:'center', background:'#e0e0e0', color:'#777', fontSize:'10px', fontWeight:'bold', letterSpacing:'2px', padding:'2px'}}>PATHWAY</div>;

    const BlockContainer = ({ title, roomsInBlock, children, color = '#e91e63', bg = '#fff0f6' }) => {
        const stats = getBlockStats(roomsInBlock);
        return (
            <div style={{border:`2px solid ${color}`, borderRadius:'8px', padding:'10px', background: bg}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${color}44`, paddingBottom:'5px', marginBottom:'8px'}}>
                    <h4 style={{margin:0, color: color}}>{title}</h4>
                    {stats.text !== "0/0" && (
                        <span style={{fontSize:'11px', fontWeight:'bold', background: stats.isFull ? color : '#fff', color: stats.isFull ? 'white' : color, padding:'2px 8px', borderRadius:'10px', border: stats.isFull ? 'none' : `1px solid ${color}`}}>
                            {stats.text}
                        </span>
                    )}
                </div>
                <div style={{display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap'}}>
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
    const blockD = [243, 244, 245, 246, 247, 248];

    // Dynamic FRC Block
    const dynamicFRC = Object.keys(allRooms)
        .filter(key => String(key).startsWith('FRC'))
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

    const blockF = dynamicFRC.length > 0 ? dynamicFRC : ["FRC-1", "FRC-2", "FRC-3", "FRC-4", "FRC-5", "FRC-6"];

    // ✅ FIND OTHER ROOMS (Emergency / Manual / Overflow)
    const getOtherRooms = () => {
        const standardKeys = new Set([
            ...blockA, ...blockB, ...blockC, ...blockD, ...blockF, ...dynamicFRC
        ]);
        
        return Object.keys(allRooms)
            .filter(key => !standardKeys.has(parseInt(key)) && !standardKeys.has(key)) 
            .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
    };

    const otherRooms = getOtherRooms();

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
                    <Column rooms={blockC.slice(0,6)} />
                    <Pathway />
                    <Column rooms={blockC.slice(6,12)} />
                    <Pathway />
                    <Column rooms={blockC.slice(12,18)} />
                </BlockContainer>
            </div>

            <div style={{display:'flex', gap:'20px', justifyContent:'flex-end'}}>
                <BlockContainer title="BLOCK F (Medical)" roomsInBlock={blockF}>
                    <div style={{display:'grid', gridTemplateColumns: blockF.length > 3 ? '1fr 1fr' : '1fr', gap:'10px'}}>
                        <Column rooms={blockF.slice(0, Math.ceil(blockF.length / 2))} />
                        <Column rooms={blockF.slice(Math.ceil(blockF.length / 2))} />
                    </div>
                </BlockContainer>

                <BlockContainer title="BLOCK D" roomsInBlock={blockD}>
                    <Column rooms={blockD.slice(0,3)} />
                    <Pathway />
                    <Column rooms={blockD.slice(3,6)} />
                </BlockContainer>
            </div>

            <div style={{background:'#1976d2', color:'white', textAlign:'center', padding:'8px', fontWeight:'bold', borderRadius:'4px', letterSpacing:'5px'}}>
                MAIN PATHWAY
            </div>

            {otherRooms.length > 0 && (
                <BlockContainer title="OTHER ACCOMMODATION / EMERGENCY" roomsInBlock={otherRooms} color="#555" bg="#f5f5f5">
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:'10px', width:'100%'}}>
                        {otherRooms.map(num => (
                            <div key={num} style={{height:'60px'}}>
                                <RoomBox num={num} />
                            </div>
                        ))}
                    </div>
                </BlockContainer>
            )}
        </div>
    );
}
