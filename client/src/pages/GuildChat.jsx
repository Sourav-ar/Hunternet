import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import MessageCard from '../components/MessageCard';
import { apiError, can } from '../utils/permissions';

export default function GuildChat() {
  const { user } = useAuth();
  const channels = ['General', 'Raid', ...(can(user.role, 'officerChat') ? ['Officer'] : [])];
  const [channel, setChannel] = useState('General');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = (selected = channel) => hunterNet.messages(selected).then(setMessages).catch((err) => setError(apiError(err)));
  useEffect(() => { load(); }, [channel]);

  const send = async (event) => {
    event.preventDefault();
    try {
      await hunterNet.sendMessage({ channel, message });
      setMessage('');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <section>
      <h1>💬 Guild Chat</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {channels.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              style={{
                background: channel === ch ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--bg-card)',
                color: channel === ch ? '#FFF' : 'var(--text-secondary)',
                border: channel === ch ? 'none' : '1px solid var(--border)',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: '700',
              }}
            >
              #{ch}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => load()}>🔄 Refresh</button>
      </div>

      {error && <p role="alert">{error}</p>}

      {/* Messages Stream Container */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '24px',
        minHeight: '380px',
        maxHeight: '520px',
        overflowY: 'auto',
        marginBottom: '20px'
      }} aria-live="polite">
        {messages.length ? (
          messages.map((entry) => <MessageCard key={entry._id} message={entry} />)
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>No messages in #{channel} channel yet. Be the first to start the conversation!</p>
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={send} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Send message to #${channel}...`}
            style={{ minHeight: '60px', marginBottom: 0 }}
            required
          />
        </div>
        <button style={{ height: '54px', padding: '0 28px' }}>Send 🚀</button>
      </form>
    </section>
  );
}
