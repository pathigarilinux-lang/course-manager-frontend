import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';

export default function Login({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Simulate a smooth transition delay
        setTimeout(() => onLogin(data), 600);
      } else {
        setError(data.error || 'Access Denied');
        setLoading(false);
      }
    } catch (err) {
      setError('Unable to connect to server');
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
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Deep Calming Teal/Blue
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(72,169,254,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(40,167,69,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>

      {/* Main Card */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(20px)',
        padding: '50px 40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', 
        width: '100%', 
        maxWidth: '400px', 
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        
        {/* Animated Logo Container */}
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'linear-gradient(135deg, #007bff, #00d2ff)', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 30px auto',
          boxShadow: '0 10px 20px rgba(0,123,255,0.3)',
          transform: loading ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.3s ease'
        }}>
          {loading ? (
             <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
             <ShieldCheck size={40} color="white" strokeWidth={1.5} />
          )}
        </div>
        
        <h2 style={{ margin: '0', color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Dhamma Seva</h2>
        <p style={{ margin: '8px 0 30px 0', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Secure Registration Access</p>
        
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#ef4444', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            fontWeight: '600',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Username Input */}
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '5px', marginBottom: '5px', display: 'block' }}>Username</label>
            <div style={{ position: 'relative' }}>
                <User size={20} color={focused === 'user' ? '#007bff' : '#cbd5e1'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.3s' }} />
                <input 
                  placeholder="Enter ID" 
                  value={creds.username} 
                  onChange={e => setCreds({...creds, username: e.target.value})} 
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                  style={{ 
                    width: '100%', 
                    padding: '16px 16px 16px 50px', 
                    borderRadius: '12px', 
                    border: focused === 'user' ? '2px solid #007bff' : '2px solid #f1f5f9', 
                    background: '#f8fafc',
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#334155',
                    outline: 'none', 
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }} 
                  autoFocus 
                />
            </div>
          </div>
          
          {/* Password Input */}
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '5px', marginBottom: '5px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
                <Lock size={20} color={focused === 'pass' ? '#007bff' : '#cbd5e1'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.3s' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={creds.password} 
                  onChange={e => setCreds({...creds, password: e.target.value})} 
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                  style={{ 
                    width: '100%', 
                    padding: '16px 16px 16px 50px', 
                    borderRadius: '12px', 
                    border: focused === 'pass' ? '2px solid #007bff' : '2px solid #f1f5f9', 
                    background: '#f8fafc',
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#334155',
                    outline: 'none', 
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }} 
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '16px', 
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #007bff 0%, #0062cc 100%)', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '700',
              borderRadius: '12px',
              border: 'none',
              marginTop: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s, box-shadow 0.2s',
              boxShadow: '0 4px 15px rgba(0,123,255,0.3)'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
        
        <div style={{ marginTop: '30px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
          Restricted System • Bhavatu Sabba Mangalam
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div>
  );
}

// Icon helper since AlertTriangle isn't imported from main but used in error
const AlertTriangle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
