import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="site-navbar">
      <nav aria-label="Primary navigation">
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          ⚡ HunterNet
        </Link>
      </nav>
      {user && (
        <div className="nav-user-meta">
          <span className="nav-user-tag">
            Signed in as <strong>{user.name}</strong> [{user.hunterRank}] &bull; <em>{user.role}</em>
          </span>
          <button type="button" onClick={signOut}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
