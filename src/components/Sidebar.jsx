import React from 'react';
import { FiHome, FiList, FiPlusCircle, FiLogOut } from 'react-icons/fi';

function Sidebar({ isSidebarOpen, activeView, setActiveView, handleLogout }) {
  return (
    <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
      <div className="brand" style={{ marginBottom: '40px', padding: '0 8px', display: 'flex', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div className="brand-mark" style={{ width: '40px', height: '40px', fontSize: '20px', color: 'var(--red)', background: 'var(--soft-red)', border: '1px solid var(--soft-red)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>🎄</div>
          <div className="brand-label"><strong style={{ color: 'var(--text)' }}>MCYM</strong><span style={{ color: 'var(--muted)' }}>Admin Panel</span></div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')} title="Dashboard">
          <FiHome /> <span className="nav-label">Dashboard</span>
        </button>
        <button className={`nav-item ${activeView === 'coupons' ? 'active' : ''}`} onClick={() => setActiveView('coupons')} title="Coupons List">
          <FiList /> <span className="nav-label">Coupons List</span>
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
