import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hunterNet } from '../services/hunternetApi';
import ItemCard from '../components/ItemCard';
import { apiError, can } from '../utils/permissions';

const blankItem = { name: '', category: 'Weapon', grade: 'E', description: '', estimatedValue: 0, imageUrl: '' };

export default function Treasury() {
  const { user } = useAuth();
  const [guild, setGuild] = useState(null);
  const [items, setItems] = useState([]);
  const [item, setItem] = useState(blankItem);
  const [appraisalValues, setAppraisalValues] = useState({});
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      hunterNet.myGuild().catch(() => null),
      hunterNet.items().catch(() => []),
    ])
      .then(([activeGuild, inventory]) => {
        setGuild(activeGuild);
        setItems(inventory);
      })
      .catch((err) => setError(apiError(err)));
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async (event) => {
    event.preventDefault();
    setError(''); setMsg('');
    try {
      await hunterNet.createItem({ ...item, estimatedValue: Number(item.estimatedValue) });
      setItem(blankItem);
      setMsg('Item registered successfully. Status: Pending Appraisal.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleAppraise = async (id) => {
    setError(''); setMsg('');
    const val = Number(appraisalValues[id]);
    if (val === undefined || isNaN(val) || val < 0) {
      setError('Please provide a valid non-negative estimated value for appraisal.');
      return;
    }
    try {
      await hunterNet.updateItemStatus(id, { status: 'Analyzed', estimatedValue: val });
      setMsg('Item appraised and marked as Analyzed.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleApprove = async (id) => {
    setError(''); setMsg('');
    try {
      await hunterNet.updateItemStatus(id, { status: 'Approved' });
      setMsg('Item approved for marketplace auction.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item from inventory?')) return;
    setError(''); setMsg('');
    try {
      await hunterNet.deleteItem(id);
      setMsg('Item deleted.');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <section>
      <h1>Guild Treasury & Inventory</h1>
      {guild ? (
        <p>Guild: <strong>{guild.name}</strong> | Treasury Balance: <strong>{guild.treasuryValue} GT</strong></p>
      ) : (
        <p>You must belong to a guild to view inventory.</p>
      )}

      {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}
      {msg && <p style={{ color: '#10b981' }}>{msg}</p>}

      {/* Register Item */}
      <section style={{ marginTop: '20px' }}>
        <h2>Register Item for Treasury Appraisal</h2>
        <form onSubmit={addItem}>
          <label>Name <input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} required /></label>
          <label>Category
            <select value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })}>
              {['Weapon', 'Armor', 'Accessory', 'Mana Crystal', 'Artifact'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>Grade
            <select value={item.grade} onChange={(e) => setItem({ ...item, grade: e.target.value })}>
              {['E', 'D', 'C', 'B', 'A', 'S', 'National'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>Description <textarea value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} required /></label>
          <label>Initial Estimated Value (GT) <input type="number" min="0" value={item.estimatedValue} onChange={(e) => setItem({ ...item, estimatedValue: e.target.value })} /></label>
          <label>Image URL <input type="url" value={item.imageUrl} onChange={(e) => setItem({ ...item, imageUrl: e.target.value })} /></label>
          <button style={{ marginTop: '10px' }}>Register Item</button>
        </form>
      </section>

      {/* Inventory List */}
      <section style={{ marginTop: '30px' }}>
        <h2>Guild Inventory ({items.length} items)</h2>
        {items.length ? (
          items.map((entry) => (
            <div key={entry._id} style={{ border: '1px solid #333', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <ItemCard item={entry}>
                {/* Appraisal Controls for Analyzers / Officers */}
                {can(user?.role, 'appraiseItem') && entry.status === 'Pending' && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#1e293b', borderRadius: '6px' }}>
                    <strong>Analyzer Appraisal:</strong>
                    <br />
                    <label>
                      Appraised Value (GT):{' '}
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 5000"
                        value={appraisalValues[entry._id] ?? entry.estimatedValue ?? ''}
                        onChange={(e) => setAppraisalValues({ ...appraisalValues, [entry._id]: e.target.value })}
                        style={{ width: '120px', marginLeft: '5px' }}
                      />
                    </label>
                    <button style={{ marginLeft: '10px' }} onClick={() => handleAppraise(entry._id)}>
                      Appraise & Mark Analyzed
                    </button>
                  </div>
                )}

                {/* Approval Controls for Leader / Vice Leader */}
                {can(user?.role, 'approveItem') && entry.status === 'Analyzed' && (
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => handleApprove(entry._id)}>
                      Approve Item for Marketplace Auction
                    </button>
                  </div>
                )}

                {/* Deletion */}
                {(user?.role === 'Guild Leader' || entry.owner?._id === user?._id) && (
                  <div style={{ marginTop: '10px' }}>
                    <button style={{ background: '#dc2626', color: '#fff' }} onClick={() => remove(entry._id)}>
                      Delete Item
                    </button>
                  </div>
                )}
              </ItemCard>
            </div>
          ))
        ) : (
          <p>No items registered in guild inventory.</p>
        )}
      </section>
    </section>
  );
}
