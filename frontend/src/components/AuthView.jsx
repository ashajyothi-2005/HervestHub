import React, { useState } from 'react';
import { Briefcase, Sprout } from 'lucide-react';
import { api } from '../services/api';
import { DISTRICTS, SKILLS, translations } from '../translations';
import LocationFields from './LocationFields';

export default function AuthView({ lang = 'en', setCurrentLang, onAuthenticated, showToast }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('farmer');
  const [form, setForm] = useState({ name: '', phone: '', password: '', district: 'Guntur District', location: '', location_latitude: null, location_longitude: null, primary_skills: 'Harvesting', experience_years: 0, expected_wage: 450 });
  const t = (key) => translations[lang]?.[key] || key;
  const text = (english, telugu) => lang === 'te' ? telugu : english;
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = mode === 'register'
        ? await api.register({ ...form, role })
        : await api.login({ phone: form.phone, password: form.password, role });
      onAuthenticated({ ...result.user, role: result.role });
    } catch (error) {
      showToast?.(error.message, 'error');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ width: 'min(100%, 480px)' }}>
        <header style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ color: '#14532d', marginBottom: '6px' }}>{t('brand_name')}</h1>
          <p style={{ color: '#64748b' }}>{text('Sign in or create your farmer/worker account', 'లాగిన్ అవ్వండి లేదా రైతు/కార్మిక ఖాతా సృష్టించండి')}</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13px' }}>
            {text('Language', 'భాష')}
            <select className="form-select" value={lang} onChange={(event) => setCurrentLang?.(event.target.value)} style={{ width: 'auto' }}>
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </label>
        </header>
        <section className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px' }}>
            <button type="button" className={role === 'farmer' ? 'btn-primary' : 'btn-secondary'} onClick={() => setRole('farmer')}><Sprout size={16} /> {text('Farmer', 'రైతు')}</button>
            <button type="button" className={role === 'worker' ? 'btn-primary' : 'btn-secondary'} onClick={() => setRole('worker')}><Briefcase size={16} /> {text('Worker', 'కార్మికుడు')}</button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ margin: 0 }}>{mode === 'login' ? text('Sign in', 'లాగిన్') : text('Create account', 'ఖాతా సృష్టించండి')}</h2>
            {mode === 'register' && role === 'worker' && <LocationFields
              district={form.district}
              location={form.location}
              lang={lang}
              onChange={(updates) => setForm((current) => ({ ...current, ...updates }))}
            />}
            {mode === 'register' && <div className="form-group">
              <label className="form-label">{text('Name', 'పేరు')}</label>
              <input className="form-input" required value={form.name} onChange={(event) => setField('name', event.target.value)} />
            </div>}
            <div className="form-group">
              <label className="form-label">{text('Phone number', 'ఫోన్ నంబర్')}</label>
              <input className="form-input" type="tel" autoComplete="tel" required value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
            </div>
            {mode === 'register' && <div className="form-group">
              <label className="form-label">{t('lbl_district')}</label>
              <select className="form-select" value={form.district} onChange={(event) => setField('district', event.target.value)}>
                {DISTRICTS.map((district) => <option key={district.value} value={district.value}>{t(district.labelKey)}</option>)}
              </select>
            </div>}
            {mode === 'register' && role === 'worker' && <>
              <div className="form-group">
                <label className="form-label">{t('lbl_experience_req')}</label>
                <input className="form-input" type="number" min="0" max="60" value={form.experience_years} onChange={(event) => setField('experience_years', Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('lbl_primary_skills')}</label>
                <select className="form-select" value={form.primary_skills} onChange={(event) => setField('primary_skills', event.target.value)}>
                  {SKILLS.map((skill) => <option key={skill.value} value={skill.value}>{t(skill.labelKey)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('lbl_expected_wage')}</label>
                <input className="form-input" type="number" min="0" value={form.expected_wage} onChange={(event) => setField('expected_wage', Number(event.target.value))} />
              </div>
            </>}
            <div className="form-group">
              <label className="form-label">{text('Password', 'పాస్‌వర్డ్')}</label>
              <input className="form-input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={form.password} onChange={(event) => setField('password', event.target.value)} />
              {mode === 'register' && <small style={{ color: '#64748b' }}>{text('Use at least 8 characters.', 'కనీసం 8 అక్షరాలు ఉపయోగించండి.')}</small>}
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center', padding: '12px' }}>
              {mode === 'login' ? text('Sign in', 'లాగిన్') : text('Register', 'నమోదు చేయండి')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? text('New here? Create an account', 'కొత్తవారా? ఖాతా సృష్టించండి') : text('Already registered? Sign in', 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}