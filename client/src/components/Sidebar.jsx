import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const isLeader = user?.role === 'Guild Leader';

  return (
    <aside className="site-sidebar">
      <nav aria-label="Guild navigation">
        <ul>
          <li>
            <NavLink to="/dashboard">📊 Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/guild">🏰 My Guild</NavLink>
          </li>
          <li>
            <NavLink to="/guilds">🌐 Guild Directory</NavLink>
          </li>
          <li>
            <NavLink to="/treasury">🏦 Treasury</NavLink>
          </li>
          <li>
            <NavLink to="/marketplace">⚔️ Marketplace</NavLink>
          </li>
          <li>
            <NavLink to="/timeline">📜 Timeline</NavLink>
          </li>
          <li>
            <NavLink to="/chat">💬 Guild Chat</NavLink>
          </li>
          {isLeader && (
            <li>
              <NavLink to="/applications">📥 Applications</NavLink>
            </li>
          )}
          <li>
            <NavLink to="/profile">👤 Profile</NavLink>
          </li>
          <li>
            <NavLink to="/settings">⚙️ Settings</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
