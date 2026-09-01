import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
