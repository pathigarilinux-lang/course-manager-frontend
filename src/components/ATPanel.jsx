import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';
import { API_URL, styles } from '../config';

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };
const tdPrint = { padding: '8px', border: '1px solid #000', fontSize:'12px', verticalAlign:'middle' };

export default function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [showKitchenReport, setShowKitchenReport] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);
  
  const handleSave = async (e) => { e.preventDefault(); await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) }); setEditingStudent(null); const res = await fetch(`${API_URL}/courses/${courseId}/participants`); setParticipants(await res.json()); };
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (showKitchenReport) {
      return (
          <div style={styles.card}>
              <div className="no-print"><button onClick={() => setShowKitchenReport(false)} style={styles.btn(false)}>Back</button><button onClick={()=>window.print()} style={{...styles.toolBtn('#ff9800'), marginLeft:'10px'}}>Print</button></div>
              <div className="print-area"><h1 style={{textAlign:'center'}}>Kitchen Report</h1><table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}><thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Food</th><th style={thPrint}>Medical</th></tr></thead><tbody>{participants.filter(p => (p.evening_food && p.evening_food !== 'None') || p.medical_info).map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody></table></div>
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><h2>AT Panel</h2><button onClick={()=>setShowKitchenReport(true)} style={styles.toolBtn('#ff9800')}><Utensils size={16}/> Report</button></div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><select style={styles.input} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><input style={styles.input} placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
      {courseId && <div style={{maxHeight:'500px', overflowY:'auto'}}><table style={{width:'100%', borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left', background:'#f9f9f9'}}><th>Name</th><th>Food</th><th>Medical</th><th>Action</th></tr></thead><tbody>{filtered.map((p) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td><strong>{p.full_name}</strong></td><td>{p.evening_food || '-'}</td><td>{p.medical_info || '-'}</td><td><button onClick={() => setEditingStudent(p)} style={styles.toolBtn('#007bff')}>Edit</button></td></tr>))}</tbody></table></div>}
      {editingStudent && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', width:'500px'}}><h3>Update</h3><form onSubmit={handleSave}><label>Food</label><select style={styles.input} value={editingStudent.evening_food || ''} onChange={e => setEditingStudent({...editingStudent, evening_food: e.target.value})}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select><label>Medical</label><textarea style={{...styles.input, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => setEditingStudent({...editingStudent, medical_info: e.target.value})} /><div style={{marginTop:'10px'}}><button type="button" onClick={() => setEditingStudent(null)} style={styles.btn(false)}>Cancel</button><button type="submit" style={{...styles.btn(true), background:'#28a745', color:'white'}}>Save</button></div></form></div></div>)}
    </div>
  );
}
