import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hunterNet } from '../services/hunternetApi';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Checking backend…');
  const [account, setAccount] = useState({ name: '', email: '', password: '', hunterRank: 'E' });
  const [createGuildOption, setCreateGuildOption] = useState(false);
  const [guildData, setGuildData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hunterNet.health()
      .then((health) => setStatus(health.message))
      .catch(() => setStatus('Backend is unavailable.'));
  }, []);

  const createAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    // 1. Register User (always as Hunter initially)
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

    // 2. If user selected Create Guild option, establish guild immediately
    if (createGuildOption && guildData.name.trim()) {
      try {
        await hunterNet.createGuild({
          name: guildData.name.trim(),
          description: guildData.description,
          treasuryValue: 1000,
        });
      } catch (guildErr) {
        console.error('Guild Creation Error:', guildErr);
      }
    }

    setBusy(false);
    navigate('/dashboard');
  };

  return (
    <main>
      <header>
        <h1>HunterNet</h1>
        <p>A multi-tenant Hunter Guild Management Platform.</p>
      </header>

      <section>
        <h2>Platform Status</h2>
        <p>{status}</p>
      </section>

      <section>
        <h2>Create a Hunter Account</h2>
        <form onSubmit={createAccount}>
          <label>
            Name
            <input
              value={account.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={account.email}
              onChange={(e) => setAccount({ ...account, email: e.target.value })}
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

          <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #444', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={createGuildOption}
                onChange={(e) => setCreateGuildOption(e.target.checked)}
              />
              Establish a New Guild upon registration (Become Guild Leader)
            </label>

            {createGuildOption && (
              <div style={{ marginTop: '10px' }}>
                <label>
                  Guild Name
                  <input
                    value={guildData.name}
                    onChange={(e) => setGuildData({ ...guildData, name: e.target.value })}
                    required={createGuildOption}
                    placeholder="e.g. Ahjin Guild"
                  />
                </label>
                <label>
                  Guild Description
                  <textarea
                    value={guildData.description}
                    onChange={(e) => setGuildData({ ...guildData, description: e.target.value })}
                    placeholder="Premier Hunter Guild..."
                  />
                </label>
              </div>
            )}
          </div>

          <button disabled={busy} style={{ marginTop: '15px' }}>
            {busy ? 'Creating account…' : createGuildOption ? 'Create Account & Found Guild' : 'Create Hunter Account'}
          </button>
        </form>

        {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}
      </section>

      <p>
        Already have an account? <Link to="/login">Log in to HunterNet</Link>
      </p>
    </main>
  );
}
