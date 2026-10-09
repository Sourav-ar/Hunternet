import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import TimelineCard from '../components/TimelineCard';
import { apiError, can } from '../utils/permissions';

export default function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setError('');
    hunterNet.timeline({ limit: 30 })
      .then(setEvents)
      .catch((err) => setError(apiError(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const announce = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await hunterNet.createTimeline({ title, description, eventType: 'ANNOUNCEMENT' });
      setTitle(''); setDescription('');
      setMsg('Announcement posted to guild timeline.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const filteredEvents = filterType === 'ALL'
    ? events
    : events.filter((e) => e.eventType === filterType);

  const eventTypes = ['ALL', 'ANNOUNCEMENT', 'ITEM_REGISTRATION', 'AUCTION_CREATED', 'BID_PLACED', 'AUCTION_ENDED'];

  return (
    <section>
      <h1>📜 Guild Timeline & Audit Log</h1>
      <p>Chronological activity log across all guild operations.</p>

      {error && <p role="alert">{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {/* Post Announcement Form for Authorized Officers */}
      {can(user?.role, 'createAnnouncement') && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '28px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.2rem' }}>📢 Publish Officer Announcement</h2>
          <form onSubmit={announce}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Raid Squad Assembly..." required />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Announcement details..." style={{ minHeight: '70px' }} />
            </label>
            <button style={{ alignSelf: 'flex-start' }}>Publish Announcement</button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {eventTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            style={{
              background: filterType === type ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--bg-card)',
              color: filterType === type ? '#FFF' : 'var(--text-secondary)',
              border: filterType === type ? 'none' : '1px solid var(--border)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div>
        {filteredEvents.length ? (
          filteredEvents.map((ev) => <TimelineCard key={ev._id} event={ev} />)
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <p>No activity events found for the selected filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
