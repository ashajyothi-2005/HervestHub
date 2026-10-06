import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { 
  translations, 
  CROPS, 
  DISTRICTS, 
  SKILLS,
  getCropDisplay,
  getDistrictDisplay,
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';

export default function FarmerDashboard({ 
  lang = 'en', 
  jobs = [], 
  workers = [], 
  applications = [],
  onOpenCreateJob, 
  onNavigateTab,
  onSelectJobForMatching 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  // Quick ML Playground state for farmer
  const [quickCalc, setQuickCalc] = useState({
    crop_type: 'Paddy',
    district: 'Guntur District',
    mandi_season: 'Kharif',
    weather_condition: 'Sunny / Dry'
  });
  const [quickWage, setQuickWage] = useState(455.0);
  const [quickDemand, setQuickDemand] = useState(42);
  const [loadingQuick, setLoadingQuick] = useState(false);

  useEffect(() => {
    runQuickForecast();
  }, [quickCalc]);

  const runQuickForecast = async () => {
    setLoadingQuick(true);
    try {
      const [wageRes, demandRes] = await Promise.all([
        api.predictWage(quickCalc),
        api.predictJobs(quickCalc)
      ]);
      setQuickWage(wageRes.predicted_market_wage);
      setQuickDemand(demandRes.predicted_jobs_next_week);
    } catch (e) {
      console.warn('Forecast error:', e);
    } finally {
      setLoadingQuick(false);
    }
  };

  const pendingApps = applications.filter(a => a.status === 'Pending').length;

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="role-hero farmer">
        <div>
          <h2>{t('dash_farmer_title')}</h2>
          <p>{t('dash_farmer_sub')}</p>
        </div>
        <div className="hero-actions">
          <button className="btn-secondary" onClick={onOpenCreateJob}>
            <PlusCircle size={16} color="#16a34a" />
            {t('nav_create_job')}
          </button>
          <button className="btn-secondary" onClick={() => onNavigateTab('disease')}>
            <Sparkles size={16} color="#16a34a" />
            {t('nav_disease_detect')}
          </button>
        </div>
      </div>

      {/* Top 5 Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigateTab('my-jobs')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper green">
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_active_jobs')}</h4>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-sub">{lang === 'te' ? "ఫీల్డ్ లో అమలులో ఉన్నాయి" : "Active farm openings"}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('matching')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper amber">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_workers_available')}</h4>
            <div className="stat-value">{workers.length}</div>
            <div className="stat-sub">{lang === 'te' ? "ధృవీకరించబడిన కూలీలు" : "Verified local labourers"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_market_wage_avg')}</h4>
            <div className="stat-value">₹{quickWage}</div>
            <div className="stat-sub">{t('lbl_predicted_wage')} {t('per_day')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_labour_demand')}</h4>
            <div className="stat-value">{quickDemand}</div>
            <div className="stat-sub">{t('workers_unit')} {lang === 'te' ? "వచ్చే వారం అవసరం" : "needed next week"}</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('applications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper purple">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>{t('stat_pending_apps')}</h4>
            <div className="stat-value">{pendingApps}</div>
            <div className="stat-sub">{lang === 'te' ? "సమీక్షకు సిద్ధంగా ఉన్నాయి" : "Awaiting review"}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Jobs + ML Quick Forecast Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Left Side: Active Farm Jobs & Worker Match Triggers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Briefcase size={20} color="#16a34a" />
              <span>{t('lbl_active_jobs')} ({jobs.length})</span>
            </div>
            <button 
              className="btn-primary" 
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={onOpenCreateJob}
            >
              <PlusCircle size={14} />
              {t('nav_create_job')}
            </button>
          </div>

          <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                <p>{t('empty_no_jobs')}</p>
                <button className="btn-primary" style={{ marginTop: '12px' }} onClick={onOpenCreateJob}>
                  {t('btn_post_job')}
                </button>
              </div>
            ) : (
              jobs.slice(0, 4).map((job) => (
                <div 
                  key={job.id} 
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="crop-badge-lg" style={{ fontSize: '12px', padding: '4px 10px' }}>
                        🌾 {getCropDisplay(job.crop_type, lang)} • {getSkillDisplay(job.required_skill, lang)}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', marginTop: '6px' }}>
                        {getDistrictDisplay(job.district, lang)}
                      </h4>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#854d0e' }}>
                        ₹{job.offered_wage} <span style={{ fontSize: '11px', color: '#64748b' }}>{t('per_day')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                        {t('lbl_predicted_wage')}: ₹{job.predicted_market_wage || 450}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                    <span>👥 {job.workers_needed} {t('workers_unit')} {lang === 'te' ? "కావలెను" : "needed"}</span>
                    <span>⏳ {job.experience_required}+ {t('years_unit')}</span>
                    <span>📅 {job.job_date}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center' }}
                      onClick={() => {
                        if (onSelectJobForMatching) onSelectJobForMatching(job);
                        onNavigateTab('matching');
                      }}
                    >
                      <Users size={14} />
                      {t('btn_find_matches')}
                    </button>

                    <button 
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px' }}
                      onClick={() => onNavigateTab('applications')}
                    >
                      {t('nav_applications')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Real-time Agricultural ML Market Forecaster */}
        <div className="card">
          <div className="card-header" style={{ background: '#f8fafc' }}>
            <div className="card-title">
              <Sparkles size={20} color="#16a34a" />
              <span>{lang === 'te' ? "AI మార్కెట్ వేతన & డిమాండ్ ఇంటెలిజెన్స్" : "Live Market Wage & Labour Forecaster"}</span>
            </div>
          </div>

          <div className="card-body">
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              {lang === 'te' 
                ? "పంట, ప్రాంతం మరియు సీజన్ మార్చి ప్రస్తుత సరసమైన మార్కెట్ కూలీ మరియు కార్మికుల డిమాండ్‌ను లైవ్‌గా అంచనా వేయండి:"
                : "Select parameters to instantly calculate expected market rates and upcoming labour demand using the trained Gradient Boosting models:"}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">{t('lbl_crop_type')}</label>
                <select 
                  className="form-select"
                  value={quickCalc.crop_type}
                  onChange={(e) => setQuickCalc({ ...quickCalc, crop_type: e.target.value })}
                >
                  {CROPS.map(c => (
                    <option key={c.value} value={c.value}>{c.icon} {translations[lang]?.[c.labelKey] || c.value}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('lbl_district')}</label>
                <select 
                  className="form-select"
                  value={quickCalc.district}
                  onChange={(e) => setQuickCalc({ ...quickCalc, district: e.target.value })}
                >
                  {DISTRICTS.map(d => (
                    <option key={d.value} value={d.value}>{translations[lang]?.[d.labelKey] || d.value}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Callouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                  {t('lbl_predicted_wage')}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>
                  {loadingQuick ? '...' : `₹${quickWage}`}
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}> {t('per_day')}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '6px' }}>
                  ✓ {lang === 'te' ? "మార్కెట్ రేటు ధృవీకరించబడింది" : "Fair regional market rate"}
                </div>
              </div>

              <div style={{ background: '#e0f2fe', border: '1.5px solid #7dd3fc', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>
                  {t('lbl_predicted_demand')}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                  {loadingQuick ? '...' : `${quickDemand}`}
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}> {t('workers_unit')}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '6px' }}>
                  ✓ {lang === 'te' ? "వచ్చే వారం అంచనా" : "District 7-day projection"}
                </div>
              </div>
            </div>

            {/* AI Plant Disease Feature Card */}
            <div 
              style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #166534, #14532d)',
                borderRadius: '14px',
                padding: '18px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => onNavigateTab('disease')}
            >
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#86efac" />
                  {t('disease_title')}
                </h4>
                <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
                  {lang === 'te' ? "వరి, మిరప, పత్తి, చెరకు, గోధుమ ఆకుల తెగుళ్ల నివారణ" : "Diagnose Paddy, Chilli, Cotton, Sugarcane, Wheat diseases instantly."}
                </p>
              </div>
              <ArrowUpRight size={20} color="#86efac" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
