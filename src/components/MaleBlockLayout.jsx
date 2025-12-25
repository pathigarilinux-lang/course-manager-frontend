import React from 'react';
import { AlertCircle } from 'lucide-react';

const INDIAN_COMMODES = new Set([301,302,303,304,305,306,317,318,319,320,329,330,331,332,333,334,335,349,350,351,362,363]);

export default function MaleBlockLayout({ rooms, occupancy, onRoomClick }) {
    const getToiletInfo = (roomNumStr) => {
        const numMatch = String(roomNumStr).match(/(\d{3})/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;
        return INDIAN_COMMODES.has(num) ? { type: 'Indian', icon: '🟤', color: '#D84315', label: 'IND' } : { type: 'Western', icon: '🚽', color: '#0277bd', label: 'WES' };
    };

    const getRoomData = () => {
        const roomGroups = {};
        rooms.filter(r => r.gender_type === 'Male').forEach(r => {
            const numMatch = String(r.room_no).match(/^(\d{3})$/);
            const key = numMatch ? parseInt(numMatch[1]) : r.room_no;
            if (!roomGroups[key]) roomGroups[key] = { baseNum: key, beds: [], toilet: getToiletInfo(r.room_no) };
            const occupant = occupancy.find(p => p.room_no === r.room_no);
            roomGroups[key].beds.push({ ...r, occupant });
        });
        return roomGroups;
    };

    const allRooms = getRoomData();
    const getRange = (start, end) => { const list = []; for (let i = start; i <= end; i++) { if (allRooms[i]) list.push(allRooms[i]); } return list; };
    const getStats = (start, end) => {
        const groups = getRange(start, end);
        let total = 0, occupied = 0;
        groups.forEach(g => { total += g.beds.length; occupied += g.beds.filter(b => b.occupant).length; });
        return { text: `${occupied}/${total}`, isFull: total > 0 && total === occupied, hasRooms: total > 0 };
    };

    // ✅ CATCH ALL OTHER ROOMS
    const getOthers = () => {
        const standard = new Set([...Array.from({length: 63}, (_, i) => 301 + i)]);
        return Object.values(allRooms).filter(g => !standard.has(g.baseNum));
    };

    const SingleBedBox = ({ group }) => {
        const bed = group.beds[0];
        if (!bed) return null;
        const p = bed.occupant;
        const isOcc = !!p;
        const isMedical = typeof group.baseNum === 'number' && group.baseNum >= 321 && group.baseNum <= 328;
        let isOld = false, badgeText = null, badgeColor = null;
        if (isOcc) { const conf = (p.conf_no || '').toUpperCase(); isOld = conf.startsWith('O') || conf.startsWith('S'); badgeText = isOld ? 'O' : 'N'; badgeColor = isOld ? '#007bff' : '#ffc107'; }

        return (
            <div onClick={() => onRoomClick(bed)} title={isMedical ? "Medical" : ""} style={{ border: `2px solid ${isOcc ? '#ccc' : (isMedical ? '#ffcc80' : '#ddd')}`, borderRadius: '6px', background: isOcc ? '#f8f9fa' : (isMedical ? '#fff8e1' : 'white'), padding: '5px', cursor: 'pointer', minHeight: '70px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'2px', marginBottom:'2px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'2px'}}><span style={{fontWeight:'900', fontSize:'13px', color: isMedical ? '#e65100' : '#333'}}>{group.baseNum}</span>{isMedical && <AlertCircle size={10} color="#f57c00" />}</div>
                    <span style={{fontSize:'9px', background: group.toilet.color, color:'white', padding:'1px 3px', borderRadius:'3px', fontWeight:'bold'}}>{group.toilet.label}</span>
                </div>
                {isOcc ? (<div style={{fontSize:'10px', lineHeight:'1.1'}}><div style={{fontWeight:'bold', color:'#000'}}>{p.full_name}</div><div style={{fontSize:'9px', color:'#444'}}>{p.conf_no}</div></div>) : <div style={{fontSize:'9px', color: isMedical ? '#e65100' : '#ccc', textAlign:'center'}}>{isMedical ? 'MED/SR' : 'EMPTY'}</div>}
                {isOcc && (<div style={{position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', borderRadius: '50%', background: badgeColor, color: badgeText === 'N' ? 'black' : 'white', fontSize: '9px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white'}}>{badgeText}</div>)}
            </div>
        );
    };

    const DoubleBedBox = ({ group }) => {
        let sortedBeds = group.beds.sort((a,b) => a.room_no.localeCompare(b.room_no));
        if (group.baseNum === 363 && sortedBeds.length > 2) sortedBeds = sortedBeds.slice(0, 2);
        return (
            <div style={{border: '1px solid #999', borderRadius: '6px', overflow:'hidden', background:'white'}}>
                <div style={{background:'#eee', padding:'2px 5px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ccc'}}>
                    <span style={{fontWeight:'900', fontSize:'12px'}}>{group.baseNum}</span>
                    <span style={{fontSize:'8px', background: group.toilet.color, color:'white', padding:'1px 3px', borderRadius:'3px'}}>{group.toilet.label}</span>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#ccc'}}> 
                    {sortedBeds.map((bed, index) => {
                        const p = bed.occupant;
                        const isOcc = !!p;
                        let bg = index === 0 ? '#f0f8ff' : '#fffde7'; 
                        if (isOcc) bg = '#f5f5f5'; 
                        let badgeColor = null, badgeText = null;
                        if (isOcc) { const conf = (p.conf_no || '').toUpperCase(); const isOld = conf.startsWith('O') || conf.startsWith('S'); badgeText = isOld ? 'O' : 'N'; badgeColor = isOld ? '#007bff' : '#ffc107'; }
                        return (
                            <div key={bed.room_id} onClick={() => onRoomClick(bed)} style={{ background: bg, padding: '4px', cursor: 'pointer', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position:'relative' }}>
                                <div style={{fontSize:'8px', fontWeight:'bold', color:'#777', textAlign:'center'}}>{bed.room_no.endsWith('A') ? 'Bed A' : (bed.room_no.endsWith('B') ? 'Bed B' : `Bed ${index + 1}`)}</div>
                                {isOcc ? (<div style={{textAlign:'center', lineHeight:'1'}}><div style={{fontSize:'9px', fontWeight:'bold'}}>{p.full_name.split(' ')[0]}</div><div style={{fontSize:'8px', color:'#444'}}>{p.conf_no}</div></div>) : <div style={{fontSize:'10px', color:'rgba(0,0,0,0.1)', textAlign:'center'}}>🛏️</div>}
                                {isOcc && (<div style={{position: 'absolute', top: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', background: badgeColor, color: badgeText === 'N' ? 'black' : 'white', fontSize: '8px', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white'}}>{badgeText}</div>)}
                            </div>
                        );
                    })}
                    {sortedBeds.length < 2 && <div style={{background:'#f5f5f5'}}></div>}
                </div>
            </div>
        );
    };

    const Pathway = ({ label }) => (<div style={{textAlign:'center', background:'#e0e0e0', color:'#555', fontWeight:'bold', fontSize:'11px', padding:'4px', margin:'10px 0', borderRadius:'4px', border: '1px dashed #999', letterSpacing: '2px'}}>{label}</div>);
    const BlockSection = ({ title, color, rangeStart, rangeEnd, children }) => {
        const stats = getStats(rangeStart, rangeEnd);
        return (
            <div style={{border:`2px solid ${color}`, borderRadius:'10px', padding:'15px', background:'#fff'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${color}33`, paddingBottom:'5px', marginBottom:'10px'}}>
                    <h3 style={{margin:0, color:color, fontSize:'16px'}}>{title}</h3>
                    {stats.hasRooms && (<span style={{fontSize:'12px', fontWeight:'bold', background: stats.isFull ? color : '#f0f0f0', color: stats.isFull ? 'white' : color, padding:'2px 8px', borderRadius:'12px', border: `1px solid ${color}`}}>{stats.text}</span>)}
                </div>
                {children}
            </div>
        );
    };

    return (
        <div style={{display:'flex', flexDirection:'column', gap:'30px'}}>
            <BlockSection title="BLOCK A (Double Beds)" color="#0056b3" rangeStart={301} rangeEnd={320}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(301, 306).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(307, 311).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}<div></div></div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(312, 316).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}<div></div></div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(317, 320).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
            </BlockSection>

            <BlockSection title="BLOCK B (Single Beds)" color="#f57f17" rangeStart={321} rangeEnd={343}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(321, 326).map(g => <SingleBedBox key={g.baseNum} group={g} />)}</div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(327, 332).map(g => <SingleBedBox key={g.baseNum} group={g} />)}</div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(333, 338).map(g => <SingleBedBox key={g.baseNum} group={g} />)}</div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px'}}>{getRange(339, 343).map(g => <SingleBedBox key={g.baseNum} group={g} />)}<div></div></div>
            </BlockSection>

            <BlockSection title="BLOCK C (Double Beds)" color="#2e7d32" rangeStart={344} rangeEnd={363}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>{getRange(344, 348).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>{getRange(349, 353).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
                <Pathway label="⬇️ CORRIDOR / WALKWAY ⬆️" />
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>{getRange(354, 358).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
                <div style={{height:'10px'}}></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>{getRange(359, 363).map(g => <DoubleBedBox key={g.baseNum} group={g} />)}</div>
            </BlockSection>

            {/* ✅ TEMPORARY / OTHERS */}
            {getOthers().length > 0 && (
                <div style={{border:'2px dashed #555', borderRadius:'10px', padding:'15px', background:'#f5f5f5'}}>
                    <h3 style={{marginTop:0, color:'#555', borderBottom:'1px solid #ddd', paddingBottom:'5px', fontSize:'16px'}}>Temporary / Other Rooms</h3>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'10px'}}>
                        {getOthers().map(g => g.beds.length > 1 ? <DoubleBedBox key={g.baseNum} group={g}/> : <SingleBedBox key={g.baseNum} group={g}/>)}
                    </div>
                </div>
            )}
        </div>
    );
}
