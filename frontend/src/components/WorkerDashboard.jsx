import React from 'react';
import { 
  Briefcase, 
  Search, 
  Sparkles, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  translations, 
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay 
} from '../translations';

export default function WorkerDashboard({ 
  lang = 'en', 
  jobs = [], 
  applications = [], 
  workerProfile = {},
  onNavigateTab,
  onSelectJobToApply 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const myApps = applications.filter(a => a.worker_id === workerProfile.id || a.worker_id === 'w1');
  const acceptedApps = myApps.filter(a => a.status === 'Accepted').length;

  return (
    <div>
      {/* Worker Hero Banner */}
      <div className="role-hero worker">
        <div>
          <h2>{t('dash_worker_title')}</h2>
          <p>{t('dash_worker_sub')}</p>
        </div>
        <div className="hero-actions">
          <button className="btn-secondary" onClick={() => onNavigateTab('find-jobs')}>
            <Search size={16} color="#d97706" />
            {t('nav_find_jobs')}
          </button>
          <button className="btn-secondary" onClick={() => onNavigateTab('recommended')}>
            <Sparkles size={16} color="#d97706" />
            {t('nav_recommended_jobs')}
          </button>
        </div>
      </div>

      {/* Top 4 Worker Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigateTab('find-jobs')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper amber">
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_total_jobs')}</h4>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-sub">{lang === 'te' ? "ప్రాంతీయ వ్యవసాయ పనులు" : "Open agricultural openings"}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('recommended')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper green">
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_matched_jobs')}</h4>
            <div className="stat-value">{jobs.filter(j => (workerProfile.primary_skills || 'Harvesting').toLowerCase().includes(j.required_skill.toLowerCase())).length || jobs.length}</div>
            <div className="stat-sub">{lang === 'te' ? "అధిక అనుకూలత కలిగినవి" : "High compatibility (>85%)"}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('my-applications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper blue">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_my_applications')}</h4>
            <div className="stat-value">{myApps.length}</div>
            <div className="stat-sub">{acceptedApps} {lang === 'te' ? "ఆమోదించబడ్డాయి" : "Approved bookings"}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('profile')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper purple">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_worker_rating')}</h4>
            <div className="stat-value">★ {workerProfile.rating || 4.8}</div>
            <div className="stat-sub">{workerProfile.total_jobs_done || 42} {t('lbl_total_jobs_done')}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Recommended Top Farm Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Recommended Jobs List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={20} color="#d97706" />
              <span>{t('nav_recommended_jobs')}</span>
            </div>
            <button 
              className="btn-amber"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '10px' }}
              onClick={() => onNavigateTab('recommended')}
            >
              {lang === 'te' ? "అన్నీ చూడండి" : "View All"}
            </button>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {jobs.slice(0, 3).map((job) => (
              <div 
                key={job.id} 
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="crop-badge-lg" style={{ fontSize: '12px', padding: '3px 8px' }}>
                      🌾 {getCropDisplay(job.crop_type, lang)} • {getSkillDisplay(job.required_skill, lang)}
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginTop: '6px' }}>
                      {job.farmer_name}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      📍 {getDistrictDisplay(job.district, lang)} (approx 6 km)
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#854d0e' }}>
                      ₹{job.offered_wage} <span style={{ fontSize: '11px', color: '#64748b' }}>{t('per_day')}</span>
                    </div>
                    <span className="match-badge high" style={{ fontSize: '11px', padding: '2px 8px', marginTop: '4px' }}>
                      94% Match
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                  <span>👥 {job.workers_needed} {t('workers_unit')}</span>
                  <span>⏳ {job.experience_required}+ {t('years_unit')}</span>
                  <span>📅 {job.job_date}</span>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '8px', fontSize: '13px', justifyContent: 'center', marginTop: '4px' }}
                  onClick={() => onSelectJobToApply(job)}
                >
                  {t('btn_apply_now')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Profile & Skill Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Star size={20} color="#d97706" />
              <span>{lang === 'te' ? "మీ కార్మిక ప్రొఫైల్ సారాంశం" : "Your Worker Profile & Wage Match"}</span>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <img 
                src={workerProfile.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} 
                alt="Profile" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }}
              />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{workerProfile.name || 'Ravi Kumar'}</h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  📍 {getDistrictDisplay(workerProfile.district || 'Guntur District', lang)}
                </p>
                <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '700', marginTop: '2px' }}>
                  ★ {workerProfile.rating || 4.8} ({workerProfile.total_jobs_done || 42} completed)
                </div>
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                {t('lbl_expected_wage')}:
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                ₹{workerProfile.expected_wage || 450} <span style={{ fontSize: '13px', fontWeight: '500' }}>{t('per_day')}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                {t('lbl_primary_skills')}:
              </span>
              <div className="worker-tags">
                {(workerProfile.primary_skills || 'Harvesting, Seeding, Pruning').split(',').map((s, i) => (
                  <span key={i} className="tag-pill skill">
                    {getSkillDisplay(s.trim(), lang)}
                  </span>
                ))}
              </div>
            </div>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
              onClick={() => onNavigateTab('profile')}
            >
              {lang === 'te' ? "ప్రొఫైల్ నవీకరించండి" : "Update Profile & Skills"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
