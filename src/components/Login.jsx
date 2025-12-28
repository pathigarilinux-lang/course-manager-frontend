import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function Login({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        onLogin(data); 
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)', // Original soft teal gradient
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px 50px', 
        borderRadius: '12px', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)', 
        width: '100%', 
        maxWidth: '360px', 
        textAlign: 'center' 
      }}>
        {/* LOGO ICON */}
        <div style={{ 
          background: 'linear-gradient(135deg, #007bff, #0056b3)', 
          width: '60px', 
          height: '60px', 
          borderRadius: '12px', // Square-ish rounded
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 20px auto',
          boxShadow: '0 4px 10px rgba(0,123,255,0.2)'
        }}>
          <Lock size={28} color="white" />
        </div>
        
        <h2 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '22px', fontWeight: '700' }}>Dhamma Seva</h2>
        <p style={{ margin: '0 0 30px 0', color: '#888', fontSize: '13px' }}>Please sign in to continue</p>
        
        {/* ERROR MESSAGE */}
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#b91c1c', 
            padding: '10px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            marginBottom: '20px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <User size={16} color="#aaa" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              placeholder="Username" 
              value={creds.username} 
              onChange={e => setCreds({...creds, username: e.target.value})} 
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                fontSize: '14px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'border 0.2s',
                ':focus': { borderColor: '#007bff' }
              }} 
              autoFocus 
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#aaa" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={creds.password} 
              onChange={e => setCreds({...creds, password: e.target.value})} 
              style={{ 
                width: '100%', 
                padding: '12px 12px 12px 40px', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                fontSize: '14px', 
                outline: 'none', 
                boxSizing: 'border-box'
              }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '12px', 
              background: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              marginTop: '10px',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Verifying...' : 'LOGIN'}
          </button>
        </form>
        
        <div style={{ marginTop: '30px', fontSize: '11px', color: '#bbb' }}>
          Restricted Access System
        </div>
      </div>
    </div>
  );
}
