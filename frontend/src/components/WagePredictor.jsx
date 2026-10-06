import React, { useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  MapPin, 
  CloudSun, 
  TrendingUp, 
  Sparkles, 
  RefreshCw,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { 
  translations, 
  CROPS, 
  MANDI_SEASONS, 
  DISTRICTS, 
  WEATHER_CONDITIONS,
  getCropDisplay,
  getDistrictDisplay,
  getSeasonDisplay,
  getWeatherDisplay
} from '../translations';
import { api } from '../services/api';

export default function WagePredictor({ lang = 'en', showToast }) {
  const t = (key) => translations[lang]?.[key] || key;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mandi_season: 'Kharif',
    district: 'Guntur District',
    crop_type: 'Paddy',
    weather_condition: 'Sunny / Dry',
    historical_labour_demanded: 60,
    historical_labour_supplied: 45
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictWage(formData);
      setPrediction(res.predicted_market_wage);
      if (showToast) {
        showToast(
          lang === 'te' 
            ? `మార్కెట్ కూలీ అంచనా: ₹${res.predicted_market_wage}/రోజు` 
            : `Predicted Market Wage: ₹${res.predicted_market_wage}/day`,
          'success'
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>
            <DollarSign size={28} color="#15803d" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('btn_predict_wage')} – {lang === 'te' ? "మార్కెట్ కూలీ అంచనా మోడల్" : "Market Wage ML Model"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "పంట, సీజన్, ప్రాంతం మరియు వాతావరణ పరిస్థితుల ఆధారంగా Gradient Boosting Regressor మోడల్ మార్కెట్ కూలీని లెక్కిస్తుంది."
                : "Predicts expected daily agricultural wages using the trained Gradient Boosting Regressor based on seasonal and district trends."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Input Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} color="#16a34a" />
              <span>{lang === 'te' ? "మోడల్ ఇన్‌పుట్ పారామితులు" : "Model Input Features"}</span>
            </div>
          </div>

          <form onSubmit={handlePredict} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Crop Type */}
            <div className="form-group">
              <label className="form-label">🌾 {t('lbl_crop_type')}</label>
              <select 
                className="form-select"
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              >
                {CROPS.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {translations[lang]?.[c.labelKey] || c.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Region / District */}
            <div className="form-group">
              <label className="form-label"><MapPin size={15} color="#16a34a" /> {t('lbl_district')}</label>
              <select 
                className="form-select"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              >
                {DISTRICTS.map(d => (
                  <option key={d.value} value={d.value}>
                    {translations[lang]?.[d.labelKey] || d.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandi Season */}
            <div className="form-group">
              <label className="form-label">📅 {t('lbl_mandi_season')}</label>
              <select 
                className="form-select"
                value={formData.mandi_season}
                onChange={(e) => setFormData({ ...formData, mandi_season: e.target.value })}
              >
                {MANDI_SEASONS.map(m => (
                  <option key={m.value} value={m.value}>
                    {translations[lang]?.[m.labelKey] || m.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather Condition */}
            <div className="form-group">
              <label className="form-label"><CloudSun size={15} color="#16a34a" /> {t('lbl_weather_condition')}</label>
              <select 
                className="form-select"
                value={formData.weather_condition}
                onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
              >
                {WEATHER_CONDITIONS.map(w => (
                  <option key={w.value} value={w.value}>
                    {w.icon} {translations[lang]?.[w.labelKey] || w.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label"><Calendar size={15} color="#16a34a" /> {t('lbl_job_date')}</label>
              <input 
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* Historical Demand & Supply */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px' }}>{t('lbl_historical_demanded')}</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.historical_labour_demanded}
                  onChange={(e) => setFormData({ ...formData, historical_labour_demanded: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px' }}>{t('lbl_historical_supplied')}</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.historical_labour_supplied}
                  onChange={(e) => setFormData({ ...formData, historical_labour_supplied: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {lang === 'te' ? "అంచనా వేస్తోంది..." : "Calculating..."}
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {t('btn_predict_wage')}
                </>
              )}
            </button>

          </form>
        </div>

        {/* Prediction Output Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px', textAlign: 'center', background: 'linear-gradient(135deg, #ffffff, #f0fdf4)', border: '2px solid #86efac' }}>
            
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <TrendingUp size={28} color="#15803d" />
            </div>

            <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('lbl_predicted_wage')}
            </span>

            <div style={{ fontSize: '42px', fontWeight: '800', color: '#14532d', margin: '10px 0' }}>
              {prediction !== null ? `₹${prediction}` : '₹481.34'}
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}> {t('per_day')}</span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '700', margin: '0 auto' }}>
              <CheckCircle2 size={14} />
              <span>Endpoint: <code>/predict_wage</code></span>
            </div>

            <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
              <div style={{ fontWeight: '700', marginBottom: '6px', color: '#0f172a' }}>
                {lang === 'te' ? "ఎంపిక చేసిన పారామితులు:" : "Configured Inputs:"}
              </div>
              <div>• {t('lbl_crop_type')}: <strong>{getCropDisplay(formData.crop_type, lang)}</strong></div>
              <div>• {t('lbl_district')}: <strong>{getDistrictDisplay(formData.district, lang)}</strong></div>
              <div>• {t('lbl_mandi_season')}: <strong>{getSeasonDisplay(formData.mandi_season, lang)}</strong></div>
              <div>• {t('lbl_weather_condition')}: <strong>{getWeatherDisplay(formData.weather_condition, lang)}</strong></div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
