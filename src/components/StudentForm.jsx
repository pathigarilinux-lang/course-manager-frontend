return ( 
      <div style={styles.card}> 
          {/* COMPACT HEADER */}
          <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <User size={20} color="#007bff"/> 
                  <h3 style={{margin:0, color:'#2c3e50', fontSize:'18px'}}>Check-In Console</h3>
              </div>
              {status && (<div style={{padding:'4px 12px', background: status.includes('Success')?'#d4edda':'#f8d7da', color: status.includes('Success')?'#155724':'#721c24', borderRadius:'20px', fontWeight:'bold', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}>{status.includes('Success') ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}{status}</div>)}
          </div>

          <div className="no-print" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
              {/* LEFT COLUMN: FORM */}
              <form onSubmit={handleSubmit}>
                  {/* STEP 1: SELECT & SEARCH (Compact) */}
                  <div style={{background:'#f8f9fa', padding:'15px', borderRadius:'10px', marginBottom:'15px', border:'1px solid #eee'}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px', alignItems:'end'}}>
                          <div>
                              <label style={{...styles.label, marginBottom:'4px', fontSize:'11px', color:'#007bff'}}>COURSE</label>
                              <select style={{...styles.input, fontSize:'13px', padding:'8px'}} onChange={handleCourseChange} value={formData.courseId}>
                                  <option value="">-- Select --</option>{courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                              </select>
                          </div>
                          <div style={{position:'relative'}}>
                              <label style={{...styles.label, marginBottom:'4px', fontSize:'11px', color:'#007bff'}}>FIND STUDENT</label>
                              <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                                  <Search size={16} style={{position:'absolute', left:'10px', color:'#999'}}/>
                                  <input ref={searchInputRef} style={{...styles.input, padding:'8px 8px 8px 32px', fontSize:'14px'}} placeholder="Name / ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setIsSearching(true); }} disabled={!formData.courseId} onFocus={() => setIsSearching(true)}/>
                                  {searchTerm && (<button type="button" onClick={()=>{setSearchTerm(''); setSelectedStudent(null);}} style={{position:'absolute', right:'10px', background:'none', border:'none', cursor:'pointer', color:'#999'}}><X size={14}/></button>)}
                              </div>
                              {isSearching && searchTerm && (<div style={{position:'absolute', top:'105%', left:0, right:0, background:'white', border:'1px solid #eee', borderRadius:'8px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'250px', overflowY:'auto'}}>{searchResults.length === 0 ? <div style={{padding:'10px', color:'#999', textAlign:'center', fontSize:'12px'}}>No matches.</div> : searchResults.map(p => (<div key={p.participant_id} onClick={() => selectStudent(p)} style={{padding:'8px 12px', borderBottom:'1px solid #f9f9f9', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', ':hover': {background: '#f8f9fa'}}} onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><div><div style={{fontWeight:'bold', color:'#333'}}>{p.full_name}</div><div style={{fontSize:'11px', color:'#777'}}>{p.conf_no} • {p.gender}</div></div><div style={{background: p.status === 'Cancelled' ? '#ffebee' : '#eee', color: p.status === 'Cancelled' ? '#c62828' : '#333', padding:'2px 6px', borderRadius:'8px', fontSize:'10px', fontWeight:'bold'}}>{p.status}</div></div>))}</div>)}
                          </div>
                      </div>
                  </div>

                  {selectedStudent && (
                      <div style={{animation:'fadeIn 0.2s ease'}}>
                          {/* ALERTS & INFO */}
                          {selectedStudent.medical_info && (<div style={{background:'#fff3cd', borderLeft:'3px solid #ffc107', padding:'8px 12px', borderRadius:'4px', marginBottom:'10px', fontSize:'12px', color:'#856404', display:'flex', gap:'8px'}}><AlertTriangle size={16}/><span><strong>Medical:</strong> {selectedStudent.medical_info}</span></div>)}
                          
                          <div style={{display:'flex', gap:'10px', marginBottom:'15px', fontSize:'12px'}}>
                              <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>ID:</strong> {formData.confNo}</div>
                              <div style={{background:'#e9ecef', padding:'6px 10px', borderRadius:'4px'}}><strong>Age:</strong> {selectedStudent.age}</div>
                              <div style={{background: themeColor, color:'white', padding:'6px 10px', borderRadius:'4px', fontWeight:'bold'}}>{selectedStudent.gender}</div>
                          </div>

                          {/* ASSIGNMENT GRID (Tightened) */}
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                              {/* ACCOMMODATION */}
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.01)'}}>
                                  <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}><MapPin size={14} color="#007bff"/> Room</h5>
                                  <div style={{marginBottom:'10px'}}>
                                      <button type="button" onClick={() => setShowVisualRoom(true)} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', background: formData.roomNo ? '#e3f2fd' : 'white', color: formData.roomNo ? '#0d47a1' : '#555', borderColor: formData.roomNo ? '#90caf9' : '#ddd', fontWeight: formData.roomNo ? 'bold' : 'normal', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>{formData.roomNo || "Select Room"}{formData.roomNo && <CheckCircle size={14} color="#28a745"/>}</button>
                                  </div>
                              </div>
                              
                              {/* DINING & LOCKERS (Updated with Headers) */}
                              <div style={{border:'1px solid #eee', borderRadius:'8px', padding:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.01)'}}>
                                  <h5 style={{margin:'0 0 10px 0', color:'#555', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f0f0f0', paddingBottom:'5px'}}><Coffee size={14} color="#e91e63"/> Dining, Lockers & Laundry</h5>
                                  <div style={{marginBottom:'10px', display:'flex', gap:'5px'}}>
                                      <select style={{...styles.input, width:'70px', padding:'8px', fontSize:'12px'}} value={formData.seatType} onChange={e=>setFormData({...formData, seatType:e.target.value})}><option>Chair</option><option>Floor</option></select>
                                      <button type="button" onClick={() => setShowVisualDining(true)} style={{...styles.input, textAlign:'left', padding:'8px', fontSize:'13px', flex:1, background: formData.seatNo ? '#e3f2fd' : 'white', color: formData.seatNo ? '#0d47a1' : '#555', fontWeight: formData.seatNo ? 'bold' : 'normal', cursor:'pointer'}}>{formData.seatNo || "Seat"}</button>
                                  </div>
                                  
                                  {/* ✅ UNIFIED 3-COLUMN GRID FOR ALL LOCKER ITEMS */}
                                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px'}}>
                                      <div>
                                          <label style={{fontSize:'10px', fontWeight:'bold', color:'#777', display:'block', marginBottom:'2px'}}>Mobile</label>
                                          <select style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%', boxSizing:'border-box'}} value={formData.mobileLocker} onChange={e => setFormData({...formData, mobileLocker: e.target.value})}><option value="">None</option>{availableMobiles.map(n => <option key={n} value={n}>{n}</option>)}</select>
                                      </div>
                                      <div>
                                          <label style={{fontSize:'10px', fontWeight:'bold', color:'#777', display:'block', marginBottom:'2px'}}>Valuables</label>
                                          <select style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%', boxSizing:'border-box'}} value={formData.valuablesLocker} onChange={e => setFormData({...formData, valuablesLocker: e.target.value})}><option value="">None</option>{availableValuables.map(n => <option key={n} value={n}>{n}</option>)}</select>
                                      </div>
                                      
                                      {/* ✅ LAUNDRY INPUT MOVED HERE */}
                                      <div>
                                          <label style={{fontSize:'10px', fontWeight:'bold', color:'#777', display:'block', marginBottom:'2px'}}>Laundry</label>
                                          <input 
                                              style={{...styles.input, padding:'6px', fontSize:'12px', width:'100%', boxSizing:'border-box', background:'#f0f8ff', fontWeight:'bold', color:'#0d47a1'}} 
                                              value={formData.laundryToken} 
                                              onChange={e=>setFormData({...formData, laundryToken:e.target.value})} 
                                              placeholder="Token" 
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* EXTRAS */}
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', fontSize:'12px'}}>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Lang</label><select style={{...styles.input, padding:'6px'}} value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>{LANGUAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Pagoda</label><button type="button" onClick={() => setShowVisualPagoda(true)} style={{...styles.input, padding:'6px', textAlign:'left', cursor:'pointer'}}>{formData.pagodaCell || "None"}</button></div>
                              <div><label style={{fontWeight:'bold', color:'#777'}}>Special</label><select style={{...styles.input, padding:'6px'}} value={formData.specialSeating} onChange={e => setFormData({...formData, specialSeating: e.target.value})}><option value="">None</option><option value="Chowky">Chowky</option><option value="Chair">Chair</option><option value="BackRest">BackRest</option></select></div>
                          </div>

                          {/* ACTIONS */}
                          <div style={{marginTop:'20px', textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                              <button type="button" onClick={triggerReprint} disabled={!selectedStudent} style={{...styles.btn(false), background:'white', border:'1px solid #ccc', color:'#555', display:'flex', alignItems:'center', gap:'6px', padding:'10px 15px', fontSize:'13px'}}><Printer size={16}/> Reprint</button>
                              <button type="submit" disabled={!selectedStudent} style={{...styles.btn(true), background: selectedStudent ? 'linear-gradient(45deg, #28a745, #218838)' : '#e0e0e0', color: selectedStudent ? 'white' : '#999', padding:'10px 30px', fontSize:'14px', borderRadius:'25px', boxShadow: selectedStudent ? '0 3px 10px rgba(40,167,69,0.2)' : 'none', cursor: selectedStudent ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:'8px'}}><CheckCircle size={18}/> Check-In</button>
                          </div>
                      </div>
                  )}
              </form>

              {/* RIGHT COLUMN: PREVIEW (Sticky) */}
              <div style={{background:'white', borderRadius:'12px', boxShadow:'0 5px 20px rgba(0,0,0,0.06)', height:'fit-content', overflow:'hidden', position:'sticky', top:'10px', border:'1px solid #eee'}}>
                  <div style={{background: themeColor, padding:'10px', textAlign:'center', color:'white'}}>
                      <h3 style={{margin:0, fontSize:'14px', letterSpacing:'1px', textTransform:'uppercase'}}>Arrival Pass</h3>
                  </div>
                  {selectedStudent ? (
                      <div style={{padding:'20px'}}>
                          <div style={{textAlign:'center', marginBottom:'15px'}}>
                              <div style={{fontWeight:'800', fontSize:'18px', color:'#333', lineHeight:'1.2'}}>{selectedStudent.full_name}</div>
                              <div style={{fontSize:'12px', color:'#777', marginTop:'4px'}}>{formData.confNo}</div>
                          </div>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'#eee', border:'1px solid #eee', borderRadius:'8px', overflow:'hidden', marginBottom:'15px'}}>
                              <div style={{background:'white', padding:'10px', textAlign:'center'}}><div style={{fontSize:'9px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Room</div><div style={{fontWeight:'900', fontSize:'20px', color:'#333'}}>{formData.roomNo || '-'}</div></div>
                              <div style={{background:'white', padding:'10px', textAlign:'center'}}><div style={{fontSize:'9px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Dining</div><div style={{fontWeight:'900', fontSize:'20px', color:'#333'}}>{formData.seatNo || '-'}</div></div>
                              <div style={{background:'white', padding:'10px', textAlign:'center'}}><div style={{fontSize:'9px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Mobile</div><div style={{fontWeight:'bold', fontSize:'14px', color:'#555'}}>{formData.mobileLocker || '-'}</div></div>
                              <div style={{background:'white', padding:'10px', textAlign:'center'}}><div style={{fontSize:'9px', color:'#999', fontWeight:'bold', textTransform:'uppercase'}}>Valuables</div><div style={{fontWeight:'bold', fontSize:'14px', color:'#555'}}>{formData.valuablesLocker || '-'}</div></div>
                          </div>
                          <div style={{textAlign:'center', fontSize:'11px', color:'#aaa', fontStyle:'italic'}}>{formData.language} • {selectedStudent.age} Yrs</div>
                      </div>
                  ) : (
                      <div style={{padding:'40px 20px', textAlign:'center', color:'#ccc'}}>
                          <User size={32} style={{opacity:0.2, marginBottom:'10px'}}/>
                          <div style={{fontSize:'13px'}}>Preview</div>
                      </div>
                  )}
                  {selectedStudent && <div style={{height:'6px', background: `repeating-linear-gradient(45deg, ${themeColor}, ${themeColor} 10px, white 10px, white 20px)`}}></div>}
              </div>
          </div>

          {/* VISUAL MODALS (Passing Maps now) */}
          {showVisualDining && <DiningLayout gender={currentGenderLabel} occupiedMap={diningMap} selected={formData.seatNo} onSelect={handleDiningSeatChange} onClose={()=>setShowVisualDining(false)} />}
          {showVisualPagoda && <PagodaLayout gender={currentGenderLabel} occupiedMap={pagodaMap} selected={formData.pagodaCell} onSelect={handlePagodaSelect} onClose={()=>setShowVisualPagoda(false)} />}
          
          {showVisualRoom && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', flexDirection:'column', padding:'20px'}}><div style={{background:'white', borderRadius:'8px', flex:1, display:'flex', flexDirection:'column', overflow:'hidden', maxWidth:'1200px', margin:'0 auto', width:'100%'}}><div style={{padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}><h3 style={{margin:0}}>📍 Select Bed for {selectedStudent ? selectedStudent.full_name : 'Student'} ({isFemale ? 'Female' : 'Male'})</h3><button onClick={()=>setShowVisualRoom(false)} style={{background:'red', color:'white', border:'none', borderRadius:'4px', padding:'5px 15px', cursor:'pointer'}}>Close</button></div><div style={{flex:1, overflowY:'auto', padding:'20px', background:'#f0f2f5'}}>{isFemale ? (<FemaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />) : (<MaleBlockLayout rooms={rooms} occupancy={occupancy} onRoomClick={handleRoomSelect} />)}</div></div></div>)}
          
          {/* PRINT AREA */}
          {printReceiptData && (<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999}}><div style={{background:'white', padding:'20px', borderRadius:'10px', width:'350px'}}><button onClick={()=>setPrintReceiptData(null)} style={{float:'right', background:'red', color:'white', border:'none', borderRadius:'50%', width:'30px', height:'30px', cursor:'pointer'}}>X</button><div id="receipt-print-area" style={{padding:'5px', border:'3px solid black', borderRadius:'8px', fontFamily:'Helvetica, Arial, sans-serif', color:'black', width:'70mm', margin:'0 auto', boxSizing:'border-box'}}><div style={{textAlign:'center', fontWeight:'bold', marginBottom:'5px'}}><div style={{fontSize:'16px'}}>VIPASSANA</div><div style={{fontSize:'10px'}}>International Meditation Center</div><div style={{fontSize:'12px'}}>Dhamma Nagajjuna 2</div></div><div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div><table style={{width:'100%', fontSize:'11px', marginBottom:'5px', lineHeight:'1.3'}}><tbody><tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Course:</td><td>{printReceiptData.courseName}</td></tr><tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Teacher:</td><td>{printReceiptData.teacherName}</td></tr><tr><td style={{fontWeight:'bold', width:'50px', verticalAlign:'top'}}>Date:</td><td>{printReceiptData.from} to {printReceiptData.to}</td></tr></tbody></table><div style={{borderBottom:'2px solid black', margin:'5px 0'}}></div><div style={{textAlign:'center'}}><div style={{fontSize:'14px', fontWeight:'900', textTransform:'uppercase', margin:'5px 0'}}>CHECK-IN PASS</div><div style={{fontSize:'45px', fontWeight:'900', lineHeight:'1', margin:'5px 0'}}>{printReceiptData.roomNo || '-'}</div><div style={{fontSize:'14px', fontWeight:'bold', margin:'5px 0', wordWrap:'break-word', lineHeight:'1.2'}}>{printReceiptData.studentName}</div><div style={{fontSize:'12px', fontWeight:'bold'}}>{printReceiptData.confNo}</div></div><table style={{width:'100%', borderCollapse:'collapse', marginTop:'10px', border:'2px solid black'}}><tbody><tr><td style={{border:'1px solid black', padding:'4px', width:'50%', fontSize:'11px'}}>Dining: <strong>{printReceiptData.seatNo || '-'}</strong></td><td style={{border:'1px solid black', padding:'4px', width:'50%', fontSize:'11px'}}>Mobile: <strong>{printReceiptData.mobile}</strong></td></tr><tr><td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Valuables: <strong>{printReceiptData.valuables}</strong></td><td style={{border:'1px solid black', padding:'4px', fontSize:'11px'}}>Lang: <strong>{printReceiptData.language}</strong></td></tr>{(printReceiptData.laundry || printReceiptData.pagoda) && (<tr><td colSpan="2" style={{border:'1px solid black', padding:'4px', fontSize:'11px', fontWeight:'bold', textAlign:'center', background:'#f0f0f0'}}>{printReceiptData.laundry && <span style={{marginRight:'10px'}}>Laundry: {printReceiptData.laundry}</span>}{printReceiptData.pagoda && <span>Pagoda: {printReceiptData.pagoda}</span>}</td></tr>)}</tbody></table><div style={{textAlign:'center', fontSize:'9px', fontStyle:'italic', marginTop:'5px'}}>*** Student Copy ***</div></div><div className="no-print" style={{marginTop:'20px', display:'flex', gap:'10px'}}><button onClick={() => window.print()} style={{flex:1, padding:'12px', background:'#007bff', color:'white', border:'none', borderRadius:'6px'}}>PRINT</button></div></div><style>{`@media print { @page { size: 72mm auto; margin: 0; } html, body { height: 100%; overflow: hidden; margin: 0; padding: 0; } body * { visibility: hidden; } #receipt-print-area, #receipt-print-area * { visibility: visible; } #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; page-break-after: avoid; } }`}</style></div>)}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div> 
  );
}
