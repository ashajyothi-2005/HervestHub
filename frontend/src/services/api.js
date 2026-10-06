// HarvestHub API Client - connects React Frontend to Flask ML Backend

const BASE_URL = ''; // Uses Vite proxy in development or direct host in production
const sessionFetch = (url, options = {}) => fetch(url, { ...options, credentials: 'include' });

export const api = {
  // 1. Health Check
  async checkHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend health check error:', err);
      return { status: 'offline', error: err.message };
    }
  },

  // 2. Predict Market Wage
  async predictWage(data) {
    const res = await fetch(`${BASE_URL}/predict_wage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.date || new Date().toISOString().split('T')[0],
        mandi_season: data.mandi_season || 'Kharif',
        district: data.district || 'Guntur District',
        crop_type: data.crop_type || 'Paddy',
        weather_condition: data.weather_condition || 'Sunny / Dry',
        historical_labour_demanded: Number(data.historical_labour_demanded || 60),
        historical_labour_supplied: Number(data.historical_labour_supplied || 45)
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Wage prediction failed: ${errText}`);
    }
    return await res.json();
  },

  // 3. Predict Labour Demand
  async predictJobs(data) {
    const res = await fetch(`${BASE_URL}/predict_jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.date || new Date().toISOString().split('T')[0],
        mandi_season: data.mandi_season || 'Kharif',
        district: data.district || 'Guntur District',
        crop_type: data.crop_type || 'Paddy',
        weather_condition: data.weather_condition || 'Sunny / Dry',
        historical_labour_demanded: Number(data.historical_labour_demanded || 60),
        historical_labour_supplied: Number(data.historical_labour_supplied || 45)
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Labour demand prediction failed: ${errText}`);
    }
    return await res.json();
  },

  async predictCombinedForecast(data) {
    const res = await sessionFetch(`${BASE_URL}/api/predict_combined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, acres: Number(data.acres), lang: data.lang || 'en' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Forecast failed' }));
      throw new Error(err.error || 'Forecast failed');
    }
    return await res.json();
  },

  // 4. Predict Worker Matching (Pairwise)
  async predictMatch(data) {
    const res = await fetch(`${BASE_URL}/predict_match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_experience_years: Number(data.worker_experience_years || 3),
        distance_km: Number(data.distance_km || 5.0),
        worker_historical_rating: Number(data.worker_historical_rating || 4.5),
        farmer_historical_rating: Number(data.farmer_historical_rating || 4.5),
        historical_acceptance_rate: Number(data.historical_acceptance_rate || 0.85),
        job_required_skill: data.job_required_skill || 'Harvesting',
        worker_primary_skills: data.worker_primary_skills || 'Harvesting, Seeding'
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Worker matching failed: ${errText}`);
    }
    return await res.json();
  },

  // 5. Predict Plant Disease from Image
  async predictDisease(imageFile, data = {}) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('crop_type', data.crop_type || '');
    formData.append('acres', String(data.acres || ''));
    formData.append('lang', data.lang || 'en');

    const res = await fetch(`${BASE_URL}/predict_disease`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Disease analysis failed' }));
      throw new Error(err.error || 'Failed to analyze crop leaf image');
    }
    return await res.json();
  },

  async chatWithDiseaseExpert(data) {
    const res = await sessionFetch(`${BASE_URL}/api/disease_chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'The AI assistant could not respond.' }));
      throw new Error(err.error || 'The AI assistant could not respond.');
    }
    return await res.json();
  },

  // 6. Fetch Jobs List
  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await sessionFetch(`${BASE_URL}/api/jobs?${query}`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return await res.json();
  },

  // 7. Post New Job
  async createJob(jobData) {
    const res = await sessionFetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    if (!res.ok) throw new Error('Failed to create job');
    return await res.json();
  },

  // 8. Fetch Workers List
  async getWorkers() {
    const res = await sessionFetch(`${BASE_URL}/api/workers`);
    if (!res.ok) throw new Error('Failed to fetch workers');
    return await res.json();
  },

  // 9. Save Worker Profile
  async saveWorkerProfile(workerData) {
    const res = await sessionFetch(`${BASE_URL}/api/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData)
    });
    if (!res.ok) throw new Error('Failed to save worker profile');
    return await res.json();
  },

  async register(data) {
    const res = await sessionFetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  async login(data) {
    const res = await sessionFetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  async logout() {
    const res = await sessionFetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    if (!res.ok) throw new Error('Sign out failed');
    return await res.json();
  },

  // 10. Fetch Applications
  async getApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await sessionFetch(`${BASE_URL}/api/applications?${query}`);
    if (!res.ok) throw new Error('Failed to fetch applications');
    return await res.json();
  },

  // 11. Create Application
  async createApplication(appData) {
    const res = await sessionFetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    if (!res.ok) throw new Error('Failed to submit application');
    return await res.json();
  },

  // 12. Update Application Status (Accept / Reject)
  async updateApplicationStatus(appId, status, farmerId) {
    const res = await sessionFetch(`${BASE_URL}/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, farmer_id: farmerId })
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Failed to update application status');
    return result;
  },

  // 13. Notifications
  async getNotifications(role = '', userId = '') {
    const params = new URLSearchParams({ role, user_id: userId });
    const res = await sessionFetch(`${BASE_URL}/api/notifications?${params}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return await res.json();
  },

  async markNotificationsRead(role, userId) {
    const res = await sessionFetch(`${BASE_URL}/api/notifications`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to mark notifications');
    return await res.json();
  },

  async getHiringRequests(role, userId) {
    const params = new URLSearchParams({ role, user_id: userId });
    const res = await sessionFetch(`${BASE_URL}/api/hiring-requests?${params}`);
    if (!res.ok) throw new Error('Failed to fetch hiring requests');
    return await res.json();
  },

  async sendHiringRequest(data) {
    const res = await sessionFetch(`${BASE_URL}/api/hiring-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Failed to send hiring request');
    return result;
  },

  async respondToHiringRequest(requestId, status, workerId) {
    const res = await sessionFetch(`${BASE_URL}/api/hiring-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, worker_id: workerId })
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || 'Failed to respond to hiring request');
    return result;
  },

  // 14. Batch Worker Matching for a Job
  async matchWorkersForJob(jobData, farmerId) {
    const res = await sessionFetch(`${BASE_URL}/api/match_workers_for_job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...jobData, farmer_id: farmerId })
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || 'Failed to match workers');
    }
    return await res.json();
  },

  // 15. Batch Job Recommendations for a Worker
  async recommendJobsForWorker(workerData) {
    const profile = {
      id: workerData.id,
      primary_skills: workerData.primary_skills,
      experience_years: workerData.experience_years,
      district: workerData.district,
      expected_wage: workerData.expected_wage
    };
    const res = await sessionFetch(`${BASE_URL}/api/recommend_jobs_for_worker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to generate job recommendations');
    return await res.json();
  },

  // 16. Sample Disease Images for Demo
  async getSampleDiseaseImages() {
    const res = await sessionFetch(`${BASE_URL}/api/sample_disease_images`);
    if (!res.ok) throw new Error('Failed to fetch sample disease images');
    return await res.json();
  }
};
