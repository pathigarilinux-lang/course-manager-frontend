import React, { useState } from 'react';
import { Database, Save, FileText, Download, Trash2, Calendar, Search, PlusCircle, Upload, CheckCircle, AlertCircle, ArrowRight, X, Filter } from 'lucide-react';
import { API_URL, styles } from '../config';

// Print styles for the preview table
const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function CourseAdmin({ courses, refreshCourses }) {
  // Tabs: 'courses', 'import', 'backup', 'search'
  const [activeTab, setActiveTab] = useState('courses'); 
  
  // State for Course Manager
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
  
  // --- SMART IMPORT STATE ---
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Map, 3: Clean/Review
  const [rawFileData, setRawFileData] = useState({ headers: [], rows: [] });
  const [fieldMapping, setFieldMapping] = useState({ full_name: '', conf_no: '', age: '', gender: '', courses_info: '', email: '', mobile: '' });
  const [cleanedData, setCleanedData] = useState([]);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(false);

  // Global Search
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

  // --- SMART IMPORT LOGIC ---
  
  // 1. FILE PARSER (Robust CSV)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return alert("File is empty or invalid.");
        
        // CSV Splitter (Handles commas inside quotes)
        const parseRow = (row) => {
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            return row.split(regex).map(cell => cell.trim().replace(/^"|"$/g, ''));
        };

        const headers = parseRow(lines[0]);
        const rows = lines.slice(1).map(line => parseRow(line));
        
        setRawFileData({ headers, rows });
        
        // Auto-Guess Mapping
        const newMap = { ...fieldMapping };
        headers.forEach((h, index) => {
            const head = h.toLowerCase();
            if (head.includes('name')) newMap.full_name = index;
            if (head.includes('conf') || head.includes('id')) newMap.conf_no = index;
            if (head.includes('age')) newMap.age = index;
            if (head.includes('gender') || head.includes('sex')) newMap.gender = index;
            if (head.includes('course') || head.includes('history')) newMap.courses_info = index;
            if (head.includes('email')) newMap.email = index;
            if (head.includes('mobile') || head.includes('phone')) newMap.mobile = index;
        });
        setFieldMapping(newMap);
        setImportStep(2); // Move to Map Step
    };
    reader.readAsText(file);
  };

  // 2. PROCESS & VALIDATE
  const runSmartCleaner = () => {
      if (fieldMapping.full_name === '' || fieldMapping.conf_no === '') {
          return alert("Please map at least 'Full Name' and 'Conf No' columns.");
      }

      const processed = rawFileData.rows.map((row, i) => {
          const getVal = (idx) => (idx !== '' && row[idx] ? row[idx] : '');
          
          let p = {
              tempId: i,
              full_name: getVal(fieldMapping.full_name),
              conf_no: getVal(fieldMapping.conf_no),
              age: getVal(fieldMapping.age).replace(/\D/g, ''), // Clean non-digits
              gender: getVal(fieldMapping.gender),
              courses_info: getVal(fieldMapping.courses_info),
              email: getVal(fieldMapping.email),
              mobile: getVal(fieldMapping.mobile),
              isValid: true,
              issues: []
          };

          // Smart Logic: Standardize Gender
          const g = p.gender.toLowerCase();
          if (g.startsWith('m')) p.gender = 'Male';
          else if (g.startsWith('f')) p.gender = 'Female';
          else p.gender = 'Male'; // Default fallback or keep empty

          // Validation Rules
          if (!p.full_name) p.issues.push('Missing Name');
          if (!p.conf_no) p.issues.push('Missing ID');
          if (!p.age) p.issues.push('Missing Age');
          
          if (p.issues.length > 0) p.isValid = false;

          return p;
      });

      setCleanedData(processed);
      setImportStep(3); // Move to Review Step
  };

  // 3. UPLOAD TO DB
  const handleFinalUpload = async () => {
      const validData = cleanedData.filter(p => p.isValid);
      if (validData.length === 0) return alert("No valid data to upload.");
      
      const targetCourse = courses.find(c => c.course_name === selectedCourseForUpload);
      if (!targetCourse) return alert("Select a target course.");

      if (!window.confirm(`Upload ${validData.length} students to ${selectedCourseForUpload}?`)) return;

      try {
          const payload = { 
              students: validData.map(s => ({ 
                  name: s.full_name, confNo: s.conf_no, age: s.age, 
                  gender: s.gender, courses: s.courses_info, email: s.email, phone: s.mobile 
              }))
          };
          
          const res = await fetch(`${API_URL}/courses/${targetCourse.course_id}/import`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(payload) 
          });
          
          const data = await res.json();
          if (res.ok) {
              alert(`✅ Success! Imported ${data.count || validData.length} students.`);
              setImportStep(1);
              setCleanedData([]);
              setRawFileData({ headers: [], rows: [] });
          } else {
              alert(`❌ Error: ${data.error}`);
          }
      } catch (err) { alert("Upload Failed."); }
  };

  // --- ACTIONS ---
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

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
        <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Database size={24} className="text-blue-600"/> Mission Control</h2>
        <div style={{display:'flex', gap:'5px'}}>
           <button onClick={()=>setActiveTab('courses')} style={styles.quickBtn(activeTab==='courses')}><Calendar size={14}/> Courses</button>
           <button onClick={()=>setActiveTab('import')} style={styles.quickBtn(activeTab==='import')}><Upload size={14}/> Smart Import</button>
           <button onClick={()=>setActiveTab('backup')} style={styles.quickBtn(activeTab==='backup')}><Save size={14}/> Backup</button>
           <button onClick={()=>setActiveTab('search')} style={styles.quickBtn(activeTab==='search')}><Search size={14}/> Search</button>
        </div>
      </div>

      {/* --- TAB 1: COURSES MANAGER --- */}
      {activeTab === 'courses' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px'}}>
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
            <div>
                <h3 style={{marginTop:0}}>All Courses ({courses.length})</h3>
                <div style={{maxHeight:'500px', overflowY:'auto', border:'1px solid #eee', borderRadius:'8px'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                        <thead style={{position:'sticky', top:0, background:'#f8f9fa'}}><tr style={{borderBottom:'2px solid #ddd'}}><th style={{padding:'12px', textAlign:'left'}}>Course Name</th><th style={{padding:'12px', textAlign:'left'}}>Teacher</th><th style={{padding:'12px', textAlign:'center'}}>Status</th><th style={{padding:'12px', textAlign:'right'}}>Action</th></tr></thead>
                        <tbody>
                            {courses.slice().reverse().map(c => {
                                const status = getCourseStatus(c);
                                return ( <tr key={c.course_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'12px'}}><div style={{fontWeight:'bold'}}>{c.course_name.split('/')[0]}</div><div style={{fontSize:'11px', color:'#666'}}>{new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</div></td><td style={{padding:'12px'}}>{c.teacher_name}</td><td style={{padding:'12px', textAlign:'center'}}><span style={{background: status.bg, color: status.color, padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold', display:'inline-block', minWidth:'70px'}}>{status.label}</span></td><td style={{padding:'12px', textAlign:'right'}}><button onClick={()=>handleDeleteCourse(c.course_id, c.course_name)} style={{padding:'6px', background:'#fff5f5', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'4px', cursor:'pointer'}} title="Delete Course"><Trash2 size={16}/></button></td></tr> );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB 2: SMART IMPORT WIZARD --- */}
      {activeTab === 'import' && (
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          
          {/* WIZARD STEPS UI */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'30px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', opacity: importStep >= 1 ? 1 : 0.5}}>
                  <div style={{width:'30px', height:'30px', borderRadius:'50%', background: importStep>=1 ? '#007bff' : '#ccc', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>1</div>
                  <span style={{fontWeight:'bold'}}>Upload</span>
              </div>
              <div style={{width:'50px', height:'2px', background:'#ccc', margin:'0 10px'}}></div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', opacity: importStep >= 2 ? 1 : 0.5}}>
                  <div style={{width:'30px', height:'30px', borderRadius:'50%', background: importStep>=2 ? '#007bff' : '#ccc', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>2</div>
                  <span style={{fontWeight:'bold'}}>Map Columns</span>
              </div>
              <div style={{width:'50px', height:'2px', background:'#ccc', margin:'0 10px'}}></div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', opacity: importStep >= 3 ? 1 : 0.5}}>
                  <div style={{width:'30px', height:'30px', borderRadius:'50%', background: importStep>=3 ? '#007bff' : '#ccc', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>3</div>
                  <span style={{fontWeight:'bold'}}>Clean & Save</span>
              </div>
          </div>

          {/* STEP 1: UPLOAD */}
          {importStep === 1 && (
              <div style={{border:'2px dashed #ccc', borderRadius:'10px', padding:'40px', textAlign:'center', background:'#f9f9f9', position:'relative'}}>
                  <h3 style={{marginTop:0}}>Step 1: Upload Registration File</h3>
                  <p style={{color:'#666', marginBottom:'20px'}}>Select your Excel (converted to CSV) file. <br/>Ensure it has headers like Name, Gender, Age, Conf No.</p>
                  <input type="file" accept=".csv" onChange={handleFileUpload} style={{position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%'}} />
                  <div style={{pointerEvents:'none'}}>
                      <Upload size={48} color="#007bff" />
                      <button type="button" style={{marginTop:'20px', ...styles.btn(true), background:'#007bff', color:'white'}}>Select CSV File</button>
                  </div>
              </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {importStep === 2 && (
              <div style={{background:'white', padding:'25px', borderRadius:'10px', border:'1px solid #ddd'}}>
                  <h3 style={{marginTop:0}}>Step 2: Map Your Columns</h3>
                  <p style={{color:'#666', marginBottom:'20px'}}>We found {rawFileData.rows.length} rows. Please confirm which column is which.</p>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                      {Object.keys(fieldMapping).map(key => (
                          <div key={key} style={{marginBottom:'10px'}}>
                              <label style={{display:'block', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', color:'#555', marginBottom:'5px'}}>
                                  {key.replace('_', ' ')} <span style={{color:'red'}}>*</span>
                              </label>
                              <select 
                                  style={{...styles.input, border: fieldMapping[key] !== '' ? '1px solid #28a745' : '1px solid #ccc'}} 
                                  value={fieldMapping[key]} 
                                  onChange={e => setFieldMapping({...fieldMapping, [key]: e.target.value})}
                              >
                                  <option value="">-- Select Column --</option>
                                  {rawFileData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                              </select>
                          </div>
                      ))}
                  </div>

                  <div style={{marginTop:'30px', display:'flex', justifyContent:'space-between'}}>
                      <button onClick={()=>setImportStep(1)} style={styles.btn(false)}>Back</button>
                      <button onClick={runSmartCleaner} style={{...styles.btn(true), background:'#28a745', color:'white'}}>Next: Clean Data <ArrowRight size={16}/></button>
                  </div>
              </div>
          )}

          {/* STEP 3: CLEAN & REVIEW */}
          {importStep === 3 && (
              <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #ddd'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                      <h3 style={{margin:0}}>Step 3: Review & Upload</h3>
                      <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                          <label style={{fontSize:'13px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                              <input type="checkbox" checked={showOnlyInvalid} onChange={e=>setShowOnlyInvalid(e.target.checked)} />
                              Show Only Errors
                          </label>
                          <select style={styles.input} value={selectedCourseForUpload} onChange={e=>setSelectedCourseForUpload(e.target.value)}>
                              <option value="">-- Select Target Course --</option>
                              {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
                          </select>
                          <button onClick={handleFinalUpload} style={{...styles.btn(true), background:'#28a745', color:'white'}}>
                              <Save size={16}/> Finish Import
                          </button>
                      </div>
                  </div>

                  <div style={{maxHeight:'400px', overflowY:'auto', border:'1px solid #eee'}}>
                      <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
                          <thead style={{position:'sticky', top:0, background:'#f8f9fa', zIndex:10}}>
                              <tr>
                                  <th style={thPrint}>Status</th>
                                  <th style={thPrint}>Conf No</th>
                                  <th style={thPrint}>Name</th>
                                  <th style={thPrint}>Age</th>
                                  <th style={thPrint}>Gender</th>
                                  <th style={thPrint}>Issues</th>
                              </tr>
                          </thead>
                          <tbody>
                              {cleanedData
                                  .filter(row => !showOnlyInvalid || !row.isValid)
                                  .map((row, i) => (
                                  <tr key={i} style={{borderBottom:'1px solid #eee', background: row.isValid ? 'white' : '#fff5f5'}}>
                                      <td style={{padding:'8px', textAlign:'center'}}>
                                          {row.isValid ? <CheckCircle size={16} color="green"/> : <AlertCircle size={16} color="red"/>}
                                      </td>
                                      <td style={{padding:'8px', fontWeight:'bold'}}>{row.conf_no}</td>
                                      <td style={{padding:'8px'}}>{row.full_name}</td>
                                      <td style={{padding:'8px'}}>{row.age}</td>
                                      <td style={{padding:'8px'}}>{row.gender}</td>
                                      <td style={{padding:'8px', color:'red', fontSize:'11px'}}>{row.issues.join(', ')}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div style={{marginTop:'15px', display:'flex', justifyContent:'space-between', color:'#666', fontSize:'12px'}}>
                      <button onClick={()=>setImportStep(2)} style={styles.btn(false)}>Back to Map</button>
                      <span>Total: {cleanedData.length} | Valid: {cleanedData.filter(d=>d.isValid).length} | Invalid: {cleanedData.filter(d=>!d.isValid).length}</span>
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
