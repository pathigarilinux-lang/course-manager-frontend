import React, { useState, useEffect } from 'react';
import { 
    User, MapPin, Phone, Mail, Calendar, CheckCircle, 
    XCircle, Clock, Heart, Edit2, Save, LogOut 
} from 'lucide-react';
import { styles } from '../config';

// --- DB CONFIG (Reusing existing DB) ---
const DB_NAME = 'DhammaMasterDB';
const STORE_NAME = 'students';
const VERSION = 14; 

const dbHelper = {
    open: () => new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }),
    get: async (mobile) => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(mobile);
            req.onsuccess = () => resolve(req.result);
        });
    },
    update: async (student) => {
        const db = await dbHelper.open();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).put(student);
            req.onsuccess = () => resolve(req.result);
        });
    }
};

export default function SevaPassport() {
    const [step, setStep] = useState('login'); // login | profile
    const [mobileInput, setMobileInput] = useState('');
    const [student, setStudent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [msg, setMsg] = useState('');

    // --- LOGIN LOGIC ---
    const handleLogin = async () => {
        if (!mobileInput || mobileInput.length < 10) {
            setMsg('Please enter a valid 10-digit mobile number.');
            return;
        }
        try {
            const data = await dbHelper.get(mobileInput);
            if (data) {
                setStudent(data);
                setStep('profile');
                setMsg('');
            } else {
                setMsg('Number not found in Master Database. Please contact the Center.');
            }
        } catch (e) {
            console.error(e);
            setMsg('Database error.');
        }
    };

    // --- UPDATE LOGIC ---
    const handleSave = async () => {
        if (!student) return;
        await dbHelper.update({
            ...student,
            last_update: new Date().toISOString()
        });
        setIsEditing(false);
        setMsg('Profile Updated Successfully! Sadhu! Sadhu! Sadhu!');
        setTimeout(() => setMsg(''), 3000);
    };

    const toggleAvailability = async () => {
        const newStatus = student.seva_availability === 'Yes' ? 'No' : 'Yes';
        const updated = { ...student, seva_availability: newStatus };
        setStudent(updated);
        await dbHelper.update(updated);
    };

    // --- CALCULATE HISTORY ---
    const getHistory = () => {
        if (!student || !student.history) return [];
        return Object.entries(student.history)
            .filter(([course, count]) => count > 0)
            .map(([course, count]) => ({ course, count }));
    };

    const totalCourses = getHistory().reduce((sum, item) => sum + item.count, 0);

    // --- RENDER: LOGIN SCREEN ---
    if (step === 'login') {
        return (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'80vh', background:'#f8fafc'}}>
                <div style={{background:'white', padding:'40px', borderRadius:'20px', boxShadow:'0 10px 25px rgba(0,0,0,0.05)', textAlign:'center', width:'100%', maxWidth:'400px'}}>
                    <div style={{width:'60px', height:'60px', background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'}}>
                        <Heart size={30} color="#0284c7" />
                    </div>
                    <h2 style={{margin:'0 0 10px 0', color:'#1e293b'}}>Seva Passport</h2>
                    <p style={{color:'#64748b', fontSize:'14px', marginBottom:'30px'}}>Access your Dhamma service profile.</p>
                    
                    <input 
                        style={{...styles.input, width:'100%', padding:'12px', fontSize:'16px', textAlign:'center', marginBottom:'15px', border:'1px solid #cbd5e1'}}
                        placeholder="Enter Registered Mobile Number"
                        value={mobileInput}
                        onChange={e => setMobileInput(e.target.value.replace(/\D/g,''))}
                    />
                    
                    <button 
                        onClick={handleLogin}
                        style={{width:'100%', padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'8px', fontSize:'16px', fontWeight:'600', cursor:'pointer'}}
                    >
                        Login
                    </button>
                    {msg && <div style={{marginTop:'15px', color:'#ef4444', fontSize:'13px'}}>{msg}</div>}
                </div>
            </div>
        );
    }

    // --- RENDER: PROFILE DASHBOARD ---
    return (
        <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px', animation:'fadeIn 0.3s'}}>
            
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
                <div>
                    <h1 style={{margin:0, color:'#1e293b'}}>Jai Bhim / Namaste, {student.name.split(' ')[0]}</h1>
                    <div style={{fontSize:'13px', color:'#64748b'}}>Seva Passport • {student.mobile}</div>
                </div>
                <button onClick={() => setStep('login')} style={{background:'#f1f5f9', border:'none', padding:'8px 16px', borderRadius:'20px', color:'#64748b', cursor:'pointer', display:'flex', gap:'6px', alignItems:'center'}}>
                    <LogOut size={14}/> Logout
                </button>
            </div>

            {msg && <div style={{background:'#dcfce7', color:'#166534', padding:'10px', borderRadius:'8px', marginBottom:'20px', textAlign:'center', fontWeight:'600'}}>{msg}</div>}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                
                {/* LEFT: STATUS CARD */}
                <div style={{background:'white', padding:'25px', borderRadius:'16px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center'}}>
                    <div style={{fontSize:'14px', color:'#64748b', marginBottom:'15px', fontWeight:'600'}}>CURRENT AVAILABILITY</div>
                    
                    <button 
                        onClick={toggleAvailability}
                        style={{
                            width:'140px', height:'140px', borderRadius:'50%', border:'none', cursor:'pointer',
                            background: student.seva_availability === 'Yes' ? '#dcfce7' : '#fee2e2',
                            color: student.seva_availability === 'Yes' ? '#166534' : '#991b1b',
                            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition:'transform 0.1s'
                        }}
                    >
                        {student.seva_availability === 'Yes' ? <CheckCircle size={40} style={{marginBottom:'5px'}}/> : <XCircle size={40} style={{marginBottom:'5px'}}/>}
                        <div style={{fontSize:'18px', fontWeight:'bold'}}>{student.seva_availability === 'Yes' ? 'AVAILABLE' : 'BUSY'}</div>
                    </button>
                    
                    <p style={{fontSize:'12px', color:'#64748b', marginTop:'15px', maxWidth:'200px'}}>
                        Tap to change. This tells the center if you are free for upcoming courses.
                    </p>
                </div>

                {/* RIGHT: HISTORY CARD */}
                <div style={{background:'white', padding:'25px', borderRadius:'16px', border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                        <div style={{fontSize:'14px', color:'#64748b', fontWeight:'600'}}>MY PĀRAMĪ</div>
                        <div style={{background:'#f0f9ff', color:'#0369a1', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold'}}>
                            {totalCourses} Courses
                        </div>
                    </div>
                    
                    <div style={{maxHeight:'200px', overflowY:'auto'}}>
                        {getHistory().length === 0 ? (
                            <div style={{color:'#cbd5e1', textAlign:'center', marginTop:'30px'}}>No records yet. Start serving!</div>
                        ) : (
                            getHistory().map((item, idx) => (
                                <div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f8fafc'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#3b82f6'}}></div>
                                        <span style={{color:'#334155', fontWeight:'500'}}>{item.course} Course</span>
                                    </div>
                                    <span style={{fontWeight:'700', color:'#1e293b'}}>{item.count}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* BOTTOM: PROFILE DETAILS (FULL WIDTH) */}
                <div style={{gridColumn:'span 2', background:'white', padding:'25px', borderRadius:'16px', border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                        <div style={{fontSize:'14px', color:'#64748b', fontWeight:'600', display:'flex', alignItems:'center', gap:'8px'}}>
                            <User size={16}/> MY DETAILS
                        </div>
                        {!isEditing ? (
                            <button onClick={()=>setIsEditing(true)} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px'}}>
                                <Edit2 size={12}/> Edit Profile
                            </button>
                        ) : (
                            <button onClick={handleSave} style={{background:'#0f172a', color:'white', border:'none', borderRadius:'6px', padding:'6px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px'}}>
                                <Save size={12}/> Save Changes
                            </button>
                        )}
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                        <div>
                            <label style={{display:'block', fontSize:'11px', color:'#64748b', marginBottom:'4px'}}>Full Name (Official)</label>
                            <input disabled value={student.name} style={{...inputStyle, background:'#f8fafc', color:'#94a3b8'}} />
                        </div>
                        <div>
                            <label style={{display:'block', fontSize:'11px', color:'#64748b', marginBottom:'4px'}}>Mobile (Login Key)</label>
                            <input disabled value={student.mobile} style={{...inputStyle, background:'#f8fafc', color:'#94a3b8'}} />
                        </div>
                        <div>
                            <label style={{display:'block', fontSize:'11px', color:'#64748b', marginBottom:'4px'}}>Current City</label>
                            <input 
                                disabled={!isEditing} 
                                value={student.city} 
                                onChange={e => setStudent({...student, city: e.target.value})}
                                style={{...inputStyle, borderColor: isEditing ? '#3b82f6' : '#e2e8f0'}} 
                            />
                        </div>
                        <div>
                            <label style={{display:'block', fontSize:'11px', color:'#64748b', marginBottom:'4px'}}>Email Address</label>
                            <input 
                                disabled={!isEditing} 
                                value={student.email} 
                                onChange={e => setStudent({...student, email: e.target.value})}
                                style={{...inputStyle, borderColor: isEditing ? '#3b82f6' : '#e2e8f0'}} 
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

const inputStyle = {
    width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #e2e8f0', fontSize:'13px', color:'#1e293b'
};
