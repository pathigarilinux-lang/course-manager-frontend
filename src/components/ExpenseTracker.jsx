import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Trash2, LogOut, FileText, DollarSign, Edit, CheckCircle, ArrowLeft, Clock, PenTool, Tag, Calendar, Activity, TrendingUp, Printer, Download } from 'lucide-react';
import { API_URL, styles } from '../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PRODUCTS = [
  { id: 'laundry', name: 'Laundry Token', price: 0, icon: '🧺', type: 'Service' },
  { id: 'soap', name: 'Soap Bar', price: 0, icon: '🧼', type: 'Item' },
  { id: 'paste', name: 'Toothpaste', price: 0, icon: '🪥', type: 'Item' },
  { id: 'brush', name: 'Toothbrush', price: 0, icon: '🦷', type: 'Item' },
  { id: 'mosquito', name: 'Mosquito Coil', price: 0, icon: '🦟', type: 'Item' },
  { id: 'med', name: 'Medicine', price: 0, icon: '💊', type: 'Medical' }, 
  { id: 'misc', name: 'Misc Item', price: 0, icon: '📦', type: 'General' }, 
];

const thPrint = { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' };

export default function ExpenseTracker({ courses, userRole }) {
  const [courseId, setCourseId] = useState(''); 
  const [participants, setParticipants] = useState([]); 
  const [selectedStudentId, setSelectedStudentId] = useState(''); 
  const [studentToken, setStudentToken] = useState(''); 
  const [history, setHistory] = useState([]); 
  const [financialData, setFinancialData] = useState([]); 
  
  const [cart, setCart] = useState([]);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]); 
  const [activeTab, setActiveTab] = useState('pos'); 
  const [reportMode, setReportMode] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [reportGenderFilter, setReportGenderFilter] = useState('All'); 

  useEffect(() => { 
      if (courseId) {
          fetch(`${API_URL}/courses/${courseId}/participants`).then(res => res.json()).then(data => setParticipants(Array.isArray(data)?data:[])).catch(err => console.error(err));
          fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); 
      }
  }, [courseId]);

  useEffect(() => { 
      if (selectedStudentId) { 
          const student = participants.find(p => p.participant_id == selectedStudentId); 
          setStudentToken(student && student.laundry_token_no ? student.laundry_token_no : ''); 
          fetch(`${API_URL}/participants/${selectedStudentId}/expenses`).then(res => res.json()).then(setHistory); 
      } else { 
          setHistory([]); setStudentToken(''); 
      } 
  }, [selectedStudentId]);

  const stats = useMemo(() => {
      const totalCollected = financialData.reduce((sum, p) => sum + parseFloat(p.total_due || 0), 0);
      const studentTotal = history.reduce((sum, h) => sum + parseFloat(h.amount), 0);
      return { totalCollected, studentTotal };
  }, [financialData, history]);

  const dashboardStats = useMemo(() => {
      if (!financialData.length) return null;
      let laundryCount = 0, laundryM = 0, laundryF = 0;
      const totalPending = financialData.reduce((sum, p) => sum + parseFloat(p.total_due), 0);
      const totalPaid = financialData.reduce((sum, p) => sum + (parseFloat(p.total_bill || 0) - parseFloat(p.total_due || 0)), 0);
      let pendingM = 0, pendingF = 0;
      financialData.forEach(p => {
          const isMale = (p.gender || '').toLowerCase().startsWith('m');
          if(isMale) pendingM += parseFloat(p.total_due); else pendingF += parseFloat(p.total_due);
          if(parseFloat(p.laundry_total) > 0) { laundryCount++; if(isMale) laundryM++; else laundryF++; }
      });
      return { totalPending, totalPaid, pendingM, pendingF, laundryCount, laundryM, laundryF };
  }, [financialData]);

  // ✅ UPDATED: Add To Cart with Qty * Rate Logic for Laundry
  const addToCart = (product) => {
      if (!selectedStudentId) return alert("Please select a student first.");
      
      // --- 1. SPECIAL LOGIC FOR LAUNDRY ---
      if (product.id === 'laundry') {
          // A. Determine Token Number
          let tokenLabel = studentToken;
          if (!tokenLabel) {
              tokenLabel = prompt("No assigned token found. Enter Token Number manually:");
              if (!tokenLabel) return; 
          }

          // B. Get Quantity
          const qtyStr = prompt("🧺 Enter Number of Clothes:", "1");
          if (qtyStr === null) return; // Cancelled
          const qty = parseInt(qtyStr);
          if (isNaN(qty) || qty <= 0) return alert("Invalid Quantity");

          // C. Get Rate (Default 20)
          const rateStr = prompt("💰 Enter Rate per Cloth (₹):", "20");
          if (rateStr === null) return; // Cancelled
          const rate = parseFloat(rateStr);
          if (isNaN(rate) || rate < 0) return alert("Invalid Rate");

          // D. Calculate Total & Create Name
          const totalAmount = qty * rate;
          const finalName = `Laundry Token ${tokenLabel} (${qty}pcs @ ₹${rate})`;

          // E. Add to Cart
          setCart([...cart, { ...product, name: finalName, price: totalAmount, date: entryDate, uid: Date.now() }]);
          return; 
      }

      // --- 2. STANDARD LOGIC FOR OTHER ITEMS ---
      let finalName = product.name;
      if (product.id === 'misc') {
          const custom = prompt("Enter Item Name:", "Misc Item");
          if (custom) finalName = custom;
      }

      const priceStr = prompt(`Enter Price for ${finalName}:`);
      if (priceStr === null) return; 
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) return alert("Please enter a valid amount.");
      
      setCart([...cart, { ...product, name: finalName, price, date: entryDate, uid: Date.now() }]);
  };

  const removeFromCart = (uid) => setCart(cart.filter(item => item.uid !== uid));

  const editCartName = (uid) => {
      const item = cart.find(i => i.uid === uid);
      if (!item) return;
      const newName = prompt("Edit Item Name:", item.name);
      if (newName) setCart(cart.map(i => i.uid === uid ? { ...i, name: newName } : i));
  };

  const editCartPrice = (uid) => {
      const item = cart.find(i => i.uid === uid);
      if (!item) return;
      const newPriceStr = prompt("Edit Price (₹):", item.price);
      if (newPriceStr !== null) {
          const newPrice = parseFloat(newPriceStr);
          if (!isNaN(newPrice)) setCart(cart.map(i => i.uid === uid ? { ...i, price: newPrice } : i)); else alert("Invalid Price");
      }
  };

  const handleCheckout = async () => {
      if (cart.length === 0) return alert("Cart is empty!");
      if (!selectedStudentId) return alert("Select a student first.");
      setIsProcessing(true);
      try {
          for (let item of cart) {
              await fetch(`${API_URL}/expenses`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ courseId, participantId: selectedStudentId, type: item.name, amount: item.price, date: item.date }) });
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
      // ✅ Optional Safety: Check userRole here if you want to restrict staff in future
      // if (userRole !== 'admin') return alert("Only Admin can delete.");
      
      if (!window.confirm("Delete this record?")) return;
      await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
      const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); 
      setHistory(await histRes.json());
      fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(setFinancialData);
  };

  const handleSettlePayment = async () => {
      if (!selectedStudentId) return;
      if (stats.studentTotal <= 0) return alert("No dues to settle!");
      const amountToPay = stats.studentTotal;
      if(!window.confirm(`💰 Confirm Payment Collection?\n\nAmount: ₹${amountToPay}\n\nThis will record a payment and clear the balance.`)) return;
      try {
          await fetch(`${API_URL}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, participantId: selectedStudentId, type: '✅ Payment Received', amount: -amountToPay }) });
          const histRes = await fetch(`${API_URL}/participants/${selectedStudentId}/expenses`); 
          setHistory(await histRes.json());
          fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(setFinancialData);
          alert("✅ Payment Recorded! Balance is now 0.");
          setActiveTab('pos'); 
      } catch (err) { console.error(err); alert("Failed to record payment."); }
  };

  const loadFinancialReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => setFinancialData(Array.isArray(data) ? data : [])); setReportMode('summary'); setReportGenderFilter('All'); };
  const loadLaundryReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res=>res.json()).then(data=>{ const laundryUsers = data.filter(p => parseFloat(p.laundry_total) > 0 || (p.laundry_token_no && p.laundry_token_no !== '')); setFinancialData(laundryUsers); setReportMode('laundry'); setReportGenderFilter('All'); }); };
  const loadPendingReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => { const pendingUsers = (Array.isArray(data) ? data : []).filter(p => parseFloat(p.total_due) > 0); setFinancialData(pendingUsers); setReportMode('pending'); setReportGenderFilter('All'); }); };
  const loadPaidReport = () => { if (!courseId) return; fetch(`${API_URL}/courses/${courseId}/financial-report`).then(res => res.json()).then(data => { const paidUsers = (Array.isArray(data) ? data : []).filter(p => { const due = parseFloat(p.total_due || 0); const bill = parseFloat(p.total_bill || 0); return due < 1.0 && bill > 0; }); setFinancialData(paidUsers); setReportMode('paid'); setReportGenderFilter('All'); }); };

  const handleExportCSV = (data, filename) => {
      if(!data || !data.length) return alert("No data to export");
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const currentStudent = participants.find(p => p.participant_id == selectedStudentId);
  const selectedCourseName = courses.find(c => c.course_id == courseId)?.course_name || '';

  const renderInvoice = () => {
      const laundryItems = history.filter(h => h.expense_type.toLowerCase().includes('laundry') && h.amount > 0);
      const shopItems = history.filter(h => !h.expense_type.toLowerCase().includes('laundry') && !h.expense_type.includes('Payment') && h.amount > 0);
      const payments = history.filter(h => h.amount < 0);
      const laundryTotal = laundryItems.reduce((sum, h) => sum + parseFloat(h.amount), 0);
      const shopTotal = shopItems.reduce((sum, h) => sum + parseFloat(h.amount), 0);
      const totalPaid = Math.abs(payments.reduce((sum, h) => sum + parseFloat(h.amount), 0));

      return (
        <div className="invoice-box" style={{maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', padding: '40px', fontFamily: 'Helvetica, Arial, sans-serif', background:'white'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px'}}>
                <div><h1 style={{margin: 0}}>INVOICE</h1><p style={{color: '#666'}}>Date: {new Date().toLocaleDateString()}</p></div>
                <div style={{textAlign: 'right'}}><h3>{currentStudent?.full_name}</h3><p>Conf: {currentStudent?.conf_no}</p><p>Room: {currentStudent?.room_no}</p><p>{selectedCourseName}</p></div>
            </div>
            {laundryItems.length > 0 && (<div style={{marginBottom:'20px'}}><div style={{background:'#e3f2fd', padding:'5px 10px', fontWeight:'bold', color:'#0d47a1', borderBottom:'1px solid #90caf9'}}>🧺 LAUNDRY SERVICES</div><table style={{width: '100%', borderCollapse: 'collapse'}}><tbody>{laundryItems.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}><td style={{padding: '8px'}}>{ex.expense_type} <span style={{fontSize:'10px', color:'#666'}}>({new Date(ex.recorded_at).toLocaleDateString()})</span></td><td style={{padding: '8px', textAlign: 'right'}}>₹{ex.amount}</td></tr> ))} <tr style={{fontWeight:'bold', background:'#f5f5f5'}}><td style={{padding:'8px', textAlign:'right'}}>Laundry Total:</td><td style={{padding:'8px', textAlign:'right'}}>₹{laundryTotal}</td></tr></tbody></table></div>)}
            {shopItems.length > 0 && (<div style={{marginBottom:'20px'}}><div style={{background:'#fff3e0', padding:'5px 10px', fontWeight:'bold', color:'#e65100', borderBottom:'1px solid #ffcc80'}}>🛒 SHOP ITEMS</div><table style={{width: '100%', borderCollapse: 'collapse'}}><tbody>{shopItems.map(ex => ( <tr key={ex.expense_id} style={{borderBottom: '1px solid #eee'}}><td style={{padding: '8px'}}>{ex.expense_type} <span style={{fontSize:'10px', color:'#666'}}>({new Date(ex.recorded_at).toLocaleDateString()})</span></td><td style={{padding: '8px', textAlign: 'right'}}>₹{ex.amount}</td></tr> ))} <tr style={{fontWeight:'bold', background:'#f5f5f5'}}><td style={{padding:'8px', textAlign:'right'}}>Shop Total:</td><td style={{padding:'8px', textAlign:'right'}}>₹{shopTotal}</td></tr></tbody></table></div>)}
            {payments.length > 0 && (<div style={{marginTop:'20px', borderTop:'2px dashed #ccc', paddingTop:'10px'}}>{payments.map(p => (<div key={p.expense_id} style={{display:'flex', justifyContent:'space-between', color:'green', fontSize:'13px'}}><span>{p.expense_type} ({new Date(p.recorded_at).toLocaleDateString()})</span><span>- ₹{Math.abs(p.amount)}</span></div>))}</div>)}
            <div style={{textAlign: 'right', marginTop: '30px', borderTop:'2px solid black', paddingTop:'10px'}}>
                <div style={{fontSize:'14px', color:'#666'}}>Total Laundry: ₹{laundryTotal}</div><div style={{fontSize:'14px', color:'#666'}}>Total Shop: ₹{shopTotal}</div><div style={{fontSize:'14px', color:'green'}}>Total Paid: -₹{totalPaid}</div><h2 style={{margin:'10px 0'}}>Net Payable: ₹{stats.studentTotal}</h2>
            </div>
            <div style={{marginTop: '60px', borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '5px'}}>Signature</div>
        </div>
      );
  };

  const renderReport = () => {
      const filteredData = financialData.filter(p => {
          if (reportGenderFilter === 'All') return true;
          const gender = (p.gender || '').toLowerCase();
          return reportGenderFilter === 'Male' ? gender.startsWith('m') : gender.startsWith('f');
      });

      const ReportControls = () => (
          <div className="no-print" style={{display:'flex', gap:'10px', alignItems:'center', background:'#f8f9fa', padding:'10px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #ddd'}}>
              <span style={{fontWeight:'bold', fontSize:'13px'}}>Filter:</span>
              <div style={{display:'flex', gap:'5px'}}>
                  {['All', 'Male', 'Female'].map(g => (
                      <button key={g} onClick={() => setReportGenderFilter(g)} style={{padding:'5px 12px', borderRadius:'15px', border: reportGenderFilter===g ? 'none' : '1px solid #ccc', background: reportGenderFilter===g ? '#333' : 'white', color: reportGenderFilter===g ? 'white' : '#333', cursor:'pointer', fontSize:'12px'}}>{g}</button>
                  ))}
              </div>
              <div style={{flex:1}}></div>
              <button onClick={() => handleExportCSV(filteredData, reportMode)} style={{display:'flex', alignItems:'center', gap:'5px', background:'#28a745', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}}><Download size={14}/> Export CSV</button>
          </div>
      );

      if (reportMode === 'laundry') { 
          const sortedList = filteredData.sort((a,b) => (parseInt(a.laundry_token_no)||0) - (parseInt(b.laundry_token_no)||0));
          return ( <div className="print-area"> <ReportControls/> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Laundry Service List {reportGenderFilter !== 'All' && `(${reportGenderFilter})`}</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black', background:'#f9f9f9'}}><th style={{...thPrint, textAlign:'center'}}>Token #</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Gender</th><th style={thPrint}>Dining Seat</th></tr></thead><tbody>{sortedList.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding: '10px', fontWeight:'bold', fontSize:'18px', textAlign:'center', borderRight:'1px solid #eee'}}>{p.laundry_token_no}</td><td style={{padding: '10px'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.gender}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td></tr>))}</tbody></table> </div> ); 
      }
      if (reportMode === 'pending') {
          const totalPending = filteredData.reduce((sum, p) => sum + parseFloat(p.total_due), 0);
          return ( <div className="print-area"> <ReportControls/> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0, color:'#d32f2f'}}>Pending Dues List {reportGenderFilter !== 'All' && `(${reportGenderFilter})`}</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead><tr style={{borderBottom: '2px solid black', background:'#fff5f5'}}><th style={thPrint}>S.N.</th><th style={thPrint}>Name</th><th style={thPrint}>Room</th><th style={thPrint}>Seat</th><th style={{...thPrint, textAlign:'right'}}>Amount Due</th></tr></thead><tbody>{filteredData.map((p, i) => (<tr key={i} style={{borderBottom: '1px solid #ddd'}}><td style={{padding:'10px'}}>{i+1}</td><td style={{padding: '10px', fontWeight:'bold'}}>{p.full_name}</td><td style={{padding: '10px'}}>{p.room_no}</td><td style={{padding: '10px'}}>{p.dining_seat_no}</td><td style={{padding: '10px', textAlign:'right', fontWeight:'bold', color:'#d32f2f'}}>₹{p.total_due}</td></tr>))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'16px', background:'#fbe9e7'}}><td colSpan={4} style={{padding:'15px', textAlign:'right'}}>TOTAL PENDING:</td><td style={{padding:'15px', textAlign:'right', color:'#d32f2f'}}>₹{totalPending}</td></tr></tbody></table> {filteredData.length === 0 && <p style={{textAlign:'center', color:'#28a745', padding:'20px', fontWeight:'bold'}}>🎉 Amazing! No pending dues.</p>} </div> ); 
      }
      if (reportMode === 'paid') {
          return ( <div className="print-area"> <ReportControls/> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0, color:'#2e7d32'}}>✅ Paid List {reportGenderFilter !== 'All' && `(${reportGenderFilter})`}</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}><thead> <tr style={{borderBottom: '2px solid black', background:'#e8f5e9'}}> <th style={thPrint}>S.N.</th> <th style={thPrint}>Name</th> <th style={thPrint}>Room</th> <th style={{...thPrint, textAlign:'right'}}>Paid Amount</th> <th style={{...thPrint, textAlign:'center'}}>Status</th> </tr> </thead> <tbody> {filteredData.map((p, i) => ( <tr key={i} style={{borderBottom: '1px solid #ddd'}}> <td style={{padding:'10px'}}>{i+1}</td> <td style={{padding: '10px', fontWeight:'bold'}}>{p.full_name}</td> <td style={{padding: '10px'}}>{p.room_no}</td> <td style={{padding: '10px', textAlign:'right', fontWeight:'bold'}}>₹{p.total_bill || 0}</td> <td style={{padding: '10px', textAlign:'center', color:'green', fontWeight:'bold'}}>Paid</td> </tr> ))} </tbody> </table> {filteredData.length === 0 && <div style={{textAlign:'center', padding:'20px', color:'#999'}}>No paid records found.</div>} </div> ); 
      }
      if (reportMode === 'invoice' && currentStudent) return renderInvoice();
      if (reportMode === 'summary') { 
          const sumLaundry = filteredData.reduce((sum, p) => sum + parseFloat(p.laundry_total || 0), 0);
          const sumShop = filteredData.reduce((sum, p) => sum + parseFloat(p.shop_total || 0), 0);
          const sumGrand = filteredData.reduce((sum, p) => sum + parseFloat(p.total_due || 0), 0);
          return ( <div className="print-area"> <ReportControls/> <div style={{textAlign: 'center', marginBottom: '20px'}}><h1 style={{margin: 0}}>Expenses Summary {reportGenderFilter !== 'All' && `(${reportGenderFilter})`}</h1><h3 style={{margin: '5px 0', color: '#555'}}>{selectedCourseName}</h3></div> <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '12px'}}> <thead> <tr style={{borderBottom: '2px solid black', background:'#f0f0f0'}}> <th style={thPrint}>S.N.</th> <th style={thPrint}>Name</th> <th style={thPrint}>Room</th> <th style={thPrint}>Seat</th> <th style={{...thPrint, textAlign:'right', background:'#e3f2fd'}}>Laundry</th> <th style={{...thPrint, textAlign:'right', background:'#fff3e0'}}>Shop</th> <th style={{...thPrint, textAlign:'right', borderLeft:'2px solid #ccc'}}>Total</th> </tr> </thead> <tbody> {filteredData.map((p, i) => ( <tr key={i} style={{borderBottom: '1px solid #ddd'}}> <td style={{padding:'8px'}}>{i+1}</td> <td style={{padding:'8px'}}>{p.full_name}</td> <td style={{padding:'8px'}}>{p.room_no}</td> <td style={{padding:'8px'}}>{p.dining_seat_no}</td> <td style={{padding:'8px', textAlign:'right', color:'#0d47a1', background:'#f1f8e9'}}>₹{p.laundry_total || 0}</td> <td style={{padding:'8px', textAlign:'right', color:'#e65100', background:'#fff8e1'}}>₹{p.shop_total || 0}</td> <td style={{padding:'8px', textAlign:'right', fontWeight:'bold', borderLeft:'2px solid #ccc'}}>₹{p.total_due}</td> </tr> ))} <tr style={{borderTop:'2px solid black', fontWeight:'bold', fontSize:'14px', background:'#fafafa'}}> <td colSpan={4} style={{padding:'10px', textAlign:'right'}}>CATEGORY TOTALS:</td> <td style={{padding:'10px', textAlign:'right', color:'#0d47a1'}}>₹{sumLaundry}</td> <td style={{padding:'10px', textAlign:'right', color:'#e65100'}}>₹{sumShop}</td> <td style={{padding:'10px', textAlign:'right', color:'black', borderLeft:'2px solid #ccc'}}>GRAND TOTAL: ₹{sumGrand}</td> </tr> </tbody> </table> </div> ); 
      }
      return null;
  };

  if (reportMode) {
      return (
          <div style={styles.card}>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                  <button onClick={() => setReportMode('')} style={styles.btn(false)}>← Back</button>
                  <button onClick={() => window.print()} style={{...styles.toolBtn('#007bff')}}>🖨️ Print</button>
              </div>
              {renderReport()}
          </div>
      );
  }

  return (
    <div style={styles.card}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'15px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>🛒 Dhamma Shop</h2>
          </div>
          <div style={{display:'flex', gap:'5px'}}>
              <button onClick={()=>setActiveTab('pos')} style={styles.quickBtn(activeTab==='pos')}><ShoppingCart size={14}/> POS</button>
              <button onClick={()=>setActiveTab('dashboard')} disabled={!courseId} style={styles.quickBtn(activeTab==='dashboard')}><Activity size={14}/> Dashboard</button>
              <button onClick={()=>setActiveTab('checkout')} disabled={!courseId} style={styles.quickBtn(activeTab==='checkout')}><LogOut size={14}/> Return Valuables</button>
          </div>
      </div>

      <div style={{marginBottom:'20px', display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px'}}>
          <select style={styles.input} onChange={e => setCourseId(e.target.value)}><option value="">-- Select Course --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}</select>
          <select style={styles.input} onChange={e => setSelectedStudentId(e.target.value)} disabled={!courseId} value={selectedStudentId}>
              <option value="">-- Select Student --</option>
              {participants.map(p => (
                  <option key={p.participant_id} value={p.participant_id}>
                      {p.full_name} ({p.conf_no || '-'} | Rm:{p.room_no || '-'} | LT:{p.laundry_token_no || 'NA'})
                  </option>
              ))}
          </select>
      </div>

      {activeTab === 'pos' && (
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              {/* LEFT: PRODUCTS */}
              <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                      <h4 style={{margin:0, color:'#555'}}>Quick Add Items (Price Prompt)</h4>
                      
                      <div style={{display:'flex', alignItems:'center', gap:'5px', background:'#f8f9fa', padding:'5px 10px', borderRadius:'6px', border:'1px solid #ddd'}}>
                          <Calendar size={14} color="#666"/>
                          <span style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Date:</span>
                          <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} style={{border:'none', background:'transparent', fontSize:'13px', fontWeight:'bold', color:'#333', outline:'none'}} />
                      </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'10px'}}>
                      {PRODUCTS.map(p => (
                          <button key={p.id} onClick={() => addToCart(p)} disabled={!selectedStudentId} style={{padding:'15px', border:'1px solid #ddd', borderRadius:'8px', background:'white', cursor: !selectedStudentId ? 'not-allowed' : 'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', transition:'all 0.2s', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                              <div style={{fontSize:'24px'}}>{p.icon}</div>
                              <div style={{fontWeight:'bold', fontSize:'13px'}}>{p.name}</div>
                              <div style={{fontSize:'12px', color:'#666'}}>Tap to Add</div>
                          </button>
                      ))}
                  </div>
              </div>

              {/* RIGHT: CART & HISTORY */}
              <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'12px', border:'1px solid #ddd', display:'flex', flexDirection:'column'}}>
                  <div style={{flex:1}}>
                      <h4 style={{marginTop:0, borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>Current Cart</h4>
                      {cart.length === 0 ? <div style={{textAlign:'center', color:'#999', padding:'20px', fontStyle:'italic'}}>Cart is empty</div> : (
                          <div style={{maxHeight:'200px', overflowY:'auto'}}>
                              {cart.map(item => (
                                  <div key={item.uid} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px dashed #eee', fontSize:'13px'}}>
                                      <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                              <span>{item.icon} {item.name}</span>
                                              <span style={{fontSize:'10px', color:'#888', background:'#eee', padding:'1px 4px', borderRadius:'4px'}}>{item.date}</span>
                                          </div>
                                          <div style={{display:'flex', gap:'4px'}}>
                                              <button onClick={() => editCartName(item.uid)} title="Edit Name" style={{background:'#e3f2fd', border:'1px solid #bbdefb', borderRadius:'4px', padding:'2px 6px', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', fontSize:'11px', color:'#0d47a1'}}><PenTool size={10}/> Name</button>
                                              <button onClick={() => editCartPrice(item.uid)} title="Edit Price" style={{background:'#fff3e0', border:'1px solid #ffe0b2', borderRadius:'4px', padding:'2px 6px', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', fontSize:'11px', color:'#e65100'}}><Tag size={10}/> Price</button>
                                          </div>
                                      </div>
                                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                          <strong>₹{item.price}</strong>
                                          <Trash2 size={14} color="red" style={{cursor:'pointer'}} onClick={()=>removeFromCart(item.uid)}/>
                                      </div>
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
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                          <h4 style={{margin:0}}>History ({history.length})</h4>
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                              <span style={{fontSize:'12px', background: stats.studentTotal > 0 ? '#fff3cd' : '#e8f5e9', padding:'2px 6px', borderRadius:'4px', color: stats.studentTotal > 0 ? 'orange' : 'green'}}>Due: ₹{stats.studentTotal}</span>
                              <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} title="Print Individual Invoice" style={{background:'#eee', border:'1px solid #ccc', borderRadius:'4px', padding:'4px', cursor:'pointer', display:'flex', alignItems:'center'}}><Printer size={14}/></button>
                          </div>
                      </div>
                      <div style={{maxHeight:'150px', overflowY:'auto'}}>
                          {history.map(h => (
                              <div key={h.expense_id} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', padding:'5px 0', borderBottom:'1px solid #eee', color: h.amount < 0 ? 'green' : 'black'}}>
                                  <span>{h.expense_type} <span style={{fontSize:'10px', color:'#888', marginLeft:'5px'}}>({new Date(h.recorded_at).toLocaleDateString()})</span></span>
                                  <span>{h.amount < 0 ? '-' : ''}₹{Math.abs(h.amount)} <span onClick={()=>handleDeleteExpense(h.expense_id)} style={{cursor:'pointer', color:'red', marginLeft:'5px'}}>×</span></span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'dashboard' && dashboardStats && (
          <div style={{animation:'fadeIn 0.3s'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px', marginBottom:'30px'}}>
                  <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #007bff'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#0d47a1', textTransform:'uppercase'}}>Total Pending Dues</div>
                      <div style={{fontSize:'28px', fontWeight:'900', color:'#333'}}>₹{dashboardStats.totalPending}</div>
                      <div style={{fontSize:'11px', color:'#555'}}>M: ₹{dashboardStats.pendingM} | F: ₹{dashboardStats.pendingF}</div>
                  </div>
                  <div style={{background:'#e8f5e9', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #2e7d32'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#1b5e20', textTransform:'uppercase'}}>Total Collected</div>
                      <div style={{fontSize:'28px', fontWeight:'900', color:'#333'}}>₹{dashboardStats.totalPaid}</div>
                      <div style={{fontSize:'11px', color:'#555'}}>Settled Payments</div>
                  </div>
                  <div style={{background:'#fff3e0', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #e65100'}}>
                      <div style={{fontSize:'12px', fontWeight:'bold', color:'#e65100', textTransform:'uppercase'}}>Laundry Users</div>
                      <div style={{fontSize:'28px', fontWeight:'900', color:'#333'}}>{dashboardStats.laundryCount}</div>
                      <div style={{fontSize:'11px', color:'#555'}}>M: {dashboardStats.laundryM} | F: {dashboardStats.laundryF}</div>
                  </div>
              </div>
              <div style={{background:'white', padding:'25px', borderRadius:'12px', border:'1px solid #eee'}}>
                  <h3 style={{marginTop:0, marginBottom:'20px'}}>Generate Reports</h3>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'15px'}}>
                      <button onClick={() => setReportMode('invoice')} disabled={!selectedStudentId} style={{...styles.quickBtn(!!selectedStudentId), justifyContent:'center', padding:'15px', background: !selectedStudentId ? '#eee' : '#e3f2fd', color: !selectedStudentId ? '#999' : '#0d47a1', border:'1px solid #ddd'}}><FileText size={20}/> Individual Invoice</button>
                      <button onClick={loadFinancialReport} style={{...styles.quickBtn(true), justifyContent:'center', padding:'15px', background:'#f8f9fa', color:'#333', border:'1px solid #ddd'}}><DollarSign size={20} color="#28a745"/> Course Summary</button>
                      <button onClick={loadLaundryReport} style={{...styles.quickBtn(true), justifyContent:'center', padding:'15px', background:'#f8f9fa', color:'#333', border:'1px solid #ddd'}}><Tag size={20} color="#007bff"/> Laundry List</button>
                      <button onClick={loadPendingReport} style={{...styles.quickBtn(true), justifyContent:'center', padding:'15px', background:'#f8f9fa', color:'#333', border:'1px solid #ddd'}}><Clock size={20} color="#d32f2f"/> Pending Dues</button>
                      <button onClick={loadPaidReport} style={{...styles.quickBtn(true), justifyContent:'center', padding:'15px', background:'#f8f9fa', color:'#333', border:'1px solid #ddd'}}><CheckCircle size={20} color="#28a745"/> Paid List</button>
                  </div>
                  {!selectedStudentId && <div style={{marginTop:'15px', color:'#999', fontSize:'12px', textAlign:'center'}}>* To print an Individual Invoice, please select a student in the POS tab first.</div>}
              </div>
          </div>
      )}

      {activeTab === 'checkout' && (
          <div style={{background:'#fff5f5', padding:'30px', borderRadius:'10px', border:'2px solid #ffcdd2', textAlign:'center'}}>
              <h3 style={{color:'#d32f2f', marginTop:0}}>🔐 Return Valuables & Checkout</h3>
              <div style={{maxWidth:'500px', margin:'0 auto 20px auto'}}>
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
                          <div style={{background:'white', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}><div style={{color:'#666', fontSize:'12px'}}>TOTAL DUE</div><div style={{fontSize:'32px', fontWeight:'bold', color: stats.studentTotal > 0 ? 'red' : 'green'}}>₹{stats.studentTotal}</div></div>
                      </div>
                      <div style={{display:'flex', justifyContent:'center', gap:'20px'}}>
                          {stats.studentTotal > 0 ? (
                              <button onClick={handleSettlePayment} style={{...styles.toolBtn('#28a745'), padding:'15px 30px', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px'}}><DollarSign size={20}/> Collect ₹{stats.studentTotal} & Clear Due</button>
                          ) : (
                              <div style={{color:'green', fontWeight:'bold', fontSize:'18px', padding:'10px', background:'#e8f5e9', borderRadius:'8px', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><CheckCircle size={24}/> Account Cleared</div>
                          )}
                          <button onClick={()=>window.print()} style={{...styles.toolBtn('#6c757d'), padding:'15px 30px', fontSize:'16px'}}>🖨️ Print Final Invoice</button>
                      </div>
                      <div className="print-only">{renderInvoice()}</div>
                      <style>{`@media screen { .print-only { display: none; } } @media print { body * { visibility: hidden; } .print-only, .print-only * { visibility: visible; } .print-only { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
                  </>
              ) : <div style={{color:'#666'}}>Please select a student above to begin checkout.</div>}
          </div>
      )}
    </div>
  );
}
