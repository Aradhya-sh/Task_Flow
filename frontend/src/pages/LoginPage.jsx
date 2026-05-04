import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (role) => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoadingRole(role);
    setLoading(true);
    try {
      await login(form.email, form.password, role);
      toast.success(role === 'admin' ? 'Logged in as Admin!' : 'Logged in as Member!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
      setLoadingRole(null);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Role login label */}
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            Choose how you want to sign in:
          </p>

          {/* Two login buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSubmit('admin')}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid var(--primary)',
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--primary-light)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
            >
              {loadingRole === 'admin'
                ? <span className="spinner-sm spinner" style={{ borderTopColor: 'var(--primary-light)' }} />
                : <>👑 Login as Admin</>}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('member')}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid #38bdf8',
                background: 'rgba(56,189,248,0.10)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(56,189,248,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.10)'; }}
            >
              {loadingRole === 'member'
                ? <span className="spinner-sm spinner" style={{ borderTopColor: '#38bdf8' }} />
                : <>👤 Login as Member</>}
            </button>
          </div>

          {/* Role description hints */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-hover)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--primary-light)' }}>Admin:</strong> Create projects & tasks, manage team, full access
            </div>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-hover)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: '#38bdf8' }}>Member:</strong> View tasks, update status, add comments only
            </div>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
