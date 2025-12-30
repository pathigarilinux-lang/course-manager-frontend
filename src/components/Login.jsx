import React, { useState } from 'react';
import { Lock, ArrowRight, KeyRound, HelpCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function Login({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false); // ✅ State for toggling hint

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

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', 
      fontFamily: '"Inter", "Segoe UI", sans-serif'
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
        border: '1px solid rgba(255,255,255,0.2)'
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
                transition: 'all 0.2s ease',
                paddingRight: '40px' // Make room for the icon
              }} 
              autoFocus 
            />
            
            {/* ✅ Hint Toggle Button */}
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
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
              title="Show Hint"
            >
              <HelpCircle size={20} />
            </button>
          </div>

          {/* ✅ Hint Message Area */}
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
              <strong>💡 Hint:</strong> Please ask the <strong>Center Manager</strong> or <strong>Trustee</strong> for today's access code.
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
        
        <div style={{ marginTop: '30px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          Vipassana International Meditation Center
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
