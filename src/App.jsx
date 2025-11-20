import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";
const ADMIN_PASSCODE = "1234"; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') setIsAuthenticated(true);
    fetchCourses();
  }, []);

  const handleLogin = (e) => { e.preventDefault(); if (pinInput === ADMIN_PASSCODE) { setIsAuthenticated(true); localStorage.setItem('admin_auth', 'true'); } else alert('Wrong PIN'); };
  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('admin_auth'); };
  const fetchCourses = () => { fetch(`${API_URL}/courses`).then(res => res.ok ? res.json() : []).then(data => setCourses(Array.isArray(data) ? data : [])).catch(console.error); };

  if (!isAuthenticated) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}><form onSubmit={handleLogin} style={cardStyle}><h2 style={{marginTop:0}}>Locked</h2><input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)} style={inputStyle} placeholder="PIN" /><button style={{...btnStyle(true), background:'#007bff', color:'white', marginTop:'10px', width:'100%'}}>Unlock</button></form></div>;

  return (
    <div className="app-container" style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } .app-container { background: white !important; padding: 0 !important; } body { font-size: 12pt; } }`}</style>
      
      <nav className="no-print" style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
          <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In</button>
          <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
          <button onClick={() => setView('reports')} style={btnStyle(view === 'reports')}>🖨️ Reports</button>
          <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Manage Students</button>
          <button onClick={() => setView('create-course')} style={btnStyle(view === 'create-course')}>➕ Course</button>
          <button onClick={() => setView('upload')} style={btnStyle(view === 'upload')}>📂 Upload</button>
        </div>
        <button onClick={handleLogout} style={{...btnStyle(false), color:'red', border:'1px solid red'}}>Logout</button>
      </nav>

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'checkin' && <CheckInForm courses={courses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'reports' && <ReportsPanel courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} />}
      {view === 'create-course' && <CreateCourseForm refreshCourses={fetchCourses} setView={setView} />}
      {view === 'upload' && <UploadParticipants courses={courses} setView={setView} />}
    </div>
  );
}

// --- UPDATED CHECK-IN FORM (With Filters + New Fields) ---
function CheckInForm({ courses }) {
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({ 
    courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '', 
    mobileLocker: '', valuablesLocker: '', language: 'English',
    pagodaCell: '', laptop: '' // NEW FIELDS
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (formData.courseId) {
      fetch(`${API_URL}/courses/${formData.courseId}/participants`)
        .then(res => res.json())
        .then(data => setParticipants(Array.isArray(data) ? data : []));
    }
  }, [formData.courseId]);

  // FILTER: Only show students who are NOT 'Arrived' yet
  const studentsPending = participants.filter(p => p.status !== 'Arrived');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Error checking in");
      setStatus('✅ Success! Student removed from list.');
      setFormData(prev => ({ ...prev, participantId: '', roomNo: '', seatNo: '', laundryToken: '', mobileLocker: '', valuablesLocker: '', pagodaCell: '', laptop: '' }));
      
      // Refresh list to remove the checked-in student immediately
      fetch(`${API_URL}/courses/${formData.courseId}/participants`)
        .then(res => res.json()).then(data => setParticipants(data));

    } catch (err) { setStatus(`❌ Error: ${err.message}`); }
  };

  return (
    <div style={cardStyle}>
      <h2>Participant Check-In</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px' }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
          <div><label style={labelStyle}>Course</label><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
          <div><label style={labelStyle}>Student (Pending Only)</label><select style={inputStyle} onChange={e => setFormData({...formData, participantId: e.target.value})} value={formData.participantId} disabled={!formData.courseId}><option value="">-- Select ({studentsPending.length} left) --</option>{studentsPending.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select></div>
        </div>
        <hr style={{border:'0', borderTop:'1px solid #eee'}} />
        
        {/* Logistics Row 1 */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
          <div><label style={labelStyle}>Room No</label><input style={inputStyle} value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} required /></div>
          <div><label style={labelStyle}>Seat No</label><input style={inputStyle} value={formData.seatNo} onChange={e => setFormData({...formData, seatNo: e.target.value})} required /></div>
          <div><label style={labelStyle}>Pagoda Cell</label><input style={inputStyle} value={formData.pagodaCell} onChange={e => setFormData({...formData, pagodaCell: e.target.value})} /></div>
          <div><label style={labelStyle}>Language</label><select style={inputStyle} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}><option>English</option><option>Hindi</option><option>Marathi</option></select></div>
        </div>

        {/* Logistics Row 2 */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'10px'}}>
           <div><label style={labelStyle}>Mob Locker</label><input style={inputStyle} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})} /></div>
           <div><label style={labelStyle}>Val Locker</label><input style={inputStyle} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})} /></div>
           <div><label style={labelStyle}>Laptop</label><input style={inputStyle} value={formData.laptop} onChange={e => setFormData({...formData, laptop: e.target.value})} placeholder="Yes / No" /></div>
           <div><label style={labelStyle}>Laundry Tk</label><input style={inputStyle} value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} /></div>
        </div>

        <button type="submit" style={{...btnStyle(true), background:'#007bff', color:'white', padding:'15px'}}>Confirm Check-In</button>
        {status && <p>{status}</p>}
      </form>
    </div>
  );
}

// --- UPDATED PARTICIPANT LIST (With Edit/Delete) ---
function ParticipantList({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState(null); // For Modal

  const loadStudents = () => {
    if (!courseId) return;
    fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data) ? data : []));
  };

  useEffect(loadStudents, [courseId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student? This cannot be undone.")) return;
    await fetch(`${API_URL}/participants/${id}`, { method: 'DELETE' });
    loadStudents();
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/participants/${editingStudent.participant_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent)
    });
    setEditingStudent(null);
    loadStudents();
  };

  const filtered = participants.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0}}>Manage Students</h2>
        <div style={{display:'flex', gap:'10px'}}>
          <select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
          <input style={inputStyle} placeholder="Search..." onChange={e => setSearch(e.target.value)} disabled={!courseId} />
        </div>
      </div>

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
          <thead><tr style={{background:'#f1f1f1', textAlign:'left'}}><th style={tdStyle}>Name</th><th style={tdStyle}>Status</th><th style={tdStyle}>Room</th><th style={tdStyle}>Pagoda</th><th style={tdStyle}>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}>
                <td style={tdStyle}><strong>{p.full_name}</strong><br/><span style={{fontSize:'11px', color:'#888'}}>{p.phone_number}</span></td>
                <td style={tdStyle}><span style={statusBadge(p.status)}>{p.status}</span></td>
                <td style={tdStyle}>{p.room_no || '-'}</td>
                <td style={tdStyle}>{p.pagoda_cell_no || '-'}</td>
                <td style={tdStyle}>
                  <button onClick={() => setEditingStudent(p)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button>
                  <button onClick={() => handleDelete(p.participant_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingStudent && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'10px', width:'400px'}}>
            <h3>Edit Student</h3>
            <form onSubmit={handleEditSave} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <label>Name</label><input style={inputStyle} value={editingStudent.full_name} onChange={e => setEditingStudent({...editingStudent, full_name: e.target.value})} />
              <label>Status</label>
              <select style={inputStyle} value={editingStudent.status} onChange={e => setEditingStudent({...editingStudent, status: e.target.value})}>
                <option>No Response</option><option>Arrived</option><option>Cancelled</option>
              </select>
              <div style={{display:'flex', gap:'10px'}}>
                <div><label>Room</label><input style={inputStyle} value={editingStudent.room_no||''} onChange={e => setEditingStudent({...editingStudent, room_no: e.target.value})} /></div>
                <div><label>Seat</label><input style={inputStyle} value={editingStudent.dining_seat_no||''} onChange={e => setEditingStudent({...editingStudent, dining_seat_no: e.target.value})} /></div>
              </div>
              <label>Pagoda Cell</label><input style={inputStyle} value={editingStudent.pagoda_cell_no||''} onChange={e => setEditingStudent({...editingStudent, pagoda_cell_no: e.target.value})} />
              <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                <button type="submit" style={{...btnStyle(true), flex:1, background:'#28a745', color:'white'}}>Save</button>
                <button type="button" onClick={() => setEditingStudent(null)} style={{...btnStyle(false), flex:1}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- OTHER COMPONENTS (Unchanged) ---
function ReportsPanel({ courses }) {
  const [mode, setMode] = useState('dining'); const [courseId, setCourseId] = useState(''); const [studentId, setStudentId] = useState(''); const [data, setData] = useState([]); const [expenses, setExpenses] = useState([]);
  useEffect(() => { if (!courseId) { setData([]); return; } fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => { const sorted = (Array.isArray(data) ? data : []).sort((a,b) => (a.dining_seat_no || 'Z').localeCompare(b.dining_seat_no || 'Z')); setData(sorted); }); }, [courseId]);
  useEffect(() => { if (studentId) { fetch(`${API_URL}/participants/${studentId}/expenses`).then(res => res.json()).then(data => setExpenses(Array.isArray(data) ? data : [])); } }, [studentId]);
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || 'Course'; const selectedStudent = data.find(p => p.participant_id == studentId);
  return ( <div style={cardStyle}> <div className="no-print" style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}> <h2>🖨️ Print Reports</h2> <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}> <button onClick={() => setMode('dining')} style={quickBtnStyle(mode==='dining')}>🍽️ Dining Sheet</button> <button onClick={() => setMode('invoice')} style={quickBtnStyle(mode==='invoice')}>🧾 Student Invoice</button> </div> <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}> <select style={inputStyle} onChange={e => setCourseId(e.target.value)} value={courseId}> <option value="">-- Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select> {mode === 'invoice' && ( <select style={inputStyle} onChange={e => setStudentId(e.target.value)} disabled={!courseId}> <option value="">-- Select Student --</option> {data.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)} </select> )} <button onClick={() => window.print()} disabled={!courseId} style={{...btnStyle(true), background: '#28a745', color: 'white'}}>🖨️ Print Now</button> </div> </div> {mode === 'dining' && courseId && ( <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}> <h1 style={{margin: 0}}>Dining Seating Chart</h1> <h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3> </div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '16px'}}> <thead> <tr style={{borderBottom: '2px solid black'}}> <th style={{textAlign:'left', padding: '10px'}}>Seat No</th> <th style={{textAlign:'left', padding: '10px'}}>Name</th> <th style={{textAlign:'left', padding: '10px'}}>Room</th> <th style={{textAlign:'left', padding: '10px'}}>Language</th> </tr> </thead> <tbody> {data.filter(p => p.status === 'Arrived').map(p => ( <tr key={p.participant_id} style={{borderBottom: '1px solid #ddd'}}> <td style={{padding: '12px', fontWeight: 'bold', fontSize: '18px'}}>{p.dining_seat_no || '-'}</td> <td style={{padding: '12px'}}>{p.full_name}</td> <td style={{padding: '12px'}}>{p.room_no}</td> <td style={{padding: '12px'}}>{p.discourse_language || 'English'}</td> </tr> ))} </tbody> </table> </div> )} {mode === 'invoice' && studentId && selectedStudent && ( <div className="print-area" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px'}}> <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}> <div> <h1 style={{margin: 0}}>INVOICE</h1> <p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p> </div> <div style={{textAlign: 'right'}}> <h3>{selectedStudent.full_name}</h3> <p>Room: {selectedStudent.room_no}</p> <p>{selectedCourseName}</p> </div> </div> <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}> <thead> <tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}> <th style={{textAlign: 'left', padding: '10px'}}>Description</th> <th style={{textAlign: 'left', padding: '10px'}}>Date</th> <th style={{textAlign: 'right', padding: '10px'}}>Amount</th> </tr> </thead> <tbody> {expenses.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}> <td style={{padding: '10px'}}>{ex.expense_type}</td> <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td> <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td> </tr> ))} </tbody> </table> <div style={{textAlign: 'right', marginTop: '20px'}}> <h3>Total Due: ₹{expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0)}</h3> </div> <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}> Signature </div> </div> )} {!courseId && <p style={{textAlign: 'center', color: '#888', padding: '50px'}}>Select a course to view report.</p>} </div> );
}

function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [expenseType, setExpenseType] = useState('Laundry Token'); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [status, setStatus] = useState('');
  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(console.error); }, [courseId]);
  useEffect(() => { if (selectedStudentId) { fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error); } else { setHistory([]); } }, [selectedStudentId]);
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/expenses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ courseId, participantId: selectedStudentId, type: expenseType, amount }) }); if (!res.ok) throw new Error("Failed"); setStatus('✅ Saved!'); setAmount(''); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); } catch (err) { setStatus('❌ Error'); } };
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  return ( <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}> <div style={cardStyle}> <h2>🛒 Record Expense</h2> <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}> <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select> <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} (Room: {p.room_no||'-'})</option>)} </select> <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}> <div> <label>Item / Type</label> <input list="expense-types" style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} required /> <datalist id="expense-types"> <option value="Laundry Token" /> <option value="Medicine" /> <option value="Store Item" /> <option value="Donation" /> </datalist> </div> <div> <label>Amount (₹)</label> <input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required /> </div> </div> <div style={{display:'flex', gap:'5px'}}> <button type="button" onClick={() => {setExpenseType('Laundry Token'); setAmount('50')}} style={quickBtnStyle(false)}>🧺 Laundry (50)</button> <button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={quickBtnStyle(false)}>🧼 Soap (30)</button> </div> <button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save Record</button> {status && <p>{status}</p>} </form> </div> <div style={cardStyle}> <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #eee', paddingBottom:'10px', marginBottom:'10px'}}> <h3 style={{margin:0}}>History</h3> <div style={{background:'#e8f5e9', color:'#2e7d32', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold'}}> Due: ₹{totalDue} </div> </div> {history.length === 0 ? ( <p style={{color:'#888'}}>No expenses recorded.</p> ) : ( <div style={{maxHeight:'300px', overflowY:'auto'}}> <table style={{width:'100%', fontSize:'14px', borderCollapse:'collapse'}}> <thead><tr style={{background:'#f9f9f9', textAlign:'left'}}><th>Item</th><th>Date</th><th>₹</th></tr></thead> <tbody> {history.map(h => ( <tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}> <td style={{padding:'8px'}}>{h.expense_type}</td> <td style={{padding:'8px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td> <td style={{padding:'8px', fontWeight:'bold'}}>₹{h.amount}</td> </tr> ))} </tbody> </table> </div> )} </div> </div> );
}

function UploadParticipants({ courses, setView }) {
  const [courseId, setCourseId] = useState(''); const [csvFile, setCsvFile] = useState(null); const [preview, setPreview] = useState([]); const [status, setStatus] = useState(''); const [debugLines, setDebugLines] = useState([]); const [showDebug, setShowDebug] = useState(false);
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; setCsvFile(file); setStatus(''); setPreview([]); setShowDebug(false); const reader = new FileReader(); reader.onload = (event) => { const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); setDebugLines(lines.slice(0, 5)); let headerIndex = -1; let headers = []; for (let i = 0; i < Math.min(lines.length, 20); i++) { const rowLower = lines[i].toLowerCase(); if (rowLower.includes('name') || rowLower.includes('student') || rowLower.includes('participant')) { headerIndex = i; const delimiter = lines[i].includes(';') ? ';' : ','; headers = lines[i].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); break; } } if (headerIndex === -1) { setStatus("⚠️ Error: No header found."); setShowDebug(true); return; } const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('participant')); const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile')); const emailIdx = headers.findIndex(h => h.includes('email')); if (nameIdx === -1) { setStatus("⚠️ Error: No Name column."); setShowDebug(true); return; } const dataRows = lines.slice(headerIndex + 1); const delimiter = lines[headerIndex].includes(';') ? ';' : ','; const parsedData = dataRows.map(row => { const cols = row.split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length <= nameIdx) return null; return { name: cols[nameIdx], phone: phoneIdx !== -1 ? cols[phoneIdx] : '', email: emailIdx !== -1 ? cols[emailIdx] : '' }; }).filter(r => r && r.name && r.name.length > 1); setPreview(parsedData); setStatus(`✅ Ready! Found ${parsedData.length} students.`); }; reader.readAsText(file); };
  const handleUpload = async () => { if (!courseId) return alert("Select course"); setStatus('Uploading...'); try { const res = await fetch(`${API_URL}/courses/${courseId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) }); if (!res.ok) throw new Error("Failed"); setStatus(`✅ Added ${preview.length} students.`); setTimeout(() => setView('checkin'), 2000); } catch (err) { setStatus("❌ " + err.message); setShowDebug(true); } };
  return ( <div style={cardStyle}><h2>📂 Upload Student Data</h2><div style={{maxWidth:'600px'}}><div style={{marginBottom:'10px'}}><label>1. Target Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div><div style={{marginBottom:'10px'}}><label>2. File (CSV):</label><input type="file" accept=".csv" onChange={handleFileChange} /></div>{status && <div style={{padding:'10px', background:'#e3f2fd', borderRadius:'4px', marginBottom:'10px'}}>{status}</div>}<button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc'}}>Upload</button>{showDebug && <div style={{marginTop:'10px', background:'#333', color:'#0f0', padding:'10px', fontSize:'10px'}}><pre>{debugLines.join('\n')}</pre></div>}</div></div> );
}

function Dashboard({ courses }) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const statusData = [{ name: 'Arrived', value: 12 }, { name: 'Expected', value: 5 }];
  const COLORS = ['#0088FE', '#FFBB28'];
  return ( <div><h2 style={{marginBottom: '20px', color: '#333'}}>Summary Dashboard</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}><div style={cardStyle}><h3 style={{marginTop:0}}>Active Courses</h3><p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#007bff' }}>{safeCourses.length}</p><ul style={{marginTop: '10px', paddingLeft: '20px', color: '#666'}}>{safeCourses.map(c => <li key={c.course_id}>{c.course_name}</li>)}</ul></div><div style={cardStyle}><h3 style={{marginTop:0}}>Arrival Status</h3><PieChart width={250} height={200}><Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></div></div></div> );
}

function CreateCourseForm({ refreshCourses, setView }) {
  const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' });
  const [status, setStatus] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Failed"); setStatus('✅ Created!'); refreshCourses(); setTimeout(() => setView('dashboard'), 1500); } catch (err) { setStatus('❌ ' + err.message); } };
  return ( <div style={cardStyle}><h2>Create New Course</h2><form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}><input style={inputStyle} placeholder="Course Name" required onChange={e => setFormData({...formData, courseName: e.target.value})} /><input style={inputStyle} placeholder="Teacher Name" required onChange={e => setFormData({...formData, teacherName: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>{status && <p>{status}</p>}</form></div> );
}

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const quickBtnStyle = (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const labelStyle = { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
const statusBadge = (status) => { const colors = { 'Arrived': '#d4edda', 'On the way': '#fff3cd', 'Cancelled': '#f8d7da', 'No Response': '#e2e3e5' }; return { background: colors[status] || '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#333' }; };
