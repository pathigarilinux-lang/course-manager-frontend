import React, { useState } from 'react';
import { Upload, Database, Save, FileText, Download, Trash2, Calendar, Search, PlusCircle, Archive, Check, ArrowRight, Edit, XCircle } from 'lucide-react';
import { API_URL, styles } from '../config';

// Print styles for the preview table
const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function CourseAdmin({ courses, refreshCourses }) {
  const [activeTab, setActiveTab] = useState('courses'); 
  
  // State
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  
  // Course Form State
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
  const [editingId, setEditingId] = useState(null); // ✅ NEW: Track which course is being edited

  // Manual Entry State
  const [manualStudent, setManualStudent] = useState({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- COURSE MANAGEMENT ---
  const getCourseStatus = (c) => {
      const now = new Date();
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      if (now > end) return { label: 'Completed', color: '#6c757d', bg: '#e2e3e5' };
      if (now >= start && now <= end) return { label: 'Active', color: '#28a745', bg: '#d4edda' };
      return { label: 'Upcoming', color: '#007bff', bg: '#cce5ff' };
  };

  // ✅ NEW: Start Edit Mode
  const handleEditClick = (c) => {
      // Extract short name from "10-Day / 2023..." string
      const shortName = c.course_name.split('/')[0].trim();
      
      setNewCourseData({
          name: shortName,
          teacher: c.teacher_name || '',
          startDate: c.start_date ? c.start_date.split('T')[0] : '',
          endDate: c.end_date ? c.end_date.split('T')[0] : ''
      });
      setEditingId(c.course_id);
      
      // Scroll to top to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ NEW: Cancel Edit Mode
  const handleCancelEdit = () => {
      setEditingId(null);
      setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
  };

  // ✅ NEW: Update Course Function
  const handleUpdateCourse = async (e) => {
      e.preventDefault();
      if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
      
      // Reconstruct the standardized Name String
      const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
      
      try {
          const payload = {
              courseName: courseName,
              teacherName: newCourseData.teacher,
              startDate: newCourseData.startDate,
              endDate: newCourseData.endDate
          };

          const res = await fetch(`${API_URL}/courses/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              alert(`✅ Course Updated: ${courseName}`);
              refreshCourses(); 
              handleCancelEdit(); // Reset form
          } else {
              const err = await res.json();
              alert(`Error: ${err.message || 'Update failed'}`);
          }
      } catch (err) { console.error(err); alert("Network Error"); }
  };

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
            refreshCourses(); 
            setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
        }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCourse = async (id, name) => {
      if(window.confirm(`⚠️ DANGER: Delete course "${name}"?\nThis will delete ALL student data for this course forever.`)) {
          await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
          refreshCourses();
      }
  };

  // --- IMPORT TOOLS ---
  const downloadTemplate = () => {
      const headers = ["Name,Age,Gender,Conf No,Courses Info,Email,Phone,Remarks"];
      const row1 = ["John Doe,30,Male,N12345,S:1 L:0,john@example.com,9999999999,Medical issue"];
      const csvContent = "data:text/csv;charset=utf-8," + headers.join("\n") + "\n" + row1.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "student_import_template.csv");
      document.body.appendChild(link);
      link.click();
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
        if(res.ok) { alert(`✅ Success: ${data.message}`); setStudents([]); } else { alert(`❌ Error: ${data.error}`); }
    } catch(err) { alert("Network Error: Failed to save data."); console.error(err); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    const newStudent = { id: Date.now(), ...manualStudent, conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`, status: 'Active', dining_seat: '', room_no: '' };
    setStudents(prev => [newStudent, ...prev]);
    setManualStudent({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
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

  const handleGlobalSearch = async () => {
      if(!globalSearch) return;
      setIsSearching(true);
      let results = [];
      for (let c of courses) {
          const res = await fetch(`${API_URL}/courses/${c.course_id}/participants`);
          const data = await res.json();
          const matches = data.filter(p => p.full_name.toLowerCase().includes(globalSearch.toLowerCase()) || (p.conf_no && p.conf_no.toLowerCase().includes(globalSearch.toLowerCase())));
          if (matches.length > 0) results.push(...matches.map(m => ({ ...m, courseName: c.course_name })));
      }
      setGlobalResults(results);
      setIsSearching(false);
  };

  // --- RENDER ---
  const TABS = [
      { id: 'courses', label: 'Courses', icon: <Calendar size={16}/> },
      { id: 'import', label: 'Import', icon: <Upload size={16}/> },
      { id: 'backup', label: 'Backup', icon: <Save size={16}/> },
      { id: 'search', label: 'Search', icon: <Search size={16}/> },
  ];

  return (
    <div style={styles.card}>
      {/* HEADER & TABS */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
        <div>
            <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'12px', color:'#2c3e50'}}>
                <Database size={24} className="text-blue-600"/> Mission Control
            </h2>
            <div style={{fontSize:'13px', color:'#666', marginTop:'5px'}}>System Administration</div>
        </div>
        <div style={{display:'flex', gap:'8px', background:'#f1f3f5', padding:'5px', borderRadius:'10px'}}>
           {TABS.map(t => (
               <button 
                   key={t.id}
                   onClick={()=>setActiveTab(t.id)} 
                   style={{
                       display:'flex', alignItems:'center', gap:'8px',
                       padding:'8px 16px', border:'none', borderRadius:'8px',
                       background: activeTab===t.id ? 'white' : 'transparent',
                       color: activeTab===t.id ? '#007bff' : '#666',
                       fontWeight: activeTab===t.id ? 'bold' : 'normal',
                       boxShadow: activeTab===t.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                       cursor:'pointer', transition:'all 0.2s'
                   }}
               >
                   {t.icon} {t.label}
               </button>
           ))}
        </div>
      </div>

      {/* --- TAB 1: COURSES MANAGER --- */}
      {activeTab === 'courses' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px', animation:'fadeIn 0.3s ease'}}>
            
            {/* Create / Edit Form */}
            <div style={{background:'linear-gradient(to bottom right, #ffffff, #f8f9fa)', padding:'25px', borderRadius:'12px', border:'1px solid #eee', height:'fit-content', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px', color: editingId ? '#e65100' : '#007bff'}}>
                    {editingId ? <Edit size={20}/> : <PlusCircle size={20}/>}
                    {editingId ? 'Edit Course' : 'Create Course'}
                </h3>
                
                {/* Switch Submit Handler based on Mode */}
                <form onSubmit={editingId ? handleUpdateCourse : handleCreateCourse} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div><label style={styles.label}>Name</label><input style={styles.input} placeholder="e.g. 10-Day" value={newCourseData.name} onChange={e=>setNewCourseData({...newCourseData, name:e.target.value})} /></div>
                    <div><label style={styles.label}>Teacher</label><input style={styles.input} placeholder="e.g. Goenka Ji" value={newCourseData.teacher || ''} onChange={e=>setNewCourseData({...newCourseData, teacher:e.target.value})} /></div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div><label style={styles.label}>Start</label><input type="date" style={styles.input} value={newCourseData.startDate} onChange={e=>setNewCourseData({...newCourseData, startDate:e.target.value})} /></div>
                        <div><label style={styles.label}>End</label><input type="date" style={styles.input} value={newCourseData.endDate} onChange={e=>setNewCourseData({...newCourseData, endDate:e.target.value})} /></div>
                    </div>
                    
                    {/* Buttons: Update or Create */}
                    <button type="submit" style={{...styles.btn(true), background: editingId ? '#e65100' : '#28a745', color:'white', justifyContent:'center', padding:'12px', marginTop:'10px'}}>
                        {editingId ? 'Update Course' : 'Create New Course'}
                    </button>
                    
                    {/* Cancel Button (Only in Edit Mode) */}
                    {editingId && (
                        <button type="button" onClick={handleCancelEdit} style={{...styles.btn(false), justifyContent:'center', padding:'8px', color:'#666'}}>
                            Cancel Edit
                        </button>
                    )}
                </form>
            </div>

            {/* Course List Table */}
            <div>
                <h3 style={{marginTop:0, marginBottom:'15px', color:'#444'}}>All Courses ({courses.length})</h3>
                <div style={{maxHeight:'500px', overflowY:'auto', border:'1px solid #eee', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                        <thead style={{position:'sticky', top:0, background:'#f8f9fa'}}>
                            <tr style={{borderBottom:'2px solid #e9ecef'}}>
                                <th style={{padding:'15px', textAlign:'left', color:'#666'}}>Course Name</th>
                                <th style={{padding:'15px', textAlign:'left', color:'#666'}}>Teacher</th>
                                <th style={{padding:'15px', textAlign:'center', color:'#666'}}>Status</th>
                                <th style={{padding:'15px', textAlign:'right', color:'#666'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.slice().reverse().map(c => {
                                const status = getCourseStatus(c);
                                const isEditing = editingId === c.course_id;
                                return (
                                    <tr key={c.course_id} style={{borderBottom:'1px solid #f0f0f0', background: isEditing ? '#fff3e0' : 'transparent'}}>
                                        <td style={{padding:'15px'}}>
                                            <div style={{fontWeight:'bold', color:'#333'}}>{c.course_name.split('/')[0]}</div>
                                            <div style={{fontSize:'12px', color:'#888', marginTop:'4px'}}>{new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{padding:'15px', color:'#555'}}>{c.teacher_name}</td>
                                        <td style={{padding:'15px', textAlign:'center'}}>
                                            <span style={{background: status.bg, color: status.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', display:'inline-block', minWidth:'80px', textAlign:'center'}}>{status.label}</span>
                                        </td>
                                        <td style={{padding:'15px', textAlign:'right'}}>
                                            <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                                {/* ✅ Edit Button */}
                                                <button onClick={()=>handleEditClick(c)} style={{padding:'8px', background:'white', color:'#e65100', border:'1px solid #ffe0b2', borderRadius:'6px', cursor:'pointer'}} title="Edit Course">
                                                    <Edit size={16}/>
                                                </button>
                                                {/* Delete Button */}
                                                <button onClick={()=>handleDeleteCourse(c.course_id, c.course_name)} style={{padding:'8px', background:'white', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer'}} title="Delete Course">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* ... (Import, Backup, Search Tabs remain unchanged) ... */}
      
      {/* --- TAB 2: IMPORT DATA --- */}
      {activeTab === 'import' && (
        <div style={{maxWidth:'900px', margin:'0 auto', animation:'fadeIn 0.3s ease'}}>
          <div style={{marginBottom:'30px', background:'#e3f2fd', padding:'20px', borderRadius:'12px', border:'1px solid #bbdefb', display:'flex', alignItems:'center', gap:'20px'}}>
            <div style={{background:'white', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#007bff', fontWeight:'bold'}}>1</div>
            <div style={{flex:1}}>
                <label style={{display:'block', fontSize:'12px', fontWeight:'bold', color:'#0d47a1', marginBottom:'5px', textTransform:'uppercase'}}>Select Target Course</label>
                <select style={{...styles.input, border:'none', fontSize:'16px', background:'transparent', fontWeight:'bold', padding:0, color:'#0056b3', outline:'none'}} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)}>
                  <option value="">-- Click to Select Course --</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
                </select>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
              {/* CSV Upload */}
              <div style={{border:'2px dashed #ccc', borderRadius:'12px', padding:'40px', textAlign:'center', background:'#f9f9f9', position:'relative', transition:'all 0.2s', ':hover':{borderColor:'#007bff'}}}>
                <h4 style={{margin:'0 0 10px 0', color:'#555'}}>Option A: Bulk Upload</h4>
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} />
                <div style={{pointerEvents:'none'}}>
                    <div style={{width:'60px', height:'60px', background:'#e9ecef', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px auto'}}>
                        <Upload size={30} color="#666"/>
                    </div>
                    <p style={{margin:'10px 0', color:'#333', fontWeight:'bold', fontSize:'16px'}}>Drag & Drop CSV</p>
                    <div style={{fontSize:'12px', color:'#888'}}>or click to browse</div>
                </div>
                <div style={{marginTop:'30px', pointerEvents:'auto'}}>
                    <button onClick={downloadTemplate} style={{background:'white', border:'1px solid #ddd', padding:'8px 15px', borderRadius:'20px', color:'#007bff', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', margin:'0 auto'}}>
                        <Download size={12}/> Download Template
                    </button>
                </div>
              </div>

              {/* Manual Entry */}
              <div style={{border:'1px solid #eee', borderRadius:'12px', padding:'25px', background:'white', boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
                  <h4 style={{margin:'0 0 20px 0', color:'#555'}}>Option B: Manual Entry</h4>
                  <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                      <input style={styles.input} placeholder="Full Name" value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} />
                      <div style={{display:'flex', gap:'10px'}}>
                          <input style={styles.input} placeholder="Conf No" value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} />
                          <input style={styles.input} type="number" placeholder="Age" value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} />
                      </div>
                      <div style={{display:'flex', gap:'10px'}}>
                          <select style={styles.input} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select>
                          <input style={styles.input} placeholder="Courses (S:1)" value={manualStudent.courses_info} onChange={e=>setManualStudent({...manualStudent, courses_info:e.target.value})} />
                      </div>
                      <button onClick={handleManualSubmit} style={{...styles.btn(true), background:'#007bff', color:'white', justifyContent:'center', marginTop:'10px', padding:'12px'}}>Add to Preview</button>
                  </div>
              </div>
          </div>

          {uploadStatus && <div style={{marginTop:'20px', padding:'15px', background: uploadStatus.type==='success'?'#d4edda':'#f8d7da', color: uploadStatus.type==='success'?'#155724':'#721c24', borderRadius:'8px', fontWeight:'bold', textAlign:'center'}}>{uploadStatus.msg}</div>}
          
          {students.length > 0 && (
            <div style={{marginTop:'40px', borderTop:'1px solid #eee', paddingTop:'20px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0}}>Preview Data ({students.length})</h3>
                  <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={()=>setStudents([])} style={styles.btn(false)}>Clear All</button>
                      <button onClick={saveToDatabase} style={{...styles.btn(true), background:'#28a745', color:'white', padding:'10px 25px'}}><Save size={16}/> Save to Database</button>
                  </div>
               </div>
               <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee', borderRadius:'8px'}}>
                 <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
                   <thead style={{position:'sticky', top:0, background:'#f1f1f1'}}><tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr></thead>
                   <tbody>{students.map(s => (<tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue', fontWeight:'bold'}}>{s.conf_no}</td><td style={{padding:'8px'}}>{s.full_name}</td><td style={{padding:'8px'}}>{s.age}</td><td style={{padding:'8px'}}>{s.gender}</td><td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td></tr>))}</tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: BACKUP --- */}
      {activeTab === 'backup' && (
          <div style={{textAlign:'center', padding:'60px 40px', animation:'fadeIn 0.3s ease'}}>
              <div style={{width:'80px', height:'80px', background:'#f8f9fa', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto'}}>
                  <Archive size={40} color="#6c757d"/>
              </div>
              <h3 style={{fontSize:'24px', margin:'0 0 10px 0'}}>System Backup</h3>
              <p style={{color:'#666', marginBottom:'40px', maxWidth:'500px', margin:'0 auto 40px auto', lineHeight:'1.6'}}>
                  Create a complete snapshot of your entire database including all courses, student records, room assignments, and financial data.
              </p>
              <button onClick={handleDownloadBackup} style={{...styles.btn(true), background:'#343a40', color:'white', padding:'15px 40px', fontSize:'16px', borderRadius:'30px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
                  <Download size={18}/> Download Full Backup (.json)
              </button>
          </div>
      )}

      {/* --- TAB 4: GLOBAL SEARCH --- */}
      {activeTab === 'search' && (
          <div style={{maxWidth:'900px', margin:'0 auto', animation:'fadeIn 0.3s ease'}}>
              <div style={{display:'flex', gap:'15px', marginBottom:'30px'}}>
                  <div style={{flex:1, position:'relative'}}>
                      <Search size={20} color="#999" style={{position:'absolute', left:'15px', top:'15px'}}/>
                      <input 
                          style={{...styles.input, padding:'15px 15px 15px 50px', fontSize:'16px', borderRadius:'30px', border:'1px solid #ddd', width:'100%', boxSizing:'border-box'}} 
                          placeholder="Search Name or Conf No across ALL courses..." 
                          value={globalSearch} 
                          onChange={e=>setGlobalSearch(e.target.value)} 
                          onKeyDown={e=>e.key==='Enter' && handleGlobalSearch()} 
                      />
                  </div>
                  <button onClick={handleGlobalSearch} style={{...styles.btn(true), background:'#007bff', color:'white', padding:'0 30px', borderRadius:'30px'}}>
                      {isSearching ? 'Searching...' : 'Search'}
                  </button>
              </div>
              
              {globalResults.length > 0 ? (
                  <div style={{background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden', boxShadow:'0 4px 10px rgba(0,0,0,0.03)'}}>
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead style={{background:'#f8f9fa'}}>
                              <tr><th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Name</th><th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Conf No</th><th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Course</th><th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Status</th></tr>
                          </thead>
                          <tbody>
                              {globalResults.map((r, i) => (
                                  <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                                      <td style={{padding:'15px', fontWeight:'bold'}}>{r.full_name}</td>
                                      <td style={{padding:'15px', color:'#555'}}>{r.conf_no}</td>
                                      <td style={{padding:'15px'}}><span style={{background:'#e3f2fd', color:'#0d47a1', padding:'3px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>{r.courseName}</span></td>
                                      <td style={{padding:'15px'}}>{r.status}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (globalSearch && !isSearching && <div style={{textAlign:'center', padding:'50px', color:'#999'}}>No results found.</div>)}
          </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
