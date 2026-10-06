import React, { useState } from 'react';
import { 
  Users, 
  Sparkles
} from 'lucide-react';
import { 
  translations
} from '../translations';
import { api } from '../services/api';

export default function WorkerMatcher({ lang = 'en', showToast, user, jobs = [], onRefreshData }) {
  const t = (key) => translations[lang]?.[key] || key;
  const farmerJobs = jobs.filter((job) => String(job.farmer_id) === String(user?.id));

  const [selectedJobId, setSelectedJobId] = useState('');
  const effectiveJobId = farmerJobs.some((job) => String(job.id) === String(selectedJobId))
    ? String(selectedJobId)
    : (farmerJobs.length ? String(farmerJobs[0].id) : '');
  const [matchedWorkers, setMatchedWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [requestedWorkerIds, setRequestedWorkerIds] = useState([]);

  const handleFindWorkers = async () => {
    const selectedJob = farmerJobs.find((job) => String(job.id) === String(effectiveJobId));
    if (!selectedJob) {
      showToast?.(lang === 'te' ? 'ముందుగా ఒక పనిని పోస్ట్ చేయండి.' : 'Post a job before searching for workers.', 'error');
      return;
    }
    setLoadingWorkers(true);
    try {
      const response = await api.matchWorkersForJob(selectedJob, user?.id);
      setMatchedWorkers(response.matched_workers || []);
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleInvite = async (worker) => {
    const selectedJob = farmerJobs.find((job) => String(job.id) === String(effectiveJobId));
    try {
      await api.sendHiringRequest({ job_id: selectedJob.id, farmer_id: user.id, worker_id: worker.id });
      setRequestedWorkerIds((ids) => [...ids, worker.id]);
      showToast?.(lang === 'te' ? 'పని అభ్యర్థన పంపబడింది.' : 'Hiring request sent.', 'success');
      onRefreshData?.();
    } catch (error) {
      showToast?.(error.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
            <Users size={28} color="#d97706" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {t('btn_find_matches')} – {lang === 'te' ? "కార్మికుల సరిపోలిక క్లాసిఫైయర్" : "Worker-Farmer Matching ML Classifier"}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {lang === 'te' 
                ? "అనుభవం, దూరం, రేటింగ్స్ మరియు నైపుణ్యాల ఆధారంగా Gradient Boosting Classifier మోడల్ అనుకూలత స్కోరును (Matching Score %) గణిస్తుంది."
                : "Evaluates compatibility between agricultural jobs and workers using the trained Gradient Boosting Classifier."}
            </p>
          </div>
        </div>
      </div>

      <section className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title"><Users size={18} color="#16a34a" /><span>{lang === 'te' ? 'మీ పనికి సరిపడే కార్మికులు' : 'Workers Matched to Your Job'}</span></div>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select className="form-select" value={effectiveJobId} onChange={(event) => setSelectedJobId(event.target.value)} style={{ flex: '1 1 240px' }}>
              <option value="">{lang === 'te' ? 'పనిని ఎంచుకోండి' : 'Select a posted job'}</option>
              {farmerJobs.map((job) => <option key={job.id} value={job.id}>{job.job_title || `${job.crop_type} ${job.required_skill}`} · {job.district}</option>)}
            </select>
            <button className="btn-primary" type="button" disabled={loadingWorkers || !farmerJobs.length} onClick={handleFindWorkers}>
              <Sparkles size={16} /> {loadingWorkers ? (lang === 'te' ? 'వెతుకుతోంది...' : 'Searching...') : (lang === 'te' ? 'కార్మికులను సరిపోల్చండి' : 'Find Matched Workers')}
            </button>
          </div>
          {matchedWorkers.length > 0 && <>
            <h3 style={{ margin: '18px 0 10px', fontSize: '15px' }}>{lang === 'te' ? `సరిపోలిన కార్మికులు: ${matchedWorkers.length}` : `Matched Workers: ${matchedWorkers.length}`}</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {matchedWorkers.map((worker) => {
                const requested = requestedWorkerIds.includes(worker.id);
                return <div key={worker.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '14px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div>
                    <strong>{worker.name}</strong>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{worker.location || worker.district} · {worker.experience_years} {t('years_unit')} · ★ {worker.rating}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{worker.primary_skills}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}><strong>{worker.matching_score}%</strong><div style={{ fontSize: '11px', color: '#64748b' }}>{worker.calculated_distance_km} km</div></div>
                  <button className={requested ? 'btn-secondary' : 'btn-primary'} type="button" disabled={requested} onClick={() => handleInvite(worker)}>
                    {requested ? (lang === 'te' ? 'పంపబడింది' : 'Sent') : t('btn_invite')}
                  </button>
                </div>;
              })}
            </div>
          </>}
          {!matchedWorkers.length && !loadingWorkers && <p style={{ color: '#64748b', fontSize: '13px', marginBottom: 0 }}>{lang === 'te' ? 'ఉద్యోగ వివరాల ఆధారంగా సరిపోలికలను చూడండి.' : 'Choose a posted job to see workers ranked by their profile match.'}</p>}
        </div>
      </section>

    </div>
  );
}
