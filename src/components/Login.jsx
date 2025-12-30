import React, { useState } from 'react';
import { Lock, ArrowRight, KeyRound, HelpCircle, Users, X } from 'lucide-react';
import { API_URL } from '../config';

export default function Login({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false); 
  const [showUserList, setShowUserList] = useState(false); 

  const availableUsers = [
    { role: 'Admin / Trustee', code: '0', hint: 'Full Control' },
    { role: 'Gate / Check-In', code: '1', hint: 'Registration' },
    { role: 'AT (Teacher)',    code: '2', hint: 'Course Mgr' },
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
      // ✅ RICH UI BACKGROUND: Animated Deep Gradient
      background: 'linear-gradient(-45deg, #0F2027, #203A43, #2C5364, #1e3c72, #2a5298)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* ✅ RICH UI: Floating Glowing Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.08)', 
        backdropFilter: 'blur(20px)',
        padding: '50px 40px', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
        width: '100%', 
        maxWidth: '380px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.15)',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div style={{ 
          width: '70px', height: '70px', 
          background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 25px auto',
          boxShadow: '0 10px 25px rgba(0, 210, 255, 0.3)'
        }}>
          {loading ? (
             <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
             <KeyRound size={32} color="white" />
          )}
        </div>
        
        <h2 style={{ margin: '0', color: 'white', fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Dhamma Nagajjuna</h2>
        <p style={{ margin: '10px 0 30px 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '500' }}>Secure Access Portal</p>
        
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
                padding: '16px', 
                paddingRight: '45px',
                borderRadius: '14px', 
                border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.15)', 
                background: 'rgba(0,0,0,0.25)',
                fontSize: '24px', 
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                letterSpacing: '8px',
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }} 
              autoFocus 
            />
            
            <button
              type="button"
              onClick={() => { setShowHint(!showHint); setShowUserList(false); }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: showHint ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Help Hint"
            >
              <HelpCircle size={16} />
            </button>
          </div>

          {showHint && (
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.15)', 
              borderRadius: '10px', 
              padding: '12px', 
              marginBottom: '20px', 
              fontSize: '13px', 
              color: '#93c5fd',
              lineHeight: '1.4',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              animation: 'fadeIn 0.3s ease',
              textAlign: 'left',
              display: 'flex', gap: '8px', alignItems: 'center'
            }}>
              <HelpCircle size={16} style={{ flexShrink: 0 }}/>
              <span>Ask the Center Manager for access.</span>
            </div>
          )}

          {error && <div style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#fca5a5', 
              fontSize: '13px', 
              fontWeight: '600', 
              marginBottom: '20px', 
              padding: '10px', 
              borderRadius: '10px', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              animation: 'shake 0.3s' 
          }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading || passcode.length < 1}
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: 'white', 
              color: '#0f2027', 
              fontSize: '15px', 
              fontWeight: '800',
              borderRadius: '14px',
              border: 'none',
              cursor: (loading || passcode.length < 1) ? 'not-allowed' : 'pointer',
              opacity: (loading || passcode.length < 1) ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 15px -3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'UNLOCKING...' : 'UNLOCK SYSTEM'} 
            {!loading && <ArrowRight size={18}/>}
          </button>
        </form>
        
        <div style={{ marginTop: '25px' }}>
            <button 
                onClick={() => { setShowUserList(!showUserList); setShowHint(false); }}
                style={{
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '12px', 
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px',
                    margin: '0 auto',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
                <Users size={14}/> Login Credentials
            </button>
        </div>

        <div style={{ marginTop: '30px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>
          Vipassana International Meditation Center
        </div>
      </div>

      {showUserList && (
          <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(210px, -50%)',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              width: '280px',
              zIndex: 5,
              animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid rgba(255,255,255,0.5)'
          }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                  <h4 style={{margin:0, color:'#1e293b', fontSize:'15px', fontWeight:'700'}}>🔑 Quick Access</h4>
                  <button onClick={() => setShowUserList(false)} style={{background:'rgba(0,0,0,0.05)', border:'none', cursor:'pointer', color:'#64748b', borderRadius:'50%', padding:'4px', display:'flex'}}><X size={16}/></button>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {availableUsers.map((u, i) => (
                      <div 
                          key={i} 
                          onClick={() => autoFill(u.code)}
                          style={{
                              padding: '12px', 
                              background: 'white', 
                              borderRadius: '12px', 
                              cursor: 'pointer', 
                              border: '1px solid #e2e8f0',
                              transition: 'all 0.2s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                          }}
                      >
                          <div style={{textAlign:'left'}}>
                              <div style={{fontSize:'13px', fontWeight:'700', color:'#334155'}}>{u.role}</div>
                              <div style={{fontSize:'11px', color:'#64748b', marginTop:'2px'}}>{u.hint}</div>
                          </div>
                          <div style={{fontSize:'12px', fontWeight:'700', color:'#2563eb', background:'#eff6ff', padding:'4px 8px', borderRadius:'6px'}}>
                              {u.code}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <style>{`
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translate(170px, -50%); scale: 0.95; } to { opacity: 1; transform: translate(210px, -50%); scale: 1; } }
        
        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.6;
            z-index: 1;
            animation: float 20s infinite ease-in-out;
        }
        .orb-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #2a5298; animation-delay: 0s; }
        .orb-2 { bottom: -10%; right: -10%; width: 400px; height: 400px; background: #1e3c72; animation-delay: -5s; }
        .orb-3 { top: 40%; left: 60%; width: 300px; height: 300px; background: #2C5364; animation-delay: -10s; }

        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, -30px); }
        }

        @media (max-width: 800px) {
            div[style*="translate(210px"] {
                transform: translate(-50%, -50%) !important; 
                top: 50% !important;
                left: 50% !important;
                z-index: 20 !important;
                width: 320px !important;
                border: 2px solid #3b82f6;
            }
        }
      `}</style>
    </div>
  );
}
