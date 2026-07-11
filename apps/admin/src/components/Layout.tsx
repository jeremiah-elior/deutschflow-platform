import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Gauge, Globe2, GraduationCap, Library, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const items = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/languages', label: 'Languages', icon: Globe2 },
  { to: '/courses', label: 'Courses', icon: GraduationCap },
  { to: '/lid', label: 'LiD Test', icon: ShieldCheck },
  { to: '/media', label: 'Media Library', icon: Library },
  { to: '/settings', label: 'App Config', icon: Settings }
];

export function Layout() {
  const { signOut, session } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brandIcon"><BookOpen size={22} /></span>
          <span>
            <strong>DeutschFlow</strong>
            <small>Admin Platform</small>
          </span>
        </Link>
        <nav className="nav">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebarFooter">
          <small>{session?.user.email}</small>
          <button className="ghostButton" onClick={() => signOut()}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
