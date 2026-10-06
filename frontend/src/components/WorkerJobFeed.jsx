import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Send 
} from 'lucide-react';
import { 
  translations, 
  CROPS, 
  DISTRICTS, 
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function WorkerJobFeed({ 
  lang = 'en', 
  workerProfile = {}, 
  applications = [], 
  onRefreshData, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    let active = true;
    api.recommendJobsForWorker(workerProfile)
      .then((result) => { if (active) setRecommendedJobs(result.recommended_jobs || []); })
      .catch((error) => { if (active) console.warn('Job recommendations unavailable:', error); })
      .finally(() => { if (active) setLoadingMatches(false); });
    return () => { active = false; };
  }, [workerProfile]);

  const isApplied = (jobId) => {
    return applications.some(a => String(a.job_id) === String(jobId) && String(a.worker_id) === String(workerProfile.id));
  };

  const handleApply = async (job, score) => {
    try {
      const payload = {
        job_id: job.id,
        job_title: job.job_title || `${job.crop_type} ${job.required_skill}`,
        crop_type: job.crop_type,
        district: job.district,
        farmer_name: job.farmer_name,
        worker_id: workerProfile.id || 'w1',
        worker_name: workerProfile.name || 'Ravi Kumar',
        worker_rating: workerProfile.rating ?? 4.5,
        worker_experience: workerProfile.experience_years ?? 0,
        worker_skills: workerProfile.primary_skills ?? '',
        expected_wage: workerProfile.expected_wage ?? 0,
        offered_wage: job.offered_wage,
        distance_km: job.distance_km,
        matching_score: score,
        notes: lang === 'te' ? "నేను ఈ పనికి అందుబాటులో ఉన్నాను." : "Available for farm work."
      };

      const res = await api.createApplication(payload);
      if (res.success) {
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch {}
        showToast(t('msg_application_sent'), 'success');
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const filtered = recommendedJobs.filter(j => {
    if (selectedCrop !== 'all' && j.crop_type.toLowerCase() !== selectedCrop.toLowerCase()) return false;
    if (selectedDistrict !== 'all' && j.district.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {lang === 'te' ? "వ్యవసాయ పనులు & AI అనుకూలత స్కోర్లు" : "Farm Job Feed & AI Match Scores"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "కార్మికుని నైపుణ్యాలు మరియు అనుభవం ఆధారంగా ప్రతి పనికి సరిపోలిక శాతం ప్రదర్శించబడుతుంది." 
                : "Worker compatibility scores computed against each open farm opening."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="form-select" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
              <option value="all">{lang === 'te' ? "అన్ని పంటలు" : "All Crops"}</option>
              {CROPS.map(c => <option key={c.value} value={c.value}>{translations[lang]?.[c.labelKey] || c.value}</option>)}
            </select>

            <select className="form-select" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
              <option value="all">{lang === 'te' ? "అన్ని జిల్లాలు" : "All Districts"}</option>
              {DISTRICTS.map(d => <option key={d.value} value={d.value}>{translations[lang]?.[d.labelKey] || d.value}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {loadingMatches ? <div className="card" style={{ padding: '24px' }}>{lang === 'te' ? 'పనులను సరిపోలుస్తోంది...' : 'Finding suitable jobs...'}</div> : filtered.length === 0 ? <div className="card" style={{ padding: '24px' }}>{t('empty_no_jobs')}</div> : filtered.map((job) => {
          const applied = isApplied(job.id);
          const score = job.matching_score;

          return (
            <div key={job.id} className="job-card">
              
              <div>
                <div className="job-card-header">
                  <span className="crop-badge-lg">
                    🌾 {getCropDisplay(job.crop_type, lang)}
                  </span>
                  <span className="match-badge high">
                    <Sparkles size={13} />
                    {score}% Match
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>
                  {getSkillDisplay(job.required_skill, lang)}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  👤 {job.farmer_name} • ★ {job.farmer_rating || 4.7}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>📍 {[job.location, getDistrictDisplay(job.district, lang)].filter(Boolean).join(', ')} ({job.distance_km} km)</div>
                <div>⏳ {job.experience_required}+ {t('years_unit')}</div>
                <div>👥 {job.workers_needed} {t('workers_unit')}</div>
                <div>📅 {job.job_date}</div>
                {job.acres > 0 && <div>🌱 {job.acres} {lang === 'te' ? 'ఎకరాలు' : 'acres'}</div>}
              </div>

              <div className="job-wage-box">
                <div>
                  <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: '700' }}>{t('lbl_offered_wage')}:</span>
                  <div className="wage-amount">₹{job.offered_wage} <span style={{ fontSize: '12px' }}>{t('per_day')}</span></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#166534', fontWeight: '700' }}>
                  {lang === 'te' ? 'మార్కెట్ అంచనా' : 'Market estimate'}: {job.predicted_market_wage ? `₹${job.predicted_market_wage}` : '—'}
                </div>
              </div>

              <button 
                className={applied ? "btn-secondary" : "btn-primary"}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                onClick={() => !applied && handleApply(job, score)}
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

    </div>
  );
}
