import React, { useState } from 'react';
import { Calendar, CloudSun, Layers, MapPin, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react';
import { api } from '../services/api';
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

const DEFAULT_DATE = new Date().toISOString().split('T')[0];

export default function CombinedForecastPredictor({ lang = 'en', showToast }) {
  const t = (key) => translations[lang]?.[key] || key;
  const [formData, setFormData] = useState({
    date: DEFAULT_DATE,
    mandi_season: 'Kharif',
    district: 'Guntur District',
    crop_type: 'Paddy',
    weather_condition: 'Sunny / Dry',
    historical_labour_demanded: 60,
    historical_labour_supplied: 45,
    acres: 1
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const explanationLines = (result?.explanation
    ? result.explanation.split(/\r?\n/)
    : [result
      ? 'English: AI explanation is unavailable; the model predictions are shown above. | తెలుగు: AI వివరణ అందుబాటులో లేదు; మోడల్ అంచనాలు పైన చూపబడ్డాయి.'
      : 'English: Enter your farm details to get both predictions. | తెలుగు: రెండు అంచనాలు పొందడానికి వ్యవసాయ వివరాలు నమోదు చేయండి.'])
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  const setField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const forecast = await api.predictCombinedForecast({ ...formData, lang });
      setResult(forecast);
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '12px' }}><Layers size={28} color="#0369a1" /></div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {lang === 'te' ? 'మార్కెట్ కూలీ & కూలీల అవసరం' : 'Market Wage & Labour Demand'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' ? 'ఒకే వివరాలతో ఉన్న రెండు ప్రస్తుత ML మోడళ్ల అంచనాలను చూడండి.' : 'Use one set of farm details for both existing ML predictions.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header"><div className="card-title"><Layers size={18} color="#0284c7" /><span>{lang === 'te' ? 'వ్యవసాయ వివరాలు' : 'Farm Details'}</span></div></div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">🌾 {t('lbl_crop_type')}</label>
              <select className="form-select" value={formData.crop_type} onChange={(event) => setField('crop_type', event.target.value)}>
                {CROPS.map((crop) => <option key={crop.value} value={crop.value}>{crop.icon} {t(crop.labelKey)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><MapPin size={15} /> {t('lbl_district')}</label>
              <select className="form-select" value={formData.district} onChange={(event) => setField('district', event.target.value)}>
                {DISTRICTS.map((district) => <option key={district.value} value={district.value}>{t(district.labelKey)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('lbl_mandi_season')}</label>
              <select className="form-select" value={formData.mandi_season} onChange={(event) => setField('mandi_season', event.target.value)}>
                {MANDI_SEASONS.map((season) => <option key={season.value} value={season.value}>{t(season.labelKey)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><CloudSun size={15} /> {t('lbl_weather_condition')}</label>
              <select className="form-select" value={formData.weather_condition} onChange={(event) => setField('weather_condition', event.target.value)}>
                {WEATHER_CONDITIONS.map((weather) => <option key={weather.value} value={weather.value}>{weather.icon} {t(weather.labelKey)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><Calendar size={15} /> {t('lbl_job_date')}</label>
              <input className="form-input" type="date" value={formData.date} onChange={(event) => setField('date', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'te' ? 'భూమి విస్తీర్ణం (ఎకరాలు)' : 'Land Area (Acres)'}</label>
              <input className="form-input" type="number" min="0.1" step="0.1" required value={formData.acres} onChange={(event) => setField('acres', Number(event.target.value))} />
              <small style={{ color: '#64748b' }}>{lang === 'te' ? 'వివరణలో ఉపయోగిస్తాం; ప్రస్తుత మోడల్ ఎకరాలను నేరుగా ఉపయోగించదు.' : 'Used as context in the explanation; the existing models do not directly use acreage.'}</small>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">{t('lbl_historical_demanded')}</label>
                <input className="form-input" type="number" min="0" value={formData.historical_labour_demanded} onChange={(event) => setField('historical_labour_demanded', Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('lbl_historical_supplied')}</label>
                <input className="form-input" type="number" min="0" value={formData.historical_labour_supplied} onChange={(event) => setField('historical_labour_supplied', Number(event.target.value))} />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? <><RefreshCw size={16} className="spin" /> {lang === 'te' ? 'లెక్కిస్తోంది...' : 'Calculating...'}</> : <><Sparkles size={16} /> {lang === 'te' ? 'రెండు అంచనాలు పొందండి' : 'Get Both Predictions'}</>}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px', border: '2px solid #86efac' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '800' }}><TrendingUp size={20} /> {t('lbl_predicted_wage')}</div>
            <div style={{ fontSize: '34px', fontWeight: '800', color: '#14532d', marginTop: '12px' }}>{result ? `₹${result.predicted_market_wage}` : '—'} <small style={{ fontSize: '14px' }}>{t('per_day')}</small></div>
          </div>
          <div className="card" style={{ padding: '24px', border: '2px solid #7dd3fc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '800' }}><Users size={20} /> {t('lbl_predicted_demand')}</div>
            <div style={{ fontSize: '34px', fontWeight: '800', color: '#0369a1', marginTop: '12px' }}>{result ? result.predicted_jobs_next_week : '—'} <small style={{ fontSize: '14px' }}>{t('workers_unit')}</small></div>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <ul style={{ color: '#475569', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
              {explanationLines.map((line, index) => <li key={index} style={{ marginBottom: '8px' }}>{line}</li>)}
            </ul>
            {result && <small style={{ color: '#64748b' }}>{getCropDisplay(formData.crop_type, lang)} · {getDistrictDisplay(formData.district, lang)} · {getSeasonDisplay(formData.mandi_season, lang)} · {getWeatherDisplay(formData.weather_condition, lang)} · {formData.acres} {lang === 'te' ? 'ఎకరాలు' : 'acres'}</small>}
          </div>
        </div>
      </div>
    </div>
  );
}