import React from 'react';
import { 
  Briefcase, 
  Sparkles, 
  DollarSign, 
  UserCheck, 
  Wheat,
  Leaf,
  Bell,
  LogOut,
  Settings
} from 'lucide-react';
import { translations } from '../translations';

export default function Navbar({ 
  currentRole, 
  currentLang, 
  setCurrentLang, 
  activeTab, 
  setActiveTab,
  serverStatus,
  user,
  onLogout,
  onOpenNotifications,
  notificationCount = 0
}) {
  const t = (key) => translations[currentLang]?.[key] || key;
  const tabLabel = (english, telugu) => currentLang === 'te' ? telugu : english;

  return (
    <header className="navbar">
      <div className="navbar-container">
        
        {/* Brand */}
        <div className="brand-section" style={{ cursor: 'pointer' }} onClick={() => setActiveTab(currentRole === 'farmer' ? 'forecast' : 'feed')}>
          <div className="brand-icon-box">
            <Wheat size={26} />
          </div>
          <div className="brand-titles">
            <h1>{t('brand_name')}</h1>
            <span>{t('brand_tagline')}</span>
          </div>
        </div>

        <nav className="nav-links">
          {currentRole === 'farmer' ? (
            <>
              <button 
                className={`nav-item ${activeTab === 'forecast' ? 'active' : ''}`}
                onClick={() => setActiveTab('forecast')}
              >
                <DollarSign size={16} />
                {t('nav_forecasts')}
              </button>

              <button 
                className={`nav-item ${activeTab === 'matching' ? 'active' : ''}`}
                onClick={() => setActiveTab('matching')}
              >
                <Sparkles size={16} />
                {t('nav_find_workers')}
              </button>

              <button 
                className={`nav-item ${activeTab === 'disease' ? 'active' : ''}`}
                onClick={() => setActiveTab('disease')}
              >
                <Leaf size={16} />
                {t('nav_disease_detect')}
              </button>

              <button 
                className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => setActiveTab('jobs')}
              >
                <Briefcase size={16} />
                {t('nav_create_job')}
              </button>
            </>
          ) : (
            <>
              <button 
                className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <Briefcase size={16} />
                {t('nav_find_jobs')}
              </button>

              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <UserCheck size={16} />
                {t('nav_profile')}
              </button>
            </>
          )}
        </nav>

        {/* Global Controls */}
        <div className="navbar-actions">
          
          {/* ML Server Status */}
          <div className={`server-pill ${serverStatus === 'online' ? 'online' : ''}`} title="Flask ML Models Online">
            <span className="status-dot"></span>
            <span>{serverStatus === 'online' ? (currentLang === 'te' ? "ML సర్వర్ సిద్ధంగా ఉంది" : "ML Models Online") : t('server_offline')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={15} aria-hidden="true" />
            <label htmlFor="dashboard-language" style={{ fontSize: '12px' }}>{t('settings_language')}</label>
            <select id="dashboard-language" className="form-select" value={currentLang} onChange={(event) => setCurrentLang(event.target.value)} style={{ width: 'auto', minWidth: '98px', padding: '7px 9px' }}>
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
          <button className="lang-switch-btn" onClick={onOpenNotifications} title={t('nav_notifications')} aria-label={t('nav_notifications')} style={{ position: 'relative' }}>
            <Bell size={16} />
            <span>{t('nav_notifications')}</span>
            {notificationCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-5px', minWidth: '17px', height: '17px', borderRadius: '9px', background: '#dc2626', color: '#fff', fontSize: '10px', display: 'grid', placeItems: 'center' }}>{notificationCount}</span>}
          </button>
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#334155' }}>{user?.name}</span>
          <button className="lang-switch-btn" onClick={onLogout} title={tabLabel('Sign out', 'లాగ్ అవుట్')} aria-label={tabLabel('Sign out', 'లాగ్ అవుట్')}><LogOut size={16} /></button>

        </div>

      </div>
    </header>
  );
}
