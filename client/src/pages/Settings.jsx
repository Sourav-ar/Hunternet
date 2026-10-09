import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [themeMode] = useState('Dark (HunterNet Modern)');
  const [notifications, setNotifications] = useState({ guildAnnouncements: true, auctionAlerts: true, chatMentions: true });
  const [msg, setMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setMsg('Settings saved successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <section style={{ maxWidth: '700px' }}>
      <h1>⚙️ Account & Display Settings</h1>
      <p>Manage your account preferences, theme, and notification channels.</p>

      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginTop: '20px' }}>
        <form onSubmit={handleSave}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>User Profile Overview</h2>
          <dl style={{ margin: '12px 0 24px' }}>
            <div>
              <dt>Name</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Hunter Rank</dt>
              <dd style={{ color: '#7C5CFF', fontWeight: '800' }}>{user?.hunterRank}</dd>
            </div>
          </dl>

          <h2 style={{ fontSize: '1.2rem', marginTop: '20px' }}>Display Theme</h2>
          <label>
            Active Theme
            <input value={themeMode} disabled style={{ opacity: 0.8 }} />
          </label>

          <h2 style={{ fontSize: '1.2rem', marginTop: '24px' }}>Notification Preferences</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '12px 0 24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications.guildAnnouncements}
                onChange={(e) => setNotifications({ ...notifications, guildAnnouncements: e.target.checked })}
              />
              Guild Timeline Announcements
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications.auctionAlerts}
                onChange={(e) => setNotifications({ ...notifications, auctionAlerts: e.target.checked })}
              />
              Marketplace Outbid & Auction Notifications
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'none', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications.chatMentions}
                onChange={(e) => setNotifications({ ...notifications, chatMentions: e.target.checked })}
              />
              Guild Chat Mentions
            </label>
          </div>

          <button style={{ alignSelf: 'flex-start' }}>Save Settings</button>
        </form>
      </div>
    </section>
  );
}
