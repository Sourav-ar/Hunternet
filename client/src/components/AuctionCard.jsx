export default function AuctionCard({ auction, children }) {
  return (
    <article className="auction-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3>🗡️ {auction.item?.name || 'Auction Item'}</h3>
        <span className="badge" style={{
          background: auction.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: auction.status === 'Active' ? '#22C55E' : '#EF4444',
          border: `1px solid ${auction.status === 'Active' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {auction.status}
        </span>
      </div>

      <dl>
        <div>
          <dt>Seller</dt>
          <dd>{auction.seller?.name || 'Unknown'}</dd>
        </div>
        <div>
          <dt>Current Bid</dt>
          <dd style={{ color: '#7C5CFF', fontWeight: '800' }}>{auction.currentBid} GT</dd>
        </div>
        <div>
          <dt>Instant Buyout</dt>
          <dd style={{ color: '#22C55E', fontWeight: '800' }}>{auction.buyoutPrice ? `${auction.buyoutPrice} GT` : 'Not Set'}</dd>
        </div>
        <div>
          <dt>Closing Time</dt>
          <dd>{new Date(auction.endTime).toLocaleString()}</dd>
        </div>
      </dl>

      {children}
    </article>
  );
}
