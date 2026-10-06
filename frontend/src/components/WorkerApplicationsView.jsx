import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import { translations, getCropDisplay, getDistrictDisplay } from '../translations';

export default function WorkerApplicationsView({ 
  lang = 'en', 
  applications = [], 
  workerProfile = {} 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const myApps = applications.filter(a => a.worker_id === workerProfile.id || a.worker_id === 'w1');

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
          {t('stat_my_applications')} ({myApps.length})
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          {lang === 'te' ? "మీరు సమర్పించిన దరఖాస్తుల స్థితి మరియు రైతు ఆమోదాలను ఇక్కడ ట్రాక్ చేయండి." : "Track the live status of your job applications and farmer confirmations."}
        </p>
      </div>

      {/* Applications list */}
      {myApps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <FileText size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p>{t('empty_no_applications')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {myApps.map((app) => (
            <div key={app.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="crop-badge-lg" style={{ fontSize: '12px', padding: '3px 8px' }}>
                    🌾 {getCropDisplay(app.crop_type, lang)}
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', marginTop: '6px' }}>
                    {app.job_title || `${app.crop_type} Work`}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    👤 {app.farmer_name}
                  </p>
                </div>

                <span 
                  className={`match-badge ${app.status === 'Accepted' ? 'high' : app.status === 'Pending' ? 'medium' : 'low'}`}
                  style={{ fontSize: '12px' }}
                >
                  {app.status === 'Accepted' ? '✓ Accepted' : app.status === 'Pending' ? '⏳ Pending' : 'Declined'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>📍 {[app.location, getDistrictDisplay(app.district, lang)].filter(Boolean).join(', ')} ({app.distance_km || 6} km)</div>
                <div>💰 Offered Wage: ₹{app.offered_wage} {t('per_day')}</div>
                <div>📅 Applied Date: {new Date(app.applied_date).toLocaleDateString()}</div>
                {app.notes && <div>💬 <em>"{app.notes}"</em></div>}
              </div>

              <div style={{ fontSize: '12px', color: app.status === 'Accepted' ? '#15803d' : '#64748b', fontWeight: '700', marginTop: 'auto' }}>
                {app.status === 'Accepted' 
                  ? (lang === 'te' ? "✓ రైతు మీ దరఖాస్తును ఆమోదించారు! పని తేదీన హాజరుకండి." : "✓ Application Confirmed by Farmer. Please arrive on schedule.")
                  : (lang === 'te' ? "రైతు సమీక్ష కోసం ఎదురుచూస్తోంది." : "Awaiting farmer review.")}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
