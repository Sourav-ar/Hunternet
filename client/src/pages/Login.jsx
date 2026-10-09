import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await login(email, password);
    setBusy(false);
    if (result.success) navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    else setError(result.error);
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-card)',
        padding: '36px 32px',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>⚡ HunterNet</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Welcome back! Log in to your hunter account.</p>
        </div>

        <form onSubmit={submit}>
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@hunternet.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button disabled={busy} style={{ width: '100%', marginTop: '8px' }}>
            {busy ? 'Logging in…' : 'Log In to Guild'}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600' }}>Return to landing page</Link>
        </p>
      </div>
    </main>
  );
}
