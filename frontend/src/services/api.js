import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sporttrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear local storage
      const token = localStorage.getItem('sporttrack_token');
      if (token) {
        localStorage.removeItem('sporttrack_token');
        localStorage.removeItem('sporttrack_user');
        window.dispatchEvent(new Event('sporttrack_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export const analyticsAPI = {
  getDashboardSummary: () => api.get('/analytics/dashboard-summary').then(res => res.data),
  getKinematicSequence: () => api.get('/analytics/kinematic-sequence').then(res => res.data),
};

export const sessionsAPI = {
  getSessions: () => api.get('/sessions').then(res => res.data),
  getSessionById: (id) => api.get(`/sessions/${id}`).then(res => res.data),
  createSession: (data) => api.post('/sessions', data).then(res => res.data),
  deleteSession: (id) => api.delete(`/sessions/${id}`).then(res => res.data),
};

export const shotsAPI = {
  logShot: (data) => api.post('/shots/log', data).then(res => res.data),
  getShotsBySession: (sessionId) => api.get(`/shots/session/${sessionId}`).then(res => res.data),
};

export const visionAPI = {
  getHealth: () => api.get('/vision/health').then(res => res.data),
  processFrame: (payload) => api.post('/vision/process-frame', payload).then(res => res.data),
  uploadVideo: (formData, onProgress) => api.post('/vision/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  }).then(res => res.data),
  computeKinematics: (payload) => api.post('/vision/compute-kinematics', payload).then(res => res.data),
};

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  getProfile: () => api.get('/auth/profile').then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  updateProfile: (updates) => api.put('/auth/profile', updates).then(res => res.data),
};

export default api;
