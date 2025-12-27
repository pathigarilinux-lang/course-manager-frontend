import React from 'react';
import { AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
const INDIAN_COMMODES = new Set([
    ...Array.from({length: 6}, (_, i) => 301 + i),
    ...Array.from({length: 4}, (_, i) => 317 + i),
    ...Array.from({length: 7}, (_, i) => 329 + i),
    349, 350, 351, 362, 363
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
    // If it finds a number (10, 20, 30), return "10D". Else return first 3 chars "SAT"
    return match ? `${match[1]}D` : courseName.substring(0, 3).toUpperCase();
};

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    
    // --- HELPER: Identify Toilet Type ---
    const getToiletInfo = (roomNumStr) => {
        const numMatch = String(roomNumStr).match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        
        if (INDIAN_COMMODES.has(num)) {
            return { type: 'Indian', icon: '🟤', color: '#D84315', label: 'IND' }; 
        }
        return { type: 'Western', icon: '🚽', color: '#0277bd', label: 'WES' }; 
    };

    // --- DATA PROCESSOR ---
    const getRoomData = () => {
        const roomGroups = {};
        rooms.filter(r => r.gender_type === 'Male').forEach(r => {
            let key = r.room_no;
            const digitMatch = String(r.room_no).match(/^(\d{3})[A-Za-z]*$/);
            if (digitMatch) {
                const num = parseInt(digitMatch[1]);
                key = isNaN(num) ? r.room_no : num;
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

    // --- HELPER: Get specific range of rooms ---
    const getRange = (start, end) => {
        const list = [];
        for (let i = start; i <= end; i++) {
            if (allRooms[i]) list.push(allRooms[i]);
        }
        return list;
    };

    // --- HELPER: Stats ---
    const getStats = (start, end) => {
        const groups = getRange(start, end);
        let total = 0;
        let occupied = 0;
        groups.forEach(g => {
            total += g.beds.length;
            occupied += g.beds.filter(b => b.occupant).length;
        });
        return { 
            text: `${occupied}/${total}`, 
            isFull: total > 0 && total === occupied,
            hasRooms: total > 0
        };
    };

    // --- HELPER: Get Others ---
    const getOthers = () => {
        const standardKeys = new Set([
            ...Array.from({length: 20}, (_, i) => 301 + i),
            ...Array.from({length: 23}, (_, i) => 321 + i),
            ...Array.from({length: 20}, (_, i) => 344 + i)
        ]);
        return Object.values(allRooms)
            .filter(g => !standardKeys.has(g.baseNum))
            .sort((a, b) => String(a.baseNum).localeCompare(String(b.baseNum), undefined, { numeric: true }));
    };

    // --- RENDER COMPONENT: Single Bed Box ---
    const SingleBedBox = ({ group }) => {
        const bed = group.beds[0];
        if (!bed) return null;
        
        const p = bed.occupant;
        const isOcc = !!p;
        const isMedical = group.baseNum >= 321 && group.baseNum <= 328;

        let badgeColor = null;
        let badgeText = null;
        let courseTag = '';
        let tagStyle = {};

        if (isOcc) {
            const conf = (p.conf_no || '').toUpperCase();
            const isOld = conf.startsWith('O') || conf.startsWith('S');
            badgeText = isOld ? 'O' : 'N';
            badgeColor = isOld ? '#007bff' : '#ffc107'; 
            
            // Tag Logic
            courseTag = getCourseTag(p.course_name);
            tagStyle = getTagStyle(courseTag);
        }

        const bg = isOcc ? '#f8f9fa' : (isMedical ? '#fff8e1' : 'white');
        const border = isOcc ? '#ccc' : (isMedical ? '#ffcc80' : '#ddd');

        return (
            <div onClick={() => onRoomClick(bed)}
                 title={isMedical ? "Reserved for Medical/Senior" : ""}
                 style={{ 
                     border: `2px solid ${border}`, 
                     borderRadius: '6px', 
                     background: bg, 
                     padding: '4px', 
                     cursor: 'pointer', 
                     minHeight: '75px', // slightly taller
                     display: 'flex', flexDirection: 'column', justifyContent: 'space-between', 
                     boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                     position: 'relative'
                 }}>
                
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid rgba(0,0,0,0.1)', paddingBottom:'2px', marginBottom:'2px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'2px'}}>
                        <span style={{fontWeight:'900', fontSize:'14px', color: isMedical ? '#e65100' : '#333'}}>{group.baseNum}</span>
                        {isMedical && <AlertCircle size={10} color="#f57c00" />}
                    </div>
                    <span style={{fontSize:'9px', background: group.toilet.color, color:'white', padding:'1px 3px', borderRadius:'3px', fontWeight:'bold'}}>{group.toilet.label}</span>
                </div>

                {isOcc ? (
                    <div style={{fontSize:'11px', lineHeight:'1.2'}}>
                        <div style={{fontWeight:'bold', color:'#000', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'2px'}}>{p.full_name}</div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'3px'}}>
                            <span style={{fontSize:'10px', color:'#444'}}>{p.conf_no}</span>
                            
                            {/* ✅ BIG VISIBLE TAG */}
                            {courseTag && (
                                <span style={{
                                    fontSize:'10px', 
                                    fontWeight:'bold', 
                                    background: tagStyle.bg, 
                                    color: tagStyle.color, 
                                    border: tagStyle.border,
                                    padding:'1px 5px', 
                                    borderRadius:'4px'
                                }}>
                                    {courseTag}
                                </span>
                            )}
                        </div>
                    </div>
                ) : <div style={{fontSize:'10px', color: isMedical ? '#e65100' : '#ccc', textAlign:'center', fontWeight: isMedical ? 'bold' : 'normal', marginTop:'5px'}}>{isMedical ? 'MED/SR' : 'EMPTY'}</div>}

                {isOcc && (
                    <div style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: badgeColor, color: badgeText === 'N' ? 'black' : 'white',
                        fontSize: '10px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                        {badgeText}
                    </div>
                )}
            </div>
        );
    };

    // --- RENDER COMPONENT: Double Bed Box ---
    const DoubleBedBox = ({ group }) => {
        let sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));
        if (group.baseNum === 363 && sortedBeds.length > 2) sortedBeds = sortedBeds.slice(0, 2);

        return (
            <div style={{border: '1px solid #999', borderRadius: '6px', overflow:'hidden', background:'white', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                <div style={{background:'#eee', padding:'2px 5px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc'}}>
                    <span style={{fontWeight:'900', fontSize:'13px'}}>{group.baseNum}</span>
                    <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'1px 3px', borderRadius:'3px', fontWeight:'bold'}}>{group.toilet.label}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, index) => {
                        const p = bed.occupant;
                        const isOcc = !!p;
                        const bedLabel = bed.room_no.endsWith('A') ? 'Bed A' : (bed.room_no.endsWith('B') ? 'Bed B' : `Bed ${index + 1}`);
                        
                        let bg = index === 0 ? '#f0f8ff' : '#fffde7'; 
                        if (isOcc) bg = '#f5f5f5'; 

                        let badgeColor = null;
                        let badgeText = null;
                        let courseTag = '';
                        let tagStyle = {};

                        if (isOcc) {
                            const conf = (p.conf_no || '').toUpperCase();
                            const isOld = conf.startsWith('O') || conf.startsWith('S');
                            badgeText = isOld ? 'O' : 'N';
                            badgeColor = isOld ? '#007bff' : '#ffc107';
                            
                            // Tag Logic
                            courseTag = getCourseTag(p.course_name);
                            tagStyle = getTagStyle(courseTag);
                        }

                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)}
                                 style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative' }}>
                                <div style={{fontSize:'9px', fontWeight:'bold', color:'#777', textAlign:'center', marginBottom:'2px'}}>{bedLabel}</div>
                                {isOcc ? (
                                    <div style={{textAlign:'center', lineHeight:'1'}}>
                                        <div style={{fontSize:'10px', fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'3px'}}>{p.full_name.split(' ')[0]}</div>
                                        
                                        {/* ✅ BIG VISIBLE TAG (Centered) */}
                                        {courseTag && (
                                            <div style={{display:'flex', justifyContent:'center'}}>
                                                <span style={{
                                                    fontSize:'9px', 
                                                    fontWeight:'bold', 
                                                    background: tagStyle.bg, 
                                                    color: tagStyle.color, 
                                                    border: tagStyle.border,
                                                    padding:'0 4px', 
                                                    borderRadius:'3px'
                                                }}>
                                                    {courseTag}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : <div style={{fontSize:'10px', color:'rgba(0,0,0,0.1)', textAlign:'center'}}>🛏️</div>}

                                {isOcc && (
                                    <div style={{
                                        position: 'absolute', top: '2px', right: '2px',
                                        width: '14px', height: '14px', borderRadius: '50%',
                                        background: badgeColor, color: badgeText === 'N' ? 'black' : 'white',
                                        fontSize: '9px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid white'
                                    }}>
                                        {badgeText}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {sortedBeds.length < 2 && <div style={{background:'#f5f5f5'}}></div>}
                </div>
            </div>
        );
    };

    // --- RENDER COMPONENT: Pathway ---
    const Pathway = ({ label }) => (
        <div style={{textAlign:'center', background:'#e0e0e0', color:'#555', fontWeight:'bold', fontSize:'11px', padding:'4px', margin:'10px 0', borderRadius:'4px', border: '1px dashed #999', letterSpacing: '2px'}}>
            {label}
        </div>
    );

    // --- BLOCK SECTION ---
    const BlockSection = ({ title, color, rangeStart, rangeEnd, children, bg = '#fff' }) => {
        const stats = rangeStart && rangeEnd ? getStats(rangeStart, rangeEnd) : { hasRooms: false };
        return (
            <div style={{border:`2px solid ${color}`, borderRadius:'10px', padding:'15px', background: bg}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${color}33`, paddingBottom:'5px', marginBottom:'10px'}}>
                    <h3 style={{margin:0, color:color, fontSize:'16px'}}>{title}</h3>
                    {stats.hasRooms && (
                        <span style={{fontSize:'12px', fontWeight:'bold', background: stats.isFull ? color : '#f0f0f0', color: stats.isFull ? 'white' : color, padding:'2px 8px', borderRadius:'12px', border: `1px solid ${color}`}}>
                            {stats.text}
                        </span>
                    )}
                </div>
                {children}
            </div>
        );
    };

    const otherRooms = getOthers();

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            {/* BLOCK A */}
            <BlockSection title="BLOCK A (Double Beds)" color="#0056b3" rangeStart={301} rangeEnd={320}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(301, 306).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(307, 311).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                    <div></div> 
                </div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(312, 316).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                    <div></div>
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(317, 320).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </BlockSection>

            {/* BLOCK B */}
            <BlockSection title="BLOCK B (Single Beds)" color="#f57f17" rangeStart={321} rangeEnd={343}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(321, 326).map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(327, 332).map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                </div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(333, 338).map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>
                    {getRange(339, 343).map(g => <SingleBedBox key={g.baseNum} group={g} />)}
                    <div></div>
                </div>
            </BlockSection>

            {/* BLOCK C */}
            <BlockSection title="BLOCK C (Double Beds)" color="#2e7d32" rangeStart={344} rangeEnd={363}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                    {getRange(344, 348).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                    {getRange(349, 353).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                    {getRange(354, 358).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                    {getRange(359, 363).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}
                </div>
            </BlockSection>

            {/* OTHERS */}
            {otherRooms.length > 0 && (
                <BlockSection title="OTHER ACCOMMODATION / EMERGENCY" color="#555" bg="#f5f5f5">
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px', width:'100%'}}>
                        {otherRooms.map(g => (g.beds.length > 1 ? <DoubleBedBox key={g.baseNum} group={g} /> : <SingleBedBox key={g.baseNum} group={g} />))}
                    </div>
                </BlockSection>
            )}
        </div>
    );
}
