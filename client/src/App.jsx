import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GuildDetails from './pages/GuildDetails';
import GuildDirectory from './pages/GuildDirectory';
import CreateGuild from './pages/CreateGuild';
import Marketplace from './pages/Marketplace';
import AuctionDetails from './pages/AuctionDetails';
import Treasury from './pages/Treasury';
import Timeline from './pages/Timeline';
import GuildChat from './pages/GuildChat';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guild" element={<GuildDetails />} />
            <Route path="/guilds" element={<GuildDirectory />} />
            <Route path="/guilds/create" element={<CreateGuild />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/auctions/:id" element={<AuctionDetails />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/chat" element={<GuildChat />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
