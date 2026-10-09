import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import { apiError } from '../utils/permissions';

const ROLE_HIERARCHY = {
  'Guild Leader': 4,
  'Vice Leader': 3,
  'Analyzer': 2,
  'Team Leader': 2,
  'Hunter': 1,
};

export default function GuildDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guild, setGuild] = useState(null);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setError('');
    try {
      const activeGuild = await hunterNet.myGuild();
      setGuild(activeGuild);
      if (activeGuild) {
        const membersList = await hunterNet.members(activeGuild._id).catch(() => []);
        setRoster(membersList);
      }
    } catch (err) {
      setError(apiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleRoleChange = async (memberId, role) => {
    setError(''); setMsg('');
    try {
      await hunterNet.updateRole(memberId, role);
      setMsg('Member role updated successfully.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleKickMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to kick ${memberName} from the guild?`)) return;
    setError(''); setMsg('');
    try {
      const res = await hunterNet.kickMember(memberId);
      setMsg(res.message || `Kicked ${memberName} from the guild.`);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleLeaveGuild = async () => {
    if (!window.confirm('Are you sure you want to leave your guild?')) return;
    setError(''); setMsg('');
    try {
      await hunterNet.leaveGuild();
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const userLevel = ROLE_HIERARCHY[user?.role] || 0;

  if (!guild) {
    return (
      <section>
        <h1>🏰 My Guild</h1>
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border)', marginTop: '20px' }}>
          <h2>You do not belong to a guild</h2>
          <p>Create a new guild or browse the directory to submit an application.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <Link to="/guilds/create"><button>Establish New Guild</button></Link>
            <Link to="/guilds"><button type="button">Browse Guild Directory</button></Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>🏰 {guild.name}</h1>
          <p>{guild.description}</p>
        </div>
        <button type="button" onClick={handleLeaveGuild} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          Leave Guild
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {/* Overview Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Guild Level</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>Level {guild.guildLevel}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Treasury Balance</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#22C55E', marginTop: '4px' }}>{guild.treasuryValue} GT</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Guild Leader</span>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{guild.guildLeader?.name || 'N/A'}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Member Capacity</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#4A8CFF', marginTop: '4px' }}>
            {guild.memberCount} / {guild.maxMembers || 10}
          </div>
        </div>
      </div>

      {/* Guild Roster Table Section */}
      <section style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: '24px', border: '1px solid var(--border)', marginTop: '24px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Guild Roster ({roster.length} members)</h2>
        {roster.length ? (
          <ul style={{ padding: 0 }}>
            {roster.map((m) => {
              const targetLevel = ROLE_HIERARCHY[m.role] || 0;
              const canKick = m._id !== user._id && userLevel > targetLevel;

              return (
                <li key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#FFF' }}>
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{m.name}</strong>
                      <span className="badge" style={{ marginLeft: '10px', background: 'rgba(124, 92, 255, 0.15)', color: '#7C5CFF', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                        Rank {m.hunterRank}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Role: {m.role}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user?.role === 'Guild Leader' && m._id !== user._id && (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m._id, e.target.value)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="Hunter">Hunter</option>
                        <option value="Vice Leader">Vice Leader</option>
                        <option value="Analyzer">Analyzer</option>
                        <option value="Team Leader">Team Leader</option>
                      </select>
                    )}

                    {canKick && (
                      <button
                        type="button"
                        onClick={() => handleKickMember(m._id, m.name)}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Kick Member
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No roster members found.</p>
        )}
      </section>
    </section>
  );
}
