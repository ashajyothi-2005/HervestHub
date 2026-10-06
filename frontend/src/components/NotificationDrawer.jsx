import React from 'react';
import { Bell, X, Clock } from 'lucide-react';
import { translations } from '../translations';
import { api } from '../services/api';

export default function NotificationDrawer({ 
  isOpen, 
  onClose, 
  lang = 'en', 
  notifications = [], 
  currentRole = 'farmer', 
  onRefreshNotifications,
  onRefreshData,
  user,
  showToast
}) {
  const t = (key) => translations[lang]?.[key] || key;

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead(currentRole, user?.id);
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (e) {
      console.warn('Mark read error:', e);
    }
  };

  const handleResponse = async (notification, status) => {
    try {
      await api.respondToHiringRequest(notification.hiring_request_id, status, user?.id);
      showToast?.(status === 'Accepted'
        ? (lang === 'te' ? 'పని అభ్యర్థన అంగీకరించబడింది.' : 'Job request accepted.')
        : (lang === 'te' ? 'పని అభ్యర్థన తిరస్కరించబడింది.' : 'Job request declined.'), 'success');
      onRefreshData?.();
    } catch (error) {
      showToast?.(error.message, 'error');
    }
  };

  const handleApplicationStatus = async (notification, status) => {
    try {
      await api.updateApplicationStatus(notification.hiring_request_id, status, user?.id);
      showToast?.(status === 'Accepted'
        ? (lang === 'te' ? 'కార్మికుని దరఖాస్తును ఆమోదించారు.' : 'Worker application accepted.')
        : (lang === 'te' ? 'కార్మికుని దరఖాస్తును తిరస్కరించారు.' : 'Worker application declined.'), 'success');
      onRefreshData?.();
    } catch (error) {
      showToast?.(error.message, 'error');
    }
  };

  const roleNotifs = notifications.filter(n => n.recipient_role === currentRole || n.recipient_role === 'all');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', position: 'fixed', right: '20px', top: '70px', maxHeight: '80vh' }}
      >
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#16a34a" />
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
              {t('nav_notifications')} ({roleNotifs.length})
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleMarkAllRead}
              style={{ background: 'transparent', border: 'none', color: '#16a34a', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
            >
              {t('btn_mark_all_read')}
            </button>

            <button 
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {roleNotifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
              <p>{t('empty_no_notifications')}</p>
            </div>
          ) : (
            roleNotifs.map((n) => (
              <div 
                key={n.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: n.read ? '#ffffff' : '#f0fdf4',
                  borderLeft: n.read ? '1px solid #e2e8f0' : '4px solid #16a34a'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                  {lang === 'te' ? (n.title_te || n.title_en) : n.title_en}
                </div>
                <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                  {lang === 'te' ? (n.message_te || n.message_en) : n.message_en}
                </div>
                {n.hiring_request_id && <div style={{ marginTop: '8px', padding: '9px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#334155', display: 'grid', gap: '4px' }}>
                  {n.job_title && <strong>{n.job_title}</strong>}
                  {n.crop_type && <span>{lang === 'te' ? 'పంట' : 'Crop'}: {n.crop_type}</span>}
                  {(n.location || n.district) && <span>{lang === 'te' ? 'ప్రాంతం' : 'Location'}: {[n.location, n.district].filter(Boolean).join(', ')}</span>}
                  {n.job_date && <span>{lang === 'te' ? 'తేదీ' : 'Date'}: {n.job_date}</span>}
                  {n.offered_wage !== null && n.offered_wage !== undefined && <span>{lang === 'te' ? 'కూలీ' : 'Wage'}: ₹{n.offered_wage}{t('per_day')}</span>}
                  {currentRole === 'farmer' && n.worker_name && <>
                    <strong style={{ marginTop: '4px' }}>{t('hiring_worker_details')}</strong>
                    <span>{n.worker_name} · {n.worker_experience} {t('years_unit')} · ★ {n.worker_rating}</span>
                    {n.worker_skills && <span>{t('lbl_primary_skills')}: {n.worker_skills}</span>}
                    {n.worker_location && <span>{t('lbl_district')}: {n.worker_location}</span>}
                    <span>{t('lbl_status')}: {lang === 'te' ? (n.status === 'Accepted' ? t('hiring_accepted') : t('hiring_rejected')) : n.status}</span>
                  </>}
                  {currentRole === 'worker' && n.status === 'Pending' && <span style={{ marginTop: '4px', fontWeight: '700' }}>{t('hiring_accept_prompt')}</span>}
                </div>}
                {currentRole === 'worker' && n.hiring_request_id && n.status === 'Pending' && <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn-primary" type="button" onClick={() => handleResponse(n, 'Accepted')} style={{ flex: 1, justifyContent: 'center' }}>{t('btn_accept')}</button>
                  <button className="btn-secondary" type="button" onClick={() => handleResponse(n, 'Rejected')} style={{ flex: 1, justifyContent: 'center' }}>{t('btn_reject')}</button>
                </div>}
                {currentRole === 'farmer' && n.title_en === 'New worker application' && n.hiring_request_id && n.status === 'Pending' && <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn-primary" type="button" onClick={() => handleApplicationStatus(n, 'Accepted')} style={{ flex: 1, justifyContent: 'center' }}>{t('btn_accept')}</button>
                  <button className="btn-secondary" type="button" onClick={() => handleApplicationStatus(n, 'Rejected')} style={{ flex: 1, justifyContent: 'center' }}>{t('btn_reject')}</button>
                </div>}
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
