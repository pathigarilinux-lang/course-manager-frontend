import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, Bell, Heart, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function SevaBoard({ courses }) {
  // In a real scenario, these counts would come from your Database.
  // For now, I am simulating the "Needs" based on course ID to show you the visual.
  // You would add columns: 'server_male_req', 'server_female_req' to your Courses table.
  
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
      if (courses.length > 0) {
          // Filter only upcoming courses
          const upcoming = courses.filter(c => new Date(c.start_date) > new Date());
          
          // MOCK DATA GENERATOR (Replace this with real DB data later)
          const mockData = upcoming.map((c, i) => ({
              ...c,
              // Simulating random needs for demonstration
              kitchen_male: i === 0 ? 0 : 2,   // 0 means Full
              kitchen_female: i === 0 ? 1 : 3,
              hall_server: i === 0 ? 1 : 0
          }));
          setOpportunities(mockData);
      }
  }, [courses]);

  const getStatusBadge = (needed) => {
      if (needed === 0) return { color: '#28a745', bg: '#e8f5e9', label: 'FULL', icon: <CheckCircle size={12}/> };
      if (needed <= 2) return { color: '#d32f2f', bg: '#ffebee', label: `${needed} URGENT`, icon: <AlertCircle size={12}/> };
      return { color: '#f57c00', bg: '#fff3e0', label: `${needed} Open`, icon: <Heart size={12}/> };
  };

  const handleApply = (courseName, role) => {
      // Simple action: Open Email or WhatsApp
      const subject = `Seva Application: ${courseName} - ${role}`;
      window.open(`mailto:seva@nagajjuna.dhamma.org?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <div style={{maxWidth:'1000px', margin:'0 auto', padding:'20px'}}>
      
      {/* HEADER */}
      <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{width:'60px', height:'60px', background:'#e3f2fd', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 15px auto'}}>
              <Heart size={30} color="#0d47a1" fill="#0d47a1" fillOpacity={0.2}/>
          </div>
          <h1 style={{margin:'0 0 10px 0', color:'#2c3e50'}}>Dhamma Service Board</h1>
          <p style={{color:'#666', maxWidth:'600px', margin:'0 auto', lineHeight:'1.6'}}>
              "The volition to serve is the most important thing."<br/>
              Check the upcoming courses below. If you are an Old Student and wish to serve, please apply.
          </p>
      </div>

      {/* CARDS GRID */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'25px'}}>
          {opportunities.map(course => (
              <div key={course.course_id} style={{
                  background:'white', borderRadius:'15px', overflow:'hidden',
                  boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'1px solid #eee',
                  transition:'transform 0.2s', ':hover':{transform:'translateY(-5px)'}
              }}>
                  {/* Course Date Header */}
                  <div style={{background:'#0d47a1', padding:'15px 20px', color:'white'}}>
                      <div style={{fontSize:'12px', opacity:0.8, textTransform:'uppercase', letterSpacing:'1px', fontWeight:'bold'}}>
                          {course.course_name.split('/')[0]}
                      </div>
                      <div style={{fontSize:'18px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', marginTop:'5px'}}>
                          <Calendar size={18}/>
                          {new Date(course.start_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(course.end_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                      </div>
                  </div>

                  {/* Requirements List */}
                  <div style={{padding:'20px'}}>
                      <h4 style={{marginTop:0, color:'#555', fontSize:'13px', textTransform:'uppercase', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'15px'}}>
                          Servers Needed
                      </h4>

                      {/* Kitchen Male */}
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#444'}}>
                              <div style={{padding:'8px', background:'#f5f5f5', borderRadius:'8px'}}><Utensils size={16}/></div>
                              <div>
                                  <div style={{fontWeight:'bold', fontSize:'14px'}}>Kitchen (Male)</div>
                                  <div style={{fontSize:'11px', color:'#888'}}>Cooking / Cleaning</div>
                              </div>
                          </div>
                          {(() => {
                              const s = getStatusBadge(course.kitchen_male);
                              return (
                                  <span style={{background:s.bg, color:s.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}>
                                      {s.icon} {s.label}
                                  </span>
                              );
                          })()}
                      </div>

                      {/* Kitchen Female */}
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#444'}}>
                              <div style={{padding:'8px', background:'#f5f5f5', borderRadius:'8px'}}><Utensils size={16}/></div>
                              <div>
                                  <div style={{fontWeight:'bold', fontSize:'14px'}}>Kitchen (Female)</div>
                                  <div style={{fontSize:'11px', color:'#888'}}>Cooking / Cleaning</div>
                              </div>
                          </div>
                          {(() => {
                              const s = getStatusBadge(course.kitchen_female);
                              return (
                                  <span style={{background:s.bg, color:s.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}>
                                      {s.icon} {s.label}
                                  </span>
                              );
                          })()}
                      </div>

                      {/* Dhamma Hall */}
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#444'}}>
                              <div style={{padding:'8px', background:'#f5f5f5', borderRadius:'8px'}}><Bell size={16}/></div>
                              <div>
                                  <div style={{fontWeight:'bold', fontSize:'14px'}}>Dhamma Server</div>
                                  <div style={{fontSize:'11px', color:'#888'}}>Hall Management</div>
                              </div>
                          </div>
                          {(() => {
                              const s = getStatusBadge(course.hall_server);
                              return (
                                  <span style={{background:s.bg, color:s.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}>
                                      {s.icon} {s.label}
                                  </span>
                              );
                          })()}
                      </div>

                      {/* Action Button */}
                      <button 
                          onClick={() => handleApply(course.course_name, 'General Server')}
                          style={{
                              width:'100%', padding:'12px', borderRadius:'8px', border:'none',
                              background: 'linear-gradient(to right, #0d47a1, #1976d2)',
                              color:'white', fontWeight:'bold', cursor:'pointer',
                              display:'flex', justifyContent:'center', alignItems:'center', gap:'8px',
                              boxShadow:'0 4px 10px rgba(13, 71, 161, 0.3)'
                          }}
                      >
                          Apply to Serve <ArrowRight size={16}/>
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {opportunities.length === 0 && (
          <div style={{textAlign:'center', padding:'50px', color:'#999'}}>
              No upcoming courses scheduled yet.
          </div>
      )}
    </div>
  );
}
