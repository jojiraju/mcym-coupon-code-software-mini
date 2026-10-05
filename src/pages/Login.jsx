import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    if (password === 'mcym2026') {
      sessionStorage.setItem('mcymAuth', 'true');
      onLoginSuccess();
    } else {
      setLoginError('Incorrect password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '0 16px', padding: '40px 32px', textAlign: 'center' }}>
        <div className="brand-mark" style={{ margin: '0 auto 20px', width: '72px', height: '72px', fontSize: '34px', background: 'var(--soft-red)', color: 'var(--red)', border: '1px solid var(--soft-red)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>🎄</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '26px', fontFamily: '"Playfair Display", serif', letterSpacing: '-0.5px' }}>MCYM Admin</h2>
        <p style={{ margin: '0 0 32px', color: 'var(--muted)', fontSize: '14px' }}>Sign in to manage coupon records</p>

        <div className="field" style={{ textAlign: 'left' }}>
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ background: '#fff', paddingRight: '44px' }}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
        <button className="btn primary" style={{ width: '100%', marginTop: '12px', fontSize: '15px', height: '54px' }} onClick={handleLogin}>Login to Dashboard</button>
        {loginError && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '16px', fontWeight: 600 }}>{loginError}</p>}
      </div>
    </div>
  );
}

export default Login;
