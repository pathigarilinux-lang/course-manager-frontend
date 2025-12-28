import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { API_URL, styles } from '../config'; // Ensure path goes up one level to config

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
        // Successful login: Pass user data up to App.jsx
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
        width: '100%', 
        maxWidth: '380px', 
        textAlign: 'center' 
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #007bff, #0056b3)', 
          width: '70px', 
          height: '70px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 25px auto',
          boxShadow: '0 4px 10px rgba(0,123,255,0.3)'
        }}>
          <Lock size={32} color="white" />
        </div>
        
        <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '24px', fontWeight: '800' }}>Dhamma Seva</h2>
        <p style={{ margin: '0 0 30px 0', color: '#7f8c8d', fontSize: '14px' }}>Authorized Personnel Only</p>
        
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#b91c1c', 
            padding: '10px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            marginBottom: '20px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              placeholder="Username" 
              value={creds.username} 
              onChange={e => setCreds({...creds, username: e.target.value})} 
              style={{ ...styles.input, paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} 
              autoFocus 
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={creds.password} 
              onChange={e => setCreds({...creds, password: e.target.value})} 
              style={{ ...styles.input, paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              ...styles.btn(true), 
              width: '100%', 
              justifyContent: 'center', 
              padding: '14px', 
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #007bff, #0056b3)', 
              color: 'white', 
              fontSize: '16px', 
              marginTop: '10px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: '25px', fontSize: '12px', color: '#cbd5e1' }}>
          Restricted Access System v1.0
        </div>
      </div>
    </div>
  );
}
