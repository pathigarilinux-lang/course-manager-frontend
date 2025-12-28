import React, { useState, useEffect } from 'react';
import { User, Clipboard, Home, Briefcase, Lock, CheckCircle, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import { API_URL, styles } from '../config';

// Helper to extract course suffix (e.g., "10-Day" -> "-10D")
const getCourseSuffix = (courseName) => {
    if (!courseName) return '';
    const match = courseName.match(/(\d+)/); // Find first number
    return match ? `-${match[1]}D` : ''; // e.g., "-10D"
};

export default function StudentForm({ courses, fetchStats, refreshCourses }) {
  const [formData, setFormData] = useState({
    participantId: '',
    fullName: '',
    roomNo: '',
    seatNo: '',
    diningSeatType: 'Table',
    laundryToken: '', // Will be auto-filled
    mobileLocker: '',
    valuablesLocker: '',
    language: 'English',
    pagodaCell: '',
    laptop: '',
    confNo: '', // Needed for logic
    dhammaSeat: '',
    specialSeating: 'None', 
    courseId: '', // Track course for suffix logic
    courseName: '' // Track name for suffix logic
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        try {
          // Fetch from ALL courses to find the student
          let allResults = [];
          for (const course of courses) {
              const res = await fetch(`${API_URL}/courses/${course.course_id}/participants`);
              const students = await res.json();
              // Add course info to student object for context
              const studentsWithCourse = students.map(s => ({ ...s, courseId: course.course_id, courseName: course.course_name }));
              allResults = [...allResults, ...studentsWithCourse];
          }
          
          const filtered = allResults.filter(p =>
            p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.conf_no && p.conf_no.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setSearchResults(filtered.slice(0, 10)); // Limit to 10
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, courses]);

  // ✅ AUTO-FILL LOGIC: Update Laundry Token when Student or Course is set
  useEffect(() => {
      if (formData.confNo && formData.courseName) {
          const suffix = getCourseSuffix(formData.courseName);
          // Only auto-fill if currently empty or matches old pattern
          // This prevents overwriting manual edits if user changed it specifically
          const suggestedToken = `${formData.confNo}${suffix}`;
          
          // Check if user hasn't manually typed something wildly different
          if (!formData.laundryToken || formData.laundryToken.includes(formData.confNo)) {
             setFormData(prev => ({ ...prev, laundryToken: suggestedToken }));
          }
      }
  }, [formData.confNo, formData.courseName]);


  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.full_name);
    setSearchResults([]);
    
    // Auto-Populate Form
    setFormData({
      participantId: student.participant_id,
      fullName: student.full_name,
      roomNo: student.room_no || '',
      seatNo: student.dining_seat_no || '',
      diningSeatType: student.dining_seat_type || 'Table',
      laundryToken: student.laundry_token_no || '', // Will trigger effect if empty
      mobileLocker: student.mobile_locker_no || '',
      valuablesLocker: student.valuables_locker_no || '',
      language: student.discourse_language || 'English',
      pagodaCell: student.pagoda_cell_no || '',
      laptop: student.laptop_details || '',
      confNo: student.conf_no || '',
      dhammaSeat: student.dhamma_hall_seat_no || '',
      specialSeating: student.special_seating || 'None',
      courseId: student.courseId,
      courseName: student.courseName // Store for suffix logic
    });
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert("Please search and select a student first.");

    try {
      const res = await fetch(`${API_URL}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `✅ Check-in Successful for ${formData.fullName}` });
        fetchStats(); 
        refreshCourses();
        // Reset form but keep last context if needed? Better to clear for next student.
        setFormData({ participantId: '', fullName: '', roomNo: '', seatNo: '', diningSeatType: 'Table', laundryToken: '', mobileLocker: '', valuablesLocker: '', language: 'English', pagodaCell: '', laptop: '', confNo: '', dhammaSeat: '', specialSeating: 'None', courseId: '', courseName: '' });
        setSearchQuery('');
        setSelectedStudent(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${data.error}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "⚠️ Network Error" });
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={{ ...styles.header, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckCircle size={24} color="#28a745" /> Student Onboarding (Check-In)
      </h2>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #007bff', borderRadius: '8px', padding: '5px 15px', background: '#f8f9fa' }}>
          <Search size={20} color="#007bff" style={{ marginRight: '10px' }} />
          <input
            type="text"
            placeholder="Search by Name or Conf No (e.g. 'Amit' or 'OM20')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...styles.input, border: 'none', fontSize: '16px', width: '100%', background: 'transparent', outline: 'none' }}
          />
          {loading && <span style={{ color: '#666', fontSize: '12px' }}>Searching...</span>}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <ul style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'white', border: '1px solid #ddd', borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 1000,
            maxHeight: '300px', overflowY: 'auto', padding: 0, margin: '5px 0'
          }}>
            {searchResults.map((s) => (
              <li
                key={s.participant_id}
                onClick={() => handleSelectStudent(s)}
                style={{
                  padding: '12px 15px', borderBottom: '1px solid #eee', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f0f8ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{s.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Conf: {s.conf_no || '-'} | {s.gender}</div>
                </div>
                <div style={{ fontSize: '11px', background: '#e9ecef', padding: '3px 8px', borderRadius: '10px' }}>
                  {s.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CHECK-IN FORM */}
      <form onSubmit={handleCheckIn} style={{ opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        
        {/* Row 1: Identification */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={styles.label}><User size={14} /> Full Name</label>
            <input style={{ ...styles.input, background: '#e9ecef' }} value={formData.fullName} readOnly />
          </div>
          <div>
            <label style={styles.label}><Clipboard size={14} /> Conf No</label>
            <input style={{ ...styles.input, background: '#e9ecef', fontWeight: 'bold' }} value={formData.confNo} readOnly />
          </div>
        </div>

        {/* Row 2: Accommodation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={styles.label}><Home size={14} /> Room No</label>
            <input 
              style={styles.input} 
              placeholder="e.g. M-101" 
              value={formData.roomNo} 
              onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })} 
            />
          </div>
          <div>
            <label style={styles.label}><Briefcase size={14} /> Laundry Token (Auto)</label>
            <input 
              style={{ ...styles.input, borderColor: '#007bff', background: '#f0f8ff', fontWeight:'bold' }} 
              placeholder="Auto-generated" 
              value={formData.laundryToken} 
              onChange={(e) => setFormData({ ...formData, laundryToken: e.target.value })} 
            />
          </div>
          <div>
            <label style={styles.label}><AlertTriangle size={14} /> Special Seating</label>
            <select 
                style={styles.input} 
                value={formData.specialSeating} 
                onChange={(e) => setFormData({ ...formData, specialSeating: e.target.value })}
            >
                <option>None</option>
                <option>Chowky</option>
                <option>Chair</option>
                <option>BackRest</option>
            </select>
          </div>
        </div>

        {/* Row 3: Dining & Lockers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          <div>
            <label style={styles.label}>🍽️ Dining Seat</label>
            <input style={styles.input} placeholder="e.g. A1" value={formData.seatNo} onChange={(e) => setFormData({ ...formData, seatNo: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}><Lock size={14} /> Mobile Locker</label>
            <input style={styles.input} placeholder="e.g. M-05" value={formData.mobileLocker} onChange={(e) => setFormData({ ...formData, mobileLocker: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}><Lock size={14} /> Valuables Locker</label>
            <input style={styles.input} placeholder="e.g. V-12" value={formData.valuablesLocker} onChange={(e) => setFormData({ ...formData, valuablesLocker: e.target.value })} />
          </div>
        </div>

        {/* Row 4: Extras */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={styles.label}>🗣️ Discourse Language</label>
            <select style={styles.input} value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
              <option>Kannada</option>
              <option>Malayalam</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <div>
             <label style={styles.label}>🛖 Pagoda Cell (Optional)</label>
             <input style={styles.input} placeholder="Assigned later..." value={formData.pagodaCell} onChange={(e) => setFormData({ ...formData, pagodaCell: e.target.value })} />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          style={{ ...styles.btn(true), width: '100%', justifyContent: 'center', padding: '15px', fontSize: '16px', background: '#28a745', color: 'white' }}
        >
          Confirm Check-In <ArrowRight size={18} style={{ marginLeft: '10px' }} />
        </button>

      </form>

      {/* FEEDBACK MESSAGE */}
      {message && (
        <div style={{
          marginTop: '20px', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold',
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
