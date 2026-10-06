import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Sparkles, 
  Briefcase, 
  CheckCircle2, 
  Star, 
  Send,
  X
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
import confetti from 'canvas-confetti';

export default function FindJobsView({ 
  lang = 'en', 
  jobs = [], 
  applications = [], 
  workerProfile = {}, 
  onRefreshData, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [minWage, setMinWage] = useState(300);

  // Apply Modal state
  const [applyingJob, setApplyingJob] = useState(null);
  const [applyNotes, setApplyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    if (selectedCrop !== 'all' && j.crop_type.toLowerCase() !== selectedCrop.toLowerCase()) return false;
    if (selectedDistrict !== 'all' && j.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    if (selectedSkill !== 'all' && j.required_skill.toLowerCase() !== selectedSkill.toLowerCase()) return false;
    if (Number(j.offered_wage) < Number(minWage)) return false;
    return true;
  });

  const isAlreadyApplied = (jobId) => {
    return applications.some(a => a.job_id === jobId && (a.worker_id === workerProfile.id || a.worker_id === 'w1'));
  };

  const handleOpenApplyModal = (job) => {
    setApplyingJob(job);
    setApplyNotes(lang === 'te' ? "నేను ఈ పనికి అందుబాటులో ఉన్నాను మరియు అనుభవం ఉంది." : "I have relevant experience and am available for this job.");
  };

  const handleConfirmApply = async () => {
    if (!applyingJob) return;
    setSubmitting(true);

    try {
      const payload = {
        job_id: applyingJob.id,
        job_title: `${applyingJob.crop_type} ${applyingJob.required_skill}`,
        crop_type: applyingJob.crop_type,
        district: applyingJob.district,
        farmer_name: applyingJob.farmer_name,
        worker_id: workerProfile.id || 'w1',
        worker_name: workerProfile.name || 'Ravi Kumar',
        worker_rating: workerProfile.rating || 4.8,
        worker_experience: workerProfile.experience_years || 5,
        worker_skills: workerProfile.primary_skills || 'Harvesting, Seeding',
        expected_wage: workerProfile.expected_wage || 450,
        offered_wage: applyingJob.offered_wage,
        distance_km: 6.5,
        matching_score: 93,
        notes: applyNotes
      };

      const res = await api.createApplication(payload);
      if (res.success) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch (_) {}
        showToast(t('msg_application_sent'), 'success');
        setApplyingJob(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header & Filter Controls */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            {t('nav_find_jobs')} ({filteredJobs.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            {lang === 'te' ? "మీ నైపుణ్యాలు, స్థానం మరియు ఆశించే కూలీకి సరిపోయే వ్యవసాయ పనులను శోధించండి." : "Browse open agricultural opportunities, inspect matching scores, and apply with one click."}
          </p>
        </div>

        {/* Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          
          {/* Crop Filter */}
          <div className="form-group">
            <label className="form-label">{t('lbl_crop_type')}</label>
            <select className="form-select" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
              <option value="all">{lang === 'te' ? "అన్ని పంటలు (All Crops)" : "All Crops"}</option>
              {CROPS.map(c => (
                <option key={c.value} value={c.value}>{translations[lang]?.[c.labelKey] || c.value}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="form-group">
            <label className="form-label">{t('lbl_district')}</label>
            <select className="form-select" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
              <option value="all">{lang === 'te' ? "అన్ని జిల్లాలు (All Districts)" : "All Districts"}</option>
              {DISTRICTS.map(d => (
                <option key={d.value} value={d.value}>{translations[lang]?.[d.labelKey] || d.value}</option>
              ))}
            </select>
          </div>

          {/* Skill Filter */}
          <div className="form-group">
            <label className="form-label">{t('lbl_required_skill')}</label>
            <select className="form-select" value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
              <option value="all">{lang === 'te' ? "అన్ని నైపుణ్యాలు (All Skills)" : "All Skills"}</option>
              {SKILLS.map(s => (
                <option key={s.value} value={s.value}>{translations[lang]?.[s.labelKey] || s.value}</option>
              ))}
            </select>
          </div>

          {/* Min Wage */}
          <div className="form-group">
            <label className="form-label">{lang === 'te' ? "కనీస కూలీ (₹)" : "Min Wage (₹)"}: {minWage}</label>
            <input 
              type="range" 
              min="300" 
              max="700" 
              step="20"
              value={minWage}
              onChange={(e) => setMinWage(Number(e.target.value))}
              style={{ accentColor: '#16a34a', marginTop: '10px' }}
            />
          </div>

        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <Briefcase size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p>{t('empty_no_jobs')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredJobs.map((job) => {
            const applied = isAlreadyApplied(job.id);
            // Check skill match
            const workerSkills = (workerProfile.primary_skills || 'Harvesting, Seeding').toLowerCase();
            const skillMatch = workerSkills.includes(job.required_skill.toLowerCase());
            const expMatch = (workerProfile.experience_years || 5) >= job.experience_required;
            const wageMatch = job.offered_wage >= (workerProfile.expected_wage || 450);

            // Compute match score
            let matchScore = 80;
            if (skillMatch) matchScore += 10;
            if (expMatch) matchScore += 5;
            if (wageMatch) matchScore += 4;

            return (
              <div key={job.id} className="job-card">
                
                {/* Header */}
                <div>
                  <div className="job-card-header">
                    <span className="crop-badge-lg">
                      🌾 {getCropDisplay(job.crop_type, lang)}
                    </span>
                    <span className="match-badge high">
                      <Sparkles size={13} />
                      {matchScore}% {lang === 'te' ? "అనుకూలత" : "Match"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>
                    {getSkillDisplay(job.required_skill, lang)}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    👤 {job.farmer_name} • ★ {job.farmer_rating || 4.7}
                  </p>
                </div>

                {/* Details grid */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>📍 {getDistrictDisplay(job.district, lang)} (6 km)</div>
                  <div>⏳ {job.experience_required}+ {t('years_unit')}</div>
                  <div>👥 {job.workers_needed} {t('workers_unit')}</div>
                  <div>📅 {job.job_date}</div>
                </div>

                {/* Offered Wage Banner */}
                <div className="job-wage-box">
                  <div>
                    <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: '700' }}>{t('lbl_offered_wage')}:</span>
                    <div className="wage-amount">₹{job.offered_wage} <span style={{ fontSize: '12px' }}>{t('per_day')}</span></div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#166534', fontWeight: '700' }}>
                    ✓ {t('lbl_predicted_wage')}: ₹{job.predicted_market_wage || 450}
                  </div>
                </div>

                {/* AI Matching Reason Tags */}
                <div className="reasons-list" style={{ fontSize: '11px', padding: '8px 12px' }}>
                  {skillMatch && <div>✓ {lang === 'te' ? "అవసరమైన నైపుణ్యం సరిపోలింది" : "Required skill directly matches your expertise"}</div>}
                  {expMatch && <div>✓ {lang === 'te' ? "అనుభవ అవసరం సరిపోయింది" : "Experience qualification satisfied"}</div>}
                  {wageMatch && <div>✓ {lang === 'te' ? "ఆశించే కూలీ పరిధిలో ఉంది" : "Wage meets or exceeds your expected rate"}</div>}
                  <div>✓ {lang === 'te' ? "సమీప ప్రాంతం (రవాణా సులభం)" : "Accessible nearby location"}</div>
                </div>

                {/* Apply Button */}
                <button 
                  className={applied ? "btn-secondary" : "btn-primary"}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  onClick={() => !applied && handleOpenApplyModal(job)}
                  disabled={applied}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 size={16} color="#16a34a" />
                      {t('btn_applied')}
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {t('btn_apply_now')}
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <div className="modal-overlay" onClick={() => setApplyingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #15803d, #14532d)', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#86efac" />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                  {t('btn_apply_now')} – {applyingJob.crop_type} ({applyingJob.required_skill})
                </h3>
              </div>
              <button 
                onClick={() => setApplyingJob(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                  {applyingJob.farmer_name}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                  📍 {getDistrictDisplay(applyingJob.district, lang)} • 💰 ₹{applyingJob.offered_wage} {t('per_day')}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {lang === 'te' ? "రైతుకు మీ సందేశం / గమనిక" : "Message / Note to Farmer"}
                </label>
                <textarea 
                  className="form-textarea"
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder={lang === 'te' ? "మీ నైపుణ్యం మరియు అందుబాటు సమయం రాయండి..." : "State your experience and availability..."}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setApplyingJob(null)}
                  disabled={submitting}
                >
                  {t('btn_close')}
                </button>

                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleConfirmApply}
                  disabled={submitting}
                >
                  <Send size={15} />
                  {submitting ? (lang === 'te' ? "పంపుతోంది..." : "Submitting...") : t('btn_apply_now')}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
