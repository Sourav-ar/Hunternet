import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hunterNet } from '../services/hunternetApi';
import { apiError } from '../utils/permissions';

export default function CreateGuild() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', treasuryValue: 1000 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await hunterNet.createGuild({
        ...form,
        treasuryValue: Number(form.treasuryValue),
      });
      setBusy(false);
      navigate('/guild');
      window.location.reload();
    } catch (err) {
      setBusy(false);
      setError(apiError(err));
    }
  };

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>🏰 Found a New Guild</h1>
      <p>Establish your guild, assemble hunters, and build your treasury.</p>

      {error && <p role="alert">{error}</p>}

      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginTop: '20px' }}>
        <form onSubmit={handleSubmit}>
          <label>
            Guild Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ahjin Guild"
              required
            />
          </label>

          <label>
            Guild Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your guild's mission and rules..."
              style={{ minHeight: '100px' }}
            />
          </label>

          <label>
            Initial Treasury Deposit (Guild Tokens)
            <input
              type="number"
              min="0"
              value={form.treasuryValue}
              onChange={(e) => setForm({ ...form, treasuryValue: e.target.value })}
            />
          </label>

          <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
            <button disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Establishing Guild…' : 'Found Guild'}
            </button>
            <button type="button" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
