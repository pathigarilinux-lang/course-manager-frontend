import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate processing delay for smoothness
    setTimeout(() => {
        // PRESERVED YOUR LOGIC:
        if (passcode === '11') onLogin('admin');
        else if (passcode === '0') onLogin('gatekeeper');
        else if (passcode === '2') onLogin('teacher');
        else {
            setError('❌ Invalid Passcode');
            setLoading(false);
        }
    }, 600);
  };

  return (
    <div style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px 50px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
      }}>
        {/* LOGO */}
        <div style={{marginBottom: '30px'}}>
            <div style={{
                width: '70px', height: '70px', 
                background: 'linear-gradient(45deg, #007bff, #00d2ff)', 
                borderRadius: '50%', margin: '0 auto 20px auto', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(0,123,255,0.3)',
                color: 'white', fontSize: '30px'
            }}>
                ☸️
            </div>
            <h1 style={{margin: '0', color: '#333', fontSize: '22px', fontWeight: '800'}}>Dhamma Nagajjuna 2</h1>
            <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '13px'}}>Secure Access Portal</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '25px', textAlign: 'left'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase', letterSpacing:'1px'}}>Enter Access Code</label>
                <div style={{position: 'relative'}}>
                    <Lock size={18} color="#999" style={{position: 'absolute', left: '15px', top: '14px'}}/>
                    <input 
                        type="password" 
                        placeholder="Passcode" 
                        value={passcode}
                        onChange={e => setPasscode(e.target.value)}
                        autoFocus
                        style={{
                            width: '100%', padding: '12px 15px 12px 45px', 
                            borderRadius: '8px', border: '1px solid #ddd', 
                            fontSize: '16px', outline: 'none',
                            background: '#f9f9f9', transition: 'all 0.3s',
                            textAlign: 'center', letterSpacing: '3px'
                        }}
                    />
                </div>
            </div>

            {error && <div style={{marginBottom: '20px', color: '#dc3545', fontSize: '13px', background: '#ffe6e6', padding: '10px', borderRadius: '6px', fontWeight:'bold'}}>{error}</div>}

            <button 
                type="submit" 
                disabled={loading}
                style={{
                    width: '100%', padding: '14px', 
                    borderRadius: '8px', border: 'none', 
                    background: 'linear-gradient(45deg, #007bff, #0056b3)', 
                    color: 'white', fontSize: '16px', fontWeight: 'bold', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 5px 15px rgba(0,123,255,0.4)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                    transition: 'transform 0.2s'
                }}
            >
                {loading ? 'Verifying...' : 'Unlock System'}
                {!loading && <ArrowRight size={18}/>}
            </button>
        </form>
        
        <div style={{marginTop: '30px', display:'flex', justifyContent:'center', gap:'20px', fontSize: '11px', color: '#aaa'}}>
            <span style={{display:'flex', alignItems:'center', gap:'4px'}}><ShieldCheck size={12}/> Secure</span>
            <span>v2.5 Stable</span>
        </div>
      </div>
    </div>
  );
}
