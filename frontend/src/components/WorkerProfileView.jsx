import React, { useState } from 'react';
import { 
  UserCheck, 
  DollarSign, 
  ShieldCheck, 
  Save, 
  Phone, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { 
  translations, 
  SKILLS,
  getDistrictDisplay,
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';
import LocationFields from './LocationFields';

export default function WorkerProfileView({ 
  lang = 'en', 
  workerProfile = {}, 
  onSaveProfile, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const [formData, setFormData] = useState({
    name: workerProfile.name || 'Ravi Kumar',
    district: workerProfile.district || 'Guntur District',
    location: workerProfile.location || '',
    location_latitude: workerProfile.location_latitude ?? null,
    location_longitude: workerProfile.location_longitude ?? null,
    experience_years: workerProfile.experience_years || 5,
    expected_wage: workerProfile.expected_wage || 450,
    phone: workerProfile.phone || '+91 98480 12345',
    primary_skills: workerProfile.primary_skills || 'Harvesting, Seeding, Pruning',
    rating: workerProfile.rating || 4.8,
    total_jobs_done: workerProfile.total_jobs_done || 42
  });

  const [saving, setSaving] = useState(false);

  // Skill toggle
  const currentSkillsArray = formData.primary_skills.split(',').map(s => s.trim()).filter(Boolean);

  const toggleSkill = (skillValue) => {
    let updated;
    if (currentSkillsArray.includes(skillValue)) {
      updated = currentSkillsArray.filter(s => s !== skillValue);
    } else {
      updated = [...currentSkillsArray, skillValue];
    }
    setFormData({ ...formData, primary_skills: updated.join(', ') });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSaveProfile) {
        onSaveProfile(formData);
      }
      showToast(t('msg_profile_saved'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
            <UserCheck size={28} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('nav_profile')} – {lang === 'te' ? "కార్మిక ప్రొఫైల్ నిర్వహణ" : "Agricultural Worker Profile"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "మీ నైపుణ్యాలు మరియు అంచనా వేతనాన్ని ఖచ్చితంగా నమోదు చేస్తే సరిపడే పనుల సిఫార్సులు మెరుగుపడతాయి."
                : "Accurate skills and wage preferences ensure the ML matching algorithm delivers optimal job recommendations."}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          
          <div className="form-grid">
            {/* Worker Name */}
            <div className="form-group">
              <label className="form-label">{t('lbl_worker_name')}</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">{t('lbl_phone')}</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <LocationFields
              district={formData.district}
              location={formData.location}
              lang={lang}
              onChange={(updates) => setFormData({ ...formData, ...updates })}
            />

            {/* Experience */}
            <div className="form-group">
              <label className="form-label">{t('lbl_experience_req')}</label>
              <input 
                type="number" 
                min="0" 
                max="35"
                className="form-input"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            {/* Expected Wage */}
            <div className="form-group full-width">
              <label className="form-label" style={{ color: '#854d0e' }}>
                <DollarSign size={16} color="#d97706" /> {t('lbl_expected_wage')}
              </label>
              <input 
                type="number" 
                step="10"
                min="200" 
                max="2000"
                className="form-input"
                style={{ borderColor: '#fde047', background: '#fefce8', fontWeight: '800', fontSize: '16px' }}
                value={formData.expected_wage}
                onChange={(e) => setFormData({ ...formData, expected_wage: parseFloat(e.target.value) || 400 })}
                required
              />
            </div>

            {/* Skills Multi-Select Chips */}
            <div className="form-group full-width">
              <label className="form-label">
                {t('lbl_primary_skills')} {lang === 'te' ? "(మీ నైపుణ్యాలను ఎంచుకోండి)" : "(Select all skills you perform)"}
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '6px' }}>
                {SKILLS.map((s) => {
                  const isSelected = currentSkillsArray.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSkill(s.value)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        color: isSelected ? '#15803d' : '#475569',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>{s.icon} {translations[lang]?.[s.labelKey] || s.value}</span>
                      {isSelected && <CheckCircle2 size={16} color="#16a34a" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? (lang === 'te' ? "భద్రపరుస్తోంది..." : "Saving...") : t('btn_save_profile')}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
