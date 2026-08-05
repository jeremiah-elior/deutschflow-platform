import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, FileText, Gauge, Globe2, GraduationCap, Layers3, Library, ListChecks, LogOut, MessageSquareText, Settings, ShieldCheck, Tags, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const items = [
  { to: '/admin', label: 'Dashboard', icon: Gauge },
  { to: '/admin/languages', label: 'Languages', icon: Globe2 },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { to: '/admin/chapters', label: 'Chapters', icon: Layers3 },
  { to: '/admin/vocabulary', label: 'Vocabulary', icon: Tags },
  { to: '/admin/notes', label: 'Notes', icon: MessageSquareText },
  { to: '/admin/videos', label: 'Videos', icon: Video },
  { to: '/admin/quiz', label: 'Quiz', icon: ListChecks },
  { to: '/admin/taxonomy', label: 'Categories', icon: FileText },
  { to: '/admin/lid', label: 'LiD Test', icon: ShieldCheck },
  { to: '/admin/media', label: 'Media Library', icon: Library },
  { to: '/admin/settings', label: 'App Config', icon: Settings }
];

export function Layout() {
  const { signOut, session } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/admin" className="brand">
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
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebarFooter">
          <Link to="/" className="adminSiteLink">View public website</Link>
          <small>{session?.email}</small>
          <button className="ghostButton" onClick={() => signOut()}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
