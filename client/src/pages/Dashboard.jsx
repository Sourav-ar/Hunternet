import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import TimelineCard from '../components/TimelineCard';
import { apiError, can } from '../utils/permissions';

const ROLE_HIERARCHY = {
  'Guild Leader': 4,
  'Vice Leader': 3,
  'Analyzer': 2,
  'Team Leader': 2,
  'Hunter': 1,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [guild, setGuild] = useState(null);
  const [events, setEvents] = useState([]);
  const [allGuilds, setAllGuilds] = useState([]);
  const [applications, setApplications] = useState([]);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newGuild, setNewGuild] = useState({ name: '', description: '', treasuryValue: 0 });

  const load = async () => {
    setError('');
    try {
      const activeGuild = await hunterNet.myGuild();
      setGuild(activeGuild);

      if (activeGuild) {
        // Fetch timeline, applications (if leader), and roster
        const [activity, membersList] = await Promise.all([
          hunterNet.timeline({ limit: 10 }).catch(() => []),
          hunterNet.members(activeGuild._id).catch(() => []),
        ]);
        setEvents(activity);
        setRoster(membersList);

        if (user?.role === 'Guild Leader') {
          const apps = await hunterNet.applications().catch(() => []);
          setApplications(apps);
        }
      } else {
        // Fetch available guilds to apply
        const list = await hunterNet.allGuilds().catch(() => []);
        setAllGuilds(list);
        setEvents([]);
      }
    } catch (err) {
      setError(apiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await hunterNet.createGuild({
        ...newGuild,
        treasuryValue: Number(newGuild.treasuryValue),
      });
      setMsg('Guild created successfully!');
      window.location.reload();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleApply = async (guildId) => {
    setError(''); setMsg('');
    try {
      await hunterNet.applyToGuild(guildId);
      setMsg('Application submitted successfully! Waiting for Guild Leader approval.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleApprove = async (appId) => {
    setError(''); setMsg('');
    try {
      await hunterNet.approveApp(appId);
      setMsg('Application approved! New member added.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleReject = async (appId) => {
    setError(''); setMsg('');
    try {
      await hunterNet.rejectApp(appId);
      setMsg('Application rejected.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleRoleChange = async (memberId, role) => {
    setError(''); setMsg('');
    try {
      await hunterNet.updateRole(memberId, role);
      setMsg('Member role updated.');
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
      setMsg('Left guild.');
      window.location.reload();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const announce = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await hunterNet.createTimeline({ title, description, eventType: 'ANNOUNCEMENT' });
      setTitle(''); setDescription('');
      setMsg('Announcement posted.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const userLevel = ROLE_HIERARCHY[user?.role] || 0;

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user.name}</strong>. Rank: <strong>{user.hunterRank}</strong> | Role: <strong>{user.role}</strong> | Guild tokens: <strong>{user.guildTokens ?? 0} GT</strong></p>

      {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {guild ? (
        <section>
          <h2>{guild.name}</h2>
          <p>{guild.description}</p>
          <p>
            Level {guild.guildLevel} · Treasury {guild.treasuryValue} GT · Members: <strong>{guild.memberCount} / {guild.maxMembers || 10}</strong> (Max Capacity)
          </p>
          <button type="button" onClick={handleLeaveGuild}>Leave Guild</button>

          {/* Leader Section: Applications */}
          {user.role === 'Guild Leader' && (
            <section style={{ marginTop: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
              <h3>Pending Guild Applications ({applications.length})</h3>
              {guild.memberCount >= (guild.maxMembers || 10) && (
                <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                  ⚠️ Guild is currently at maximum member capacity ({guild.maxMembers || 10}). You must kick a member before approving new applicants.
                </p>
              )}
              {applications.length ? (
                <ul>
                  {applications.map((app) => (
                    <li key={app._id} style={{ marginBottom: '10px' }}>
                      <strong>{app.applicant?.name}</strong> (Rank: {app.applicant?.hunterRank}, Email: {app.applicant?.email})
                      {' '}
                      <button onClick={() => handleApprove(app._id)} disabled={guild.memberCount >= (guild.maxMembers || 10)}>
                        Approve
                      </button>
                      {' '}
                      <button onClick={() => handleReject(app._id)}>Reject</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No pending applications.</p>
              )}
            </section>
          )}

          {/* Roster Section */}
          <section style={{ marginTop: '20px', padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
            <h3>Guild Roster ({roster.length} members)</h3>
            {roster.length ? (
              <ul>
                {roster.map((m) => {
                  const targetLevel = ROLE_HIERARCHY[m.role] || 0;
                  const canKick = m._id !== user._id && userLevel > targetLevel;

                  return (
                    <li key={m._id} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>
                        <strong>{m.name}</strong> [{m.hunterRank}] - <em>{m.role}</em>
                      </span>

                      {/* Leader Role Change */}
                      {user.role === 'Guild Leader' && m._id !== user._id && (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m._id, e.target.value)}
                        >
                          <option value="Hunter">Hunter</option>
                          <option value="Vice Leader">Vice Leader</option>
                          <option value="Analyzer">Analyzer</option>
                          <option value="Team Leader">Team Leader</option>
                        </select>
                      )}

                      {/* Hierarchy Member Kick Button */}
                      {canKick && (
                        <button
                          style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', fontSize: '0.85rem' }}
                          onClick={() => handleKickMember(m._id, m.name)}
                        >
                          Kick Member
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No roster data.</p>
            )}
          </section>

          {/* Post Announcement */}
          {can(user.role, 'createAnnouncement') && (
            <section style={{ marginTop: '20px' }}>
              <h3>Post Announcement</h3>
              <form onSubmit={announce}>
                <label>Title <input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
                <label>Description <textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
                <button>Publish</button>
              </form>
            </section>
          )}

          {/* Activity Feed */}
          <section style={{ marginTop: '20px' }}>
            <h3>Recent Guild Activity</h3>
            {events.length ? (
              events.map((ev) => <TimelineCard key={ev._id} event={ev} />)
            ) : (
              <p>No activity recorded.</p>
            )}
          </section>
        </section>
      ) : (
        /* Guildless User View */
        <section>
          <h2>You belong to no guild</h2>
          <p>Create your own guild to become a Guild Leader, or browse available guilds to submit an application.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {/* Create Guild */}
            <section style={{ padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
              <h3>Create a Guild</h3>
              <form onSubmit={handleCreateGuild}>
                <label>Guild Name <input value={newGuild.name} onChange={(e) => setNewGuild({ ...newGuild, name: e.target.value })} required /></label>
                <label>Description <textarea value={newGuild.description} onChange={(e) => setNewGuild({ ...newGuild, description: e.target.value })} /></label>
                <label>Initial Treasury (GT) <input type="number" min="0" value={newGuild.treasuryValue} onChange={(e) => setNewGuild({ ...newGuild, treasuryValue: e.target.value })} /></label>
                <button style={{ marginTop: '10px' }}>Create Guild</button>
              </form>
            </section>

            {/* Browse & Apply */}
            <section style={{ padding: '15px', border: '1px solid #333', borderRadius: '8px' }}>
              <h3>Browse Guilds</h3>
              {allGuilds.length ? (
                <ul>
                  {allGuilds.map((g) => (
                    <li key={g._id} style={{ marginBottom: '15px' }}>
                      <strong>{g.name}</strong> (Leader: {g.guildLeader?.name || 'N/A'}, Members: {g.memberCount} / {g.maxMembers || 10})
                      <br />
                      <small>{g.description}</small>
                      <br />
                      <button style={{ marginTop: '5px' }} onClick={() => handleApply(g._id)} disabled={g.memberCount >= (g.maxMembers || 10)}>
                        {g.memberCount >= (g.maxMembers || 10) ? 'Guild Full' : 'Apply to Join'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No guilds established yet. Be the first to create one!</p>
              )}
            </section>
          </div>
        </section>
      )}
    </section>
  );
}
