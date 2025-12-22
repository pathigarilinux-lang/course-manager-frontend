import React, { useState } from 'react';
import { Upload, Database, Save, FileText, Download } from 'lucide-react';
import { API_URL, styles } from '../config';

// Print styles for the preview table
const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function CourseAdmin({ courses, refreshCourses }) {
  // Local State for Admin Tasks
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('upload'); 
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
  const [manualStudent, setManualStudent] = useState({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });

  // --- ACTIONS ---

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
    const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
    try {
        const payload = {
            courseName: courseName,
            teacherName: newCourseData.teacher || 'Goenka Ji',
            startDate: newCourseData.startDate,
            endDate: newCourseData.endDate
        };
        const res = await fetch(`${API_URL}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            alert(`✅ Course Created: ${courseName}`);
            refreshCourses(); // Refresh parent list
            setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
        }
    } catch (err) { console.error(err); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    
    const newStudent = { 
        id: Date.now(), 
        ...manualStudent, 
        conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`, 
        status: 'Active', dining_seat: '', room_no: '' 
    };
    
    setStudents(prev => [newStudent, ...prev]);
    alert(`Added ${newStudent.full_name} to the Preview list.`);
    setManualStudent({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
    setAdminSubTab('upload'); // Switch to preview view
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { 
        try { processCSV(e.target.result); } 
        catch (err) { console.error(err); setUploadStatus({ type: 'error', msg: 'Failed to parse CSV.' }); } 
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) { setUploadStatus({ type: 'error', msg: 'File is empty or too short.' }); return; }
    
    const splitRow = (rowStr) => rowStr.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    let headerRowIndex = -1;
    let headers = [];
    
    // Auto-detect header row
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const lineLower = lines[i].toLowerCase();
        if (lineLower.includes('name') && (lineLower.includes('gender') || lineLower.includes('age'))) {
            headerRowIndex = i;
            headers = splitRow(lines[i]).map(h => h.toLowerCase());
            break;
        }
    }
    
    if (headerRowIndex === -1) { setUploadStatus({ type: 'error', msg: 'Could not detect headers (Name, Gender, Age). Please check CSV format.' }); return; }
    
    const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
    const map = { 
        conf: getIndex(['conf', 'ref', 'id', 'no.']), 
        name: getIndex(['name', 'student', 'given']), 
        age: getIndex(['age']), 
        gender: getIndex(['gender', 'sex']), 
        courses: getIndex(['course', 'history']), 
        seat: getIndex(['seat', 'dining']), 
        email: getIndex(['email']), 
        phone: getIndex(['phone', 'mobile']), 
        notes: getIndex(['notes', 'remark']) 
    };
    
    const parsedStudents = lines.slice(headerRowIndex + 1).map((line, index) => {
      const row = splitRow(line);
      const rawName = map.name > -1 ? row[map.name] : '';
      const rawConf = map.conf > -1 ? row[map.conf] : '';
      
      if (!rawName && !rawConf) return null; 
      
      return { 
          id: Date.now() + index, 
          conf_no: rawConf || `TEMP-${index + 1}`, 
          full_name: rawName || 'Unknown Student', 
          age: map.age > -1 ? row[map.age] : '', 
          gender: map.gender > -1 ? row[map.gender] : '', 
          courses_info: map.courses > -1 ? row[map.courses] : '', 
          dining_seat: map.seat > -1 ? row[map.seat] : '', 
          email: map.email > -1 ? row[map.email] : '', 
          mobile: map.phone > -1 ? row[map.phone] : '', 
          notes: map.notes > -1 ? row[map.notes] : '', 
          status: rawConf ? 'Active' : 'Pending ID' 
      };
    }).filter(s => s !== null);
    
    setStudents(parsedStudents);
    setUploadStatus({ type: 'success', msg: `Ready! Loaded ${parsedStudents.length} valid students.` });
  };

  const saveToDatabase = async () => {
    if (students.length === 0) return;
    const targetCourse = courses.find(c => c.course_name === selectedCourseForUpload);
    if (!targetCourse) return alert("Please select a valid course first.");
    if (!window.confirm(`Save ${students.length} students to ${selectedCourseForUpload}?`)) return;
    
    try {
        const payload = { students: students.map(s => ({ name: s.full_name, confNo: s.conf_no, age: s.age, gender: s.gender, courses: s.courses_info, email: s.email, phone: s.mobile }))};
        const res = await fetch(`${API_URL}/courses/${targetCourse.course_id}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { 
            alert(`✅ Success: ${data.message}`); 
            setStudents([]); 
        } else { 
            alert(`❌ Error: ${data.error}`); 
        }
    } catch(err) { alert("Network Error: Failed to save data."); console.error(err); }
  };

  const handleDownloadBackup = async () => {
      try {
          const resCourses = await fetch(`${API_URL}/courses`);
          const coursesData = await resCourses.json();
          let allData = { timestamp: new Date().toISOString(), courses: coursesData, participants: [] };
          
          for (let c of coursesData) {
              const resP = await fetch(`${API_URL}/courses/${c.course_id}/participants`);
              const pData = await resP.json();
              allData.participants.push(...pData);
          }
          
          const blob = new Blob([JSON.stringify(allData, null, 2)], {type : 'application/json'});
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `dhamma_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch(e) { alert("Backup Failed"); }
  };

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Upload size={24} className="text-blue-600"/> Course Admin</h2>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={()=>setAdminSubTab('create')} style={styles.quickBtn(adminSubTab==='create')}>+ New Course</button>
           <button onClick={()=>setAdminSubTab('upload')} style={styles.quickBtn(adminSubTab==='upload')}>📂 Upload CSV</button>
           <button onClick={()=>setAdminSubTab('manual')} style={styles.quickBtn(adminSubTab==='manual')}>✍️ Manual Entry</button>
           <button onClick={handleDownloadBackup} style={{...styles.quickBtn(false), background:'#6c757d', color:'white'}}>💾 Backup DB</button>
        </div>
      </div>

      {adminSubTab === 'create' && (
        <form onSubmit={handleCreateCourse} style={{maxWidth:'500px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'15px'}}>
          <h3 style={{textAlign:'center'}}>Create New Course</h3>
          <div><label style={styles.label}>Course Name</label><input style={styles.input} placeholder="e.g. 10-Day" value={newCourseData.name} onChange={e=>setNewCourseData({...newCourseData, name:e.target.value})} /></div>
          <div><label style={styles.label}>Teacher Name</label><input style={styles.input} placeholder="e.g. Goenka Ji" value={newCourseData.teacher || ''} onChange={e=>setNewCourseData({...newCourseData, teacher:e.target.value})} /></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <div><label style={styles.label}>Start</label><input type="date" style={styles.input} value={newCourseData.startDate} onChange={e=>setNewCourseData({...newCourseData, startDate:e.target.value})} /></div>
            <div><label style={styles.label}>End</label><input type="date" style={styles.input} value={newCourseData.endDate} onChange={e=>setNewCourseData({...newCourseData, endDate:e.target.value})} /></div>
          </div>
          <button type="submit" style={{...styles.btn(true), background:'#28a745', color:'white'}}>Create Course</button>
        </form>
      )}

      {adminSubTab === 'upload' && (
        <>
          <div style={{marginBottom:'20px'}}>
            <label style={styles.label}>Select Target Course</label>
            <select style={styles.input} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)}>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
            </select>
          </div>
          <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'30px', textAlign:'center', background:'#f9f9f9', position:'relative'}}>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} />
            <div style={{pointerEvents:'none'}}><Database size={40} color="#999" /><p style={{margin:'10px 0', color:'#555'}}>Click to upload .CSV file</p></div>
          </div>
          {uploadStatus && <div style={{marginTop:'15px', padding:'10px', background:'#e6fffa', color:'#2c7a7b'}}>{uploadStatus.msg}</div>}
          
          {students.length > 0 && (
            <div style={{marginTop:'25px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0}}>Preview ({students.length})</h3>
                  <button onClick={saveToDatabase} style={{...styles.btn(true), background:'#28a745', color:'white'}}><Save size={16}/> Save to Database</button>
               </div>
               <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee'}}>
                 <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
                   <thead style={{position:'sticky', top:0, background:'#f1f1f1'}}><tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr></thead>
                   <tbody>{students.map(s => (<tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue'}}>{s.conf_no}</td><td style={{padding:'8px'}}>{s.full_name}</td><td style={{padding:'8px'}}>{s.age}</td><td style={{padding:'8px'}}>{s.gender}</td><td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td></tr>))}</tbody>
                 </table>
               </div>
            </div>
          )}
        </>
      )}

      {adminSubTab === 'manual' && (
        <form onSubmit={handleManualSubmit} style={{maxWidth:'600px', margin:'0 auto'}}>
          <h3 style={{textAlign:'center', marginBottom:'20px'}}>Add Single Student</h3>
          <div style={{marginBottom:'15px'}}><label style={styles.label}>Target Course</label><select style={styles.input} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)} required><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}</select></div>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'15px', marginBottom:'15px'}}><div><label style={styles.label}>Full Name</label><input style={styles.input} value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} required /></div><div><label style={styles.label}>Conf No</label><input style={styles.input} value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} /></div></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:'15px', marginBottom:'15px'}}><div><label style={styles.label}>Gender</label><select style={styles.input} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select></div><div><label style={styles.label}>Age</label><input type="number" style={styles.input} value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} /></div><div><label style={styles.label}>Courses Info</label><input style={styles.input} value={manualStudent.courses_info} onChange={e=>setManualStudent({...manualStudent, courses_info:e.target.value})} placeholder="e.g. S:3 L:1" /></div></div>
          <button type="submit" style={{...styles.btn(true), width:'100%', background:'#007bff', color:'white'}}>+ Add to Preview</button>
        </form>
      )}
    </div>
  );
}
