import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Users, Home, Upload, UserCheck, Trash2 } from 'lucide-react';

// POINT THIS TO YOUR LIVE RENDER BACKEND
const API_URL = "https://course-manager-backend-cd1m.onrender.com/api"; 

export default function App() {
  const [view, setView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ total: 0, arrived: 0, male: 0, female: 0 });
  const [loading, setLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch Data when Course Changes
  useEffect(() => {
    if (selectedCourse) {
      fetchParticipants();
      fetchStats();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`);
      const data = await res.json();
      setCourses(data);
      if (data.length > 0 && !selectedCourse) setSelectedCourse(data[0].course_id);
    } catch (err) { console.error("Error fetching courses", err); }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/participants?course_id=${selectedCourse}`);
      const data = await res.json();
      setParticipants(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/${selectedCourse}`);
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  // --- ACTIONS ---

  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you sure? This will delete ALL data for this course (students, expenses, room allocations).")) return;
    try {
        await fetch(`${API_URL}/courses/${selectedCourse}`, { method: 'DELETE' });
        alert("Course Deleted");
        window.location.reload();
    } catch (err) { alert("Error deleting course"); }
  };

  const handleAssignToken = async (participantId) => {
    try {
      const res = await fetch(`${API_URL}/assign-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId, course_id: selectedCourse })
      });
      if (res.ok) fetchParticipants();
    } catch (err) { alert("Failed to assign token"); }
  };

  const updateStage = async (p, newStage) => {
    const updated = { ...p, process_stage: newStage };
    setParticipants(prev => prev.map(item => item.participant_id === p.participant_id ? updated : item));
    
    await fetch(`${API_URL}/participants/${p.participant_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    fetchParticipants();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wider">DHAMMA MANAGER</h1>
          <p className="text-xs text-slate-400 mt-1">Course Admin System</p>
        </div>
        
        <div className="p-4">
          <label className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Current Course</label>
          <select 
            className="w-full mt-2 bg-slate-800 border-none rounded p-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
            value={selectedCourse || ''}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name} ({new Date(c.start_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 px-2 space-y-1 mt-4">
          <NavItem icon={<Activity size={18} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={<Users size={18} />} label="Participants" active={view === 'participants'} onClick={() => setView('participants')} />
          <NavItem icon={<UserCheck size={18} />} label="Zero Day (Arrival)" active={view === 'zeroday'} onClick={() => setView('zeroday')} />
          <NavItem icon={<Home size={18} />} label="Room Allocation" active={view === 'rooms'} onClick={() => setView('rooms')} />
          <NavItem icon={<Upload size={18} />} label="Data Import" active={view === 'import'} onClick={() => setView('import')} />
        </nav>
        
        <div className="p-4 border-t border-slate-800">
             <button onClick={handleDeleteCourse} className="w-full flex items-center justify-center space-x-2 text-red-400 hover:text-red-300 text-xs transition-colors">
                <Trash2 size={14} /> <span>Delete Current Course</span>
             </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">{view.replace('-', ' ')}</h2>
          <div className="text-sm text-gray-500">
            {participants.length} Students | {stats.arrived} Arrived
          </div>
        </header>

        <main className="p-8">
          {!selectedCourse ? (
             <div className="text-center mt-20 text-gray-400">Please select or create a course to begin.</div>
          ) : (
            <>
              {view === 'dashboard' && <DashboardView stats={stats} participants={participants} />}
              {view === 'participants' && <ParticipantsView participants={participants} fetchParticipants={fetchParticipants} />}
              {view === 'zeroday' && <ZeroDayView participants={participants} onAssignToken={handleAssignToken} onUpdateStage={updateStage} />}
              {view === 'import' && <ImportView courseId={selectedCourse} onUploadSuccess={fetchParticipants} />}
              {view === 'rooms' && <div className="text-gray-500 text-center mt-20">Room Allocation Visualizer (Coming Soon in V2)</div>}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ stats, participants }) {
  const genderData = [
    { name: 'Male', value: stats.male, color: '#3b82f6' },
    { name: 'Female', value: stats.female, color: '#ec4899' }
  ];

  const statusData = [
    { name: 'Arrived', value: stats.arrived },
    { name: 'Pending', value: stats.total - stats.arrived },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Total Students" value={stats.total} icon={<Users className="text-blue-500" />} />
      <StatCard title="Arrived" value={stats.arrived} icon={<UserCheck className="text-green-500" />} />
      <StatCard title="Pending" value={stats.total - stats.arrived} icon={<Activity className="text-orange-500" />} />

      <div className="bg-white p-6 rounded-xl shadow-sm col-span-1 lg:col-span-2 h-80">
        <h3 className="font-bold text-gray-700 mb-4">Gender Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm h-80">
        <h3 className="font-bold text-gray-700 mb-4">Arrival Status</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
    </div>
  );
}

function ParticipantsView({ participants, fetchParticipants }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = participants.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (p.token_number && p.token_number.toString().includes(search))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between">
        <input 
          type="text" 
          placeholder="Search by name or token..." 
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add New</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-3">Token</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Gender</th>
              <th className="px-6 py-3">Room</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.participant_id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3 font-mono text-blue-600 font-bold">{p.token_number || '-'}</td>
                <td className="px-6 py-3 font-medium text-gray-900">{p.full_name}</td>
                <td className="px-6 py-3">{p.gender}</td>
                <td className="px-6 py-3">{p.room_no || 'Unassigned'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'Arrived' ? 'bg-green-100 text-green-700' : 
                    p.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <button onClick={() => setEditing(p)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal 
          participant={editing} 
          onClose={() => setEditing(null)} 
          onSave={async (updated) => {
            await fetch(`${API_URL}/participants/${updated.participant_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            });
            setEditing(null);
            fetchParticipants();
          }} 
        />
      )}
    </div>
  );
}

function EditModal({ participant, onClose, onSave }) {
  const [form, setForm] = useState({ ...participant });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold">Edit Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Basic Info</h4></div>
          <Input label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} />
          <Input label="Status" name="status" value={form.status} onChange={handleChange} />
          <Input label="Age" name="age" value={form.age} onChange={handleChange} />
          <Input label="Gender" name="gender" value={form.gender} onChange={handleChange} />
          
          <div className="col-span-2 mt-4"><h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Allocation</h4></div>
          <Input label="Room No" name="room_no" value={form.room_no} onChange={handleChange} />
          <Input label="Dining Seat" name="dining_seat_no" value={form.dining_seat_no} onChange={handleChange} />
          
          <div className="col-span-2 mt-4"><h4 className="font-bold text-blue-500 text-xs uppercase tracking-wider mb-2">Special Needs (New)</h4></div>
          <div className="col-span-1">
             <label className="block text-xs font-semibold text-gray-600 mb-1">Evening Food</label>
             <select name="evening_food" value={form.evening_food || ''} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                <option value="">None</option>
                <option value="Milk">Milk</option>
                <option value="Fruit">Fruit</option>
                <option value="Lemon Water">Lemon Water</option>
             </select>
          </div>
          <Input label="Medical Info" name="medical_info" value={form.medical_info} onChange={handleChange} />
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Teacher Notes</label>
            <textarea name="teacher_notes" value={form.teacher_notes || ''} onChange={handleChange} className="w-full border rounded p-2 text-sm h-20"></textarea>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input 
        type="text" 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
      />
    </div>
  );
}

function ZeroDayView({ participants, onAssignToken, onUpdateStage }) {
  // Filter for people who haven't arrived or are in process
  const activeList = participants.filter(p => p.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center">
        <div>
           <h3 className="font-bold text-blue-800">Arrival Desk</h3>
           <p className="text-sm text-blue-600">Search student, confirm details, and assign Token Number.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeList.map(p => {
          const stage = p.process_stage || 0;
          const hasToken = !!p.token_number;

          return (
            <div key={p.participant_id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${hasToken ? 'border-green-500' : 'border-gray-300'}`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-800">{p.full_name}</h4>
                {hasToken ? (
                  <span className="bg-green-100 text-green-800 font-bold text-xl px-3 py-1 rounded">{p.token_number}</span>
                ) : (
                  <button 
                    onClick={() => onAssignToken(p.participant_id)}
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Check In / Assign Token
                  </button>
                )}
              </div>
              
              <div className="text-xs text-gray-500 space-y-1 mb-4">
                <p>Status: {p.status}</p>
                <p>Conf: {p.conf_no}</p>
              </div>

              {hasToken && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Process Flow</p>
                  <div className="flex space-x-2">
                    <StageButton label="Reg" active={stage >= 1} onClick={() => onUpdateStage(p, 1)} />
                    <StageButton label="Valuables" active={stage >= 2} onClick={() => onUpdateStage(p, 2)} />
                    <StageButton label="Room Key" active={stage >= 3} onClick={() => onUpdateStage(p, 3)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageButton({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
        active 
          ? 'bg-green-500 text-white border-green-600' 
          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function ImportView({ courseId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const handleUpload = async () => {
    if (!file || !courseId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);

    try {
      setMsg("Uploading...");
      const res = await fetch(`${API_URL}/upload-csv`, { method: 'POST', body: formData });
      const data = await res.json();
      setMsg(`Success! ${data.count || 'Rows'} processed.`);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setMsg("Error uploading file.");
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-10 text-center">
      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload className="text-blue-600" size={32} />
      </div>
      <h3 className="text-xl font-bold mb-2">Upload Student CSV</h3>
      <p className="text-gray-500 mb-6 text-sm">Ensure your CSV has headers like 'Name', 'Gender', 'Phone'.</p>
      
      <input 
        type="file" 
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      <button 
        onClick={handleUpload} 
        disabled={!file}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
      >
        Process Import
      </button>

      {msg && <p className="mt-4 font-medium text-green-600">{msg}</p>}
    </div>
  );
}
