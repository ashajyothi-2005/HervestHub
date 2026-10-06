import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Star, 
  Sparkles, 
  Phone, 
  Clock, 
  Check 
} from 'lucide-react';
import { translations, getCropDisplay, getDistrictDisplay, getSkillDisplay } from '../translations';
import { api } from '../services/api';

export default function FarmerApplicationsView({ 
  lang = 'en', 
  applications = [], 
  onRefreshData, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredApps = applications.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const handleStatusChange = async (appId, status) => {
    try {
      await api.updateApplicationStatus(appId, status);
      showToast(t('msg_status_updated'), 'success');
      if (onRefreshData) onRefreshData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            {t('nav_applications')} ({applications.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            {lang === 'te' ? "మీ వ్యవసాయ పనులకు కార్మికుల నుండి వచ్చిన అన్ని దరఖాస్తులను సమీక్షించండి." : "Review and manage all worker applications for your farm operations."}
          </p>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'accepted', 'declined'].map((st) => (
            <button
              key={st}
              className={`nav-item ${filterStatus === st ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'capitalize' }}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'all' ? (lang === 'te' ? 'అన్నీ' : 'All') : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <FileText size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p>{t('empty_no_applications')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredApps.map((app) => (
            <div key={app.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Job reference & match score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="crop-badge-lg" style={{ fontSize: '12px', padding: '3px 8px' }}>
                    🌾 {getCropDisplay(app.crop_type, lang)}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: '6px' }}>
                    {app.worker_name}
                  </h3>
                </div>

                <span className="match-badge high" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  <Sparkles size={13} />
                  {app.matching_score || 93}% Match
                </span>
              </div>

              {/* Worker meta */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>📍 {[app.worker_location, getDistrictDisplay(app.district, lang)].filter(Boolean).join(', ')} ({app.distance_km || 6} km)</div>
                <div>⏳ {app.worker_experience} {t('years_unit')} • ★ {app.worker_rating || 4.8} rating</div>
                <div>💰 Expected Wage: ₹{app.expected_wage} {t('per_day')} (Offered: ₹{app.offered_wage})</div>
                {app.notes && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#64748b' }}>
                    "{app.notes}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span className={`match-badge ${app.status === 'Accepted' ? 'high' : app.status === 'Pending' ? 'medium' : 'low'}`} style={{ fontSize: '12px' }}>
                  {app.status}
                </span>

                {app.status === 'Pending' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleStatusChange(app.id, 'Accepted')}
                    >
                      <CheckCircle2 size={14} />
                      {t('btn_accept')}
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#b91c1c' }}
                      onClick={() => handleStatusChange(app.id, 'Declined')}
                    >
                      <XCircle size={14} />
                      {t('btn_reject')}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {app.status === 'Accepted' ? '✓ Application Approved' : 'Declined'}
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
