import React, { useState, useEffect } from 'react';
import { 
    Upload, Database, Save, Download, Trash2, Calendar, 
    Search, PlusCircle, Edit, FileText, CheckCircle, 
    AlertTriangle, X, Lock, Unlock, Eye, User, MapPin,
    RefreshCw, Filter, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { API_URL, styles } from '../config';

// --- STYLES FOR PRINT/TABLES ---
const thPrint = { 
    textAlign: 'left', 
    padding: '12px 15px', 
    borderBottom: '2px solid #dee2e6', 
    fontSize: '13px', 
    fontWeight: '600',
    color: '#495057', 
    textTransform: 'uppercase', 
    background: '#f8f9fa',
    whiteSpace: 'nowrap'
};

const tdStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'middle',
    color: '#333'
};

// ==========================================
// ✅ HELPER: SMART PHONE CLEANER
// ==========================================
const extractPhoneNumber = (rawStr) => {
    if (!rawStr) return '';
    const str = String(rawStr);
    
    // 1. Remove Email Addresses if mixed in same cell
    const withoutEmail = str.replace(/\S+@\S+\.\S+/g, '');
    
    // 2. Remove non-digit characters (keep + for country code)
    // We allow 0-9 and + 
    const cleanNumber = withoutEmail.replace(/[^0-9+]/g, '');
    
    return cleanNumber.trim();
};

export default function CourseAdmin({ courses, refreshCourses, userRole }) { 
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('courses'); // courses | import | search
  
  // CREATE STATE
  const [newCourse, setNewCourse] = useState({ 
      course_name: '', start_date: '', end_date: '', teacher_name: '' 
  });
  
  // EDIT STATE
  const [editingCourse, setEditingCourse] = useState(null); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // VIEW DETAILS STATE
  const [viewingCourseId, setViewingCourseId] = useState(null); 
  const [courseStats, setCourseStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // IMPORT STATE
  const [importFile, setImportFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [targetCourseId, setTargetCourseId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // GLOBAL SEARCH STATE
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  // ==========================================
  // 1. FETCH STATS (When viewing details)
  // ==========================================
  useEffect(() => {
      if (viewingCourseId) {
          fetchCourseStats(viewingCourseId);
      }
  }, [viewingCourseId]);

  const fetchCourseStats = async (id) => {
      setIsLoadingStats(true);
      try {
          const res = await fetch(`${API_URL}/courses/${id}/stats`);
          if(res.ok) {
              const data = await res.json();
              setCourseStats(data);
          } else {
              setCourseStats(null);
          }
      } catch (e) { console.error(e); }
      setIsLoadingStats(false);
  };


  // ==========================================
  // 2. CREATE COURSE (WITH ROLE SECURITY)
  // ==========================================
  const handleAddCourse = async (e) => {
      e.preventDefault();
      if(!newCourse.course_name || !newCourse.start_date) return alert("Course Name and Start Date required.");

      setIsSaving(true);
      try {
          // ✅ CRITICAL: Attach Owner Role
          const payload = {
              ...newCourse,
              owner_role: userRole // 'admin', 'staff', or 'dn1ops'
          };

          const res = await fetch(`${API_URL}/courses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              alert("✅ Course Created Successfully!");
              setNewCourse({ course_name: '', start_date: '', end_date: '', teacher_name: '' });
              refreshCourses();
          } else {
              const err = await res.json();
              alert(`❌ Failed: ${err.error || 'Unknown Error'}`);
          }
      } catch (err) {
          console.error(err);
          alert("Network Error");
      }
      setIsSaving(false);
  };


  // ==========================================
  // 3. UPDATE COURSE (EDIT)
  // ==========================================
  const openEditModal = (course) => {
      setEditingCourse({ ...course });
      setIsEditModalOpen(true);
  };

  const handleUpdateCourse = async () => {
      if (!editingCourse) return;
      setIsSaving(true);
      try {
          const res = await fetch(`${API_URL}/courses/${editingCourse.course_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editingCourse)
          });

          if (res.ok) {
              alert("✅ Course Updated!");
              setIsEditModalOpen(false);
              setEditingCourse(null);
              refreshCourses();
          } else {
              alert("Update Failed");
          }
      } catch (e) { console.error(e); alert("Network Error"); }
      setIsSaving(false);
  };


  // ==========================================
  // 4. DELETE COURSE
  // ==========================================
  const handleDeleteCourse = async (id) => {
      if(!window.confirm("⚠️ DANGER: This will delete the course AND ALL students in it.\n\nThis cannot be undone.\n\nAre you sure you want to proceed?")) return;
      
      try {
          const res = await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
          if(res.ok) {
              alert("🗑️ Course Deleted");
              refreshCourses();
          } else {
              alert("Failed to delete.");
          }
      } catch(e) { console.error(e); }
  };


  // ==========================================
  // 5. LOCK / UNLOCK COURSE (Status Toggle)
  // ==========================================
  const toggleCourseStatus = async (course) => {
      const newStatus = course.status === 'Completed' ? 'Active' : 'Completed';
      const action = newStatus === 'Completed' ? 'ARCHIVE' : 'ACTIVATE';
      
      if(!window.confirm(`Are you sure you want to ${action} this course?\n\nCompleted courses are hidden from some views.`)) return;

      try {
          const res = await fetch(`${API_URL}/courses/${course.course_id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ ...course, status: newStatus })
          });
          if(res.ok) refreshCourses();
      } catch(e) { console.error(e); }
  };


  // ==========================================
  // 6. EXCEL IMPORT LOGIC
  // ==========================================
  const handleFileUpload = async () => {
      if (!importFile || !targetCourseId) return alert("Please select a file and a course.");
      setUploadStatus("Processing File...");
      setIsUploading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(sheet);

              setUploadStatus(`Found ${jsonData.length} rows. Uploading...`);
              
              let successCount = 0;
              let failCount = 0;
              
              for (const row of jsonData) {
                  // Flexible Column Matching
                  const name = row['Name'] || row['Student Name'] || row['Full Name'] || row['Student'] || 'Unknown';
                  if(name === 'Unknown') {
                      failCount++;
                      continue; // Skip empty rows
                  }

                  const studentData = {
                      course_id: targetCourseId,
                      full_name: name,
                      age: row['Age'] || 0,
                      gender: row['Gender'] || row['Sex'] || 'Male',
                      mobile_no: extractPhoneNumber(row['Mobile'] || row['Phone'] || row['Contact'] || row['Cell']),
                      email: row['Email'] || '',
                      city: row['City'] || row['Location'] || '',
                      conf_no: row['Conf. No.'] || row['ID'] || row['Conf'] || '',
                      old_student: (row['Old/New'] === 'Old' || row['Category'] === 'Old' || row['Status'] === 'Old'),
                      status: 'Attending'
                  };

                  await fetch(`${API_URL}/participants`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify(studentData)
                  });
                  successCount++;
              }

              setUploadStatus(`✅ Import Complete!\nSuccess: ${successCount}\nSkipped: ${failCount}`);
              setImportFile(null);
              // document.getElementById('fileInput').value = ""; // Reset input if needed
              
          } catch (err) {
              console.error(err);
              setUploadStatus("❌ Error processing file. Please check format.");
          }
          setIsUploading(false);
      };
      reader.readAsArrayBuffer(importFile);
  };


  // ==========================================
  // 7. GLOBAL SEARCH LOGIC
  // ==========================================
  const handleGlobalSearch = async () => {
      if(globalSearch.length < 3) return;
      setIsSearching(true);
      try {
          const res = await fetch(`${API_URL}/participants/search?q=${globalSearch}`);
          const data = await res.json();
          setGlobalResults(Array.isArray(data) ? data : []);
      } catch(e) { console.error(e); }
      setIsSearching(false);
  };


  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div style={styles.card}>
      {/* HEADER TABS */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#2c3e50', fontSize:'22px'}}>
                  <Database size={24} color="#007bff"/> Course Administration
              </h2>
              <div style={{fontSize:'13px', color:'#777', marginTop:'5px'}}>
                  Create courses, manage schedules, and import student data.
              </div>
          </div>
          
          <div style={{display:'flex', gap:'10px', background:'#f8f9fa', padding:'5px', borderRadius:'8px', border:'1px solid #e9ecef'}}>
              <button onClick={()=>setActiveTab('courses')} style={{...styles.btn(activeTab==='courses'), fontSize:'13px', borderRadius:'6px'}}><Calendar size={16}/> Manage Courses</button>
              <button onClick={()=>setActiveTab('import')} style={{...styles.btn(activeTab==='import'), fontSize:'13px', borderRadius:'6px'}}><Upload size={16}/> Import Data</button>
              <button onClick={()=>setActiveTab('search')} style={{...styles.btn(activeTab==='search'), fontSize:'13px', borderRadius:'6px'}}><Search size={16}/> Global Search</button>
          </div>
      </div>

      {/* --- TAB 1: MANAGE COURSES --- */}
      {activeTab === 'courses' && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
              
              {/* CREATE FORM */}
              <div style={{background:'#fff', padding:'25px', borderRadius:'12px', marginBottom:'30px', border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', color:'#495057'}}>
                      <PlusCircle size={20} color="#28a745"/>
                      <h4 style={{margin:0, fontSize:'16px'}}>Create New Course</h4>
                  </div>
                  
                  <form onSubmit={handleAddCourse} style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:'20px', alignItems:'end'}}>
                      <div>
                          <label style={styles.label}>Course Name *</label>
                          <input style={styles.input} placeholder="e.g. 10-Day Course" value={newCourse.course_name} onChange={e=>setNewCourse({...newCourse, course_name:e.target.value})} required/>
                      </div>
                      <div>
                          <label style={styles.label}>Start Date *</label>
                          <input type="date" style={styles.input} value={newCourse.start_date} onChange={e=>setNewCourse({...newCourse, start_date:e.target.value})} required/>
                      </div>
                      <div>
                          <label style={styles.label}>End Date</label>
                          <input type="date" style={styles.input} value={newCourse.end_date} onChange={e=>setNewCourse({...newCourse, end_date:e.target.value})} />
                      </div>
                      <div>
                          <label style={styles.label}>Teacher</label>
                          <input style={styles.input} placeholder="Name" value={newCourse.teacher_name} onChange={e=>setNewCourse({...newCourse, teacher_name:e.target.value})} />
                      </div>
                      <button type="submit" disabled={isSaving} style={{...styles.btn(true), height:'42px', display:'flex', alignItems:'center', gap:'8px', background: isSaving ? '#ccc' : '#28a745'}}>
                          {isSaving ? 'Saving...' : 'Create Course'} <ArrowRight size={16}/>
                      </button>
                  </form>
              </div>

              {/* COURSE LIST TABLE */}
              <div style={{background:'white', borderRadius:'12px', border:'1px solid #e9ecef', overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                      <thead>
                          <tr style={{background:'#f8f9fa'}}>
                              <th style={thPrint}>Course Name</th>
                              <th style={thPrint}>Dates</th>
                              <th style={thPrint}>Status</th>
                              <th style={thPrint}>Owner</th>
                              <th style={{...thPrint, textAlign:'right'}}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {courses.map(course => (
                              <tr key={course.course_id} style={{
                                  borderBottom:'1px solid #eee', 
                                  background: course.status === 'Completed' ? '#f8f9fa' : 'white',
                                  color: course.status === 'Completed' ? '#999' : '#333'
                              }}>
                                  <td style={tdStyle}>
                                      <div style={{fontWeight:'bold', fontSize:'15px'}}>{course.course_name}</div>
                                      {course.teacher_name && <div style={{fontSize:'12px', color:'#777', marginTop:'3px'}}>Teacher: {course.teacher_name}</div>}
                                  </td>
                                  <td style={tdStyle}>
                                      <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                          <Calendar size={14} color="#777"/>
                                          {new Date(course.start_date).toLocaleDateString()} 
                                          {course.end_date && <span style={{color:'#999'}}> ➝ </span>}
                                          {course.end_date && new Date(course.end_date).toLocaleDateString()}
                                      </div>
                                  </td>
                                  <td style={tdStyle}>
                                       <button 
                                          onClick={()=>toggleCourseStatus(course)} 
                                          style={{
                                              background: course.status === 'Completed' ? '#e9ecef' : '#e8f5e9',
                                              border: course.status === 'Completed' ? '1px solid #ced4da' : '1px solid #a5d6a7',
                                              cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', 
                                              fontSize:'11px', fontWeight:'bold', 
                                              color: course.status==='Completed'?'#6c757d':'#2e7d32',
                                              padding: '4px 10px', borderRadius:'20px'
                                          }}
                                       >
                                          {course.status === 'Completed' ? <Lock size={12}/> : <Unlock size={12}/>}
                                          {course.status || 'Active'}
                                       </button>
                                  </td>
                                  <td style={tdStyle}>
                                      <span style={{
                                          background: course.owner_role === 'dn1ops' ? '#f3e5f5' : '#e3f2fd', 
                                          color: course.owner_role === 'dn1ops' ? '#7b1fa2' : '#0d47a1', 
                                          padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'bold', textTransform:'uppercase',
                                          border: course.owner_role === 'dn1ops' ? '1px solid #e1bee7' : '1px solid #bbdefb'
                                      }}>
                                          {course.owner_role || 'STAFF'}
                                      </span>
                                  </td>
                                  <td style={{...tdStyle, textAlign:'right'}}>
                                      <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                          <button onClick={()=>setViewingCourseId(course.course_id)} style={{background:'#e3f2fd', border:'1px solid #bbdefb', padding:'8px', borderRadius:'6px', color:'#0d47a1', cursor:'pointer', transition:'all 0.2s'}} title="View Stats">
                                              <Eye size={16}/>
                                          </button>
                                          <button onClick={()=>openEditModal(course)} style={{background:'#fff3cd', border:'1px solid #ffeeba', padding:'8px', borderRadius:'6px', color:'#856404', cursor:'pointer', transition:'all 0.2s'}} title="Edit Course">
                                              <Edit size={16}/>
                                          </button>
                                          <button onClick={()=>handleDeleteCourse(course.course_id)} style={{background:'#ffebee', border:'1px solid #f5c6cb', padding:'8px', borderRadius:'6px', color:'#c62828', cursor:'pointer', transition:'all 0.2s'}} title="Delete Course">
                                              <Trash2 size={16}/>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                          {courses.length === 0 && (
                              <tr><td colSpan="5" style={{padding:'40px', textAlign:'center', color:'#adb5bd', fontStyle:'italic'}}>No courses found. Create one above to get started.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- TAB 2: IMPORT DATA --- */}
      {activeTab === 'import' && (
          <div style={{animation:'fadeIn 0.3s ease', maxWidth:'700px', margin:'0 auto', padding:'40px 0'}}>
              <div style={{textAlign:'center', marginBottom:'40px'}}>
                  <div style={{background:'#e3f2fd', width:'80px', height:'80px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto', boxShadow:'0 4px 10px rgba(13, 71, 161, 0.2)'}}>
                      <Upload size={40} color="#0d47a1"/>
                  </div>
                  <h3 style={{margin:'0 0 10px 0', fontSize:'24px', color:'#333'}}>Bulk Import Students</h3>
                  <p style={{color:'#666', margin:0, fontSize:'15px'}}>Upload an Excel file (.xlsx) to automatically add students to a course.</p>
              </div>

              <div style={{background:'#fff', padding:'30px', borderRadius:'15px', border:'1px solid #e0e0e0', display:'flex', flexDirection:'column', gap:'25px', boxShadow:'0 4px 20px rgba(0,0,0,0.04)'}}>
                  
                  {/* Step 1 */}
                  <div>
                      <label style={{display:'block', fontWeight:'bold', marginBottom:'8px', color:'#555'}}>1. Select Target Course</label>
                      <select 
                          style={{...styles.input, width:'100%', fontSize:'15px', padding:'12px'}} 
                          value={targetCourseId} 
                          onChange={e => setTargetCourseId(e.target.value)}
                      >
                          <option value="">-- Choose a Course --</option>
                          {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name} ({new Date(c.start_date).toLocaleDateString()})</option>)}
                      </select>
                  </div>

                  {/* Step 2 */}
                  <div>
                      <label style={{display:'block', fontWeight:'bold', marginBottom:'8px', color:'#555'}}>2. Choose File</label>
                      <div style={{border:'2px dashed #ccc', padding:'20px', borderRadius:'8px', textAlign:'center', background:'#f9f9f9'}}>
                          <input 
                              type="file" 
                              accept=".xlsx, .xls" 
                              onChange={e => setImportFile(e.target.files[0])}
                              style={{width:'100%'}}
                          />
                          <div style={{fontSize:'12px', color:'#999', marginTop:'5px'}}>Supported: .xlsx, .xls</div>
                      </div>
                  </div>

                  {/* Action */}
                  <button 
                      onClick={handleFileUpload} 
                      disabled={!importFile || !targetCourseId || isUploading}
                      style={{
                          ...styles.btn(true), width:'100%', padding:'14px', fontSize:'16px', borderRadius:'8px',
                          background: (!importFile || !targetCourseId) ? '#e9ecef' : '#0d47a1',
                          color: (!importFile || !targetCourseId) ? '#999' : 'white',
                          cursor: (!importFile || !targetCourseId) ? 'not-allowed' : 'pointer'
                      }}
                  >
                      {isUploading ? 'Importing Data...' : 'Start Upload'}
                  </button>

                  {/* Status Box */}
                  {uploadStatus && (
                      <div style={{
                          marginTop:'10px', padding:'15px', borderRadius:'8px', width:'100%', fontSize:'14px', fontWeight:'500', lineHeight:'1.5',
                          background: uploadStatus.includes('Success') ? '#d4edda' : (uploadStatus.includes('Error') ? '#f8d7da' : '#e2e3e5'),
                          color: uploadStatus.includes('Success') ? '#155724' : (uploadStatus.includes('Error') ? '#721c24' : '#383d41'),
                          whiteSpace: 'pre-wrap', border: '1px solid rgba(0,0,0,0.1)'
                      }}>
                          {uploadStatus}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- TAB 3: GLOBAL SEARCH --- */}
      {activeTab === 'search' && (
          <div style={{animation:'fadeIn 0.3s ease'}}>
              <div style={{display:'flex', gap:'10px', marginBottom:'25px', background:'#f1f3f5', padding:'20px', borderRadius:'10px'}}>
                  <div style={{flex:1, position:'relative'}}>
                      <Search size={20} style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                      <input 
                          style={{...styles.input, width:'100%', padding:'14px 14px 14px 45px', fontSize:'16px', borderRadius:'8px', border:'1px solid #ced4da'}} 
                          placeholder="Search entire database by Name, Conf No, or Mobile..." 
                          value={globalSearch}
                          onChange={e => setGlobalSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                      />
                  </div>
                  <button onClick={handleGlobalSearch} style={{...styles.btn(true), padding:'0 30px', fontSize:'16px', borderRadius:'8px'}}>
                      {isSearching ? 'Searching...' : 'Search'}
                  </button>
              </div>

              {globalResults.length > 0 ? (
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 15px rgba(0,0,0,0.05)'}}>
                      <div style={{padding:'15px', background:'#f8f9fa', borderBottom:'1px solid #eee', fontWeight:'bold', color:'#555'}}>
                          Found {globalResults.length} matches
                      </div>
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead style={{background:'#fff'}}>
                              <tr>
                                  <th style={thPrint}>Name</th>
                                  <th style={thPrint}>Conf No</th>
                                  <th style={thPrint}>Course</th>
                                  <th style={thPrint}>Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {globalResults.map((r, i) => (
                                  <tr key={i} style={{borderBottom:'1px solid #f0f0f0', ':hover':{background:'#f9f9f9'}}}>
                                      <td style={{padding:'15px', fontWeight:'bold', color:'#333'}}>{r.full_name}</td>
                                      <td style={{padding:'15px', color:'#555', fontFamily:'monospace'}}>{r.conf_no}</td>
                                      <td style={{padding:'15px'}}>
                                          <div style={{background:'#e3f2fd', color:'#0d47a1', padding:'5px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'bold', width:'fit-content'}}>
                                              {r.courseName || 'Unknown Course'}
                                          </div>
                                      </td>
                                      <td style={{padding:'15px'}}>
                                          <span style={{color: r.status === 'Attending' ? '#28a745' : '#dc3545', fontWeight:'bold'}}>
                                              {r.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (globalSearch && !isSearching && (
                  <div style={{textAlign:'center', padding:'60px', color:'#999', background:'#f9f9f9', borderRadius:'10px', border:'1px dashed #ccc'}}>
                      <div style={{fontSize:'40px', marginBottom:'10px'}}>🔍</div>
                      <div>No results found for "{globalSearch}"</div>
                  </div>
              ))}
          </div>
      )}

      {/* ================= MODALS ================= */}

      {/* EDIT COURSE MODAL */}
      {isEditModalOpen && editingCourse && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(2px)'}}>
              <div style={{background:'white', padding:'30px', borderRadius:'12px', width:'450px', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', animation:'fadeIn 0.2s ease'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
                      <h3 style={{margin:0, color:'#333'}}>Edit Course</h3>
                      <button onClick={()=>setIsEditModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}><X size={24}/></button>
                  </div>
                  <div style={{display:'grid', gap:'20px'}}>
                      <div>
                          <label style={styles.label}>Course Name</label>
                          <input style={styles.input} value={editingCourse.course_name} onChange={e=>setEditingCourse({...editingCourse, course_name:e.target.value})} />
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                          <div>
                              <label style={styles.label}>Start Date</label>
                              <input type="date" style={styles.input} value={editingCourse.start_date ? new Date(editingCourse.start_date).toISOString().split('T')[0] : ''} onChange={e=>setEditingCourse({...editingCourse, start_date:e.target.value})} />
                          </div>
                          <div>
                              <label style={styles.label}>End Date</label>
                              <input type="date" style={styles.input} value={editingCourse.end_date ? new Date(editingCourse.end_date).toISOString().split('T')[0] : ''} onChange={e=>setEditingCourse({...editingCourse, end_date:e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label style={styles.label}>Teacher Name</label>
                          <input style={styles.input} value={editingCourse.teacher_name} onChange={e=>setEditingCourse({...editingCourse, teacher_name:e.target.value})} />
                      </div>
                      <button onClick={handleUpdateCourse} disabled={isSaving} style={{...styles.btn(true), width:'100%', marginTop:'10px', height:'45px', fontSize:'16px'}}>
                          {isSaving ? 'Saving Changes...' : 'Save Updates'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingCourseId && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(2px)'}}>
              <div style={{background:'white', padding:'30px', borderRadius:'15px', width:'550px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', animation:'fadeIn 0.2s ease'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
                      <div>
                          <h3 style={{margin:0, color:'#333'}}>Course Statistics</h3>
                          <div style={{fontSize:'12px', color:'#777', marginTop:'5px'}}>Real-time breakdown of participant data</div>
                      </div>
                      <button onClick={()=>setViewingCourseId(null)} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}><X size={24}/></button>
                  </div>
                  
                  {isLoadingStats ? (
                      <div style={{padding:'40px', textAlign:'center', color:'#777'}}>Loading data...</div>
                  ) : courseStats ? (
                      <div style={{display:'grid', gap:'25px'}}>
                          
                          {/* Top Metrics */}
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
                              <div style={{background:'linear-gradient(135deg, #e3f2fd, #bbdefb)', padding:'20px', borderRadius:'12px', textAlign:'center', border:'1px solid #90caf9'}}>
                                  <div style={{fontSize:'32px', fontWeight:'900', color:'#0d47a1'}}>{courseStats.total || 0}</div>
                                  <div style={{fontSize:'13px', color:'#0d47a1', fontWeight:'bold', textTransform:'uppercase'}}>Total</div>
                              </div>
                              <div style={{background:'linear-gradient(135deg, #e8f5e9, #c8e6c9)', padding:'20px', borderRadius:'12px', textAlign:'center', border:'1px solid #a5d6a7'}}>
                                  <div style={{fontSize:'32px', fontWeight:'900', color:'#1b5e20'}}>{courseStats.attending || 0}</div>
                                  <div style={{fontSize:'13px', color:'#1b5e20', fontWeight:'bold', textTransform:'uppercase'}}>Attending</div>
                              </div>
                              <div style={{background:'linear-gradient(135deg, #fff3e0, #ffe0b2)', padding:'20px', borderRadius:'12px', textAlign:'center', border:'1px solid #ffcc80'}}>
                                  <div style={{fontSize:'32px', fontWeight:'900', color:'#e65100'}}>{courseStats.new || 0}</div>
                                  <div style={{fontSize:'13px', color:'#e65100', fontWeight:'bold', textTransform:'uppercase'}}>New Students</div>
                              </div>
                          </div>
                          
                          {/* Gender Bar */}
                          <div style={{padding:'20px', background:'#f8f9fa', borderRadius:'12px', border:'1px solid #e9ecef'}}>
                              <h5 style={{marginTop:0, marginBottom:'15px', color:'#555', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px'}}>Gender Distribution</h5>
                              
                              <div style={{display:'flex', height:'15px', borderRadius:'10px', overflow:'hidden', marginBottom:'10px'}}>
                                  <div style={{flex: courseStats.male || 1, background:'#007bff'}}></div>
                                  <div style={{flex: courseStats.female || 1, background:'#e91e63'}}></div>
                              </div>
                              
                              <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px'}}>
                                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                      <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#007bff'}}></div>
                                      <strong>Male:</strong> {courseStats.male || 0}
                                  </div>
                                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                      <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#e91e63'}}></div>
                                      <strong>Female:</strong> {courseStats.female || 0}
                                  </div>
                              </div>
                          </div>
                          
                          <div style={{textAlign:'center', fontSize:'11px', color:'#ccc', marginTop:'10px'}}>
                              Internal Course ID: {viewingCourseId}
                          </div>
                      </div>
                  ) : (
                      <div style={{textAlign:'center', padding:'20px', color:'#dc3545'}}>Stats not available.</div>
                  )}
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
