import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay for "App feel"
    setTimeout(() => {
        // Simple hardcoded check - Replace with your real API auth logic if needed
        if (credentials.username === 'admin' && credentials.password === 'dhamma') {
            onLogin(true);
        } else {
            setError('Invalid credentials');
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', // Deep serene gradient
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px 50px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
      }}>
        {/* LOGO AREA */}
        <div style={{marginBottom: '30px'}}>
            <div style={{
                width: '80px', height: '80px', 
                background: 'linear-gradient(45deg, #007bff, #00d2ff)', 
                borderRadius: '50%', margin: '0 auto 20px auto', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(0,123,255,0.3)'
            }}>
                <span style={{fontSize:'40px'}}>☸️</span>
            </div>
            <h1 style={{margin: '0', color: '#333', fontSize: '24px', fontWeight: '800'}}>Dhamma Nagajjuna 2</h1>
            <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '14px'}}>Management Console</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '20px', textAlign: 'left'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase'}}>Username</label>
                <div style={{position: 'relative'}}>
                    <User size={18} color="#999" style={{position: 'absolute', left: '15px', top: '12px'}}/>
                    <input 
                        type="text" 
                        placeholder="Enter username" 
                        value={credentials.username}
                        onChange={e => setCredentials({...credentials, username: e.target.value})}
                        style={{
                            width: '100%', padding: '12px 15px 12px 45px', 
                            borderRadius: '8px', border: '1px solid #ddd', 
                            fontSize: '14px', outline: 'none',
                            background: '#f9f9f9', transition: 'all 0.3s'
                        }}
                    />
                </div>
            </div>

            <div style={{marginBottom: '30px', textAlign: 'left'}}>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase'}}>Password</label>
                <div style={{position: 'relative'}}>
                    <Lock size={18} color="#999" style={{position: 'absolute', left: '15px', top: '12px'}}/>
                    <input 
                        type="password" 
                        placeholder="Enter password" 
                        value={credentials.password}
                        onChange={e => setCredentials({...credentials, password: e.target.value})}
                        style={{
                            width: '100%', padding: '12px 15px 12px 45px', 
                            borderRadius: '8px', border: '1px solid #ddd', 
                            fontSize: '14px', outline: 'none',
                            background: '#f9f9f9'
                        }}
                    />
                </div>
            </div>

            {error && <div style={{marginBottom: '20px', color: '#dc3545', fontSize: '13px', background: '#ffe6e6', padding: '10px', borderRadius: '6px'}}>{error}</div>}

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
                {loading ? 'Accessing...' : 'Sign In'}
                {!loading && <ArrowRight size={18}/>}
            </button>
        </form>
        
        <div style={{marginTop: '30px', fontSize: '11px', color: '#aaa'}}>
            v2.0 • Secured System • Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}
