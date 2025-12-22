import React, { useState, useEffect } from 'react';
import { Upload, Database, Save, FileText, Download, Trash2, Calendar, Search, PlusCircle, Archive } from 'lucide-react';
import { API_URL, styles } from '../config';

// Print styles for the preview table
const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function CourseAdmin({ courses, refreshCourses }) {
  // Tabs: 'courses' (List/Create), 'import' (CSV/Manual), 'backup' (JSON)
  const [activeTab, setActiveTab] = useState('courses'); 
  
  // State
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    const newStudent = { id: Date.now(), ...manualStudent, conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`, status: 'Active', dining_seat: '', room_no: '' };
    setStudents(prev => [newStudent, ...prev]);
    alert(`Added ${newStudent.full_name} to the Preview list.`);
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

  // --- GLOBAL SEARCH (Client-Side for simplicity) ---
  const handleGlobalSearch = async () => {
      if(!globalSearch) return;
      setIsSearching(true);
      let results = [];
      // Fetch data from ALL courses (Caution: Heavy operation if DB is huge, but fine for local centers)
      for (let c of courses) {
          const res = await fetch(`${API_URL}/courses/${c.course_id}/participants`);
          const data = await res.json();
          const matches = data.filter(p => 
              p.full_name.toLowerCase().includes(globalSearch.toLowerCase()) || 
              (p.conf_no && p.conf_no.toLowerCase().includes(globalSearch.toLowerCase()))
          );
          if (matches.length > 0) {
              results.push(...matches.map(m => ({ ...m, courseName: c.course_name })));
          }
      }
      setGlobalResults(results);
      setIsSearching(false);
  };

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Database size={24} className="text-blue-600"/> Mission Control</h2>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={()=>setActiveTab('courses')} style={styles.quickBtn(activeTab==='courses')}><Calendar size={14}/> Courses</button>
           <button onClick={()=>setActiveTab('import')} style={styles.quickBtn(activeTab==='import')}><Upload size={14}/> Import Data</button>
           <button onClick={()=>setActiveTab('backup')} style={styles.quickBtn(activeTab==='backup')}><Save size={14}/> Backup</button>
           <button onClick={()=>setActiveTab('search')} style={styles.quickBtn(activeTab==='search')}><Search size={14}/> Global Search</button>
        </div>
      </div>

      {/* --- TAB 1: COURSES MANAGER --- */}
      {activeTab === 'courses' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px'}}>
            {/* Create Form */}
            <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', height:'fit-content'}}>
                <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}><PlusCircle size={18}/> Create Course</h3>
                <form onSubmit={handleCreateCourse} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div><label style={styles.label}>Name</label><input style={styles.input} placeholder="e.g. 10-Day" value={newCourseData.name} onChange={e=>setNewCourseData({...newCourseData, name:e.target.value})} /></div>
                    <div><label style={styles.label}>Teacher</label><input style={styles.input} placeholder="e.g. Goenka Ji" value={newCourseData.teacher || ''} onChange={e=>setNewCourseData({...newCourseData, teacher:e.target.value})} /></div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div><label style={styles.label}>Start</label><input type="date" style={styles.input} value={newCourseData.startDate} onChange={e=>setNewCourseData({...newCourseData, startDate:e.target.value})} /></div>
                        <div><label style={styles.label}>End</label><input type="date" style={styles.input} value={newCourseData.endDate} onChange={e=>setNewCourseData({...newCourseData, endDate:e.target.value})} /></div>
                    </div>
                    <button type="submit" style={{...styles.btn(true), background:'#28a745', color:'white', justifyContent:'center'}}>Create New Course</button>
                </form>
            </div>

            {/* Course List Table */}
            <div>
                <h3 style={{marginTop:0}}>All Courses ({courses.length})</h3>
                <div style={{maxHeight:'500px', overflowY:'auto', border:'1px solid #eee', borderRadius:'8px'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                        <thead style={{position:'sticky', top:0, background:'#f8f9fa'}}>
                            <tr style={{borderBottom:'2px solid #ddd'}}>
                                <th style={{padding:'12px', textAlign:'left'}}>Course Name</th>
                                <th style={{padding:'12px', textAlign:'left'}}>Teacher</th>
                                <th style={{padding:'12px', textAlign:'center'}}>Status</th>
                                <th style={{padding:'12px', textAlign:'right'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.slice().reverse().map(c => {
                                const status = getCourseStatus(c);
                                return (
                                    <tr key={c.course_id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:'12px'}}>
                                            <div style={{fontWeight:'bold'}}>{c.course_name.split('/')[0]}</div>
                                            <div style={{fontSize:'11px', color:'#666'}}>{new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{padding:'12px'}}>{c.teacher_name}</td>
                                        <td style={{padding:'12px', textAlign:'center'}}>
                                            <span style={{background: status.bg, color: status.color, padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold', display:'inline-block', minWidth:'70px'}}>{status.label}</span>
                                        </td>
                                        <td style={{padding:'12px', textAlign:'right'}}>
                                            <button onClick={()=>handleDeleteCourse(c.course_id, c.course_name)} style={{padding:'6px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'4px', cursor:'pointer'}} title="Delete Course">
                                                <Trash2 size={16}/>
                                            </button>
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

      {/* --- TAB 2: IMPORT DATA --- */}
      {activeTab === 'import' && (
        <div style={{maxWidth:'800px', margin:'0 auto'}}>
          <div style={{marginBottom:'20px', background:'#f0f8ff', padding:'15px', borderRadius:'8px', border:'1px solid #cce5ff'}}>
            <label style={styles.label}>1. Select Target Course</label>
            <select style={styles.input} value={selectedCourseForUpload} onChange={(e) => setSelectedCourseForUpload(e.target.value)}>
              <option value="">-- Select Course --</option>
              {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
            </select>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              {/* CSV Upload */}
              <div style={{border:'2px dashed #ccc', borderRadius:'8px', padding:'30px', textAlign:'center', background:'#f9f9f9', position:'relative'}}>
                <h4 style={{margin:'0 0 10px 0'}}>Option A: Bulk Upload</h4>
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} />
                <div style={{pointerEvents:'none'}}>
                    <Database size={40} color="#999" />
                    <p style={{margin:'10px 0', color:'#555', fontWeight:'bold'}}>Drag CSV Here</p>
                    <button type="button" style={styles.btn(false)}>Browse File</button>
                </div>
                <div style={{marginTop:'20px', pointerEvents:'auto'}}>
                    <button onClick={downloadTemplate} style={{background:'none', border:'none', color:'#007bff', textDecoration:'underline', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                        <Download size={12}/> Download Template CSV
                    </button>
                </div>
              </div>

              {/* Manual Entry */}
              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'20px'}}>
                  <h4 style={{margin:'0 0 15px 0'}}>Option B: Manual Entry</h4>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                      <input style={styles.input} placeholder="Full Name" value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} />
                      <div style={{display:'flex', gap:'5px'}}>
                          <input style={styles.input} placeholder="Conf No" value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} />
                          <input style={styles.input} type="number" placeholder="Age" value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} />
                      </div>
                      <div style={{display:'flex', gap:'5px'}}>
                          <select style={styles.input} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select>
                          <input style={styles.input} placeholder="Courses (S:1)" value={manualStudent.courses_info} onChange={e=>setManualStudent({...manualStudent, courses_info:e.target.value})} />
                      </div>
                      <button onClick={handleManualSubmit} style={{...styles.btn(true), background:'#007bff', color:'white', justifyContent:'center'}}>Add to Preview</button>
                  </div>
              </div>
          </div>

          {uploadStatus && <div style={{marginTop:'15px', padding:'10px', background:'#e6fffa', color:'#2c7a7b', borderRadius:'5px'}}>{uploadStatus.msg}</div>}
          
          {students.length > 0 && (
            <div style={{marginTop:'25px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h3 style={{margin:0}}>Preview ({students.length})</h3>
                  <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={()=>setStudents([])} style={styles.btn(false)}>Clear</button>
                      <button onClick={saveToDatabase} style={{...styles.btn(true), background:'#28a745', color:'white'}}><Save size={16}/> Save to Database</button>
                  </div>
               </div>
               <div style={{maxHeight:'300px', overflowY:'auto', border:'1px solid #eee'}}>
                 <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
                   <thead style={{position:'sticky', top:0, background:'#f1f1f1'}}><tr><th style={thPrint}>Conf</th><th style={thPrint}>Name</th><th style={thPrint}>Age</th><th style={thPrint}>Gender</th><th style={thPrint}>Courses</th></tr></thead>
                   <tbody>{students.map(s => (<tr key={s.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px', color: s.status === 'Pending ID' ? 'orange' : 'blue'}}>{s.conf_no}</td><td style={{padding:'8px'}}>{s.full_name}</td><td style={{padding:'8px'}}>{s.age}</td><td style={{padding:'8px'}}>{s.gender}</td><td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td></tr>))}</tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: BACKUP --- */}
      {activeTab === 'backup' && (
          <div style={{textAlign:'center', padding:'40px'}}>
              <Database size={64} color="#6c757d" style={{marginBottom:'20px'}}/>
              <h3>System Backup</h3>
              <p style={{color:'#666', marginBottom:'30px', maxWidth:'400px', margin:'0 auto 30px auto'}}>Download a complete copy of all courses, students, and financial records in JSON format.</p>
              <button onClick={handleDownloadBackup} style={{...styles.btn(true), background:'#6c757d', color:'white', padding:'15px 30px', fontSize:'16px'}}>Download Full Backup</button>
          </div>
      )}

      {/* --- TAB 4: GLOBAL SEARCH --- */}
      {activeTab === 'search' && (
          <div style={{maxWidth:'800px', margin:'0 auto'}}>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                  <input style={{...styles.input, padding:'15px', fontSize:'18px'}} placeholder="Search Name or Conf No across ALL courses..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleGlobalSearch()} />
                  <button onClick={handleGlobalSearch} style={{...styles.btn(true), background:'#007bff', color:'white', padding:'0 25px'}}>{isSearching ? '...' : 'Search'}</button>
              </div>
              
              {globalResults.length > 0 ? (
                  <table style={{width:'100%', borderCollapse:'collapse', background:'white', border:'1px solid #eee'}}>
                      <thead style={{background:'#f8f9fa'}}>
                          <tr><th style={thPrint}>Name</th><th style={thPrint}>Conf</th><th style={thPrint}>Course</th><th style={thPrint}>Status</th></tr>
                      </thead>
                      <tbody>
                          {globalResults.map((r, i) => (
                              <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                  <td style={{padding:'10px', fontWeight:'bold'}}>{r.full_name}</td>
                                  <td style={{padding:'10px'}}>{r.conf_no}</td>
                                  <td style={{padding:'10px', color:'#007bff'}}>{r.courseName}</td>
                                  <td style={{padding:'10px'}}>{r.status}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              ) : (globalSearch && !isSearching && <div style={{textAlign:'center', padding:'20px', color:'#999'}}>No results found.</div>)}
          </div>
      )}
    </div>
  );
}
