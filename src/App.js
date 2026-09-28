import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import CreateIssue from './components/CreateIssue';
import IssueList from './components/IssueList';
import TagMapUpdates from './components/TagMap';
import DashboardAnalytics from './components/DashboardAnalytics';

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

  // Shared form voice command state to pass into CreateIssue
  const [voiceFormCommand, setVoiceFormCommand] = useState(null);

  // Voice Assistant States
  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US'); // 'en-US' atau 'ms-MY'
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const recognitionRef = useRef(null);

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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const targetIssueId = searchParams.get('issueId');
    if (targetIssueId) {
      localStorage.setItem('open_issue_id', targetIssueId);
    }
  }, []);

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

  // Setup Web Speech API for Universal Voice Control
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const rawText = event.results[0][0].transcript;
      const command = rawText.toLowerCase().trim();
      setVoiceFeedback(`"${rawText}"`);

      // 1. Navigation Command Matching
      if (
        command.includes('dashboard') ||
        command.includes('go home') ||
        command.includes('papan pemuka') ||
        command === 'home'
      ) {
        navigateTo('home');
        setVoiceFeedback('Navigating to Dashboard');
        return;
      }
      
      if (
        command.includes('new issue') ||
        command.includes('create issue') ||
        command.includes('add issue') ||
        command.includes('tambah isu') ||
        command.includes('buka isu')
      ) {
        navigateTo('create');
        setVoiceFeedback('Navigating to Add Issue');
        return;
      }

      if (
        command.includes('issue list') ||
        command.includes('list of issue') ||
        command.includes('senarai isu') ||
        command === 'list'
      ) {
        navigateTo('list');
        setVoiceFeedback('Navigating to Issue List');
        return;
      }

      if (
        command.includes('analytic') ||
        command.includes('analytics') ||
        command.includes('graf') ||
        command.includes('carta')
      ) {
        navigateTo('analytics');
        setVoiceFeedback('Navigating to Analytics');
        return;
      }

      if (
        command.includes('tagmap') ||
        command.includes('tag map')
      ) {
        navigateTo('tagmap');
        setVoiceFeedback('Navigating to TagMap');
        return;
      }

      // 2. Form Auto-Fill Command (Hantar ke borang CreateIssue)
      setVoiceFormCommand({ text: rawText, timestamp: Date.now() });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceFeedback('Error capturing audio');
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceFeedback(''), 4000);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleVoiceAssistant = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceFeedback('Listening...');
      recognitionRef.current.lang = voiceLanguage;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className={`dashboard-container ${isPortrait ? 'is-portrait' : 'is-landscape'}`}>
      {/* Top Navigation Bar */}
      <div className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ fontWeight: 'bold', color: '#0d3b66', fontSize: '15px' }}>
            ⚙️ Proton Tracking System
          </span>
        </div>

        <div>
          {activeTab !== 'home' && (
            <button 
              className="back-btn" 
              onClick={handleBackNavigation}
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
            
            {/* Header Akronim Center */}
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
              <h3>Add New Issue</h3>
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
            voiceCommand={voiceFormCommand}
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

      {/* Satu Butang Universal Voice Floating Action Button */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        {/* Feedback visual teks arahan */}
        {voiceFeedback && (
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              maxWidth: '260px',
              textAlign: 'center',
              border: '1px solid #38bdf8'
            }}
          >
            {voiceFeedback}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={voiceLanguage}
            onChange={(e) => setVoiceLanguage(e.target.value)}
            disabled={isListening}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="en-US">EN</option>
            <option value="ms-MY">BM</option>
          </select>

          <button
            type="button"
            onClick={toggleVoiceAssistant}
            title={isListening ? 'Click to stop' : 'Universal Voice: navigate or fill form'}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isListening ? '#dc2626' : '#0d3b66',
              color: '#ffffff',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening 
                ? '0 0 16px rgba(220, 38, 38, 0.8)' 
                : '0 4px 14px rgba(13, 59, 102, 0.45)',
              transition: 'all 0.3s ease',
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {isListening ? '🛑' : '🎙️'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span>©</span> Developed by Razin ME
      </div>
    </div>
  );
}