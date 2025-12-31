import React, { useState, useEffect } from 'react';
import { Users, Plus, Save, Trash2, Printer, Coffee, Bell, Shield, Briefcase, UserCheck, Edit, Heart } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function SevaBoard({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Server Form State
  const [newServer, setNewServer] = useState({
      full_name: '',
      gender: 'Male',
      age: '',
      mobile_no: '',
      duty: 'Kitchen', // Default duty
      room_no: '',
      conf_no: 'SEV-' + Math.floor(Math.random() * 1000) // Auto-gen ID
  });

  const DUTIES = [
      { label: 'Kitchen', color: '#e65100', icon: <Coffee size={14}/> },
      { label: 'Dining Hall', color: '#f57c00', icon: <Coffee size={14}/> },
      { label: 'Dhamma Hall', color: '#1976d2', icon: <Bell size={14}/> },
      { label: 'Manager', color: '#d32f2f', icon: <Briefcase size={14}/> },
      { label: 'Office', color: '#00796b', icon: <Briefcase size={14}/> },
      { label: 'Site/Guard', color: '#388e3c', icon: <Shield size={14}/> },
      { label: 'Registration', color: '#512da8', icon: <UserCheck size={14}/> },
      { label: 'Cleaning', color: '#795548', icon: <Users size={14}/> }
  ];

  // --- FETCH SERVERS ---
  const fetchServers = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/courses/${courseId}/participants`);
          const data = await res.json();
          // Filter only people marked as 'Server' or with 'SEV' in conf_no
          const filtered = data.filter(p => 
              (p.conf_no && p.conf_no.startsWith('SEV')) || 
              (p.remarks && p.remarks.includes('Server')) ||
              p.status === 'Server'
          );
          setServers(filtered);
      } catch (e) { console.error(e); }
      setLoading(false);
  };

  useEffect(() => { fetchServers(); }, [courseId]);

  // --- ACTIONS ---
  const handleAddServer = async (e) => {
      e.preventDefault();
      try {
          const payload = {
              ...newServer,
              course_id: courseId,
              status: 'Server', // Important Flag
              remarks: `Duty: ${newServer.duty}`,
              conf_no: `SEV-${Math.floor(1000 + Math.random() * 9000)}` // Ensure unique ID
          };
          
          await fetch(`${API_URL}/check-in`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(payload) 
          });
          
          setShowAddModal(false);
          setNewServer({ full_name: '', gender: 'Male', age: '', mobile_no: '', duty: 'Kitchen', room_no: '', conf_no: '' });
          fetchServers();
      } catch (err) { alert("Failed to add server"); }
  };

  const updateDuty = async (participantId, newDuty) => {
      // Just update the remarks/duty field
      await fetch(`${API_URL}/participants/${participantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarks: `Duty: ${newDuty}` })
      });
      fetchServers();
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Remove this server?")) return;
      await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' });
      fetchServers();
  };

  // --- PRINT SEVA CARD ---
  const printCard = (s) => {
      const dutyObj = DUTIES.find(d => (s.remarks || '').includes(d.label)) || DUTIES[0];
      const html = `
        <html>
          <head>
            <style>
              @page { size: 54mm 86mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: sans-serif; text-align: center; border: 2px solid black; height: 100vh; box-sizing: border-box; }
              .header { background: ${dutyObj.color}; color: white; padding: 10px 0; font-weight: bold; text-transform: uppercase; -webkit-print-color-adjust: exact; }
              .name { font-size: 18px; font-weight: 900; margin: 15px 0 5px 0; }
              .role { font-size: 14px; color: #555; font-weight: bold; margin-bottom: 10px; }
              .duty-badge { border: 2px solid ${dutyObj.color}; color: ${dutyObj.color}; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
              .footer { position: absolute; bottom: 0; width: 100%; padding: 10px 0; font-size: 10px; color: #777; border-top: 1px solid #ccc; }
            </style>
          </head>
          <body>
            <div class="header">DHAMMA SEVA</div>
            <div class="name">${s.full_name}</div>
            <div class="role">${s.gender} • Age: ${s.age}</div>
            <div class="duty-badge">${dutyObj.label.toUpperCase()}</div>
            <div style="margin-top: 10px; font-size: 12px;">Room: <strong>${s.room_no || '-'}</strong></div>
            <div class="footer">Dhamma Nagajjuna</div>
          </body>
        </html>
      `;
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: 'none' });
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open(); doc.write(html); doc.close();
      iframe.onload = () => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
      };
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
         <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
             <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#d32f2f'}}><Heart size={24}/> Seva Board</h2>
             <select style={{...styles.input, maxWidth:'250px'}} onChange={e=>setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c=><option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
         </div>
         <button onClick={()=>setShowAddModal(true)} disabled={!courseId} style={{...styles.btn(true), background:'#d32f2f', color:'white', opacity: !courseId ? 0.5 : 1}}><Plus size={18}/> Add Server</button>
      </div>

      {/* SERVER LIST */}
      <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
        {servers.map(s => {
            const currentDuty = DUTIES.find(d => (s.remarks || '').includes(d.label)) || { label: 'Unassigned', color: '#ccc' };
            
            return (
              <div key={s.participant_id} style={{background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'15px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', top:0, left:0, width:'5px', height:'100%', background: currentDuty.color}}></div>
                  
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginLeft:'10px'}}>
                      <div>
                          <div style={{fontWeight:'bold', fontSize:'16px', color:'#333'}}>{s.full_name}</div>
                          <div style={{fontSize:'12px', color:'#777'}}>{s.gender} • {s.age} Yrs</div>
                          <div style={{fontSize:'12px', color:'#777', marginTop:'2px'}}>📱 {s.mobile_no || 'No Phone'}</div>
                      </div>
                      <div style={{background:'#f5f5f5', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', fontWeight:'bold'}}>{s.room_no || 'No Room'}</div>
                  </div>

                  {/* DUTY SELECTOR */}
                  <div style={{marginTop:'15px', marginLeft:'10px'}}>
                      <label style={{fontSize:'11px', fontWeight:'bold', color:'#999', display:'block', marginBottom:'4px'}}>ASSIGNED DUTY</label>
                      <select 
                        value={currentDuty.label} 
                        onChange={(e) => updateDuty(s.participant_id, e.target.value)}
                        style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'13px', fontWeight:'bold', color: currentDuty.color}}
                      >
                          {DUTIES.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                      </select>
                  </div>

                  {/* ACTIONS */}
                  <div style={{marginTop:'15px', paddingTop:'10px', borderTop:'1px solid #f0f0f0', display:'flex', gap:'10px', marginLeft:'10px'}}>
                      <button onClick={()=>printCard(s)} style={{flex:1, padding:'6px', background:'#e3f2fd', color:'#0d47a1', border:'none', borderRadius:'4px', cursor:'pointer', display:'flex', justifyContent:'center', gap:'5px', fontSize:'12px', alignItems:'center'}}><Printer size={14}/> ID Card</button>
                      <button onClick={()=>handleDelete(s.participant_id)} style={{padding:'6px 10px', background:'#ffebee', color:'#c62828', border:'none', borderRadius:'4px', cursor:'pointer'}}><Trash2 size={14}/></button>
                  </div>
              </div>
            );
        })}
        
        {servers.length === 0 && courseId && (
            <div style={{gridColumn:'1 / -1', textAlign:'center', padding:'40px', color:'#ccc'}}>
                <Users size={48} style={{marginBottom:'10px', opacity:0.2}}/>
                <div>No Servers assigned to this course yet.</div>
            </div>
        )}
      </div>

      {/* ADD SERVER MODAL */}
      {showAddModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'400px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
                  <h3 style={{marginTop:0, color:'#d32f2f', display:'flex', alignItems:'center', gap:'10px'}}><Plus size={20}/> Add Dhamma Server</h3>
                  <form onSubmit={handleAddServer}>
                      <div style={{marginBottom:'10px'}}><label style={styles.label}>Name</label><input required style={styles.input} value={newServer.full_name} onChange={e=>setNewServer({...newServer, full_name:e.target.value})} placeholder="Full Name"/></div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
                          <div><label style={styles.label}>Gender</label><select style={styles.input} value={newServer.gender} onChange={e=>setNewServer({...newServer, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
                          <div><label style={styles.label}>Age</label><input required type="number" style={styles.input} value={newServer.age} onChange={e=>setNewServer({...newServer, age:e.target.value})} placeholder="Age"/></div>
                      </div>
                      <div style={{marginBottom:'10px'}}><label style={styles.label}>Mobile</label><input style={styles.input} value={newServer.mobile_no} onChange={e=>setNewServer({...newServer, mobile_no:e.target.value})} placeholder="Phone Number"/></div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
                          <div><label style={styles.label}>Duty</label><select style={styles.input} value={newServer.duty} onChange={e=>setNewServer({...newServer, duty:e.target.value})}>{DUTIES.map(d=><option key={d.label} value={d.label}>{d.label}</option>)}</select></div>
                          <div><label style={styles.label}>Room</label><input style={styles.input} value={newServer.room_no} onChange={e=>setNewServer({...newServer, room_no:e.target.value})} placeholder="Room"/></div>
                      </div>
                      <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                          <button type="button" onClick={()=>setShowAddModal(false)} style={styles.btn(false)}>Cancel</button>
                          <button type="submit" style={{...styles.btn(true), background:'#d32f2f', color:'white'}}>Save Server</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
