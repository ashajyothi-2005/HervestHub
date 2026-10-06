import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Star, 
  Briefcase, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Sparkles, 
  Filter, 
  Check,
  Send
} from 'lucide-react';
import { 
  translations, 
  getCropDisplay, 
  getDistrictDisplay, 
  getSkillDisplay 
} from '../translations';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function WorkerMatchingView({ 
  lang = 'en', 
  jobs = [], 
  selectedJob = null, 
  showToast 
}) {
  const t = (key) => translations[lang]?.[key] || key;

  const [activeJobId, setActiveJobId] = useState(selectedJob?.id || (jobs[0]?.id || ''));
  const [matchedWorkers, setMatchedWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitedWorkerIds, setInvitedWorkerIds] = useState(new Set());

  const currentJob = jobs.find(j => j.id === activeJobId) || jobs[0];

  useEffect(() => {
    if (currentJob) {
      fetchMatchesForJob(currentJob);
    }
  }, [activeJobId, currentJob]);

  const fetchMatchesForJob = async (job) => {
    if (!job) return;
    setLoading(true);
    try {
      const res = await api.matchWorkersForJob({
        id: job.id,
        required_skill: job.required_skill,
        district: job.district,
        farmer_rating: job.farmer_rating || 4.7,
        offered_wage: job.offered_wage,
        experience_required: job.experience_required
      });
      if (res && res.matched_workers) {
        setMatchedWorkers(res.matched_workers);
      }
    } catch (e) {
      console.warn('Matching error:', e);
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (worker) => {
    setInvitedWorkerIds(prev => new Set([...prev, worker.id]));
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
    showToast(
      lang === 'te' 
        ? `${worker.name} కి పని ఆహ్వానం పంపబడింది!` 
        : `Work invitation sent to ${worker.name}!`,
      'success'
    );
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Users size={22} color="#16a34a" />
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                {t('nav_find_workers')} – {lang === 'te' ? "AI వర్కర్ మ్యాచింగ్ వ్యవస్థ" : "AI Worker Matching Intelligence"}
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "మెషిన్ లెర్నింగ్ మోడల్ ఆధారంగా మీ పొలం పనికి సరిగ్గా సరిపోయే స్థానిక వ్యవసాయ కూలీల అనుకూలత స్కోరు మరియు వివరాలు."
                : "Gradient Boosting ML classifier evaluates geospatial distance, ratings, and skillsets to rank candidate workers."}
            </p>
          </div>

          {/* Job Picker Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              {lang === 'te' ? "పనిని ఎంచుకోండి:" : "Select Farm Job:"}
            </span>
            <select 
              className="form-select"
              style={{ fontWeight: '700', minWidth: '220px', borderColor: '#16a34a' }}
              value={activeJobId}
              onChange={(e) => setActiveJobId(e.target.value)}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {getCropDisplay(job.crop_type, lang)} ({getSkillDisplay(job.required_skill, lang)}) - {getDistrictDisplay(job.district, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Job Summary Pill Box */}
        {currentJob && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534' }}>
            <span><strong>🌾 {t('lbl_crop_type')}:</strong> {getCropDisplay(currentJob.crop_type, lang)}</span>
            <span>•</span>
            <span><strong>🛠️ {t('lbl_required_skill')}:</strong> {getSkillDisplay(currentJob.required_skill, lang)}</span>
            <span>•</span>
            <span><strong>📍 {t('lbl_district')}:</strong> {getDistrictDisplay(currentJob.district, lang)}</span>
            <span>•</span>
            <span><strong>💰 {t('lbl_offered_wage')}:</strong> ₹{currentJob.offered_wage} {t('per_day')}</span>
            <span>•</span>
            <span><strong>👥 {t('lbl_workers_needed')}:</strong> {currentJob.workers_needed}</span>
          </div>
        )}
      </div>

      {/* Workers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Sparkles size={36} color="#16a34a" style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '12px', fontWeight: '700', color: '#15803d' }}>
            {lang === 'te' ? "కూలీల నైపుణ్యాలు & సరిపోలిక స్కోరును AI విశ్లేషిస్తోంది..." : "Evaluating worker compatibility using ML classifier..."}
          </p>
        </div>
      ) : matchedWorkers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>{t('empty_no_workers')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {matchedWorkers.map((worker) => {
            const isInvited = invitedWorkerIds.has(worker.id);
            const scoreClass = worker.matching_score >= 85 ? 'high' : worker.matching_score >= 70 ? 'medium' : 'low';
            const reasons = lang === 'te' ? worker.reasons_te : worker.reasons_en;

            return (
              <div key={worker.id} className="worker-card">
                
                {/* Top Section: Avatar, Name, Rating & Score Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="worker-header">
                    <img src={worker.avatar} alt={worker.name} className="worker-avatar" />
                    <div className="worker-meta">
                      <h3>{worker.name}</h3>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={13} color="#16a34a" /> {getDistrictDisplay(worker.district, lang)} ({worker.calculated_distance_km} {t('km_away')})
                      </p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#d97706', fontWeight: '700' }}>
                        <Star size={13} fill="#d97706" /> {worker.rating} / 5.0 ({worker.total_jobs_done} {t('lbl_total_jobs_done')})
                      </p>
                    </div>
                  </div>

                  {/* Matching Score Badge */}
                  <div className={`match-badge ${scoreClass}`}>
                    <Sparkles size={14} />
                    <span>{worker.matching_score}% {lang === 'te' ? "అనుకూలత" : "Match"}</span>
                  </div>
                </div>

                {/* Wage and Experience Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{t('lbl_expected_wage')}:</span>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#854d0e' }}>
                      ₹{worker.expected_wage} <span style={{ fontSize: '11px' }}>{t('per_day')}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{t('lbl_experience_req')}:</span>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      {worker.experience_years} {t('years_unit')}
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    {t('lbl_primary_skills')}:
                  </span>
                  <div className="worker-tags">
                    {worker.primary_skills.split(',').map((s, idx) => (
                      <span key={idx} className="tag-pill skill">
                        {getSkillDisplay(s.trim(), lang)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Why this match is suitable (AI Explanations) */}
                {reasons && reasons.length > 0 && (
                  <div className="reasons-list">
                    <span style={{ fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <CheckCircle2 size={13} color="#16a34a" /> {t('lbl_why_match')}:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <button 
                    className={isInvited ? "btn-secondary" : "btn-primary"}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleInvite(worker)}
                    disabled={isInvited}
                  >
                    {isInvited ? (
                      <>
                        <Check size={16} color="#16a34a" />
                        {lang === 'te' ? "ఆహ్వానం పంపబడింది" : "Invited"}
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        {t('btn_invite')}
                      </>
                    )}
                  </button>

                  <a 
                    href={`tel:${worker.phone}`}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    title={worker.phone}
                  >
                    <Phone size={15} color="#16a34a" />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
