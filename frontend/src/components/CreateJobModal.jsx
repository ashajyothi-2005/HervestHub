import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  translations, 
  CROPS, 
  MANDI_SEASONS, 
  DISTRICTS, 
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

export default function CreateJobModal({ isOpen, onClose, lang = 'en', onJobCreated, showToast }) {
  const t = (key) => translations[lang]?.[key] || key;

  const [formData, setFormData] = useState({
    crop_type: 'Paddy',
    required_skill: 'Harvesting',
    workers_needed: 8,
    district: 'Guntur District',
    mandi_season: 'Kharif',
    weather_condition: 'Sunny / Dry',
    job_date: new Date().toISOString().split('T')[0],
    experience_required: 2,
    offered_wage: 450,
    historical_labour_demanded: 65,
    historical_labour_supplied: 50,
    description: ''
  });

  const [predictedWage, setPredictedWage] = useState(null);
  const [predictedDemand, setPredictedDemand] = useState(null);
  const [matchedWorkersPreview, setMatchedWorkersPreview] = useState([]);
  const [loadingWage, setLoadingWage] = useState(false);
  const [loadingDemand, setLoadingDemand] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto calculate ML predictions when key agricultural inputs change
  useEffect(() => {
    if (isOpen) {
      handleRunAllPredictions();
    }
  }, [formData.crop_type, formData.district, formData.mandi_season, formData.weather_condition, formData.required_skill, isOpen]);

  const handleRunAllPredictions = async () => {
    // 1. Predict Wage
    setLoadingWage(true);
    try {
      const res = await api.predictWage(formData);
      setPredictedWage(res.predicted_market_wage);
    } catch (e) {
      console.warn('Wage prediction error:', e);
    } finally {
      setLoadingWage(false);
    }

    // 2. Predict Labour Demand
    setLoadingDemand(true);
    try {
      const res = await api.predictJobs(formData);
      setPredictedDemand(res.predicted_jobs_next_week);
    } catch (e) {
      console.warn('Demand prediction error:', e);
    } finally {
      setLoadingDemand(false);
    }

    // 3. Match Available Workers
    setLoadingMatches(true);
    try {
      const res = await api.matchWorkersForJob({
        ...formData,
        farmer_rating: 4.8
      });
      if (res && res.matched_workers) {
        setMatchedWorkersPreview(res.matched_workers.slice(0, 3));
      }
    } catch (e) {
      console.warn('Worker matching preview error:', e);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const jobPayload = {
        ...formData,
        farmer_name: lang === 'te' ? "రైతు అప్పారావు (Appa Rao)" : "Farmer Appa Rao",
        farmer_id: "f1",
        farmer_rating: 4.8,
        predicted_market_wage: predictedWage || 450,
        predicted_labour_demand: predictedDemand || 30
      };

      const result = await api.createJob(jobPayload);
      if (result.success) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (_) {}
        showToast(t('msg_job_posted_success'), 'success');
        if (onJobCreated) onJobCreated(result.job);
        onClose();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        
        {/* Modal Header */}
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #15803d, #14532d)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={22} color="#86efac" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{t('nav_create_job')}</h3>
              <p style={{ fontSize: '12px', opacity: 0.85 }}>{t('brand_sub')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          <div className="form-grid">
            {/* Crop Selection */}
            <div className="form-group">
              <label className="form-label">
                <span>🌾</span> {t('lbl_crop_type')}
              </label>
              <select 
                className="form-select"
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              >
                {CROPS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {translations[lang]?.[c.labelKey] || c.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Required Skill */}
            <div className="form-group">
              <label className="form-label">
                <span>🛠️</span> {t('lbl_required_skill')}
              </label>
              <select 
                className="form-select"
                value={formData.required_skill}
                onChange={(e) => setFormData({ ...formData, required_skill: e.target.value })}
              >
                {SKILLS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {translations[lang]?.[s.labelKey] || s.value}
                  </option>
                ))}
              </select>
            </div>

            {/* District / Region */}
            <div className="form-group">
              <label className="form-label">
                <MapPin size={15} color="#16a34a" /> {t('lbl_district')}
              </label>
              <select 
                className="form-select"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              >
                {DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {translations[lang]?.[d.labelKey] || d.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandi Season */}
            <div className="form-group">
              <label className="form-label">
                <span>📅</span> {t('lbl_mandi_season')}
              </label>
              <select 
                className="form-select"
                value={formData.mandi_season}
                onChange={(e) => setFormData({ ...formData, mandi_season: e.target.value })}
              >
                {MANDI_SEASONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {translations[lang]?.[m.labelKey] || m.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather Condition */}
            <div className="form-group">
              <label className="form-label">
                <span>🌤️</span> {t('lbl_weather_condition')}
              </label>
              <select 
                className="form-select"
                value={formData.weather_condition}
                onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
              >
                {WEATHER_CONDITIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.icon} {translations[lang]?.[w.labelKey] || w.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Workers Needed */}
            <div className="form-group">
              <label className="form-label">
                <Users size={15} color="#16a34a" /> {t('lbl_workers_needed')}
              </label>
              <input 
                type="number" 
                min="1" 
                max="200"
                className="form-input"
                value={formData.workers_needed}
                onChange={(e) => setFormData({ ...formData, workers_needed: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Required Experience */}
            <div className="form-group">
              <label className="form-label">
                <ShieldCheck size={15} color="#16a34a" /> {t('lbl_experience_req')}
              </label>
              <input 
                type="number" 
                min="0" 
                max="30"
                className="form-input"
                value={formData.experience_required}
                onChange={(e) => setFormData({ ...formData, experience_required: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Farmer Offered Wage (Separate from Market Wage) */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#854d0e' }}>
                <DollarSign size={15} color="#d97706" /> {t('lbl_offered_wage')}
              </label>
              <input 
                type="number" 
                step="10"
                min="100" 
                max="3000"
                className="form-input"
                style={{ borderColor: '#fde047', background: '#fefce8', fontWeight: '800' }}
                value={formData.offered_wage}
                onChange={(e) => setFormData({ ...formData, offered_wage: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Job Date */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={15} color="#16a34a" /> {t('lbl_job_date')}
              </label>
              <input 
                type="date" 
                className="form-input"
                value={formData.job_date}
                onChange={(e) => setFormData({ ...formData, job_date: e.target.value })}
              />
            </div>

            {/* Job Description */}
            <div className="form-group full-width">
              <label className="form-label">
                {t('lbl_job_description')}
              </label>
              <textarea 
                className="form-textarea"
                placeholder={lang === 'te' ? "ఉదా: తెనాలి గ్రామీణ ప్రాంతంలో 5 ఎకరాల్లో వరి కోతకు అనుభవజ్ఞులైన కూలీలు కావలెను..." : "e.g., 5 acres paddy harvesting in Tenali rural, immediate work starting this week..."}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* AI Intelligence Live Prediction Suite */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#16a34a" /> 
                {lang === 'te' ? "AI అంచనాలు & మార్కెట్ ఇంటెలిజెన్స్" : "AI Market & Labour Intelligence"}
              </h4>
              <button 
                type="button"
                onClick={handleRunAllPredictions}
                style={{ background: 'transparent', border: 'none', color: '#16a34a', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {lang === 'te' ? "తిరిగి లెక్కించండి" : "Recalculate AI"}
              </button>
            </div>

            <div className="prediction-box-grid">
              {/* Predicted Market Wage */}
              <div className="prediction-card">
                <h4>{t('lbl_predicted_wage')}</h4>
                <div className="pred-value">
                  {loadingWage ? (
                    <span style={{ fontSize: '16px', color: '#94a3b8' }}>Analyzing...</span>
                  ) : (
                    <>
                      ₹{predictedWage !== null ? predictedWage : '450.00'}
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{t('per_day')}</span>
                    </>
                  )}
                </div>
                <div className="pred-badge">
                  <TrendingUp size={12} />
                  <span>ML Gradient Boosting Regressor</span>
                </div>
              </div>

              {/* Predicted Labour Demand */}
              <div className="prediction-card">
                <h4>{t('lbl_predicted_demand')}</h4>
                <div className="pred-value">
                  {loadingDemand ? (
                    <span style={{ fontSize: '16px', color: '#94a3b8' }}>Forecasting...</span>
                  ) : (
                    <>
                      {predictedDemand !== null ? predictedDemand : '35'}
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}> {t('workers_unit')}</span>
                    </>
                  )}
                </div>
                <div className="pred-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <Users size={12} />
                  <span>Regional Forecast (Next Week)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Matched Suitable Workers Preview */}
          {matchedWorkersPreview.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#16a34a" /> 
                {lang === 'te' ? "ఈ పనికి తక్షణమే సరిపోయే కూలీలు" : "Top Matching Suitable Workers Available Now"}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {matchedWorkersPreview.map((w) => (
                  <div key={w.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px' }}>{w.name}</span>
                      <span className="match-badge high" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {w.matching_score}% Match
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      ★ {w.rating} • {w.experience_years} {t('years_unit')} • {w.calculated_distance_km || 6} km
                    </div>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                      Exp Wage: ₹{w.expected_wage} {t('per_day')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {t('btn_close')}
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              <Briefcase size={16} />
              {submitting ? (lang === 'te' ? "పోస్ట్ చేస్తోంది..." : "Posting Job...") : t('btn_post_job')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
