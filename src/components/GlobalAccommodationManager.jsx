import React, { useState, useEffect } from 'react';
import { Home, Briefcase, User, Bed, LogOut, Settings, AlertCircle, X, FileText } from 'lucide-react';
import MaleBlockLayout from './MaleBlockLayout';
import FemaleBlockLayout from './FemaleBlockLayout';
import AutoAllocationTool from './AutoAllocationTool'; // ✅ NEW IMPORT
import { API_URL, styles } from '../config';

export default function GlobalAccommodationManager() {
    const [occupancy, setOccupancy] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [viewMode, setViewMode] = useState('Male'); // Male | Female
    
    // ✅ NEW STATE for Auto-Allocator
    const [showAutoTool, setShowAutoTool] = useState(false);

    // DND State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [draggedStudent, setDraggedStudent] = useState(null);
    const [rooms, setRooms] = useState([]);
    
    // Stats & Reporting
    const [stats, setStats] = useState({ total: 0, occupied: 0, male: 0, female: 0 });
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        fetchRooms();
        fetchOccupancy();
        fetch(`${API_URL}/courses`).then(res => res.json()).then(setCourses);
    }, []);

    useEffect(() => {
        fetchOccupancy();
    }, [selectedCourse]);

    const fetchRooms = () => {
        fetch(`${API_URL}/rooms`).then(res => res.json()).then(setRooms);
    };

    const fetchOccupancy = async () => {
        const res = await fetch(`${API_URL}/rooms/occupancy`);
        const data = await res.json();
        
        let filtered = data;
        if (selectedCourse) {
            filtered = data.filter(p => String(p.course_id) === String(selectedCourse));
        }

        setOccupancy(filtered);
        
        // Calculate Stats
        const totalBeds = 235; // Fixed capacity based on layout
        const occ = filtered.length;
        const male = filtered.filter(p => (p.gender||'').toLowerCase().startsWith('m')).length;
        const female = filtered.filter(p => (p.gender||'').toLowerCase().startsWith('f')).length;
        setStats({ total: totalBeds, occupied: occ, male, female });
    };

    const handleDrop = async (student, targetRoom) => {
        if (!student || !targetRoom) return;
        
        // Validation
        if (targetRoom.occupant) {
            alert("⛔ Room is already occupied!");
            return;
        }

        const confirmMsg = `Move ${student.full_name} to Room ${targetRoom.room_no}?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`${API_URL}/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: student.participant_id,
                    roomNo: targetRoom.room_no,
                    courseId: student.course_id, // Ensure course ID is passed
                    // Preserve other fields
                    confNo: student.conf_no,
                    gender: student.gender
                })
            });

            if (res.ok) {
                fetchOccupancy(); // Refresh
                setDraggedStudent(null);
            } else {
                alert("Move failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Network Error");
        }
    };

    const handleUnassign = async (student) => {
        if (!window.confirm(`Remove ${student.full_name} from Room ${student.room_no}?`)) return;
        
        try {
            // We use the same check-in endpoint but send empty room
            const res = await fetch(`${API_URL}/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: student.participant_id,
                    roomNo: null, // Clear room
                    courseId: student.course_id,
                    confNo: student.conf_no
                })
            });
            if (res.ok) fetchOccupancy();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{...styles.card, maxWidth:'100%', height:'85vh', display:'flex', flexDirection:'column', padding:0, overflow:'hidden'}}>
            
            {/* --- HEADER CONTROLS --- */}
            <div style={{padding:'15px', background:'#fff', borderBottom:'1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', zIndex:10}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{background:'#007bff', padding:'8px', borderRadius:'8px', color:'white'}}><Bed size={20}/></div>
                    <div>
                        <h2 style={{margin:0, fontSize:'18px', color:'#2c3e50'}}>Accommodation Manager</h2>
                        <div style={{fontSize:'12px', color:'#777'}}>Global View & Drag-and-Drop Moves</div>
                    </div>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    {/* Course Filter */}
                    <select 
                        style={{...styles.input, padding:'8px', width:'200px', fontWeight:'bold', borderColor:'#007bff'}} 
                        value={selectedCourse} 
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">-- ALL COURSES --</option>
                        {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                    </select>

                    {/* View Toggles */}
                    <div style={{background:'#f1f3f5', padding:'4px', borderRadius:'20px', display:'flex'}}>
                        <button onClick={()=>setViewMode('Male')} style={{padding:'6px 15px', borderRadius:'16px', border:'none', background: viewMode==='Male'?'#007bff':'transparent', color: viewMode==='Male'?'white':'#555', fontWeight:'bold', cursor:'pointer', transition:'0.2s'}}>Male Block</button>
                        <button onClick={()=>setViewMode('Female')} style={{padding:'6px 15px', borderRadius:'16px', border:'none', background: viewMode==='Female'?'#e91e63':'transparent', color: viewMode==='Female'?'white':'#555', fontWeight:'bold', cursor:'pointer', transition:'0.2s'}}>Female Block</button>
                    </div>

                    {/* ✅ AUTO-ALLOCATE BUTTON */}
                    <button 
                        onClick={() => setShowAutoTool(true)} 
                        disabled={!selectedCourse}
                        style={{
                            display:'flex', alignItems:'center', gap:'6px', 
                            background: selectedCourse ? 'linear-gradient(45deg, #6a11cb, #2575fc)' : '#e0e0e0', 
                            color: selectedCourse ? 'white' : '#999', 
                            border:'none', padding:'8px 15px', 
                            borderRadius:'20px', 
                            cursor: selectedCourse ? 'pointer' : 'not-allowed', 
                            fontWeight:'bold',
                            boxShadow: selectedCourse ? '0 4px 10px rgba(106, 17, 203, 0.3)' : 'none'
                        }}
                        title={!selectedCourse ? "Select a specific course first" : "Open Auto-Allocation Assistant"}
                    >
                        <Settings size={16}/> Auto-Allocate
                    </button>

                    <button onClick={()=>setShowReport(true)} style={{display:'flex', alignItems:'center', gap:'6px', background:'#28a745', color:'white', border:'none', padding:'8px 15px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold'}}>
                        <FileText size={16}/> Report
                    </button>
                </div>
            </div>

            {/* --- STATS BAR --- */}
            <div style={{background:'#2c3e50', color:'white', padding:'8px 20px', display:'flex', gap:'30px', fontSize:'13px', fontWeight:'bold'}}>
                <span>Total Capacity: {stats.total}</span>
                <span>Occupied: {stats.occupied} ({Math.round(stats.occupied/stats.total*100)}%)</span>
                <span style={{color:'#90caf9'}}>Male: {stats.male}</span>
                <span style={{color:'#f48fb1'}}>Female: {stats.female}</span>
                <span style={{marginLeft:'auto', color:'#cfd8dc'}}>Showing: {selectedCourse ? 'Filtered Course' : 'All Occupancy'}</span>
            </div>

            {/* --- MAIN LAYOUT AREA --- */}
            <div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f8f9fa'}}>
                {viewMode === 'Male' ? (
                    <MaleBlockLayout 
                        rooms={rooms} 
                        occupancy={occupancy} 
                        onRoomClick={(bed) => {
                            if(bed.occupant) handleUnassign(bed.occupant);
                            else if(draggedStudent) handleDrop(draggedStudent, bed);
                            else alert("Drag a student here to assign.");
                        }} 
                    />
                ) : (
                    <FemaleBlockLayout 
                        rooms={rooms} 
                        occupancy={occupancy} 
                        onRoomClick={(bed) => {
                            if(bed.occupant) handleUnassign(bed.occupant);
                            else if(draggedStudent) handleDrop(draggedStudent, bed);
                            else alert("Drag a student here to assign.");
                        }} 
                    />
                )}
            </div>

            {/* --- REPORT MODAL --- */}
            {showReport && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
                    <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px', maxHeight:'80vh', overflowY:'auto'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                            <h3>Empty Beds Report</h3>
                            <button onClick={()=>setShowReport(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
                        </div>
                        <div style={{fontSize:'13px'}}>
                            <h4>Male Block (Empty)</h4>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'20px'}}>
                                {rooms.filter(r => r.gender_type==='Male' && !occupancy.find(o=>o.room_no===r.room_no)).map(r => (
                                    <span key={r.room_id} style={{background:'#e3f2fd', padding:'2px 6px', borderRadius:'4px'}}>{r.room_no}</span>
                                ))}
                            </div>
                            <h4>Female Block (Empty)</h4>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                                {rooms.filter(r => r.gender_type==='Female' && !occupancy.find(o=>o.room_no===r.room_no)).map(r => (
                                    <span key={r.room_id} style={{background:'#fce4ec', padding:'2px 6px', borderRadius:'4px'}}>{r.room_no}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{marginTop:'30px', textAlign:'right'}}>
                            <button onClick={()=>window.print()} style={styles.btn(true)}>Print Report</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ✅ AUTO-ALLOCATION MODAL --- */}
            {showAutoTool && (
                <AutoAllocationTool 
                    courseId={selectedCourse} 
                    onClose={() => setShowAutoTool(false)} 
                    onSuccess={() => fetchOccupancy()} 
                />
            )}

        </div>
    );
}
