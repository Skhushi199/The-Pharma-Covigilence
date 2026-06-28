import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000, // 35s to allow HF cold starts
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pv_token');
        localStorage.removeItem('pv_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  registerAdmin: (data) => api.post('/auth/admin/register', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Complaints ────────────────────────────────────────────────
export const complaintAPI = {
  start: (data) => api.post('/complaints/start', data),
  addSymptoms: (id, data) => api.post(`/complaints/${id}/symptoms`, data),
  addUserSeverity: (id, data) => api.post(`/complaints/${id}/user-severity`, data),
  submitNaranjo: (id, data) => api.post(`/complaints/${id}/naranjo`, data),
  getMyComplaints: () => api.get('/complaints/my'),
};

// ─── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getQueue: () => api.get('/admin/complaints'),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  updateStatus: (id, data) => api.put(`/admin/complaints/${id}/status`, data),
  checkDuplicates: (medicineName) => api.get(`/admin/duplicates/${medicineName}`),
  getMedicineAnalytics: (name) => api.get(`/admin/analytics/medicine?name=${encodeURIComponent(name)}`),
  getPRR: (drug, event) => api.get(`/admin/signals/prr?drug=${encodeURIComponent(drug)}&event=${encodeURIComponent(event)}`),
};

export default api;
