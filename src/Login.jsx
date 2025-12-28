import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { API_URL, styles } from '../config';

export default function Login({ onLogin }) {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data); // Pass { username, role } to App
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f6f8' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' }}>
        <div style={{ background: '#e3f2fd', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Lock size={30} color="#007bff" />
        </div>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Dhamma Seva Access</h2>
        {error && <div style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            placeholder="Username" 
            value={creds.username} 
            onChange={e => setCreds({...creds, username: e.target.value})} 
            style={styles.input} 
            autoFocus 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={creds.password} 
            onChange={e => setCreds({...creds, password: e.target.value})} 
            style={styles.input} 
          />
          <button type="submit" style={{ ...styles.btn(true), width: '100%', justifyContent: 'center', padding: '12px', background: '#007bff', color: 'white', fontSize: '16px' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
