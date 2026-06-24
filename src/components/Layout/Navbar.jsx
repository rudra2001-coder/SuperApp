import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

const navItems = [
  { path: '/data-processor', label: 'Data Processor', icon: '📄' },
  { path: '/network-tools', label: 'Network Tools', icon: '🌐' },
  { path: '/utilities', label: 'Utilities', icon: '🧰' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
      gap: 16,
    },
    logo: {
      fontSize: 20,
      fontWeight: 700,
      color: 'var(--accent)',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    },
    nav: {
      display: 'flex',
      gap: 4,
    },
    link: {
      padding: '8px 16px',
      borderRadius: 'var(--radius)',
      textDecoration: 'none',
      color: 'var(--text-secondary)',
      fontSize: 14,
      fontWeight: 500,
      transition: 'all 0.2s',
    },
    linkActive: {
      background: 'var(--accent)',
      color: '#fff',
    },
    toggleBtn: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: 16,
      whiteSpace: 'nowrap',
    },
  };

  return (
    <nav style={styles.navbar}>
      <NavLink to="/" style={styles.logo}>⚡ SuperApp</NavLink>
      <div style={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </div>
      <button style={styles.toggleBtn} onClick={toggleTheme}>
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </nav>
  );
}
