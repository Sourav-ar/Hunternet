import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { apiError } from '../utils/permissions';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((response) => setProfile(response.data.data)).catch((err) => setError(apiError(err)));
  }, []);

  if (error) return <section><h1>Profile</h1><p role="alert">{error}</p></section>;
  if (!profile) return <section><h1>Profile</h1><p>Loading profile…</p></section>;

  return (
    <section>
      <h1>👤 Hunter Profile</h1>
      <p>Your official Hunter License and Guild Credentials.</p>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '32px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: '800',
            color: '#FFF'
          }}>
            {profile.name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{profile.name}</h2>
            <span className="badge" style={{ background: 'rgba(124, 92, 255, 0.15)', color: '#7C5CFF', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
              Rank {profile.hunterRank} Hunter
            </span>
          </div>
        </div>

        <dl>
          <div>
            <dt>Email Address</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Guild Role</dt>
            <dd>{profile.role}</dd>
          </div>
          <div>
            <dt>Hunter Rank</dt>
            <dd style={{ color: '#7C5CFF', fontWeight: '800' }}>{profile.hunterRank}</dd>
          </div>
          <div>
            <dt>Guild Tokens Balance</dt>
            <dd style={{ color: '#22C55E', fontWeight: '800' }}>{profile.guildTokens} GT</dd>
          </div>
          <div>
            <dt>Guild Contribution</dt>
            <dd>{profile.contribution}</dd>
          </div>
          <div>
            <dt>Registered Date</dt>
            <dd>{new Date(profile.joinedAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
