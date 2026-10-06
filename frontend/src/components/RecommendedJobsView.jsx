import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Star, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  Send,
  Zap
} from 'lucide-react';
import { 
  translations, 
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function RecommendedJobsView({ 
  lang = 'en', 
  workerProfile = {}, 
  applications = [], 
  onRefreshData, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [workerProfile]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.recommendJobsForWorker({
        id: workerProfile.id || 'w1',
        primary_skills: workerProfile.primary_skills || 'Harvesting, Seeding, Pruning',
        experience_years: workerProfile.experience_years || 5,
        district: workerProfile.district || 'Guntur District',
        rating: workerProfile.rating || 4.8,
        acceptance_rate: workerProfile.acceptance_rate || 0.92,
        expected_wage: workerProfile.expected_wage || 450
      });
      if (res && res.recommended_jobs) {
        setRecommendedJobs(res.recommended_jobs);
      }
    } catch (e) {
      console.warn('Recommend jobs error:', e);
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyApplied = (jobId) => {
    return applications.some(a => a.job_id === jobId && (a.worker_id === workerProfile.id || a.worker_id === 'w1'));
  };

  const handleQuickApply = async (job) => {
    try {
      const payload = {
        job_id: job.id,
        job_title: `${job.crop_type} ${job.required_skill}`,
        crop_type: job.crop_type,
        district: job.district,
        farmer_name: job.farmer_name,
        worker_id: workerProfile.id || 'w1',
        worker_name: workerProfile.name || 'Ravi Kumar',
        worker_rating: workerProfile.rating || 4.8,
        worker_experience: workerProfile.experience_years || 5,
        worker_skills: workerProfile.primary_skills || 'Harvesting, Seeding',
        expected_wage: workerProfile.expected_wage || 450,
        offered_wage: job.offered_wage,
        distance_km: job.distance_km || 6.5,
        matching_score: job.matching_score || 94,
        notes: lang === 'te' ? "నేను ఈ పనికి నేరుగా దరఖాస్తు చేసుకున్నాను." : "Applied via AI Recommendation match."
      };

      const res = await api.createApplication(payload);
      if (res.success) {
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch (_) {}
        showToast(t('msg_application_sent'), 'success');
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}>
            <Sparkles size={24} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('nav_recommended_jobs')}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te'
                ? "మీ నైపుణ్యాలు మరియు అంచనా వేతనానికి సరిపోయే పనులను AI మోడల్ ర్యాంక్ చేసింది."
                : "Personalized job matches ranked using Gradient Boosting Classifier based on your skills, experience, and proximity."}
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Sparkles size={36} color="#d97706" style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '12px', fontWeight: '700', color: '#b45309' }}>
            {lang === 'te' ? "AI మీ కోసం అత్యుత్తమ పనులను సిఫార్సు చేస్తోంది..." : "Calculating personalized recommendations..."}
          </p>
        </div>
      ) : recommendedJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('empty_no_jobs')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {recommendedJobs.map((job) => {
            const applied = isAlreadyApplied(job.id);
            const reasons = lang === 'te' ? job.reasons_te : job.reasons_en;

            return (
              <div key={job.id} className="job-card" style={{ borderTop: '4px solid #f59e0b' }}>
                
                <div>
                  <div className="job-card-header">
                    <span className="crop-badge-lg">
                      🌾 {getCropDisplay(job.crop_type, lang)}
                    </span>
                    <span className="match-badge high" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                      <Zap size={13} />
                      {job.matching_score}% {lang === 'te' ? "సరిపోలిక" : "Match"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '800', marginTop: '10px', color: '#0f172a' }}>
                    {getSkillDisplay(job.required_skill, lang)}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    👤 {job.farmer_name} • ★ {job.farmer_rating || 4.7}
                  </p>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>📍 {getDistrictDisplay(job.district, lang)} ({job.distance_km || 6} km)</div>
                  <div>⏳ {job.experience_required}+ {t('years_unit')}</div>
                  <div>👥 {job.workers_needed} {t('workers_unit')}</div>
                  <div>📅 {job.job_date}</div>
                </div>

                <div className="job-wage-box">
                  <div>
                    <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: '700' }}>{t('lbl_offered_wage')}:</span>
                    <div className="wage-amount">₹{job.offered_wage} <span style={{ fontSize: '12px' }}>{t('per_day')}</span></div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#166534', fontWeight: '700' }}>
                    ✓ {t('lbl_predicted_wage')}: ₹{job.predicted_market_wage || 450}
                  </div>
                </div>

                {/* Reasons why this job matches */}
                {reasons && reasons.length > 0 && (
                  <div className="reasons-list">
                    <span style={{ fontWeight: '700', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <CheckCircle2 size={13} color="#d97706" /> {t('lbl_why_match')}:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button 
                  className={applied ? "btn-secondary" : "btn-amber"}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '12px', borderRadius: '12px', fontWeight: '700' }}
                  onClick={() => !applied && handleQuickApply(job)}
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
    </div>
  );
}
