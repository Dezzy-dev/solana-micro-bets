import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletContextProvider } from './components/WalletContextProvider';
import { LandingPage } from './pages/LandingPage';
import { Game } from './pages/game';
import { PlaceBet } from './pages/PlaceBet';
import { AdminResolve } from './pages/AdminResolve';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/legacy" element={
            <div style={styles.app}>
              <nav style={styles.nav}>
                <div style={styles.navContent}>
                  <Link to="/" style={styles.logo}>
                    PDA Escrow
                  </Link>
                  <div style={styles.navLinks}>
                    <Link to="/legacy" style={styles.navLink}>
                      Place Bet
                    </Link>
                    <Link to="/admin-resolve" style={styles.navLink}>
                      Resolve
                    </Link>
                  </div>
                </div>
              </nav>
              <PlaceBet />
            </div>
          } />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-resolve" element={
            <div style={styles.app}>
              <nav style={styles.nav}>
                <div style={styles.navContent}>
                  <Link to="/" style={styles.logo}>
                    PDA Escrow
                  </Link>
                  <div style={styles.navLinks}>
                    <Link to="/legacy" style={styles.navLink}>
                      Place Bet
                    </Link>
                    <Link to="/admin-resolve" style={styles.navLink}>
                      Resolve
                    </Link>
                  </div>
                </div>
              </nav>
              <AdminResolve />
            </div>
          } />
        </Routes>
      </Router>
    </WalletContextProvider>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
  },
  nav: {
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    padding: '16px 0',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#4ade80',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    fontSize: '16px',
    color: '#e0e0e0',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
    padding: '8px 0',
  },
};

// Add hover styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  a:hover {
    color: #4ade80 !important;
  }
`;
document.head.appendChild(styleSheet);

export default App;

