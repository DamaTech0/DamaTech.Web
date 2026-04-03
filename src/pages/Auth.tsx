import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Tab = 'login' | 'register';

export default function Auth() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res =
        tab === 'login'
          ? await authApi.login(email, password)
          : await authApi.register(email, password);
      login(res.token, res.email);
      navigate('/dashboard');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-brand-icon">📡</div>
          <div className="auth-brand-title">DamaTech</div>
          <div className="auth-brand-desc">
            Manage your digital signage screens, media, and schedules from one place.
          </div>
          <div className="auth-brand-features">
            {[
              'Pair devices with a 6-digit code',
              'Upload images and videos to the cloud',
              'Set time-based content schedules',
              'Monitor screens in real-time',
            ].map((f) => (
              <div key={f} className="auth-brand-feature">
                <div className="auth-brand-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📡</div>
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">
              {tab === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </div>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>
              Sign in
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="label">Password {tab === 'register' && <span style={{ color: 'var(--text-dim)' }}>(min. 8 characters)</span>}</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={tab === 'register' ? 8 : undefined}
              />
            </div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
