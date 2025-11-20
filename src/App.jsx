import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const API_URL = "https://course-manager-backend-cd1m.onrender.com";

export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  const fetchCourses = () => {
    fetch(`${API_URL}/courses`)
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setCourses(data) : setCourses([]))
      .catch(err => { console.error(err); setError("Connection Error"); });
  };

  useEffect(() => { fetchCourses(); }, []);

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <nav style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setView('dashboard')} style={btnStyle(view === 'dashboard')}>📊 Dashboard</button>
        <button onClick={() => setView('checkin')} style={btnStyle(view === 'checkin')}>📝 Check-In Desk</button>
        <button onClick={() => setView('expenses')} style={btnStyle(view === 'expenses')}>🛒 Store</button>
        <button onClick={() => setView('participants')} style={btnStyle(view === 'participants')}>👥 Students</button>
        <button onClick={() => setView('create-course')} style={btnStyle(view === 'create-course')}>➕ New Course</button>
        <button onClick={() => setView('upload')} style={btnStyle(view === 'upload')}>📂 Upload List</button>
      </nav>

      {error && <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px', marginBottom: '20px' }}>⚠️ {error}</div>}

      {view === 'dashboard' && <Dashboard courses={courses} />}
      {view === 'checkin' && <CheckInForm courses={courses} />}
      {view === 'expenses' && <ExpenseTracker courses={courses} />}
      {view === 'participants' && <ParticipantList courses={courses} />}
      {view === 'create-course' && <CreateCourseForm refreshCourses={fetchCourses} setView={setView} />}
      {view === 'upload' && <UploadParticipants courses={courses} setView={setView} />}
    </div>
  );
}

// --- NEW COMPONENT: STORE / EXPENSES ---
function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [expenseType, setExpenseType] = useState('Laundry Token');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');

  // Load Students
  useEffect(() => {
    if (courseId) {
      fetch(`${API_URL}/courses/${courseId}/participants`)
        .then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(console.error);
    }
  }, [courseId]);

  // Load Student History
  useEffect(() => {
    if (selectedStudentId) {
      fetch(`${API_URL}/participants/${selectedStudentId}/expenses`)
        .then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error);
    } else {
      setHistory([]);
    }
  }, [selectedStudentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ courseId, participantId: selectedStudentId, type: expenseType, amount })
      });
      if (!res.ok) throw new Error("Failed");
      setStatus('✅ Saved!');
      setAmount(''); // Clear amount
      // Refresh history
      const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`);
      const histData = await histRes.json();
      setHistory(histData);
    } catch (err) { setStatus('❌ Error'); }
  };

  // Calculate Total Due
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      
      {/* Left: Input Form */}
      <div style={cardStyle}>
        <h2>🛒 Record Expense</h2>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <select style={inputStyle} onChange={e => setCourseId(e.target.value)} required>
            <option value="">-- 1. Select Course --</option>
            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
          </select>
          
          <select style={inputStyle} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required>
            <option value="">-- 2. Select Student --</option>
            {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} (Room: {p.room_no||'-'})</option>)}
          </select>

          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}>
            <div>
              <label>Item / Type</label>
              <input list="expense-types" style={inputStyle} value={expenseType} onChange={e => setExpenseType(e.target.value)} required />
              <datalist id="expense-types">
                <option value="Laundry Token" />
                <option value="Medicine" />
                <option value="Store Item" />
                <option value="Donation" />
              </datalist>
            </div>
            <div>
              <label>Amount (₹)</label>
              <input type="number" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
          </div>

          {/* Quick Buttons */}
          <div style={{display:'flex', gap:'5px'}}>
            <button type="button" onClick={() => {setExpenseType('Laundry Token'); setAmount('50')}} style={quickBtnStyle}>🧺 Laundry (50)</button>
            <button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={quickBtnStyle}>🧼 Soap (30)</button>
          </div>

          <button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Save Record</button>
          {status && <p>{status}</p>}
        </form>
      </div>

      {/* Right: History & Total */}
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #eee', paddingBottom:'10px', marginBottom:'10px'}}>
          <h3 style={{margin:0}}>History</h3>
          <div style={{background:'#e8f5e9', color:'#2e7d32', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold'}}>
            Due: ₹{totalDue}
          </div>
        </div>
        
        {history.length === 0 ? (
          <p style={{color:'#888'}}>No expenses recorded for this student.</p>
        ) : (
          <div style={{maxHeight:'300px', overflowY:'auto'}}>
            <table style={{width:'100%', fontSize:'14px', borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9f9f9', textAlign:'left'}}><th>Item</th><th>Date</th><th>₹</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'8px'}}>{h.expense_type}</td>
                    <td style={{padding:'8px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td>
                    <td style={{padding:'8px', fontWeight:'bold'}}>₹{h.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- EXISTING COMPONENTS (Unchanged) ---

function ParticipantList({ courses }) {
  const [courseId, setCourseId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!courseId) { setParticipants([]); return; }
    setLoading(true);
    fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => { setParticipants(Array.isArray(data) ? data : []); setLoading(false); }).catch(err => { console.error(err); setLoading(false); });
  }, [courseId]);
  const filteredList = participants.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.phone_number && p.phone_number.includes(search)));
  return (
    <div style={cardStyle}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0}}>👥 Student List</h2>
        <div style={{background:'#e3f2fd', padding:'5px 10px', borderRadius:'15px', fontSize:'14px', color:'#0d47a1'}}>Total: <strong>{filteredList.length}</strong></div>
      </div>
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', flexWrap:'wrap'}}>
        <div style={{flex:1}}><select style={inputStyle} onChange={e => setCourseId(e.target.value)} value={courseId}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div>
        <div style={{flex:1}}><input style={inputStyle} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} disabled={!courseId} /></div>
      </div>
      {loading ? <p>Loading...</p> : !courseId ? <p style={{color:'#888'}}>Select a course.</p> : filteredList.length === 0 ? <p>No students found.</p> : (
        <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead><tr style={{background:'#f1f1f1', textAlign:'left'}}><th style={thStyle}>#</th><th style={thStyle}>Name</th><th style={thStyle}>Phone</th><th style={thStyle}>Status</th><th style={thStyle}>Room</th><th style={thStyle}>Seat</th></tr></thead><tbody>{filteredList.map((p, index) => (<tr key={p.participant_id} style={{borderBottom:'1px solid #eee'}}><td style={tdStyle}>{index + 1}</td><td style={tdStyle}><strong>{p.full_name}</strong></td><td style={tdStyle}>{p.phone_number || '-'}</td><td style={tdStyle}><span style={statusBadge(p.status)}>{p.status}</span></td><td style={tdStyle}>{p.room_no || '-'}</td><td style={tdStyle}>{p.dining_seat_no || '-'}</td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}

function UploadParticipants({ courses, setView }) {
  const [courseId, setCourseId] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState('');
  const [debugLines, setDebugLines] = useState([]); 
  const [showDebug, setShowDebug] = useState(false);
  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCsvFile(file); setStatus(''); setPreview([]); setShowDebug(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result; const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      setDebugLines(lines.slice(0, 5));
      let headerIndex = -1; let headers = [];
      for (let i = 0; i < Math.min(lines.length, 20); i++) { const rowLower = lines[i].toLowerCase(); if (rowLower.includes('name') || rowLower.includes('student') || rowLower.includes('participant')) { headerIndex = i; const delimiter = lines[i].includes(';') ? ';' : ','; headers = lines[i].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); break; } }
      if (headerIndex === -1) { setStatus("⚠️ Error: No header found."); setShowDebug(true); return; }
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('participant')); const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile')); const emailIdx = headers.findIndex(h => h.includes('email'));
      if (nameIdx === -1) { setStatus("⚠️ Error: No Name column."); setShowDebug(true); return; }
      const dataRows = lines.slice(headerIndex + 1); const delimiter = lines[headerIndex].includes(';') ? ';' : ',';
      const parsedData = dataRows.map(row => { const cols = row.split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length <= nameIdx) return null; return { name: cols[nameIdx], phone: phoneIdx !== -1 ? cols[phoneIdx] : '', email: emailIdx !== -1 ? cols[emailIdx] : '' }; }).filter(r => r && r.name && r.name.length > 1);
      setPreview(parsedData); setStatus(`✅ Ready! Found ${parsedData.length} students.`);
    }; reader.readAsText(file);
  };
  const handleUpload = async () => {
    if (!courseId) return alert("Select course");
    setStatus('Uploading...');
    try { const res = await fetch(`${API_URL}/courses/${courseId}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: preview }) }); if (!res.ok) throw new Error("Failed"); setStatus(`✅ Added ${preview.length} students.`); setTimeout(() => setView('checkin'), 2000); } catch (err) { setStatus("❌ " + err.message); setShowDebug(true); }
  };
  return (
    <div style={cardStyle}><h2>📂 Upload Student List</h2><div style={{maxWidth:'600px'}}><div style={{marginBottom:'10px'}}><label>1. Target Course:</label><select style={inputStyle} onChange={e => setCourseId(e.target.value)}><option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select></div><div style={{marginBottom:'10px'}}><label>2. File (CSV):</label><input type="file" accept=".csv" onChange={handleFileChange} /></div>{status && <div style={{padding:'10px', background:'#e3f2fd', borderRadius:'4px', marginBottom:'10px'}}>{status}</div>}<button onClick={handleUpload} disabled={!csvFile || !courseId || preview.length===0} style={{...btnStyle(true), width:'100%', background: preview.length>0?'#28a745':'#ccc'}}>Upload</button>{showDebug && <div style={{marginTop:'10px', background:'#333', color:'#0f0', padding:'10px', fontSize:'10px'}}><pre>{debugLines.join('\n')}</pre></div>}</div></div>
  );
}

function Dashboard({ courses }) {
  const safeCourses = Array.isArray(courses) ? courses : [];
  const statusData = [{ name: 'Arrived', value: 12 }, { name: 'Expected', value: 5 }];
  const COLORS = ['#0088FE', '#FFBB28'];
  return (
    <div><h2 style={{marginBottom: '20px', color: '#333'}}>Summary Dashboard</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}><div style={cardStyle}><h3 style={{marginTop:0}}>Active Courses</h3><p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0', color: '#007bff' }}>{safeCourses.length}</p><ul style={{marginTop: '10px', paddingLeft: '20px', color: '#666'}}>{safeCourses.map(c => <li key={c.course_id}>{c.course_name}</li>)}</ul></div><div style={cardStyle}><h3 style={{marginTop:0}}>Arrival Status</h3><PieChart width={250} height={200}><Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></div></div></div>
  );
}

function CreateCourseForm({ refreshCourses, setView }) {
  const [formData, setFormData] = useState({ courseName: '', teacherName: '', startDate: '', endDate: '' });
  const [status, setStatus] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); try { const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Failed"); setStatus('✅ Created!'); refreshCourses(); setTimeout(() => setView('dashboard'), 1500); } catch (err) { setStatus('❌ ' + err.message); } };
  return (
    <div style={cardStyle}><h2>Create New Course</h2><form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}><input style={inputStyle} placeholder="Course Name" required onChange={e => setFormData({...formData, courseName: e.target.value})} /><input style={inputStyle} placeholder="Teacher Name" required onChange={e => setFormData({...formData, teacherName: e.target.value})} /><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, startDate: e.target.value})} /><input type="date" style={inputStyle} required onChange={e => setFormData({...formData, endDate: e.target.value})} /></div><button type="submit" style={{...btnStyle(true), background:'#28a745', color:'white'}}>Create Course</button>{status && <p>{status}</p>}</form></div>
  );
}

function CheckInForm({ courses }) {
  const [participants, setParticipants] = useState([]);
  const [formData, setFormData] = useState({ courseId: '', participantId: '', roomNo: '', seatNo: '', laundryToken: '' });
  const [status, setStatus] = useState('');
  useEffect(() => { if (formData.courseId) { fetch(`${API_URL}/courses/${formData.courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(console.error); } }, [formData.courseId]);
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Submitting...'); try { const res = await fetch(`${API_URL}/check-in`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)}); if (!res.ok) throw new Error("Error"); setStatus('✅ Success!'); setFormData(prev => ({...prev, participantId:'', roomNo:'', seatNo:'', laundryToken:''})); } catch (err) { setStatus('❌ '+err.message); } };
  return (
    <div style={cardStyle}><h2>Participant Check-In</h2><form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px', maxWidth:'500px'}}><select style={inputStyle} onChange={e => setFormData({...formData, courseId: e.target.value})} required><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select><select style={inputStyle} onChange={e => setFormData({...formData, participantId: e.target.value})} value={formData.participantId} disabled={!formData.courseId} required><option value="">-- Select Student --</option>{participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name}</option>)}</select><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}><input placeholder="Room No" value={formData.roomNo} onChange={e => setFormData({...formData, roomNo: e.target.value})} style={inputStyle} required /><input placeholder="Seat No" value={formData.seatNo} onChange={e => setFormData({...formData, seatNo: e.target.value})} style={inputStyle} required /></div><input placeholder="Laundry Token" value={formData.laundryToken} onChange={e => setFormData({...formData, laundryToken: e.target.value})} style={inputStyle} /><button type="submit" style={{...btnStyle(true), background:'#007bff', color:'white'}}>Confirm Check-In</button>{status && <p>{status}</p>}</form></div>
  );
}

// --- STYLES ---
const btnStyle = (isActive) => ({ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#333', fontWeight: '500' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const quickBtnStyle = { padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: '#f1f1f1', cursor: 'pointer', fontSize: '12px' };
const thStyle = { padding: '12px', borderBottom: '2px solid #eee', color: '#555' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
const statusBadge = (status) => { const colors = { 'Arrived': '#d4edda', 'On the way': '#fff3cd', 'Cancelled': '#f8d7da', 'No Response': '#e2e3e5' }; return { background: colors[status] || '#eee', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#333' }; };
