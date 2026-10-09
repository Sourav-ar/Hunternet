import { useEffect, useState } from 'react';
import { hunterNet } from '../services/hunternetApi';
import { apiError } from '../utils/permissions';

export default function Applications() {
  const [guild, setGuild] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setError('');
    try {
      const activeGuild = await hunterNet.myGuild();
      setGuild(activeGuild);
      if (activeGuild) {
        const apps = await hunterNet.applications().catch(() => []);
        setApplications(apps);
      }
    } catch (err) {
      setError(apiError(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const isFull = guild && guild.memberCount >= (guild.maxMembers || 10);

  return (
    <section>
      <h1>📥 Guild Membership Applications</h1>
      <p>Review pending applications to join your guild.</p>

      {error && <p role="alert">{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {guild && (
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Guild Capacity:</strong> {guild.memberCount} / {guild.maxMembers || 10} Members
          </div>
          {isFull && (
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠️ Guild Full - Kick a member to approve new applicants
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {applications.length ? (
          applications.map((app) => (
            <div key={app._id} style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>👤 {app.applicant?.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Email: {app.applicant?.email} &bull; Applied: {new Date(app.createdAt).toLocaleDateString()}
                </p>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(124, 92, 255, 0.15)', color: '#7C5CFF', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                    Rank {app.applicant?.hunterRank} Hunter
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleApprove(app._id)}
                  disabled={isFull}
                  style={{ background: isFull ? 'var(--bg-surface)' : 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)' }}
                >
                  Approve Applicant
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(app._id)}
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <p>No pending guild applications.</p>
          </div>
        )}
      </div>
    </section>
  );
}
