import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Search, Calendar, Phone, User, MapPin, 
    ChevronRight, History, Award, Mail, FileText 
} from 'lucide-react';
import { API_URL, styles } from '../config';

// --- PREMIUM STYLES (Matching App.jsx) ---
const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0'
};

const badgeStyle = (type) => {
    switch (type) {
        case 'Old Student': return { bg: '#e0f2f1', color: '#00695c' }; // Teal
        case 'New Student': return { bg: '#fff3e0', color: '#e65100' }; // Orange
        case 'Server': return { bg: '#f3e5f5', color: '#7b1fa2' }; // Purple
        default: return { bg: '#f1f5f9', color: '#475569' };
    }
};

export default function AlumniDirectory({ courses }) {
    const [allRecords, setAllRecords] = useState([]);
    const [uniqueAlumni, setUniqueAlumni] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlumni, setSelectedAlumni] = useState(null);

    // 1. FETCH ALL DATA
    useEffect(() => {
        const fetchAllHistory = async () => {
            if (!courses || courses.length === 0) return;
            setIsLoading(true);
            
            try {
                // Fetch participants from ALL courses in parallel
                const promises = courses.map(c => 
                    fetch(`${API_URL}/courses/${c.course_id}/participants`)
                        .then(r => r.json())
                        .then(data => Array.isArray(data) ? data.map(p => ({ ...p, courseName: c.course_name, courseStart: c.start_date, courseEnd: c.end_date, teacher: c.teacher_name })) : [])
                        .catch(() => [])
                );

                const results = await Promise.all(promises);
                const flatList = results.flat();
                setAllRecords(flatList);
                processAlumni(flatList);
            } catch (err) {
                console.error("Alumni fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllHistory();
    }, [courses]);

    // 2. PROCESS & DE-DUPLICATE (Group by Phone)
    const processAlumni = (records) => {
        const groups = {};

        records.forEach(r => {
            // Key: Clean Phone Number (Primary) OR Name+Age (Fallback)
            let key = r.mobile ? r.mobile.replace(/\D/g, '') : `${r.full_name}-${r.age}`;
            if (!key || key.length < 5) key = `UNKNOWN-${r.participant_id}`;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    name: r.full_name,
                    phone: r.mobile || '-',
                    gender: r.gender,
                    age: r.age,
                    latestStatus: r.status, // Most recent status
                    history: [],
                    category: r.category || (String(r.conf_no).startsWith('O') ? 'Old Student' : 'New Student')
                };
            }
            
            // Add Course History
            groups[key].history.push({
                course: r.courseName,
                date: r.courseStart,
                role: r.category || 'Student',
                status: r.status,
                confNo: r.conf_no,
                seat: r.dining_seat_no
            });
        });

        // Convert to Array & Sort by Name
        const alumniList = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
        setUniqueAlumni(alumniList);
    };

    // 3. SEARCH FILTER
    const filteredList = useMemo(() => {
        if (!searchTerm) return uniqueAlumni.slice(0, 50); // Show first 50 initially for performance
        const lower = searchTerm.toLowerCase();
        return uniqueAlumni.filter(a => 
            a.name.toLowerCase().includes(lower) || 
            a.phone.includes(lower) ||
            a.history.some(h => String(h.confNo).toLowerCase().includes(lower))
        );
    }, [uniqueAlumni, searchTerm]);

    return (
        <div style={{animation: 'fadeIn 0.3s ease'}}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                    <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#1e293b'}}>
                        <History size={28} className="text-blue-600"/> Global Alumni Directory
                    </h2>
                    <div style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>
                        Connect records across all courses. Total Unique Students: <strong>{uniqueAlumni.length}</strong>
                    </div>
                </div>
                {isLoading && <span style={{color:'#e65100', fontWeight:'bold', fontSize:'12px'}}>Syncing Database...</span>}
            </div>

            {/* SEARCH BAR */}
            <div style={{...cardStyle, padding:'15px', marginBottom:'20px', display:'flex', gap:'15px', alignItems:'center'}}>
                <Search size={20} color="#94a3b8"/>
                <input 
                    style={{...styles.input, border:'none', fontSize:'16px', width:'100%', outline:'none'}} 
                    placeholder="Search Alumni by Name, Phone, or Old ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* RESULTS GRID */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'20px'}}>
                {filteredList.map(student => (
                    <div 
                        key={student.id} 
                        onClick={() => setSelectedAlumni(student)}
                        style={{
                            ...cardStyle, 
                            cursor:'pointer', transition:'all 0.2s', 
                            borderLeft: `4px solid ${String(student.gender).toLowerCase().startsWith('m') ? '#3b82f6' : '#ec4899'}`
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                            <div style={{fontWeight:'bold', fontSize:'16px', color:'#334155'}}>{student.name}</div>
                            <span style={{
                                fontSize:'10px', padding:'2px 8px', borderRadius:'12px', fontWeight:'bold',
                                background: badgeStyle(student.category).bg, color: badgeStyle(student.category).color
                            }}>
                                {student.history.length} Courses
                            </span>
                        </div>
                        
                        <div style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'13px', color:'#64748b'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}><Phone size={14}/> {student.phone}</div>
                            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                <Award size={14}/> Latest: {student.history[student.history.length-1].status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DETAIL MODAL (TIMELINE) */}
            {selectedAlumni && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                    <div style={{background:'white', width:'600px', maxHeight:'85vh', borderRadius:'16px', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                        
                        {/* Modal Header */}
                        <div style={{padding:'25px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div>
                                <h2 style={{margin:0, color:'#1e293b'}}>{selectedAlumni.name}</h2>
                                <div style={{display:'flex', gap:'15px', marginTop:'8px', fontSize:'13px', color:'#64748b'}}>
                                    <span style={{display:'flex', alignItems:'center', gap:'5px'}}><User size={14}/> {selectedAlumni.age} Yrs / {selectedAlumni.gender}</span>
                                    <span style={{display:'flex', alignItems:'center', gap:'5px'}}><Phone size={14}/> {selectedAlumni.phone}</span>
                                </div>
                            </div>
                            <button onClick={()=>setSelectedAlumni(null)} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Users size={16}/></button>
                        </div>

                        {/* Timeline Body */}
                        <div style={{padding:'25px', overflowY:'auto', background:'white'}}>
                            <h4 style={{marginTop:0, marginBottom:'20px', color:'#94a3b8', textTransform:'uppercase', fontSize:'11px', letterSpacing:'1px'}}>Dhamma Journey</h4>
                            
                            <div style={{display:'flex', flexDirection:'column', gap:'0'}}>
                                {selectedAlumni.history.map((event, idx) => (
                                    <div key={idx} style={{display:'flex', gap:'15px', position:'relative', paddingBottom:'25px'}}>
                                        {/* Timeline Line */}
                                        {idx !== selectedAlumni.history.length - 1 && (
                                            <div style={{position:'absolute', left:'7px', top:'20px', bottom:0, width:'2px', background:'#e2e8f0'}}></div>
                                        )}
                                        
                                        {/* Timeline Dot */}
                                        <div style={{
                                            width:'16px', height:'16px', borderRadius:'50%', 
                                            background: event.status === 'Completed' ? '#10b981' : (event.status === 'Attending' ? '#3b82f6' : '#cbd5e1'), 
                                            border:'3px solid white', boxShadow:'0 0 0 2px #e2e8f0', zIndex:2
                                        }}></div>

                                        <div style={{flex:1, marginTop:'-4px'}}>
                                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                                <strong style={{color:'#334155'}}>{event.course.split('/')[0]}</strong>
                                                <span style={{fontSize:'12px', color:'#64748b'}}>{new Date(event.date).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', border:'1px solid #f1f5f9', fontSize:'13px'}}>
                                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                                                    <div><span style={{color:'#94a3b8'}}>Status:</span> <span style={{fontWeight:'500'}}>{event.status}</span></div>
                                                    <div><span style={{color:'#94a3b8'}}>Role:</span> <span style={{fontWeight:'500'}}>{event.role}</span></div>
                                                    <div><span style={{color:'#94a3b8'}}>ID:</span> {event.confNo || '-'}</div>
                                                    <div><span style={{color:'#94a3b8'}}>Seat:</span> {event.seat || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{padding:'15px 25px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end'}}>
                            <button onClick={()=>setSelectedAlumni(null)} style={styles.btn(false)}>Close Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
