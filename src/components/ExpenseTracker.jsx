import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Trash2, Printer, LogOut, FileText, TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { API_URL, styles } from '../config';

// --- CONFIGURATION: PRE-DEFINED PRODUCTS ---
const PRODUCTS = [
  { id: 'laundry', name: 'Laundry Token', price: 50, icon: '🧺', type: 'Service' },
  { id: 'soap', name: 'Soap Bar', price: 30, icon: '🧼', type: 'Item' },
  { id: 'paste', name: 'Toothpaste', price: 40, icon: '🪥', type: 'Item' },
  { id: 'brush', name: 'Toothbrush', price: 20, icon: '🦷', type: 'Item' },
  { id: 'mosquito', name: 'Mosquito Coil', price: 10, icon: '🦟', type: 'Item' },
  { id: 'med', name: 'Medicine', price: 0, icon: '💊', type: 'Medical' }, 
 ];

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function ExpenseTracker({ courses }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [selectedStudentId, setSelectedStudentId] = useState(''); 
  const [studentToken, setStudentToken] = useState(''); 
  const [history, setHistory] = useState([]); 
  const [financialData, setFinancialData] = useState([]); 
  
  // Cart & UI State
  const [cart, setCart] = useState([]);
  const [customPrice, setCustomPrice] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [activeTab, setActiveTab] = useState('pos'); 
  const [reportMode, setReportMode] = useState(''); 
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- INITIAL DATA LOADING ---
  useEffect(() => { 
      if (courseId) {
          fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(err => console.error(err));
          fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); 
      }
  }, [courseId]);

  useEffect(() => { 
      if (selectedStudentId) { 
          const student = participants.find(p => p.participant_id == selectedStudentId); 
          setStudentToken(student ? student.laundry_token_no : ''); 
          fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(setHistory); 
      } else { 
          setHistory([]); setStudentToken(''); 
      } 
  }, [selectedStudentId]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
      const totalCollected = financialData.reduce((sum, p) => sum + parseFloat(p.total_due || 0), 0);
      const studentTotal = history.reduce((sum, h) => sum + parseFloat(h.amount), 0);
      return { totalCollected, studentTotal };
  }, [financialData, history]);

  // --- ACTIONS ---
  const addToCart = (product) => {
      if (product.price === 0) {
          const price = prompt(`Enter amount for ${product.name}:`);
          if (!price) return;
          setCart([...cart, { ...product, price: parseFloat(price), uid: Date.now() }]);
      } else {
          let name = product.name;
          if (product.id === 'laundry' && studentToken) name = `Laundry Token ${studentToken}`;
          setCart([...cart, { ...product, name, uid: Date.now() }]);
      }
  };

  const removeFromCart = (uid) => setCart(cart.filter(item => item.uid !== uid));

  const handleCheckout = async () => {
      if (cart.length === 0) return alert("Cart is empty!");
      if (!selectedStudentId) return alert("Select a student first.");
      setIsProcessing(true);
      try {
          for (let item of cart) {
              await fetch(`${API_URL}/expenses`, { 
                  method: 'POST', 
                  headers: {'Content-Type':'application/json'}, 
                  body: JSON.stringify({ courseId, participantId: selectedStudentId, type: item.name, amount: item.price }) 
              });
          }
          const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); 
          setHistory(await histRes.json());
          fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(setFinancialData);
          setCart([]);
          alert("✅ Transaction Saved!");
      } catch (err) { alert("Transaction Failed"); }
      setIsProcessing(false);
  };

  const handleDeleteExpense = async (id) => {
      if (!window.confirm("Delete this record?")) return;
      await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
      const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); 
      setHistory(await histRes.json());
      fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(setFinancialData);
  };

  // --- REPORT LOADERS ---
  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); };
  
  const loadLaundryReport = () => { 
      if (!courseId) return; 
      fetch(`${API_URL}/courses/${courseId}/participants`).then(res=>res.json()).then(data=>{ 
          const laundryUsers = data.filter(p => p.status === 'Attending' && p.laundry_token_no && p.laundry_token_no.trim() !== '');
          setFinancialData(laundryUsers); 
          setReportMode('laundry'); 
      }); 
  };

  // PENDING DUES REPORT
  const loadPendingReport = () => {
      if (!courseId) return;
      fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => {
          // Filter students with Due Amount > 0
          const pendingUsers = (Array.isArray(data) ? data : []).filter(p => parseFloat(p.total_due) > 0);
          setFinancialData(pendingUsers);
          setReportMode('pending');
      });
  };

  const currentStudent = participants.find(p => p.participant_id == selectedStudentId);
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || '';

  // Invoice Render Logic
  const renderInvoice = () => (
      <div className="invoice-box" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px', fontFamily: 'Helvetica, Arial, sans-serif', background:'white'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}>
              <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div>
              <div style={{textAlign: 'right'}}><h3>{currentStudent?.full_name}</h3><p>Conf: {currentStudent?.conf_no}</p><p>Room: {currentStudent?.room_no}</p><p>{selectedCourseName}</p></div>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}>
              <thead><tr style={{background: '#f9f9f9', borderBottom: '2px solid #333'}}><th style={{textAlign: 'left', padding: '10px'}}>Description</th><th style={{textAlign: 'left', padding: '10px'}}>Date</th><th style={{textAlign: 'right', padding: '10px'}}>Amount</th></tr></thead>
              <tbody>
                  {history.map(ex => (
                      <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '10px'}}>{ex.expense_type}</td>
                          <td style={{padding: '10px'}}>{new Date(ex.recorded_at).toLocaleDateString()}</td>
                          <td style={{padding: '10px', textAlign: 'right'}}>₹{ex.amount}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div style={{textAlign: 'right', marginTop: '20px'}}><h3>Total Due: ₹{stats.studentTotal}</h3></div>
          <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div>
      </div>
  );

  // --- VIEWS ---

  if (reportMode === 'laundry') { 
      const sortedList = financialData.sort((a,b) => (parseInt(a.laundry_token_no)||0) - (parseInt(b.laundry_token_no)||0));
      const maleCount = sortedList.filter(p => (p.gender||'').toLowerCase().startsWith('m')).length;
      const femaleCount = sortedList.filter(p => (p.gender||'').toLowerCase().startsWith('f')).length;

      return ( 
          <div style={styles.card}> 
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> 
                  <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> 
                  <button onClick={() => window.print()} style={{...styles.toolBtn('#007bff')}}>🖨️ Print List</button> 
              </div> 
              <div className="no-print" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}>
                  <div style={{background:'#e3f2fd', padding:'15px', borderRadius:'8px', borderLeft:'4px solid #007bff'}}><div style={{color:'#0d47a1', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase'}}>Total Bags</div><div style={{fontSize:'24px', fontWeight:'bold'}}>{sortedList.length}</div></div>
                  <div style={{background:'#f3e5f5', padding:'15px', borderRadius:'8px', borderLeft:'4px solid #9c27b0'}}><div style={{color:'#4a148c', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase'}}>Male Side</div><div style={{fontSize:'24px', fontWeight:'bold'}}>{maleCount}</div></div>
                  <div style={{background:'#fce4ec', padding:'15px', borderRadius:'8px', borderLeft:'4px solid #e91e63'}}><div style={{color:'#880e4f', fontSize:'12px', fontWeight:'bold', textTransform:'uppercase'}}>Female Side</div><div style={{fontSize:'24px', fontWeight:'bold'}}>{femaleCount}</div></div>
              </div>
              <div className="print-area"> 
                  <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Laundry Service List</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> 
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black', background:'#f9f9f9'}}><th style={{...thPrint, textAlign:'center'}}>Token #</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Gender</th><th style={thPrint}>Dining Seat</th></tr></thead><tbody>{sortedList.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '10px', fontWeight:'bold', fontSize:'18px', textAlign:'center', borderRight:'1px solid #eee'}}>{p.laundry_token_no}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.gender}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td></tr>))}</tbody></table> 
                  {sortedList.length === 0 && <p style={{textAlign:'center', color:'#999', padding:'20px'}}>No students have been assigned laundry tokens yet.</p>}
              </div> 
          </div> 
      ); 
  }

  // PENDING DUES REPORT VIEW
  if (reportMode === 'pending') {
      const totalPending = financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0);
      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                  <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button>
                  <button onClick={() => window.print()} style={{...styles.toolBtn('#d32f2f'), color:'white'}}>🖨️ Print Pending List</button>
              </div>
              <div className="print-area">
                  <div style={{textAlign: 'center', marginBottom: '20px'}}>
                      <h1 style={{margin: 0, color:'#d32f2f'}}>Pending Dues List</h1>
                      <h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3>
                  </div>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                      <thead>
                          <tr style={{borderBottom: '2px solid black', background:'#fff5f5'}}>
                              <th style={thPrint}>S.N.</th>
                              <th style={thPrint}>Name</th>
                              <th style={thPrint}>Room</th>
                              <th style={thPrint}>Seat</th>
                              <th style={{...thPrint, textAlign:'right'}}>Amount Due</th>
                          </tr>
                      </thead>
                      <tbody>
                          {financialData.map((p, i) => (
                              <tr key={i} style={{borderBottom: '1px solid #ddd'}}>
                                  <td style={{padding:'10px'}}>{i+1}</td>
                                  <td style={{padding: '10px', fontWeight:'bold'}}>{p.full_name}</td>
                                  <td style={{padding: '10px'}}>{p.room_no}</td>
                                  <td style={{padding: '10px'}}>{p.dining_seat_no}</td>
                                  <td style={{padding: '10px', textAlign:'right', fontWeight:'bold', color:'#d32f2f'}}>₹{p.total_due}</td>
                              </tr>
                          ))}
                          <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px', background:'#fbe9e7'}}>
                              <td colSpan={4} style={{padding:'15px', textAlign:'right'}}>TOTAL PENDING:</td>
                              <td style={{padding:'15px', textAlign:'right', color:'#d32f2f'}}>₹{totalPending}</td>
                          </tr>
                      </tbody>
                  </table>
                  {financialData.length === 0 && <p style={{textAlign:'center', color:'#28a745', padding:'20px', fontWeight:'bold'}}>🎉 Amazing! No pending dues. Everyone has paid.</p>}
              </div>
          </div>
      );
  }

  if (reportMode === 'invoice' && currentStudent) { 
      return ( 
          <div style={styles.card}> 
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> 
                  <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> 
                  <button onClick={() => window.print()} style={{...styles.btn(true), background:'#28a745', color:'white'}}>🖨️ Print Invoice</button> 
              </div> 
              <div className="print-area">{renderInvoice()}</div> 
          </div> 
      ); 
  }
  
  if (reportMode === 'summary') { return ( <div style={styles.card}> <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}> <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button> <button onClick={() => window.print()} style={{...styles.btn(true), background:'#28a745', color:'white'}}>🖨️ Print Report</button> </div> <div className="print-area"> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary Report</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Total Due (₹)</th></tr></thead><tbody>{financialData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px'}}><td colSpan={4} style={{padding:'15px', textAlign:'right'}}>GRAND TOTAL:</td><td style={{padding:'15px', textAlign:'right'}}>₹{financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0)}</td></tr> </tbody></table> </div> </div> ); }

  if (activeTab === 'checkout') {
      return (
          <div style={styles.card}>
              <div style={{background:'#fff5f5', padding:'30px', borderRadius:'10px', border:'2px solid #ffcdd2', textAlign:'center'}}>
                  <h3 style={{color:'#d32f2f', marginTop:0}}>🔐 Return Valuables & Checkout</h3>
                  <div style={{maxWidth:'500px', margin:'0 auto 20px auto'}}>
                      {/* ✅ UPDATED DROPDOWN (Includes Conf No) */}
                      <select style={styles.input} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} value={selectedStudentId}>
                          <option value="">-- Select Student --</option>
                          {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no})</option>)}
                      </select>
                  </div>
                  
                  {currentStudent ? (
                      <>
                          <div style={{fontSize:'20px', fontWeight:'bold', marginBottom:'20px'}}>{currentStudent.full_name}</div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', marginBottom:'30px'}}>
                              <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}><div style={{color:'#666', fontSize:'12px'}}>MOBILE LOCKER</div><div style={{fontSize:'32px', fontWeight:'bold', color:'#007bff'}}>{currentStudent.mobile_locker_no || '-'}</div></div>
                              <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}><div style={{color:'#666', fontSize:'12px'}}>VALUABLES LOCKER</div><div style={{fontSize:'32px', fontWeight:'bold', color:'#e91e63'}}>{currentStudent.valuables_locker_no || '-'}</div></div>
                              <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}><div style={{color:'#666', fontSize:'12px'}}>TOTAL DUE</div><div style={{fontSize:'32px', fontWeight:'bold', color:'green'}}>₹{stats.studentTotal}</div></div>
                          </div>
                          <div style={{display:'flex', justifyContent:'center', gap:'20px'}}>
                              <button onClick={()=>window.print()} style={{...styles.toolBtn('#6c757d'), padding:'15px 30px', fontSize:'16px'}}>🖨️ Print Final Invoice</button>
                              <button onClick={()=>{alert("Items Returned. Ensure payment is collected."); setActiveTab('pos');}} style={{...styles.toolBtn('#28a745'), padding:'15px 30px', fontSize:'16px'}}>✅ Confirm Returned</button>
                          </div>
                          <div className="print-only">{renderInvoice()}</div>
                          <style>{`@media screen { .print-only { display: none; } } @media print { body * { visibility: hidden; } .print-only, .print-only * { visibility: visible; } .print-only { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
                      </>
                  ) : <div style={{color:'#666'}}>Please select a student above to begin checkout.</div>}
              </div>
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>🛒 Dhamma Shop</h2>
              {courseId && <span style={{background:'#e3f2fd', color:'#0d47a1', padding:'2px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold'}}>Total Collected: ₹{stats.totalCollected}</span>}
          </div>
          <div style={{display:'flex', gap:'5px'}}>
              <button onClick={()=>setActiveTab('pos')} style={styles.quickBtn(activeTab==='pos')}><ShoppingCart size={14}/> POS</button>
              <button onClick={()=>setActiveTab('checkout')} disabled={!courseId} style={styles.quickBtn(activeTab==='checkout')}><LogOut size={14}/> Return Valuables</button>
              <button onClick={()=>setActiveTab('reports')} disabled={!courseId} style={styles.quickBtn(activeTab==='reports')}><FileText size={14}/> Reports</button>
          </div>
      </div>

      {activeTab !== 'checkout' && (
          <div style={{marginBottom:'20px', display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px'}}>
              <select style={styles.input} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
              {/* ✅ UPDATED DROPDOWN: Shows Name + Conf No + Room */}
              <select style={styles.input} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} value={selectedStudentId}>
                  <option value="">-- Select Student --</option>
                  {participants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.conf_no} | {p.room_no || 'No Room'})</option>)}
              </select>
          </div>
      )}

      {/* --- TAB 1: POS --- */}
      {activeTab === 'pos' && (
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              <div>
                  <h4 style={{marginTop:0, color:'#555'}}>Quick Add Items</h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'10px'}}>
                      {PRODUCTS.map(p => (
                          <button key={p.id} onClick={() => addToCart(p)} disabled={!selectedStudentId} style={{padding:'15px', border:'1px solid #ddd', borderRadius:'8px', background:'white', cursor: !selectedStudentId ? 'not-allowed' : 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', transition:'all 0.2s', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                              <div style={{fontSize:'24px'}}>{p.icon}</div>
                              <div style={{fontWeight:'bold', fontSize:'13px'}}>{p.name}</div>
                              <div style={{fontSize:'12px', color:'#666'}}>{p.price > 0 ? `₹${p.price}` : 'Custom'}</div>
                          </button>
                      ))}
                  </div>
                  <div style={{marginTop:'20px', padding:'15px', background:'#f9f9f9', borderRadius:'8px'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', marginBottom:'10px', color:'#555'}}>MANUAL ENTRY</div>
                      <div style={{display:'flex', gap:'10px'}}>
                          <input placeholder="Item Name" style={styles.input} value={customItemName} onChange={e=>setCustomItemName(e.target.value)} />
                          <input type="number" placeholder="₹" style={{...styles.input, width:'80px'}} value={customPrice} onChange={e=>setCustomPrice(e.target.value)} />
                          <button onClick={()=>{ if(customItemName && customPrice) { addToCart({name:customItemName, price:parseFloat(customPrice), icon:'🖊️'}); setCustomItemName(''); setCustomPrice(''); }}} disabled={!selectedStudentId} style={styles.toolBtn('#6c757d')}>Add</button>
                      </div>
                  </div>
              </div>
              <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'12px', border:'1px solid #ddd', display:'flex', flexDirection:'column'}}>
                  <div style={{flex:1}}>
                      <h4 style={{marginTop:0, borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>Current Cart</h4>
                      {cart.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px', fontStyle:'italic'}}>Cart is empty</div> : (
                          <div style={{maxHeight:'200px', overflowY:'auto'}}>
                              {cart.map(item => (
                                  <div key={item.uid} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px dashed #eee', fontSize:'13px'}}>
                                      <span>{item.icon} {item.name}</span>
                                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}><strong>₹{item.price}</strong><Trash2 size={14} color="red" style={{cursor:'pointer'}} onClick={()=>removeFromCart(item.uid)}/></div>
                                  </div>
                              ))}
                          </div>
                      )}
                      {cart.length > 0 && (
                          <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'2px solid #ddd'}}>
                              <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'16px', marginBottom:'15px'}}><span>Total</span><span>₹{cart.reduce((a,b)=>a+b.price,0)}</span></div>
                              <button onClick={handleCheckout} disabled={isProcessing} style={{...styles.btn(true), width:'100%', justifyContent:'center', background: isProcessing ? '#ccc' : '#28a745'}}>{isProcessing ? 'Processing...' : 'Confirm & Save'}</button>
                          </div>
                      )}
                  </div>
                  <div style={{marginTop:'30px', paddingTop:'20px', borderTop:'2px solid #ccc'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}><h4 style={{margin:0}}>History ({history.length})</h4><span style={{fontSize:'12px', background:'#fff3cd', padding:'2px 6px', borderRadius:'4px'}}>Due: ₹{stats.studentTotal}</span></div>
                      <div style={{maxHeight:'150px', overflowY:'auto'}}>
                          {history.map(h => (<div key={h.expense_id} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'5px 0', borderBottom:'1px solid #eee'}}><span>{h.expense_type}</span><span>₹{h.amount} <span onClick={()=>handleDeleteExpense(h.expense_id)} style={{cursor:'pointer', color:'red', marginLeft:'5px'}}>×</span></span></div>))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB 3: REPORTS --- */}
      {activeTab === 'reports' && (
          <div>
              <h3 style={{marginTop:0}}>Financial Reports</h3>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                  <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} style={{...styles.quickBtn(!!selectedStudentId), background: selectedStudentId ? '#17a2b8' : '#e2e6ea', color: selectedStudentId ? 'white' : '#999', cursor: selectedStudentId ? 'pointer' : 'not-allowed'}}>🖨️ Individual Invoice</button>
                  <button onClick={loadFinancialReport} disabled={!courseId} style={{...styles.quickBtn(!!courseId), background: courseId ? '#28a745' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>💰 Course Summary</button>
                  <button onClick={loadLaundryReport} disabled={!courseId} style={{...styles.quickBtn(!!courseId), background: courseId ? '#007bff' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed'}}>📋 Laundry List</button>
                  <button onClick={loadPendingReport} disabled={!courseId} style={{...styles.quickBtn(!!courseId), background: courseId ? '#d32f2f' : '#e2e6ea', color: courseId ? 'white' : '#999', cursor: courseId ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:'5px'}}><Clock size={14}/> Pending Dues</button>
              </div>
              <div style={{padding:'20px', background:'#f8f9fa', borderRadius:'8px', textAlign:'center', color:'#666'}}>Select a report type above to view details.</div>
          </div>
      )}
    </div>
  );
}
