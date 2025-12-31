import React, { useState } from 'react';
import { 
    Upload, 
    Database, 
    Save, 
    Download, 
    Trash2, 
    Calendar, 
    Search, 
    PlusCircle, 
    Edit, 
    FileText, 
    CheckCircle, 
    AlertTriangle 
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { API_URL, styles } from '../config';

const thPrint = { 
    textAlign: 'left', 
    padding: '8px', 
    border: '1px solid #000', 
    fontSize: '12px', 
    color: '#000', 
    textTransform: 'uppercase', 
    background: '#f0f0f0' 
};

// ==========================================
// ✅ HELPER: SMART PHONE CLEANER
// ==========================================
const extractPhoneNumber = (rawStr) => {
    if (!rawStr) return '';
    const str = String(rawStr);
    const withoutEmail = str.replace(/\S+@\S+\.\S+/g, '');
    const cleanNumber = withoutEmail.replace(/[^0-9+]/g, '');
    return cleanNumber.trim();
};

export default function CourseAdmin({ courses, refreshCourses, userRole }) { 
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('courses'); 
  
  // Data State
  const [students, setStudents] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [mappingReport, setMappingReport] = useState(null);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState('');
  
  // Forms State
  const [newCourseData, setNewCourseData] = useState({ name: '', teacher: '', startDate: '', endDate: '' });
  const [editingId, setEditingId] = useState(null); 

  // Manual Entry State
  const [manualStudent, setManualStudent] = useState({ 
      full_name: '', 
      gender: 'Male', 
      age: '', 
      conf_no: '', 
      courses_info: '' 
  });

  // Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ==========================================
  // 1. COURSE MANAGEMENT LOGIC
  // ==========================================
  
  const getCourseStatus = (c) => {
      const now = new Date();
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      
      if (now > end) {
          return { label: 'Completed', color: '#6c757d', bg: '#e2e3e5' };
      }
      if (now >= start && now <= end) {
          return { label: 'Active', color: '#28a745', bg: '#d4edda' };
      }
      return { label: 'Upcoming', color: '#007bff', bg: '#cce5ff' };
  };

  const handleEditClick = (c) => {
      if (!c.course_id) return alert("Error: Invalid ID");
      const shortName = c.course_name ? c.course_name.split('/')[0].trim() : 'Unknown';
      
      setNewCourseData({
          name: shortName,
          teacher: c.teacher_name || '',
          startDate: c.start_date ? c.start_date.split('T')[0] : '',
          endDate: c.end_date ? c.end_date.split('T')[0] : ''
      });
      
      setEditingId(c.course_id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
  };

  const handleUpdateCourse = async (e) => {
      e.preventDefault();
      if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
      if (!editingId) return alert("Missing ID");

      const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
      
      try {
          const res = await fetch(`${API_URL}/courses/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  courseName: courseName,
                  teacherName: newCourseData.teacher,
                  startDate: newCourseData.startDate,
                  endDate: newCourseData.endDate
              })
          });
          
          if (res.ok) {
              alert(`✅ Updated!`);
              refreshCourses(); 
              handleCancelEdit(); 
          } else {
              alert(`❌ Failed to update.`);
          }
      } catch (err) { 
          alert(`⚠️ Network Error`); 
      }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.name || !newCourseData.startDate) return alert("Please fill in required fields.");
    
    const courseName = `${newCourseData.name} / ${newCourseData.startDate} to ${newCourseData.endDate}`;
    
    try {
        const res = await fetch(`${API_URL}/courses`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({
                courseName: courseName,
                teacherName: newCourseData.teacher || 'Goenka Ji',
                startDate: newCourseData.startDate,
                endDate: newCourseData.endDate,
                // 👇 THIS IS THE MISSING LINE 👇
                owner_role: userRole 
            }) 
        });
        
        if (res.ok) {
            alert(`✅ Created: ${courseName}`);
            refreshCourses(); 
            setNewCourseData({ name: '', teacher: '', startDate: '', endDate: '' });
        }
    } catch (err) { 
        console.error(err); 
    }
  };

  const handleDeleteCourse = async (id, name) => {
      if(window.confirm(`⚠️ DANGER: Delete course "${name}"?\nThis will delete ALL student data for this course forever.`)) {
          await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
          refreshCourses();
      }
  };

  // ==========================================
  // 2. EXCEL IMPORT LOGIC
  // ==========================================

  const downloadTemplate = () => {
      const data = [
          ["ConfNo", "Student", "Gender", "Age", "Courses", "Phone", "10d", "STP", "TSC"],
          ["OM20", "Example Student", "Male", 30, "", "9876543210", 8, 4, 0],
          ["NM15", "New Student", "Female", 45, "3", "9988776655", 0, 0, 0],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Dhamma_Import_Template.xlsx");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadStatus({ type: 'info', msg: 'Reading file...' });
    setMappingReport(null); 

    const reader = new FileReader();
    reader.onload = (e) => { 
        try { 
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processDataRows(jsonData);
        } 
        catch (err) { 
            console.error(err); 
            setUploadStatus({ type: 'error', msg: 'Failed to read Excel file.' }); 
        } 
    };
    reader.readAsArrayBuffer(file);
  };

  const processDataRows = (rows) => {
    if (!rows || rows.length < 2) { setUploadStatus({ type: 'error', msg: 'File is empty.' }); return; }
    
    let headerRowIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
        if ((rowStr.includes('conf') && rowStr.includes('no')) || (rowStr.includes('student') && rowStr.includes('age'))) {
            headerRowIndex = i;
            headers = rows[i].map(h => String(h).trim()); 
            break;
        }
    }
    
    if (headerRowIndex === -1) { 
        setUploadStatus({ type: 'error', msg: '❌ Could not find headers (ConfNo, Student). Please check the file.' }); 
        return; 
    }
    
    const getIndex = (keywords) => headers.findIndex(h => keywords.some(k => h.toLowerCase() === k.toLowerCase() || h.toLowerCase().includes(k.toLowerCase())));
    
    const map = { 
        conf: getIndex(['ConfNo', 'Conf No', 'Form No']), 
        name: getIndex(['Student', 'Name', 'Sadhaka']), 
        age: getIndex(['Age']), 
        gender: getIndex(['Gender', 'Sex']), 
        phone: getIndex(['Mobile', 'Cell', 'Phone', 'Contact No', 'Contact Num', 'Contact']), 
        generic: getIndex(['Courses', 'History', 'Old/New']), 
        c10: getIndex(['10d']), cstp: getIndex(['STP', 'Satipatthana']), ctsc: getIndex(['TSC', 'Teen', 'Service']),
        c20: getIndex(['20d']), c30: getIndex(['30d']), c45: getIndex(['45d', '40d']), c60: getIndex(['60d']),
        languages: getIndex(['Languages', 'Language'])
    };

    const report = {
        name: map.name > -1 ? headers[map.name] : null,
        conf: map.conf > -1 ? headers[map.conf] : null,
        gender: map.gender > -1 ? headers[map.gender] : 'Auto-Detect',
        phone: map.phone > -1 ? `✅ Found (${headers[map.phone]})` : '⚠️ Not Found',
        courses_generic: map.generic > -1 ? '✅ Found' : '❌ Not Found',
        missing: []
    };
    if (!report.name) report.missing.push("Student Name");
    if (!report.conf) report.missing.push("ConfNo");
    setMappingReport(report); 

    if (report.missing.length > 0) {
        setUploadStatus({ type: 'error', msg: `❌ Issues found: ${report.missing.join(', ')}` });
        return;
    }

    const parsedStudents = [];
    let currentSectionGender = null;
    let droppedCount = 0; 
    let phoneCount = 0;

    for(let i=0; i<headerRowIndex; i++) {
        const rowStr = rows[i].map(c => String(c).toUpperCase()).join(' ');
        if (rowStr.includes('GENDER: MALE') || rowStr.includes('GENDER:MALE')) currentSectionGender = 'Male';
        else if (rowStr.includes('GENDER: FEMALE') || rowStr.includes('GENDER:FEMALE')) currentSectionGender = 'Female';
    }

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        const rowStr = row.map(c => String(c).toUpperCase()).join(' ');

        if (rowStr.includes('GENDER: MALE') || rowStr.includes('GENDER:MALE')) { currentSectionGender = 'Male'; continue; }
        if (rowStr.includes('GENDER: FEMALE') || rowStr.includes('GENDER:FEMALE')) { currentSectionGender = 'Female'; continue; }
        if (rowStr.includes('CONFNO') && rowStr.includes('STUDENT')) continue;

        const rawConf = map.conf > -1 ? String(row[map.conf] || '').trim().toUpperCase().replace(/\s+/g, '') : '';
        const validPattern = /^(OM|NM|OF|NF|SM|SF)\d+$/; 
        
        if (!validPattern.test(rawConf)) {
            if (rawConf.length > 0 || (map.name > -1 && row[map.name])) droppedCount++; 
            continue; 
        }

        const rawName = map.name > -1 ? row[map.name] : '';
        if (!rawName) continue; 

        let pGender = currentSectionGender;
        if (map.gender > -1 && row[map.gender]) {
            const gVal = String(row[map.gender]).trim().toLowerCase();
            if (gVal.startsWith('m')) pGender = 'Male';
            else if (gVal.startsWith('f')) pGender = 'Female';
        }

        const rawPhone = map.phone > -1 ? row[map.phone] : '';
        const cleanPhone = extractPhoneNumber(rawPhone);
        if(cleanPhone) phoneCount++;

        let coursesStr = "0"; 
        let specificParts = [];
        const addSpec = (colIndex, label) => {
            if (colIndex > -1 && row[colIndex] != null && row[colIndex] !== '') {
                const val = parseInt(String(row[colIndex]).trim());
                if (!isNaN(val) && val > 0) specificParts.push(`${label}:${val}`);
            }
        };

        addSpec(map.c10, '10D'); addSpec(map.cstp, 'STP'); addSpec(map.ctsc, 'TSC');
        addSpec(map.c20, '20D'); addSpec(map.c30, '30D'); addSpec(map.c45, '45D'); addSpec(map.c60, '60D');

        if (specificParts.length > 0) {
            coursesStr = specificParts.join(', ');
        } else if (map.generic > -1 && row[map.generic] != null && row[map.generic] !== '') {
            coursesStr = String(row[map.generic]).trim();
        }

        parsedStudents.push({ 
            id: Date.now() + i, 
            conf_no: rawConf, 
            full_name: rawName, 
            age: map.age > -1 ? row[map.age] : '', 
            gender: pGender || 'Unknown', 
            courses_info: coursesStr, 
            mobile: cleanPhone, 
            notes: map.languages > -1 ? `Lang: ${row[map.languages]}` : '', 
            status: 'Active' 
        });
    }
    
    setStudents(parsedStudents);
    setUploadStatus({ 
        type: 'success', 
        msg: `✅ Found ${parsedStudents.length} students. (${phoneCount} have phone numbers). Dropped ${droppedCount} invalid rows.` 
    });
  };

  const saveToDatabase = async () => {
    if (students.length === 0) return;
    const targetCourse = courses.find(c => c.course_name === selectedCourseForUpload);
    if (!targetCourse) return alert("Please select a valid course first.");
    if (!window.confirm(`Confirm Import:\n\nCourse: ${selectedCourseForUpload}\nStudents: ${students.length}\n\nProceed?`)) return;
    
    try {
        const payload = { 
            students: students.map(s => ({ 
                name: s.full_name, 
                confNo: s.conf_no, 
                age: s.age, 
                gender: s.gender, 
                courses: s.courses_info, 
                phone_number: s.mobile,
                phone: s.mobile,
                mobile: s.mobile,
                contact_number: s.mobile
            }))
        };
        
        const res = await fetch(`${API_URL}/courses/${targetCourse.course_id}/import`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        const data = await res.json();
        
        if(res.ok) { 
            alert(`✅ Success: ${data.message}`); 
            setStudents([]); 
            setMappingReport(null); 
            setUploadStatus(null); 
        } else { 
            alert(`❌ Error: ${data.error}`); 
        }
    } catch(err) { 
        alert("Network Error: Failed to save data."); 
        console.error(err); 
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseForUpload) return alert("Please select a target course first.");
    if (!manualStudent.full_name) return alert("Name is required.");
    
    const newStudent = { 
        id: Date.now(), 
        ...manualStudent, 
        conf_no: manualStudent.conf_no || `MANUAL-${Date.now()}`, 
        status: 'Active', 
        dining_seat: '', 
        room_no: '',
        mobile: '' 
    };
    
    setStudents(prev => [newStudent, ...prev]);
    setManualStudent({ full_name: '', gender: 'Male', age: '', conf_no: '', courses_info: '' });
  };

  // ==========================================
  // 3. BACKUP & SEARCH TOOLS
  // ==========================================

  // ✅ RESTORED BACKUP FEATURE
  const handleDownloadBackup = async () => {
      try {
          const response = await fetch(`${API_URL}/backup`);
          if (!response.ok) throw new Error("Backup failed");
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dhamma_system_backup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } catch(e) { 
          console.error(e);
          alert("Backup Failed: " + e.message); 
      }
  };

  const handleGlobalSearch = async () => {
      if(!globalSearch) return;
      setIsSearching(true);
      let results = [];
      
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

  // ✅ UPDATED TABS TO INCLUDE BACKUP
  const TABS = [
      { id: 'courses', label: 'Courses', icon: <Calendar size={16}/> },
      { id: 'import', label: 'Import', icon: <Upload size={16}/> },
      ...(userRole === 'admin' ? [{ id: 'backup', label: 'Backup', icon: <Save size={16}/> }] : []),
      { id: 'search', label: 'Search', icon: <Search size={16}/> },
  ];

  return (
    <div style={styles.card}>
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
            <div style={{background:'linear-gradient(to bottom right, #ffffff, #f8f9fa)', padding:'25px', borderRadius:'12px', border:'1px solid #eee', height:'fit-content', boxShadow:'0 4px 12px rgba(0,0,0,0.03)'}}>
                <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px', color: editingId ? '#e65100' : '#007bff'}}>
                    {editingId ? <Edit size={20}/> : <PlusCircle size={20}/>}
                    {editingId ? 'Edit Course' : 'Create Course'}
                </h3>
                <form onSubmit={editingId ? handleUpdateCourse : handleCreateCourse} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div><label style={styles.label}>Name</label><input style={styles.input} placeholder="e.g. 10-Day" value={newCourseData.name} onChange={e=>setNewCourseData({...newCourseData, name:e.target.value})} /></div>
                    <div><label style={styles.label}>Teacher</label><input style={styles.input} placeholder="e.g. Goenka Ji" value={newCourseData.teacher || ''} onChange={e=>setNewCourseData({...newCourseData, teacher:e.target.value})} /></div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div><label style={styles.label}>Start</label><input type="date" style={styles.input} value={newCourseData.startDate} onChange={e=>setNewCourseData({...newCourseData, startDate:e.target.value})} /></div>
                        <div><label style={styles.label}>End</label><input type="date" style={styles.input} value={newCourseData.endDate} onChange={e=>setNewCourseData({...newCourseData, endDate:e.target.value})} /></div>
                    </div>
                    <button type="submit" style={{...styles.btn(true), background: editingId ? '#e65100' : '#28a745', color:'white', justifyContent:'center', padding:'12px', marginTop:'10px'}}>
                        {editingId ? 'Update Course' : 'Create New Course'}
                    </button>
                    {editingId && (<button type="button" onClick={handleCancelEdit} style={{...styles.btn(false), justifyContent:'center', padding:'8px', color:'#666', border:'1px solid #ccc'}}>Cancel Edit</button>)}
                </form>
            </div>
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
                                                <button onClick={()=>handleEditClick(c)} style={{padding:'8px', background:'white', color:'#e65100', border:'1px solid #ffe0b2', borderRadius:'6px', cursor:'pointer'}} title="Edit Course"><Edit size={16}/></button>
                                                {userRole === 'admin' && (<button onClick={()=>handleDeleteCourse(c.course_id, c.course_name)} style={{padding:'8px', background:'white', color:'#d32f2f', border:'1px solid #ffcdd2', borderRadius:'6px', cursor:'pointer'}} title="Delete Course"><Trash2 size={16}/></button>)}
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

      {/* --- IMPORT TAB --- */}
      {activeTab === 'import' && (
        <div style={{maxWidth:'900px', margin:'0 auto', animation:'fadeIn 0.3s ease'}}>
          <div style={{marginBottom:'30px', background:'#e3f2fd', padding:'20px', borderRadius:'12px', border:'1px solid #bbdefb', display:'flex', alignItems:'center', gap:'15px'}}>
              <div style={{background:'white', width:'50px', height:'50px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#007bff'}}>
                  <Upload size={24}/>
              </div>
              <div style={{flex:1}}>
                  <h3 style={{margin:0, color:'#0d47a1'}}>Bulk Import</h3>
                  <div style={{fontSize:'13px', color:'#555', marginTop:'4px'}}>Upload Excel (.xlsx) file with student data.</div>
              </div>
              <button onClick={downloadTemplate} style={{background:'white', color:'#0d47a1', border:'none', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'6px'}}>
                  <Download size={14}/> Download Template
              </button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px', marginBottom:'30px'}}>
              <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
                  <h4 style={{marginTop:0, marginBottom:'15px', color:'#444'}}>1. Select Target Course</h4>
                  <select style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #ccc', fontSize:'14px'}} value={selectedCourseForUpload} onChange={e=>setSelectedCourseForUpload(e.target.value)}>
                      <option value="">-- Select Course --</option>
                      {courses.map(c => <option key={c.course_id} value={c.course_name}>{c.course_name}</option>)}
                  </select>
              </div>
              <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #eee', boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
                  <h4 style={{marginTop:0, marginBottom:'15px', color:'#444'}}>2. Upload File</h4>
                  <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{width:'100%'}} />
              </div>
          </div>

          {uploadStatus && (
              <div style={{
                  padding:'15px', borderRadius:'8px', marginBottom:'20px', 
                  background: uploadStatus.type === 'error' ? '#ffebee' : (uploadStatus.type === 'success' ? '#e8f5e9' : '#e3f2fd'),
                  color: uploadStatus.type === 'error' ? '#c62828' : (uploadStatus.type === 'success' ? '#2e7d32' : '#0d47a1'),
                  border: `1px solid ${uploadStatus.type === 'error' ? '#ffcdd2' : (uploadStatus.type === 'success' ? '#c8e6c9' : '#bbdefb')}`
              }}>
                  <strong>Status:</strong> {uploadStatus.msg}
              </div>
          )}

          {students.length > 0 && (
              <div style={{background:'white', border:'1px solid #eee', borderRadius:'12px', overflow:'hidden'}}>
                  <div style={{padding:'15px', background:'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h4 style={{margin:0}}>Preview Data ({students.length})</h4>
                      <button onClick={saveToDatabase} style={{...styles.btn(true), background:'#28a745', color:'white', padding:'8px 20px'}}>
                          <Save size={16}/> Confirm Import
                      </button>
                  </div>
                  <div style={{maxHeight:'400px', overflowY:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
                          <thead style={{background:'#f1f3f5', position:'sticky', top:0}}>
                              <tr>
                                  <th style={thPrint}>Name</th>
                                  <th style={thPrint}>Conf No</th>
                                  <th style={thPrint}>Gender</th>
                                  <th style={thPrint}>Age</th>
                                  <th style={thPrint}>Mobile</th>
                                  <th style={thPrint}>Courses</th>
                              </tr>
                          </thead>
                          <tbody>
                              {students.slice(0, 100).map((s, i) => (
                                  <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                                      <td style={{padding:'8px'}}>{s.full_name}</td>
                                      <td style={{padding:'8px', fontFamily:'monospace'}}>{s.conf_no}</td>
                                      <td style={{padding:'8px'}}>{s.gender}</td>
                                      <td style={{padding:'8px'}}>{s.age}</td>
                                      <td style={{padding:'8px', color: s.mobile ? 'green' : '#ccc'}}>{s.mobile || '-'}</td>
                                      <td style={{padding:'8px', color:'#666'}}>{s.courses_info}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {students.length > 100 && <div style={{padding:'10px', textAlign:'center', color:'#888', fontStyle:'italic'}}>...and {students.length - 100} more rows</div>}
                  </div>
              </div>
          )}
          
          <div style={{marginTop:'40px', paddingTop:'20px', borderTop:'1px dashed #ccc'}}>
              <h4 style={{marginBottom:'15px', color:'#555'}}>Manual Entry (Fallback)</h4>
              <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', display:'flex', gap:'10px', alignItems:'end'}}>
                  <div><label style={styles.label}>Name</label><input style={styles.input} value={manualStudent.full_name} onChange={e=>setManualStudent({...manualStudent, full_name:e.target.value})} /></div>
                  <div><label style={styles.label}>ID</label><input style={styles.input} value={manualStudent.conf_no} onChange={e=>setManualStudent({...manualStudent, conf_no:e.target.value})} /></div>
                  <div><label style={styles.label}>Age</label><input style={{...styles.input, width:'60px'}} value={manualStudent.age} onChange={e=>setManualStudent({...manualStudent, age:e.target.value})} /></div>
                  <div><label style={styles.label}>Gender</label><select style={styles.input} value={manualStudent.gender} onChange={e=>setManualStudent({...manualStudent, gender:e.target.value})}><option>Male</option><option>Female</option></select></div>
                  <button onClick={handleManualSubmit} style={{...styles.btn(true), height:'38px'}}>Add</button>
              </div>
          </div>
        </div>
      )}

      {/* --- BACKUP TAB --- */}
      {activeTab === 'backup' && (
          <div style={{textAlign:'center', padding:'50px', animation:'fadeIn 0.3s ease'}}>
              <div style={{marginBottom:'20px', color:'#555'}}>Download a full JSON backup of the current system state.</div>
              <button onClick={handleDownloadBackup} style={{...styles.btn(true), padding:'15px 30px', fontSize:'16px', margin:'0 auto'}}>
                  <Download size={20}/> Download System Backup
              </button>
          </div>
      )}

      {/* --- SEARCH TAB --- */}
      {activeTab === 'search' && (
          <div style={{maxWidth:'800px', margin:'0 auto', animation:'fadeIn 0.3s ease'}}>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                  <input 
                      style={{...styles.input, flex:1, padding:'12px', fontSize:'16px'}} 
                      placeholder="Search ALL databases by Name, Conf No..." 
                      value={globalSearch}
                      onChange={e => setGlobalSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                  />
                  <button onClick={handleGlobalSearch} style={{...styles.btn(true), padding:'0 30px'}}>
                      {isSearching ? '...' : 'Search'}
                  </button>
              </div>

              {globalResults.length > 0 ? (
                  <div style={{background:'white', border:'1px solid #eee', borderRadius:'8px', overflow:'hidden'}}>
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                          <thead style={{background:'#f8f9fa'}}>
                              <tr>
                                  <th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Name</th>
                                  <th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Conf No</th>
                                  <th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Course</th>
                                  <th style={{padding:'15px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Status</th>
                              </tr>
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
