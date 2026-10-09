import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import AuctionCard from '../components/AuctionCard';
import { apiError, can } from '../utils/permissions';

export default function Marketplace() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [listing, setListing] = useState({ itemId: '', startingBid: '', buyoutPrice: '', durationHours: 24 });
  const [amounts, setAmounts] = useState({});
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      hunterNet.auctions().catch(() => []),
      hunterNet.items({ status: 'Approved' }).catch(() => []),
    ])
      .then(([active, approved]) => {
        setAuctions(active);
        setApprovedItems(approved);
      })
      .catch((err) => setError(apiError(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const list = async (event) => {
    event.preventDefault();
    setError(''); setMsg('');
    try {
      await hunterNet.createAuction({
        ...listing,
        startingBid: Number(listing.startingBid),
        buyoutPrice: listing.buyoutPrice ? Number(listing.buyoutPrice) : undefined,
        durationHours: Number(listing.durationHours),
      });
      setListing({ itemId: '', startingBid: '', buyoutPrice: '', durationHours: 24 });
      setMsg('Auction created and listed on marketplace!');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const bid = async (id) => {
    setError(''); setMsg('');
    const amountVal = Number(amounts[id]);
    if (!amountVal || amountVal <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }
    try {
      const res = await hunterNet.placeBid(id, { amount: amountVal });
      setAmounts({ ...amounts, [id]: '' });
      setMsg(res.message || 'Bid placed successfully!');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const buyoutNow = async (auction) => {
    if (!window.confirm(`Buy out item immediately for ${auction.buyoutPrice} GT?`)) return;
    setError(''); setMsg('');
    try {
      const res = await hunterNet.placeBid(auction._id, { amount: auction.buyoutPrice });
      setMsg(res.message || 'Buyout completed! Item purchased.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const close = async (id, action) => {
    setError(''); setMsg('');
    try {
      await hunterNet[action](id);
      setMsg(action === 'endAuction' ? 'Auction closed.' : 'Auction cancelled.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <section>
      <h1>Guild Marketplace & Auction House</h1>
      <p>Your Balance: <strong>{user?.guildTokens ?? 0} Guild Tokens</strong></p>

      {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {/* Create Auction */}
      <section style={{ marginTop: '20px' }}>
        <h2>List Approved Item for Auction</h2>
        <form onSubmit={list}>
          <label>Select Approved Item
            <select value={listing.itemId} onChange={(e) => setListing({ ...listing, itemId: e.target.value })} required>
              <option value="">-- Choose an item --</option>
              {approvedItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Grade: {item.grade}, Appraised: {item.estimatedValue} GT)
                </option>
              ))}
            </select>
          </label>
          <label>Starting Bid (GT) <input type="number" min="1" value={listing.startingBid} onChange={(e) => setListing({ ...listing, startingBid: e.target.value })} required /></label>
          <label>Optional Buyout Price (GT) <input type="number" min="0" value={listing.buyoutPrice} onChange={(e) => setListing({ ...listing, buyoutPrice: e.target.value })} placeholder="Instant buy price" /></label>
          <label>Duration (Hours) <input type="number" min="1" value={listing.durationHours} onChange={(e) => setListing({ ...listing, durationHours: e.target.value })} required /></label>
          <button style={{ marginTop: '10px' }}>List Auction</button>
        </form>
      </section>

      {/* Active Auctions List */}
      <section style={{ marginTop: '30px' }}>
        <h2>Active Guild Auctions ({auctions.length})</h2>
        {auctions.length ? (
          auctions.map((auction) => (
            <div key={auction._id} style={{ border: '1px solid #333', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <AuctionCard auction={auction}>
                {/* Bidding Controls for Active Auctions */}
                {auction.status === 'Active' && auction.seller?._id !== user?._id && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#1e293b', borderRadius: '6px' }}>
                    <label>
                      Place Bid (Current: {auction.currentBid} GT):{' '}
                      <input
                        type="number"
                        min={auction.currentBid + 1}
                        placeholder={`Min: ${auction.currentBid + 1}`}
                        value={amounts[auction._id] || ''}
                        onChange={(e) => setAmounts({ ...amounts, [auction._id]: e.target.value })}
                        style={{ width: '120px', marginLeft: '5px' }}
                      />
                    </label>
                    <button style={{ marginLeft: '10px' }} onClick={() => bid(auction._id)}>
                      Place Bid
                    </button>

                    {/* Instant Buyout Button */}
                    {auction.buyoutPrice > 0 && (
                      <button
                        style={{ marginLeft: '10px', background: '#10b981', color: '#fff' }}
                        onClick={() => buyoutNow(auction)}
                      >
                        ⚡ Buy It Now ({auction.buyoutPrice} GT)
                      </button>
                    )}
                  </div>
                )}

                {/* Seller or Officer Ending Controls */}
                {auction.status === 'Active' && (auction.seller?._id === user?._id || ['Guild Leader', 'Vice Leader'].includes(user?.role)) && (
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => close(auction._id, 'endAuction')}>
                      End Auction & Settle Winner
                    </button>
                    {can(user?.role, 'cancelAuction') && (
                      <button style={{ marginLeft: '10px', background: '#dc2626', color: '#fff' }} onClick={() => close(auction._id, 'cancelAuction')}>
                        Cancel Auction
                      </button>
                    )}
                  </div>
                )}
              </AuctionCard>
            </div>
          ))
        ) : (
          <p>No active marketplace auctions.</p>
        )}
      </section>
    </section>
  );
}
