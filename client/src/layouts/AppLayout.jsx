import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-container">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
