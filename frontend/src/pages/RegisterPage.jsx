import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to TaskFlow.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={form[key]}
        onChange={e => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: '' }); }}
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </div>
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Start managing your team's work today</p>

        <form onSubmit={handleSubmit}>
          {field('name', 'Full name', 'text', 'John Doe')}
          {field('email', 'Email address', 'email', 'you@example.com')}
          {field('password', 'Password', 'password', '••••••••')}
          {field('confirm', 'Confirm password', 'password', '••••••••')}

          <div className="form-group">
            <label className="form-label">I am registering as</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'admin' })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `2px solid ${form.role === 'admin' ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'var(--bg-hover)',
                  color: form.role === 'admin' ? 'var(--primary-light)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'member' })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `2px solid ${form.role === 'member' ? '#38bdf8' : 'var(--border)'}`,
                  background: form.role === 'member' ? 'rgba(56,189,248,0.12)' : 'var(--bg-hover)',
                  color: form.role === 'member' ? '#38bdf8' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                👤 Member
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
              {form.role === 'admin'
                ? 'Admins can create projects, manage tasks and team members.'
                : 'Members can view tasks, update status and add comments.'}
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }} disabled={loading}>
            {loading ? <span className="spinner-sm spinner" style={{ borderTopColor: 'white' }} /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
