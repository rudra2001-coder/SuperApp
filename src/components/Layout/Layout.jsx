import { useEffect, useState, Component } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSupabase } from '../../context/SupabaseContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: 'var(--text-h)', margin: '0 0 8px', fontSize: 22 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px', fontSize: 14, maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SupabaseBanner() {
  const { configured, loading, session } = useSupabase();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('supabase-banner-dismissed') === 'true');

  if (loading || dismissed || configured) return null;

  return (
    <div style={{
      background: 'var(--warning)', color: '#212529', padding: '10px 24px',
      fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      borderBottom: '1px solid rgba(0,0,0,0.1)',
    }}>
      <span>⚠️ Supabase is not connected. History and realtime features will fall back to localStorage. Add your Supabase URL and anon key in <code style={{ background: 'rgba(0,0,0,0.08)', padding: '2px 6px', borderRadius: 4 }}>.env</code> to enable cloud sync.</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => window.location.reload()} style={{
          padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)',
          background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>🔄 Retry</button>
        <button onClick={() => { setDismissed(true); sessionStorage.setItem('supabase-banner-dismissed', 'true'); }} style={{
          padding: '6px 14px', borderRadius: 'var(--radius)', border: 'none',
          background: 'transparent', cursor: 'pointer', fontSize: 16, opacity: 0.7,
        }}>✕</button>
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        className="mobile-sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 100,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: '8px',
          cursor: 'pointer',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ☰
      </button>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
        />
      )}
      <Navbar />
      <SupabaseBanner />
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
