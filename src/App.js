import React, { useEffect, useState } from 'react';
import './App.css';
import CreateIssue from './components/CreateIssue';
import IssueList from './components/IssueList';
import TagMapUpdates from './components/TagMap';
import DashboardAnalytics from './components/DashboardAnalytics';

// Profil default sistem tanpa login
const DEFAULT_USER_PROFILE = {
  id: '00000000-0000-0000-0000-000000000000',
  department: 'ME',
  staff_id: 'Proton ID',
  full_name: 'Proton',
  avatar_url: null,
};

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('home');

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update Clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Jam & Tarikh
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
  };

  // Pengesanan Orientasi Dinamik: Potret vs Landskap
  const checkIsPortrait = () => {
    return window.innerHeight > window.innerWidth || window.innerWidth <= 768;
  };

  const [isPortrait, setIsPortrait] = useState(checkIsPortrait());

  useEffect(() => {
    const handleOrientationOrResize = () => {
      setIsPortrait(checkIsPortrait());
    };

    window.addEventListener('resize', handleOrientationOrResize);
    window.addEventListener('orientationchange', handleOrientationOrResize);

    return () => {
      window.removeEventListener('resize', handleOrientationOrResize);
      window.removeEventListener('orientationchange', handleOrientationOrResize);
    };
  }, []);

  // Tangkap issueId daripada parameter URL dan navigasi terus ke senarai isu
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const targetIssueId = searchParams.get('issueId');
    if (targetIssueId) {
      localStorage.setItem('open_issue_id', targetIssueId);
    }
  }, []);

  // URL Hash Navigation tanpa sekatan login
  useEffect(() => {
    const handleHashChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlIssueId = searchParams.get('issueId');
      const pendingIssueId = urlIssueId || localStorage.getItem('open_issue_id');
      const currentHash = window.location.hash.replace('#/', '').replace('#', '');

      if (pendingIssueId) {
        window.history.replaceState(null, '', `/?issueId=${pendingIssueId}#/list`);
        setActiveTab('list');
        return;
      }

      if (!currentHash || currentHash === '' || currentHash === 'login') {
        window.history.replaceState(null, '', '#/home');
        setActiveTab('home');
      } else {
        const validTabs = ['home', 'create', 'list', 'analytics', 'tagmap'];
        if (validTabs.includes(currentHash)) {
          setActiveTab(currentHash);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (tabName) => {
    window.location.hash = `#/${tabName}`;
    setActiveTab(tabName);
  };

  const handleBackNavigation = () => {
    navigateTo('home');
  };

  const handleIssueCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    navigateTo('list');
  };

  return (
    <div className={`dashboard-container ${isPortrait ? 'is-portrait' : 'is-landscape'}`}>
      {/* Top Header Bar */}
      <div 
        className="top-nav" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}
      >
        <div>
          <span style={{ fontWeight: 'bold', color: '#0d3b66', fontSize: '16px' }}>
            ⚙️ Proton Tracking System
          </span>
        </div>

        {/* Real-time Digital Clock & Date (Center Pill) */}
        <div 
          style={{
            backgroundColor: '#0c4a6e',
            color: '#ffffff',
            padding: '6px 18px',
            borderRadius: '6px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minWidth: '150px'
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            {formatTime(currentTime)}
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '1px' }}>
            {formatDate(currentTime)}
          </div>
        </div>

        <div>
          {activeTab !== 'home' && (
            <button 
              className="back-btn" 
              onClick={handleBackNavigation}
              style={{
                backgroundColor: '#0d3b66',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⬅️ Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'home' && (
        <div className={`dashboard-grid ${isPortrait ? 'portrait-layout' : 'landscape-layout'}`}>
          <div className="hero-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Header Akronim R.A.Z.I.N (Center) */}
            <div className="hero-title" style={{ textAlign: 'center', width: '100%' }}>
              <h1 style={{ letterSpacing: '4px', marginBottom: '14px', fontSize: '28px', textAlign: 'center' }}>
                R.A.Z.I.N
              </h1>
              
              <div 
                style={{ 
                  display: 'inline-flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  textAlign: 'left',
                  margin: '0 auto',
                  color: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', width: '22px', textAlign: 'center', display: 'inline-block' }}>R</span>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>oot Cause</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', width: '22px', textAlign: 'center', display: 'inline-block' }}>A</span>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>nalysis</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', width: '22px', textAlign: 'center', display: 'inline-block' }}>Z</span>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>ero</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', width: '22px', textAlign: 'center', display: 'inline-block' }}>I</span>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>ssue Resolution</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', width: '22px', textAlign: 'center', display: 'inline-block' }}>N</span>
                  <span style={{ fontSize: '15px', fontWeight: '600' }}>etwork</span>
                </div>
              </div>
            </div>

            {/* Profile Proton (Center) */}
            <div 
              className="user-profile" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px', 
                marginTop: '20px', 
                width: '100%', 
                textAlign: 'center' 
              }}
            >
              <div 
                className="avatar" 
                style={{ 
                  width: '65px', 
                  height: '80px', 
                  borderRadius: '6px', 
                  overflow: 'hidden', 
                  backgroundColor: '#e2e8f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '2px solid rgba(255,255,255,0.6)', 
                  margin: '0 auto' 
                }}
              >
                <span style={{ fontSize: '32px' }}>👤</span>
              </div>

              <div className="welcome-text" style={{ textAlign: 'center', width: '100%' }}>
                <div className="welcome-title" style={{ textAlign: 'center' }}>Welcome to</div>
                <div className="user-name" style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                  {DEFAULT_USER_PROFILE.full_name}
                </div>
                <div className="staff-id-text" style={{ fontSize: '13px', color: '#cbd5e1', textAlign: 'center' }}>
                  ({DEFAULT_USER_PROFILE.staff_id})
                </div>
              </div>
            </div>

          </div>

          <div className="menu-card card-list" onClick={() => navigateTo('list')}>
            <div className="card-overlay">
              <h3>List of Issues</h3>
            </div>
          </div>

          <div className="menu-card card-create" onClick={() => navigateTo('create')}>
            <div className="card-overlay">
              <h3>Specify an Issue</h3>
            </div>
          </div>

          <div className="menu-card card-dashboard" onClick={() => navigateTo('analytics')}>
            <div className="card-overlay">
              <h3>Dashboard Analytics</h3>
            </div>
          </div>

          <div className="menu-card card-escalate" onClick={() => navigateTo('tagmap')}>
            <div className="card-overlay">
              <h3>TagMap Updates</h3>
            </div>
          </div>
        </div>
      )}

      {/* View: Create Issue Form */}
      {activeTab === 'create' && (
        <div>
          <CreateIssue 
            userProfile={DEFAULT_USER_PROFILE} 
            onBackToDashboard={handleBackNavigation}
            onIssueCreated={handleIssueCreated} 
          />
        </div>
      )}

      {/* View: Issue List Table */}
      {activeTab === 'list' && (
        <div>
          <IssueList 
            onBackToDashboard={handleBackNavigation}
            userProfile={DEFAULT_USER_PROFILE} 
            refreshTrigger={refreshTrigger} 
          />
        </div>
      )}

      {/* View: Dashboard Analytics */}
      {activeTab === 'analytics' && (
        <div>
          <DashboardAnalytics onBack={handleBackNavigation} />
        </div>
      )}

      {/* View: TagMap Updates Table */}
      {activeTab === 'tagmap' && (
        <div>
          <TagMapUpdates onBack={handleBackNavigation} />
        </div>
      )}

      {/* Footer */}
      <div className="footer" style={{ textAlign: 'center', marginTop: '30px', color: '#64748b', fontSize: '13px' }}>
        <span>©</span> Developed by Razin ME
      </div>
    </div>
  );
}