import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CombinedForecastPredictor from './components/CombinedForecastPredictor';
import AuthView from './components/AuthView';
import WorkerMatcher from './components/WorkerMatcher';
import PlantDiseaseDetector from './components/PlantDiseaseDetector';
import PostFarmJobView from './components/PostFarmJobView';
import WorkerJobFeed from './components/WorkerJobFeed';
import WorkerProfileView from './components/WorkerProfileView';
import NotificationDrawer from './components/NotificationDrawer';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('harvesthub_user') || 'null'); } catch { return null; }
  });
  const currentRole = user?.role || 'farmer';
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('harvesthub_language') || 'en');
  const [activeTab, setActiveTab] = useState(() => user?.role === 'worker' ? 'feed' : 'forecast');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [serverStatus, setServerStatus] = useState('offline');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const workerProfile = user?.role === 'worker' ? user : {};
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => { checkHealth(); }, []);

  useEffect(() => {
    localStorage.setItem('harvesthub_language', currentLang);
  }, [currentLang]);

  useEffect(() => {
    if (user) {
      loadWorkspaceData(user);
    }
  }, [user]);

  async function checkHealth() {
    try {
      const res = await api.checkHealth();
      if (res && res.status) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  }

  async function loadWorkspaceData(activeUser = user) {
    if (!activeUser) return;
    try {
      const appFilters = activeUser.role === 'farmer'
        ? { farmer_id: activeUser.id }
        : { worker_id: activeUser.id };
      const [jobsRes, appsRes, notificationsRes] = await Promise.all([
        api.getJobs(),
        api.getApplications(appFilters),
        api.getNotifications(activeUser.role, activeUser.id)
      ]);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (appsRes?.applications) setApplications(appsRes.applications);
      if (notificationsRes?.notifications) setNotifications(notificationsRes.notifications);
    } catch (e) {
      console.warn('Load dashboard data error:', e);
    }
  }

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setActiveTab(authenticatedUser.role === 'farmer' ? 'forecast' : 'feed');
    localStorage.setItem('harvesthub_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch (error) { console.warn('Sign out error:', error); }
    localStorage.removeItem('harvesthub_user');
    setUser(null);
    setJobs([]);
    setApplications([]);
    setNotifications([]);
  };

  return (
    <div className="app-layout">
      {user ? <>
        <Navbar
          currentRole={currentRole}
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          serverStatus={serverStatus}
          user={user}
          onLogout={handleLogout}
          onOpenNotifications={async () => {
            await loadWorkspaceData(user);
            setNotificationsOpen(true);
          }}
          notificationCount={notifications.filter((item) => !item.read).length}
        />
        <main className="main-content">
          {currentRole === 'farmer' && <>
            {activeTab === 'forecast' && <CombinedForecastPredictor lang={currentLang} showToast={showToast} />}
            {activeTab === 'matching' && <WorkerMatcher lang={currentLang} showToast={showToast} currentRole={currentRole} user={user} jobs={jobs} onRefreshData={() => loadWorkspaceData(user)} />}
            {activeTab === 'disease' && <PlantDiseaseDetector lang={currentLang} showToast={showToast} />}
            {activeTab === 'jobs' && <PostFarmJobView lang={currentLang} jobs={jobs} user={user} onRefreshData={() => loadWorkspaceData(user)} showToast={showToast} />}
          </>}
          {currentRole === 'worker' && <>
            {activeTab === 'feed' && <WorkerJobFeed lang={currentLang} jobs={jobs} workerProfile={workerProfile} applications={applications} onRefreshData={() => loadWorkspaceData(user)} showToast={showToast} />}
            {activeTab === 'profile' && <WorkerProfileView lang={currentLang} workerProfile={workerProfile} onSaveProfile={async (updated) => {
              try {
                const result = await api.saveWorkerProfile({ ...user, ...updated });
                const refreshedUser = { ...user, ...result.worker };
                setUser(refreshedUser);
                localStorage.setItem('harvesthub_user', JSON.stringify(refreshedUser));
              } catch (error) { showToast(error.message, 'error'); }
            }} showToast={showToast} />}
          </>}
        </main>
        <NotificationDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          lang={currentLang}
          notifications={notifications}
          currentRole={currentRole}
          user={user}
          onRefreshNotifications={() => loadWorkspaceData(user)}
          onRefreshData={() => loadWorkspaceData(user)}
          showToast={showToast}
        />
      </> : <AuthView lang={currentLang} setCurrentLang={setCurrentLang} onAuthenticated={handleAuthenticated} showToast={showToast} />}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} color="#22c55e" />
            ) : (
              <AlertCircle size={18} color="#ef4444" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
