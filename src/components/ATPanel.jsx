import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Printer, Settings, AlertTriangle } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function ATPanel({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [showKitchenReport, setShowKitchenReport] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(setParticipants); }, [courseId]);

  const handleLocalChange = (field, value) => setEditingStudent(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setParticipants(prev => prev.map(p => p.participant_id === editingStudent.participant_id ? editingStudent : p));
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingStudent) });
    setEditingStudent(null);
  };

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => { const valA = a.conf_no || ''; const valB = b.conf_no || ''; return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA); });

  const printKitchenReport = () => {
      // Logic for Kitchen Report
      setShowKitchenReport(true);
      setTimeout(() => window.print(), 500);
  };

  if (showKitchenReport) {
      const kitchenData = participants.filter(p => (p.evening_food && p.evening_food !== 'None') || (p.medical_info && p.medical_info.trim() !== ''));
      return (
          <div style={cardStyle}>
              <div className="no-print"><button onClick={() => setShowKitchenReport(false)} style={btnStyle(false)}>← Back</button></div>
              <div className="print-area">
                  <h1 style={{textAlign:'center'}}>Kitchen & Medical Report</h1>
                  <table style={{width:'100%', borderCollapse:'collapse', marginTop:'20px'}}>
                      <thead><tr style={{borderBottom:'2px solid black'}}><th style={thPrint}>Room</th><th style={thPrint}>Name</th><th style={thPrint}>Evening Food</th><th style={thPrint}>Medical/Notes</th></tr></thead>
                      <tbody>{kitchenData.map(p => (<tr key={p.participant_id}><td style={tdPrint}><strong>{p.room_no}</strong></td><td style={tdPrint}>{p.full_name}</td><td style={tdPrint}>{p.evening_food}</td><td style={tdPrint}>{p.medical_info}</td></tr>))}</tbody>
                  </table>
              </div>
          </div>
      );
  }

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2>AT Panel</h2>
          <button onClick={printKitchenReport} disabled={!courseId} style={{...toolBtn('#ff9800')}}><Utensils size={16}/> Kitchen Report</button>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
        <input style={inputStyle} placeholder="Search Student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!courseId} />
      </div>
      {courseId && (
        <div style={{maxHeight:'500px', overflowY:'auto'}}>
           <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
             <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}>
               <th style={{padding:'10px'}}>S.N.</th><th style={{padding:'10px'}}>Name</th><th style={{padding:'10px', cursor:'pointer'}} onClick={toggleSort}>Conf {sortOrder==='asc'?'▲':'▼'}</th><th style={{padding:'10px'}}>Special SEAT</th><th style={{padding:'10px'}}>Food</th><th style={{padding:'10px'}}>Medical</th><th style={{padding:'10px'}}>Action</th>
             </tr></thead>
             <tbody>{filtered.map((p, i) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px', color:'#777'}}>{i+1}</td><td style={{padding:'10px'}}><strong>{p.full_name}</strong></td><td style={{padding:'10px'}}>{p.conf_no}</td><td style={{padding:'10px'}}>{p.special_seating || '-'}</td><td style={{padding:'10px'}}>{p.evening_food || '-'}</td><td style={{padding:'10px'}}>{p.medical_info || '-'}</td><td style={{padding:'10px'}}><button onClick={() => setEditingStudent(p)} style={{...toolBtn('#007bff'), padding:'5px 10px'}}>✏️ Detail</button></td></tr>))}</tbody>
           </table>
        </div>
      )}
      {editingStudent && (<div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}><div style={{background:'white', padding:'30px', borderRadius:'10px', width:'500px'}}><h3>Update: {editingStudent.full_name}</h3><form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'15px'}}><div><label style={labelStyle}>Special Seating</label><select style={inputStyle} value={editingStudent.special_seating || ''} onChange={(e) => handleLocalChange('special_seating', e.target.value)}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div><div><label style={labelStyle}>Evening Food</label><select style={inputStyle} value={editingStudent.evening_food || ''} onChange={e => handleLocalChange('evening_food', e.target.value)}><option value="">None</option><option value="Lemon Water">Lemon Water</option><option value="Milk">Milk</option><option value="Fruit">Fruit</option></select></div><div><label style={labelStyle}>Medical</label><textarea style={{...inputStyle, height:'80px'}} value={editingStudent.medical_info || ''} onChange={e => handleLocalChange('medical_info', e.target.value)} /></div><div><label style={labelStyle}>Notes</label><input style={inputStyle} value={editingStudent.teacher_notes || ''} onChange={e => handleLocalChange('teacher_notes', e.target.value)} /></div><div style={{textAlign:'right', display:'flex', gap:'10px', justifyContent:'flex-end'}}><button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false)}}>Cancel</button><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save</button></div></form></div></div>)}
    </div>
  );
}
