import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hunterNet } from '../services/hunternetApi';
import { apiError } from '../utils/permissions';

export default function GuildDirectory() {
  const [guilds, setGuilds] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = (q = '') => {
    setError('');
    hunterNet.allGuilds(q ? { q } : {})
      .then(setGuilds)
      .catch((err) => setError(apiError(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleApply = async (guildId, guildName) => {
    setError(''); setMsg('');
    try {
      await hunterNet.applyToGuild(guildId);
      setMsg(`Application submitted to ${guildName}! Waiting for Leader approval.`);
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>🌐 Guild Directory</h1>
          <p>Browse active hunter guilds across the HunterNet system.</p>
        </div>
        <Link to="/guilds/create">
          <button>➕ Found New Guild</button>
        </Link>
      </div>

      {error && <p role="alert">{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', margin: '20px 0 28px', maxWidth: '540px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guilds by name..."
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>

      {/* Guild Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {guilds.length ? (
          guilds.map((g) => {
            const isFull = g.memberCount >= (g.maxMembers || 10);
            return (
              <div key={g._id} style={{
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🏰 {g.name}</h3>
                    <span className="badge" style={{ background: 'rgba(124, 92, 255, 0.15)', color: '#7C5CFF', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                      Level {g.guildLevel}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{g.description}</p>
                  
                  <dl>
                    <div>
                      <dt>Guild Leader</dt>
                      <dd>{g.guildLeader?.name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt>Members</dt>
                      <dd style={{ color: isFull ? '#EF4444' : '#4A8CFF' }}>
                        {g.memberCount} / {g.maxMembers || 10}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  onClick={() => handleApply(g._id, g.name)}
                  disabled={isFull}
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  {isFull ? 'Guild Full' : 'Apply to Join Guild'}
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <p>No guilds found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
}
