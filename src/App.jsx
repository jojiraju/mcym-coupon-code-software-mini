import React, { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Toaster, toast } from 'react-hot-toast';
import './index.css';

import Dashboard from './pages/Dashboard';
import CouponsCreate from './pages/CouponsCreate';
import CouponsList from './pages/CouponsList';
import LuckyDraw from './pages/LuckyDraw';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
  const [coupons, setCoupons] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('mcymAuth') === 'true');

  // Load from Firebase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'mcym', 'coupons');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data().list;
          setCoupons(Array.isArray(data) ? data : []);
        } else {
          setCoupons([]);
        }
      } catch (error) {
        console.error("Error loading from Firebase:", error);
        toast.error('Could not load data from Firebase');
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to Firebase whenever coupons change
  const saveCoupons = async (updated) => {
    setCoupons(updated);
    try {
      const docRef = doc(db, 'mcym', 'coupons');
      await setDoc(docRef, { list: updated });
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      toast.error('Could not save to Firebase. Please check your config.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mcymAuth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        handleLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <main className="main-content">
        <header className="app-header" style={{ flex: 'none', borderRadius: '0', padding: '24px 32px' }}>
          <div className="nav" style={{ justifyContent: 'space-between' }}>
            <button className="icon-btn hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle Sidebar" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', flex: 'none' }}>
              <FiMenu size={18} />
            </button>
            <div className="rate">₹20 / COUPON</div>
          </div>
          <div className="hero" style={{ margin: '0' }}>
            <h1 style={{ fontSize: '32px' }}>
              {activeView === 'dashboard' ? 'Dashboard Overview' :
                activeView === 'create' ? 'Register Coupons' :
                  activeView === 'draw' ? 'Lucky Draw' :
                    'Coupon Management'}
            </h1>
            <p>
              {activeView === 'dashboard' ? 'Track your campaign progress.' :
                activeView === 'create' ? 'Add new batches of coupons to the system.' :
                  activeView === 'draw' ? 'Pick the winning coupons.' :
                    'Search and manage existing coupons.'}
            </p>
          </div>
        </header>

        <div className="wrap" style={{ margin: '-20px 32px 50px', padding: '0', maxWidth: 'none', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--muted)', fontSize: '15px', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>⏳</span> Loading coupon data...
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && <Dashboard coupons={coupons} />}
              {activeView === 'create' && <CouponsCreate coupons={coupons} setCoupons={saveCoupons} toast={toast} setActiveView={setActiveView} />}
              {activeView === 'coupons' && <CouponsList coupons={coupons} setCoupons={saveCoupons} toast={toast} setActiveView={setActiveView} />}
              {activeView === 'draw' && <LuckyDraw coupons={coupons} toast={toast} />}
            </>
          )}
        </div>
      </main>
      <Toaster position="top-center" toastOptions={{ style: { padding: '16px', color: '#1e293b', fontWeight: 500, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', borderRadius: '12px', fontSize: '15px' } }} />
    </div>
  );
}

export default App;
