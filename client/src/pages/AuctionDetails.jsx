import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import { apiError, can } from '../utils/permissions';

export default function AuctionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setError('');
    hunterNet.auctions()
      .then((list) => {
        const found = list.find((a) => a._id === id);
        if (found) setAuction(found);
        else setError('Auction not found or has ended.');
      })
      .catch((err) => setError(apiError(err)));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    const val = Number(bidAmount);
    if (!val || val <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }
    try {
      const res = await hunterNet.placeBid(id, { amount: val });
      setBidAmount('');
      setMsg(res.message || 'Bid placed successfully!');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleBuyout = async () => {
    if (!auction?.buyoutPrice) return;
    if (!window.confirm(`Buy out item immediately for ${auction.buyoutPrice} GT?`)) return;
    setError(''); setMsg('');
    try {
      const res = await hunterNet.placeBid(id, { amount: auction.buyoutPrice });
      setMsg(res.message || 'Instant buyout successful!');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleCloseAuction = async (action) => {
    setError(''); setMsg('');
    try {
      await hunterNet[action](id);
      setMsg(action === 'endAuction' ? 'Auction ended & settled.' : 'Auction cancelled.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  if (error) {
    return (
      <section>
        <button type="button" onClick={() => navigate('/marketplace')} style={{ marginBottom: '20px' }}>
          ← Back to Marketplace
        </button>
        <p role="alert">{error}</p>
      </section>
    );
  }

  if (!auction) {
    return <section><p>Loading auction details…</p></section>;
  }

  const isSeller = auction.seller?._id === user?._id;

  return (
    <section style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button type="button" onClick={() => navigate('/marketplace')} style={{ marginBottom: '20px' }}>
        ← Back to Marketplace
      </button>

      {error && <p role="alert">{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>🗡️ {auction.item?.name || 'Auction Item'}</h1>
            <p style={{ marginTop: '4px' }}>Category: {auction.item?.category} &bull; Grade: {auction.item?.grade}</p>
          </div>
          <span className="badge" style={{
            background: auction.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: auction.status === 'Active' ? '#22C55E' : '#EF4444',
            border: `1px solid ${auction.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            padding: '6px 14px',
            fontSize: '0.85rem'
          }}>
            Status: {auction.status}
          </span>
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>{auction.item?.description}</p>

        <dl>
          <div>
            <dt>Seller</dt>
            <dd>{auction.seller?.name || 'Unknown'}</dd>
          </div>
          <div>
            <dt>Current Highest Bid</dt>
            <dd style={{ color: '#7C5CFF', fontWeight: '800', fontSize: '1.25rem' }}>{auction.currentBid} GT</dd>
          </div>
          <div>
            <dt>Highest Bidder</dt>
            <dd>{auction.highestBidder?.name || 'No bids yet'}</dd>
          </div>
          <div>
            <dt>Instant Buyout Price</dt>
            <dd style={{ color: '#22C55E', fontWeight: '800', fontSize: '1.25rem' }}>
              {auction.buyoutPrice ? `${auction.buyoutPrice} GT` : 'Not Set'}
            </dd>
          </div>
          <div>
            <dt>Closing Time</dt>
            <dd>{new Date(auction.endTime).toLocaleString()}</dd>
          </div>
        </dl>

        {/* Bidding Actions for Active Auction */}
        {auction.status === 'Active' && !isSeller && (
          <div style={{ marginTop: '28px', padding: '20px', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <h3>Place Your Bid</h3>
            <form onSubmit={handlePlaceBid} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
              <input
                type="number"
                min={auction.currentBid + 1}
                placeholder={`Min bid: ${auction.currentBid + 1} GT`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit">Place Bid</button>

              {auction.buyoutPrice > 0 && (
                <button type="button" onClick={handleBuyout} style={{ background: 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)' }}>
                  ⚡ Buyout ({auction.buyoutPrice} GT)
                </button>
              )}
            </form>
          </div>
        )}

        {/* Admin / Seller Controls */}
        {auction.status === 'Active' && (isSeller || ['Guild Leader', 'Vice Leader'].includes(user?.role)) && (
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => handleCloseAuction('endAuction')}>
              End Auction & Transfer Item
            </button>
            {can(user?.role, 'cancelAuction') && (
              <button type="button" onClick={() => handleCloseAuction('cancelAuction')} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                Cancel Auction
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
