import React, { useState } from 'react';
import { 
  Briefcase, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { 
  translations, 
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';

export default function FarmerJobsView({ 
  lang = 'en', 
  jobs = [], 
  applications = [], 
  onOpenCreateJob, 
  onNavigateToMatching, 
  onRefreshData,
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;
  const [expandedJobId, setExpandedJobId] = useState(jobs[0]?.id || null);

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      showToast(t('msg_status_updated'), 'success');
      if (onRefreshData) onRefreshData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            {t('nav_my_jobs')} ({jobs.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            {lang === 'te' ? "మీరు సృష్టించిన వ్యవసాయ పనులు మరియు వచ్చిన కూలీల దరఖాస్తులను నిర్వహించండి." : "Manage your agricultural listings, monitor applicant compatibility, and confirm bookings."}
          </p>
        </div>

        <button className="btn-primary" onClick={onOpenCreateJob}>
          <PlusCircle size={16} />
          {t('nav_create_job')}
        </button>
      </div>

      {/* Jobs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <p>{t('empty_no_jobs')}</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onOpenCreateJob}>
              {t('btn_post_job')}
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const jobApps = applications.filter(a => a.job_id === job.id);
            const isExpanded = expandedJobId === job.id;

            return (
              <div key={job.id} className="card">
                
                {/* Job Summary Banner */}
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', cursor: 'pointer' }} onClick={() => setExpandedJobId(isExpanded ? null : job.id)}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="brand-icon-box" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="crop-badge-lg" style={{ fontSize: '12px', padding: '3px 8px' }}>
                          🌾 {getCropDisplay(job.crop_type, lang)}
                        </span>
                        <span className="tag-pill skill">
                          {getSkillDisplay(job.required_skill, lang)}
                        </span>
                        <span className="match-badge high" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {job.status || 'Active'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', marginTop: '4px' }}>
                        {getDistrictDisplay(job.district, lang)} – {job.workers_needed} {t('workers_unit')} {lang === 'te' ? "కావలెను" : "Required"}
                      </h3>
                    </div>
                  </div>

                  {/* Wage Info & Expand Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#854d0e' }}>
                        ₹{job.offered_wage} <span style={{ fontSize: '11px', color: '#64748b' }}>{t('per_day')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                        {t('lbl_predicted_wage')}: ₹{job.predicted_market_wage || 450}
                      </div>
                    </div>

                    <button 
                      type="button" 
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details & Applications Area */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', padding: '20px 24px', background: '#f8fafc' }}>
                    
                    {/* Meta Details Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                      <span>📅 <strong>{t('lbl_job_date')}:</strong> {job.job_date}</span>
                      <span>⏳ <strong>{t('lbl_experience_req')}:</strong> {job.experience_required}+ {t('years_unit')}</span>
                      <span>🌤️ <strong>{t('lbl_weather_condition')}:</strong> {job.weather_condition}</span>
                      <span>👥 <strong>{t('lbl_predicted_demand')}:</strong> {job.predicted_labour_demand || 35} {t('workers_unit')}</span>
                    </div>

                    {job.description && (
                      <p style={{ fontSize: '13px', color: '#334155', marginBottom: '18px', background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        {job.description}
                      </p>
                    )}

                    {/* Applications received for this job */}
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                          {t('lbl_total_applications')} ({jobApps.length})
                        </h4>

                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => onNavigateToMatching(job)}
                        >
                          <Sparkles size={14} />
                          {lang === 'te' ? "మరిన్ని కూలీలను AI ద్వారా వెతకండి" : "Match More Workers with AI"}
                        </button>
                      </div>

                      {jobApps.length === 0 ? (
                        <div style={{ padding: '20px', background: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                          {lang === 'te' ? "ఈ పనికి ఇంకా దరఖాస్తులు రాలేదు. 'Match More Workers' పై క్లిక్ చేసి కూలీలను నేరుగా ఆహ్వానించండి." : "No direct applications submitted yet. Click 'Match More Workers' to invite top candidates."}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {jobApps.map((app) => (
                            <div 
                              key={app.id} 
                              style={{ 
                                background: 'white', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px', 
                                padding: '14px 18px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                flexWrap: 'wrap', 
                                gap: '12px' 
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{app.worker_name}</span>
                                  <span className="match-badge high" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                    {app.matching_score || 92}% Match
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700' }}>
                                    ★ {app.worker_rating || 4.8}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {app.worker_experience} {t('years_unit')} • {app.worker_skills} • Exp Wage: ₹{app.expected_wage}
                                </div>
                              </div>

                              {/* Status / Accept / Reject Controls */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {app.status === 'Pending' ? (
                                  <>
                                    <button 
                                      className="btn-primary" 
                                      style={{ padding: '6px 14px', fontSize: '12px' }}
                                      onClick={() => handleStatusUpdate(app.id, 'Accepted')}
                                    >
                                      <CheckCircle2 size={14} />
                                      {t('btn_accept')}
                                    </button>
                                    <button 
                                      className="btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '12px', color: '#b91c1c' }}
                                      onClick={() => handleStatusUpdate(app.id, 'Declined')}
                                    >
                                      <XCircle size={14} />
                                      {t('btn_reject')}
                                    </button>
                                  </>
                                ) : (
                                  <span 
                                    className={`match-badge ${app.status === 'Accepted' ? 'high' : 'low'}`}
                                    style={{ fontSize: '12px' }}
                                  >
                                    {app.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
