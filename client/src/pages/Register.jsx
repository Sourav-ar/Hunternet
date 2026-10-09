import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState({ name: '', email: '', password: '', hunterRank: 'E' });
  const [createGuildOption, setCreateGuildOption] = useState(false);
  const [guildData, setGuildData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    const result = await register(
      account.name,
      account.email,
      account.password,
      'Hunter',
      account.hunterRank
    );

    if (!result.success) {
      setBusy(false);
      setError(result.error);
      return;
    }

    if (createGuildOption && guildData.name.trim()) {
      try {
        await hunterNet.createGuild({
          name: guildData.name.trim(),
          description: guildData.description,
          treasuryValue: 1000,
        });
      } catch (guildErr) {
        console.error('Guild creation failed:', guildErr);
      }
    }

    setBusy(false);
    navigate('/dashboard');
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'var(--bg-card)',
        padding: '36px 32px',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>⚡ Join HunterNet</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Create your official Hunter License account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              value={account.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
              placeholder="Sung Jinwoo"
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={account.email}
              onChange={(e) => setAccount({ ...account, email: e.target.value })}
              placeholder="hunter@hunternet.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength="6"
              value={account.password}
              onChange={(e) => setAccount({ ...account, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <label>
            Hunter Rank
            <select
              value={account.hunterRank}
              onChange={(e) => setAccount({ ...account, hunterRank: e.target.value })}
            >
              {['E', 'D', 'C', 'B', 'A', 'S', 'National Level'].map((rank) => (
                <option key={rank}>{rank}</option>
              ))}
            </select>
          </label>

          <div style={{ marginTop: '15px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textTransform: 'none', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={createGuildOption}
                onChange={(e) => setCreateGuildOption(e.target.checked)}
              />
              Found a New Guild upon registration (Become Leader)
            </label>

            {createGuildOption && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.8rem' }}>
                  Guild Name
                  <input
                    value={guildData.name}
                    onChange={(e) => setGuildData({ ...guildData, name: e.target.value })}
                    placeholder="e.g. Ahjin Guild"
                    required={createGuildOption}
                  />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Guild Description
                  <textarea
                    value={guildData.description}
                    onChange={(e) => setGuildData({ ...guildData, description: e.target.value })}
                    placeholder="Premier Hunter Guild..."
                    style={{ minHeight: '60px' }}
                  />
                </label>
              </div>
            )}
          </div>

          <button disabled={busy} style={{ width: '100%', marginTop: '12px' }}>
            {busy ? 'Registering…' : createGuildOption ? 'Create Account & Found Guild' : 'Create Hunter Account'}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log in here</Link>
        </p>
      </div>
    </main>
  );
}
