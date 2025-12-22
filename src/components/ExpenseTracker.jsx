import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { API_URL, styles } from '../config';

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); const [participants, setParticipants] = useState([]); const [selectedStudentId, setSelectedStudentId] = useState(''); const [studentToken, setStudentToken] = useState(''); const [expenseType, setExpenseType] = useState('Laundry Token'); const [amount, setAmount] = useState(''); const [history, setHistory] = useState([]); const [status, setStatus] = useState(''); const [showInvoice, setShowInvoice] = useState(false); const [reportMode, setReportMode] = useState(''); const [financialData, setFinancialData] = useState([]); const [editingId, setEditingId] = useState(null); const [checkoutMode, setCheckoutMode] = useState(false);

  useEffect(() => { if (courseId) fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(err => console.error(err)); }, [courseId]);
  useEffect(() => { if (selectedStudentId) { const student = participants.find(p => p.participant_id == selectedStudentId); setStudentToken(student ? student.laundry_token_no : ''); fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(data => setHistory(Array.isArray(data)?data:[])).catch(console.error); } else { setHistory([]); setStudentToken(''); } }, [selectedStudentId]);
  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); };
  const loadLaundryReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/participants`).then(res=>res.json()).then(data=>{ setFinancialData(data.filter(p=>p.status==='Attending')); setReportMode('laundry'); }); };
  const handleLaundryClick = () => { const label = studentToken ? `Laundry Token ${studentToken}` : `Laundry Token`; setExpenseType(label); setAmount('50'); };
  const handleEditClick = (item) => { setEditingId(item.expense_id); setExpenseType(item.expense_type); setAmount(item.amount); setStatus('✏️ Editing Mode...'); };
  const handleSubmit = async (e) => { e.preventDefault(); setStatus('Saving...'); const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`; const method = editingId ? 'PUT' : 'POST'; const body = editingId ? { expense_type: expenseType, amount } : { courseId, participantId: selectedStudentId, type: expenseType, amount }; try { const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (!res.ok) throw new Error("Failed"); setStatus(editingId ? '✅ Updated!' : '✅ Saved!'); setAmount(''); setEditingId(null); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); } catch (err) { setStatus('❌ Error'); } };
  const handleDeleteExpense = async (id) => { if (!window.confirm("Delete?")) return; await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' }); const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); const histData = await histRes.json(); setHistory(histData); };
  const totalDue = history.reduce((sum, item) => sum + parseFloat(item.amount), 0); const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || ''; const currentStudent = participants.find(p => p.participant_id == selectedStudentId);
  
  if (reportMode === 'invoice' && currentStudent) { return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> <button onClick={() => window.print()} style={{...styles.btn(true), background:'#28a745', color:'white'}}>🖨️ Print Invoice</button> </div> <div className="print-area" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px'}}> <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}> <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div> <div style={{textAlign: 'right'}}><h3>{currentStudent.full_name}</h3><p>Room: {currentStudent.room_no}</p><p>{selectedCourseName}</p></div> </div> <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}> <thead><tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}><th style={{textAlign: 'left', padding: '10px'}}>Description</th><th style={{textAlign: 'left', padding: '10px'}}>Date</th><th style={{textAlign: 'right', padding: '10px'}}>Amount</th></tr></thead> <tbody> {history.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}> <td style={{padding: '10px'}}>{ex.expense_type}</td> <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td> <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td> </tr> ))} </tbody> </table> <div style={{textAlign: 'right', marginTop: '20px'}}><h3>Total Due: ₹{totalDue}</h3></div> <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div> </div> </div> ); }
  
  if (reportMode === 'summary') { return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> <button onClick={() => window.print()} style={{...styles.btn(true), background:'#28a745', color:'white'}}>🖨️ Print Report</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary Report</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Total Due (₹)</th></tr></thead><tbody>{financialData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px'}}><td colSpan={4} style={{padding:'15px', textAlign:'right'}}>GRAND TOTAL:</td><td style={{padding:'15px', textAlign:'right'}}>₹{financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0)}</td></tr> </tbody></table> </div> </div> ); }

  if (reportMode === 'laundry') { return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> <button onClick={() => window.print()} style={{...styles.btn(true), background:'#007bff', color:'white'}}>🖨️ Print List</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Laundry Token List</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Laundry Token</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Dining Seat</th></tr></thead><tbody>{financialData.sort((a,b)=> (parseInt(a.laundry_token_no)||999)-(parseInt(b.laundry_token_no)||999)).map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px', fontWeight:'bold', fontSize:'16px'}}>{p.laundry_token_no || '-'}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td></tr>))}</tbody></table> </div> </div> ); }

  if (checkoutMode) {
      // VALUABLES CHECK-OUT MODE
      return (
          <div style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                  <h2 style={{color:'#d32f2f'}}>🔐 Valuables Check-Out Mode</h2>
                  <button onClick={()=>setCheckoutMode(false)} style={styles.btn(false)}>Exit Mode</button>
              </div>
              <div style={{background:'#fff5f5', padding:'20px', borderRadius:'10px', border:'2px solid #ffcdd2'}}>
                  <select style={styles.input} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- Select Student to Return Valuables --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no || '-'})</option>)} </select>
                  {currentStudent && (
                      <div style={{marginTop:'20px', padding:'20px', background:'white', borderRadius:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                          <h3 style={{marginTop:0}}>{currentStudent.full_name}</h3>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                              <div style={{padding:'15px', background:'#e3f2fd', borderRadius:'5px'}}><h4>Mobile Locker</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.mobile_locker_no || 'None'}</div></div>
                              <div style={{padding:'15px', background:'#fff3cd', borderRadius:'5px'}}><h4>Valuables Locker</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.valuables_locker_no || 'None'}</div></div>
                              <div style={{padding:'15px', background:'#e8f5e9', borderRadius:'5px'}}><h4>Room Key</h4><div style={{fontSize:'24px', fontWeight:'bold'}}>{currentStudent.room_no || 'None'}</div></div>
                          </div>
                          <button onClick={()=>{alert(`✅ Items Returned to ${currentStudent.full_name}`); setSelectedStudentId('');}} style={{...styles.btn(true), width:'100%', padding:'15px', fontSize:'18px', background:'#28a745'}}>CONFIRM ITEMS RETURNED</button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}><h2>🛒 Store</h2><div><button onClick={()=>setReportMode('invoice')} style={styles.quickBtn(true)}>Invoice</button><button onClick={()=>setCheckoutMode(true)} style={{...styles.quickBtn(false), marginLeft:'5px'}}><LogOut size={16}/> Checkout Valuables</button></div></div>
      
      {/* MOVED TOOLS & REPORTS TO TOP */}
      <div style={{marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #eee'}}>
        <h3 style={{marginTop:0, color:'#555', fontSize:'16px'}}>Tools & Reports</h3>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} style={{...styles.quickBtn(!!selectedStudentId), background: selectedStudentId ? '#17a2b8' : '#e2e6ea', color: selectedStudentId ? 'white' : '#999', cursor: selectedStudentId ? 'pointer' : 'not-allowed'}}>🖨️ Print Invoice</button>
          <button onClick={loadFinancialReport} disabled={!courseId} style={{...styles.quickBtn(!!courseId), background: courseId ? '#28a745' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>💰 Course Summary</button>
          <button onClick={loadLaundryReport} disabled={!courseId} style={{...styles.quickBtn(!!courseId), background: courseId ? '#007bff' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>📋 Laundry List</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
        <select style={styles.input} onChange={e => setCourseId(e.target.value)} required> <option value="">-- 1. Select Course --</option> {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} </select>
        <select style={styles.input} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} required> <option value="">-- 2. Select Student --</option> {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no || '-'})</option>)} </select>
        <div style={{background:'#f0f2f5', padding:'10px', borderRadius:'6px', border:'1px solid #ddd'}}> <label style={{fontSize:'12px', color:'#666', fontWeight:'bold'}}>ASSIGNED LAUNDRY TOKEN:</label> <div style={{fontSize:'18px', fontWeight:'bold', color:'#007bff'}}>{studentToken || '-'}</div> </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px'}}>
          <div><label>Item / Type</label><input list="expense-types" style={styles.input} value={expenseType} onChange={e => setExpenseType(e.target.value)} required /><datalist id="expense-types"><option value="Laundry Token" /><option value="Medicine" /><option value="Store Item" /><option value="Donation" /></datalist></div>
          <div><label>Amount (₹)</label><input type="number" style={styles.input} value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        </div>
        <div style={{display:'flex', gap:'5px'}}> <button type="button" onClick={handleLaundryClick} style={styles.quickBtn(false)}>🧺 Laundry (50)</button> <button type="button" onClick={() => {setExpenseType('Soap'); setAmount('30')}} style={styles.quickBtn(false)}>🧼 Soap (30)</button> </div>
        <div style={{display:'flex', gap:'10px'}}> <button type="submit" style={{...styles.btn(true), flex:1, background: editingId ? '#ffc107' : '#28a745', color: editingId ? 'black' : 'white'}}> {editingId ? 'Update Record' : 'Save Record'} </button> {editingId && <button type="button" onClick={() => {setEditingId(null); setAmount(''); setExpenseType('Laundry Token');}} style={{...styles.btn(false), background:'#6c757d', color:'white'}}>Cancel</button>} </div> {status && <p>{status}</p>}
      </form>
      
      <div style={{marginTop:'20px'}}>
         <h4 style={{marginBottom:'10px'}}>Recent Transactions</h4>
         {history.length === 0 ? ( <p style={{color:'#888', fontSize:'13px'}}>No history found.</p> ) : ( <div style={{maxHeight:'200px', overflowY:'auto'}}><table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}><thead><tr style={{textAlign:'left', borderBottom:'1px solid #eee'}}><th>S.N.</th><th>Item</th><th>Date</th><th>₹</th><th></th></tr></thead><tbody>{history.map((h, i) => (<tr key={h.expense_id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'5px'}}>{i+1}</td><td style={{padding:'5px'}}>{h.expense_type}</td><td style={{padding:'5px', color:'#666'}}>{new Date(h.recorded_at).toLocaleDateString()}</td><td style={{padding:'5px', fontWeight:'bold'}}>₹{h.amount}</td><td style={{textAlign:'right'}}><button onClick={()=>handleEditClick(h)} style={{marginRight:'5px', cursor:'pointer'}}>✏️</button><button onClick={()=>handleDeleteExpense(h.expense_id)} style={{color:'red', cursor:'pointer'}}>🗑️</button></td></tr>))}</tbody></table></div> )}
      </div>
    </div>
  );
}
