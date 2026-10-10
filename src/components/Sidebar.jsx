import React from 'react';
import { FiHome, FiList, FiPlusCircle, FiLogOut, FiGift, FiCreditCard } from 'react-icons/fi';

function Sidebar({ isSidebarOpen, activeView, setActiveView, handleLogout }) {
  return (
    <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
      <div className="brand" style={{ marginBottom: '40px', padding: '0 8px', display: 'flex', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div className="brand-mark" style={{ width: '40px', height: '40px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <img src="/mcym-logo.png" alt="MCYM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
          </div>
          <div className="brand-label"><strong style={{ color: 'var(--text)' }}>MCYM</strong><span style={{ color: 'var(--muted)' }}>Edakara Region</span></div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')} title="Dashboard">
          <FiHome /> <span className="nav-label">Dashboard</span>
        </button>
        <button className={`nav-item ${activeView === 'coupons' ? 'active' : ''}`} onClick={() => setActiveView('coupons')} title="Coupons List">
          <FiList /> <span className="nav-label">Coupons List</span>
        </button>
        <button className={`nav-item ${activeView === 'draw' ? 'active' : ''}`} onClick={() => setActiveView('draw')} title="Lucky Draw">
          <FiGift /> <span className="nav-label">Lucky Draw</span>
        </button>
        <button className={`nav-item ${activeView === 'members' ? 'active' : ''}`} onClick={() => setActiveView('members')} title="Member Cards">
          <FiCreditCard /> <span className="nav-label">Member Cards</span>
        </button>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
        <button className="nav-item" style={{ color: 'var(--red)', background: 'var(--soft-red)' }} onClick={handleLogout} title="Logout">
          <FiLogOut /> <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
