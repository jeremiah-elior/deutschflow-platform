import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { siteConfig } from './siteConfig';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/support', label: 'Support' }
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="publicSite">
      <header className="publicHeader">
        <div className="publicContainer publicHeaderInner">
          <Link to="/" className="publicBrand" aria-label="DeutschFlow home">
            <img src="/deutschflow-logo.png" alt="" />
            <span>DeutschFlow</span>
          </Link>

          <nav className="publicNav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
            ))}
            <Link className="navCta" to="/support">Get help</Link>
          </nav>

          <button className="mobileMenuButton" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open ? (
          <nav className="mobileNav publicContainer" aria-label="Mobile navigation">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>)}
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/delete-account">Delete account</Link>
          </nav>
        ) : null}
      </header>

      <main className="publicMain"><Outlet /></main>

      <footer className="publicFooter">
        <div className="publicContainer footerGrid">
          <div className="footerBrandBlock">
            <Link to="/" className="publicBrand footerBrand">
              <img src="/deutschflow-logo.png" alt="" />
              <span>DeutschFlow</span>
            </Link>
            <p>German learning made clearer with structured lessons, multilingual explanations and Leben in Deutschland Test preparation.</p>
          </div>
          <div>
            <strong>DeutschFlow</strong>
            <Link to="/about">About</Link>
            <Link to="/support">Support</Link>
            <a href={`mailto:${siteConfig.supportEmail}`}>Contact</a>
          </div>
          <div>
            <strong>Legal</strong>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/delete-account">Delete Account</Link>
            <Link to="/impressum">Impressum</Link>
          </div>
        </div>
        <div className="publicContainer footerBottom">
          <span>© {new Date().getFullYear()} DeutschFlow. All rights reserved.</span>
          <Link to="/admin/login" className="adminFooterLink">Admin</Link>
        </div>
      </footer>
    </div>
  );
}
