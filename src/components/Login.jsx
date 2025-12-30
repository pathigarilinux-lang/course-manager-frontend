import React, { useState } from 'react';
import { Lock, ArrowRight, KeyRound, HelpCircle, Users, X } from 'lucide-react';
import { API_URL } from '../config';

export default function Login({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false); 
  const [showUserList, setShowUserList] = useState(false); // ✅ Toggle for User List

  // 📝 DEMO USER DATA (You can customize this list)
  const availableUsers = [
    { role: 'Admin / Trustee', code: '123456', hint: 'Full Access' },
    { role: 'AT (Teacher)',    code: '998877', hint: 'Course Mgr' },
    { role: 'Server / Vol.',   code: '555555', hint: 'View Only' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTimeout(() => onLogin(data), 500); 
      } else {
        setError('❌ Access Denied');
        setPasscode(''); 
        setLoading(false);
      }
    } catch (err) {
      setError('⚠️ Connection Failed');
      setLoading(false);
    }
  };

  // Helper to auto-fill passcode from list
  const autoFill = (code) => {
    setPasscode(code);
    setShowUserList(false);
    setError('');
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', 
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(72,169,254,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(25px)',
        padding: '50px 40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', 
        width: '100%', 
        maxWidth: '380px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div style={{ 
          width: '70px', height: '70px', 
          background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 25px auto',
          boxShadow: '0 0 20px rgba(0,210,255,0.4)'
        }}>
          {loading ? (
             <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
             <KeyRound size={32} color="white" />
          )}
        </div>
        
        <h2 style={{ margin: '0', color: 'white', fontSize: '24px', fontWeight: '700', letterSpacing: '0.5px' }}>Dhamma Nagajjuna</h2>
        <p style={{ margin: '10px 0 30px 0', color: '#b8c6db', fontSize: '13px' }}>Enter Passcode to Access</p>
        
        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <input 
              type="password" 
              inputMode="numeric" 
              placeholder="• • • • •" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value)} 
              maxLength={6}
              style={{ 
                width: '100%', 
                padding: '15px', 
                paddingRight: '45px',
                borderRadius: '12px', 
                border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)', 
                background: 'rgba(0,0,0,0.2)',
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                letterSpacing: '8px',
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }} 
              autoFocus 
            />
            
            {/* 💡 Hint Toggle (Right side of input) */}
            <button
              type="button"
              onClick={() => { setShowHint(!showHint); setShowUserList(false); }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: showHint ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: '5px'
              }}
              title="Help Hint"
            >
              <HelpCircle size={20} />
            </button>
          </div>

          {/* Simple Text Hint */}
          {showHint && (
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px', 
              fontSize: '12px', 
              color: '#d1d5db',
              lineHeight: '1.4',
              border: '1px dashed rgba(255,255,255,0.2)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <strong>💡 Hint:</strong> Contact Center Manager for access.
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', animation: 'shake 0.3s' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading || passcode.length < 3}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: 'white', 
              color: '#1e293b', 
              fontSize: '15px', 
              fontWeight: '800',
              borderRadius: '12px',
              border: 'none',
              cursor: (loading || passcode.length < 3) ? 'not-allowed' : 'pointer',
              opacity: (loading || passcode.length < 3) ? 0.6 : 1,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading ? 'UNLOCKING...' : 'UNLOCK SYSTEM'} 
            {!loading && <ArrowRight size={18}/>}
          </button>
        </form>
        
        {/* 👥 User List Toggle Button */}
        <div style={{ marginTop: '20px' }}>
            <button 
                onClick={() => { setShowUserList(!showUserList); setShowHint(false); }}
                style={{
                    background: 'transparent', 
                    border: 'none', 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '5px',
                    margin: '0 auto',
                    textDecoration: 'underline'
                }}
            >
                <Users size={14}/> Show Available Users
            </button>
        </div>

        <div style={{ marginTop: '30px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          Vipassana International Meditation Center
        </div>
      </div>

      {/* 📋 SLIDING USER CREDENTIALS PANEL */}
      {showUserList && (
          <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(190px, -50%)', // Positions it to the RIGHT of the main box
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              width: '260px',
              zIndex: 5,
              animation: 'slideIn 0.3s ease-out'
          }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom:'8px'}}>
                  <h4 style={{margin:0, color:'#333', fontSize:'14px'}}>🔑 Demo Credentials</h4>
                  <button onClick={() => setShowUserList(false)} style={{background:'none', border:'none', cursor:'pointer', color:'#999'}}><X size={16}/></button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {availableUsers.map((u, i) => (
                      <div 
                          key={i} 
                          onClick={() => autoFill(u.code)}
                          style={{
                              padding: '10px', 
                              background: '#f8f9fa', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              border: '1px solid #eee',
                              transition: 'background 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      >
                          <div style={{textAlign:'left'}}>
                              <div style={{fontSize:'13px', fontWeight:'bold', color:'#333'}}>{u.role}</div>
                              <div style={{fontSize:'10px', color:'#666'}}>{u.hint}</div>
                          </div>
                          <div style={{fontSize:'12px', fontWeight:'bold', color:'#007bff', background:'white', padding:'2px 6px', borderRadius:'4px', border:'1px solid #ddd'}}>
                              {u.code}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translate(150px, -50%); } to { opacity: 1; transform: translate(190px, -50%); } }
        
        /* Mobile adjustment for sliding panel */
        @media (max-width: 800px) {
            div[style*="translate(190px"] {
                transform: translate(-50%, -50%) !important; /* Center it */
                top: 50% !important;
                left: 50% !important;
                z-index: 20 !important;
                width: 300px !important;
                border: 2px solid #007bff;
            }
        }
      `}</style>
    </div>
  );
}
