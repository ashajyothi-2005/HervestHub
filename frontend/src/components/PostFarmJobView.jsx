import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  PlusCircle, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  CloudSun 
} from 'lucide-react';
import { 
  translations, 
  CROPS, 
  MANDI_SEASONS, 
  WEATHER_CONDITIONS, 
  SKILLS,
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay,
  getSeasonDisplay,
  getWeatherDisplay 
} from '../translations';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import LocationFields from './LocationFields';

export default function PostFarmJobView({ lang = 'en', jobs = [], user, onRefreshData, showToast }) {
  const t = (key) => translations[lang]?.[key] || key;

  const [formData, setFormData] = useState({
    crop_type: 'Paddy',
    required_skill: 'Harvesting',
    workers_needed: 10,
    district: 'Guntur District',
    location: '',
    location_latitude: null,
    location_longitude: null,
    mandi_season: 'Kharif',
    weather_condition: 'Sunny / Dry',
    job_date: new Date().toISOString().split('T')[0],
    experience_required: 2,
    offered_wage: 460,
    historical_labour_demanded: 60,
    historical_labour_supplied: 45,
    acres: 1,
    description: ''
  });

  const [predictedWage, setPredictedWage] = useState(481.34);
  const [predictedDemand, setPredictedDemand] = useState(34);
  const [loadingPred, setLoadingPred] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    runPredictions();
  }, [formData.crop_type, formData.district, formData.mandi_season, formData.weather_condition]);

  const runPredictions = async () => {
    setLoadingPred(true);
    try {
      const [w, d] = await Promise.all([
        api.predictWage(formData),
        api.predictJobs(formData)
      ]);
      setPredictedWage(w.predicted_market_wage);
      setPredictedDemand(d.predicted_jobs_next_week);
    } catch (e) {
      console.warn('Prediction error:', e);
    } finally {
      setLoadingPred(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        farmer_id: user?.id,
        farmer_name: user?.name,
        predicted_market_wage: predictedWage,
        predicted_labour_demand: predictedDemand
      };

      const res = await api.createJob(payload);
      if (res.success) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (_) {}
        showToast(t('msg_job_posted_success'), 'success');
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>
            <Briefcase size={28} color="#15803d" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('btn_post_job')} – {lang === 'te' ? "AI మార్కెట్ వేతన & డిమాండ్ ఆధారిత పని" : "AI Market Wage & Demand Informed Job Posting"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "పనిని సృష్టించే సమయంలోనే మార్కెట్ కూలీ మోడల్ మరియు కూలీల డిమాండ్ మోడల్ ప్రిడిక్షన్లను సరిచూసుకోండి."
                : "Creates agricultural job posts with integrated ML wage prediction and regional labour demand projections."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Create Job Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PlusCircle size={18} color="#16a34a" />
              <span>{lang === 'te' ? "వ్యవసాయ పని వివరాలు" : "Farm Job Form Inputs"}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label">🌾 {t('lbl_crop_type')}</label>
              <select className="form-select" value={formData.crop_type} onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}>
                {CROPS.map(c => <option key={c.value} value={c.value}>{c.icon} {translations[lang]?.[c.labelKey] || c.value}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">🛠️ {t('lbl_required_skill')}</label>
              <select className="form-select" value={formData.required_skill} onChange={(e) => setFormData({ ...formData, required_skill: e.target.value })}>
                {SKILLS.map(s => <option key={s.value} value={s.value}>{s.icon} {translations[lang]?.[s.labelKey] || s.value}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <LocationFields
                district={formData.district}
                location={formData.location}
                lang={lang}
                onChange={(updates) => setFormData({ ...formData, ...updates })}
              />

              <div className="form-group">
                <label className="form-label">📅 {t('lbl_mandi_season')}</label>
                <select className="form-select" value={formData.mandi_season} onChange={(e) => setFormData({ ...formData, mandi_season: e.target.value })}>
                  {MANDI_SEASONS.map(m => <option key={m.value} value={m.value}>{translations[lang]?.[m.labelKey] || m.value}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('lbl_acres')}</label>
              <input type="number" min="0.1" step="0.1" required className="form-input" value={formData.acres} onChange={(e) => setFormData({ ...formData, acres: parseFloat(e.target.value) || 0 })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label"><CloudSun size={15} color="#16a34a" /> {t('lbl_weather_condition')}</label>
                <select className="form-select" value={formData.weather_condition} onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}>
                  {WEATHER_CONDITIONS.map(w => <option key={w.value} value={w.value}>{w.icon} {translations[lang]?.[w.labelKey] || w.value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label"><Users size={15} color="#16a34a" /> {t('lbl_workers_needed')}</label>
                <input type="number" min="1" max="100" className="form-input" value={formData.workers_needed} onChange={(e) => setFormData({ ...formData, workers_needed: parseInt(e.target.value) || 1 })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label"><Calendar size={15} color="#16a34a" /> {t('lbl_job_date')}</label>
                <input type="date" className="form-input" value={formData.job_date} onChange={(e) => setFormData({ ...formData, job_date: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label"><ShieldCheck size={15} color="#16a34a" /> {t('lbl_experience_req')}</label>
                <input type="number" min="0" max="25" className="form-input" value={formData.experience_required} onChange={(e) => setFormData({ ...formData, experience_required: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {/* Farmer Offered Wage (Separate) */}
            <div className="form-group" style={{ background: '#fefce8', padding: '14px', borderRadius: '12px', border: '1.5px solid #fde047' }}>
              <label className="form-label" style={{ color: '#854d0e', fontWeight: '800' }}>
                <DollarSign size={16} color="#d97706" /> {t('lbl_offered_wage')}
              </label>
              <input 
                type="number"
                step="10"
                className="form-input"
                style={{ fontSize: '18px', fontWeight: '800', color: '#854d0e', borderColor: '#fde047' }}
                value={formData.offered_wage}
                onChange={(e) => setFormData({ ...formData, offered_wage: parseFloat(e.target.value) || 0 })}
              />
              <span style={{ fontSize: '11px', color: '#854d0e', marginTop: '4px' }}>
                {lang === 'te' ? "గమనిక: రైతు ఇచ్చే కూలీ మార్కెట్ వేతన మోడల్ అంచనా నుండి వేరుగా ఉంటుంది." : "Note: Farmer's offered wage remains independent from the ML predicted market wage."}
              </span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={submitting}>
              <Briefcase size={16} />
              {submitting ? (lang === 'te' ? "పోస్ట్ చేస్తోంది..." : "Posting...") : t('btn_post_job')}
            </button>

          </form>
        </div>

        {/* Live ML Intelligence Forecast Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff, #f0fdf4)', border: '2px solid #86efac' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp size={20} color="#15803d" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>
                {t('lbl_predicted_wage')} (/predict_wage)
              </span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#14532d' }}>
              ₹{predictedWage} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{t('per_day')}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#166534', marginTop: '6px' }}>
              {lang === 'te' ? "ఈ పంట మరియు జిల్లాకు ML మోడల్ అంచనా వేసిన మార్కెట్ కూలీ రేటు." : "Calculated using the trained Gradient Boosting Regressor for this region."}
            </p>
          </div>

          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff, #f0f9ff)', border: '2px solid #7dd3fc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={20} color="#0284c7" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
                {t('lbl_predicted_demand')} (/predict_jobs)
              </span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#0369a1' }}>
              {predictedDemand} <span style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>{t('workers_unit')}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#0369a1', marginTop: '6px' }}>
              {lang === 'te' ? "వచ్చే వారం ఈ జిల్లాలో అవసరమయ్యే కూలీల అంచనా." : "Projected regional agricultural labour demand for next 7 days."}
            </p>
          </div>

          {/* Active Posted Jobs List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: '15px' }}>
                <Briefcase size={16} color="#16a34a" />
                <span>{t('lbl_active_jobs')} ({jobs.length})</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {jobs.map((j) => (
                <div key={j.id} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '800', fontSize: '13px' }}>
                      {getCropDisplay(j.crop_type, lang)} ({getSkillDisplay(j.required_skill, lang)})
                    </span>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      📍 {[j.location, getDistrictDisplay(j.district, lang)].filter(Boolean).join(', ')} • {j.workers_needed} {t('workers_unit')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: '800', color: '#854d0e', fontSize: '14px' }}>
                    ₹{j.offered_wage}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
