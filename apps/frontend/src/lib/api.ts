import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authApi = {
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const quizApi = {
  create: (data: any) => api.post('/quiz', data),
  getAll: (isPublic?: boolean) => api.get('/quiz', { params: { isPublic } }),
  getById: (id: string) => api.get(`/quiz/${id}`),
  update: (id: string, data: any) => api.put(`/quiz/${id}`, data),
  delete: (id: string) => api.delete(`/quiz/${id}`),
};

export const gameApi = {
  createSession: (quizId: string) => api.post('/game/session', { quizId }),
  getSession: (pin: string) => api.get(`/game/session/${pin}`),
  getResults: (sessionId: string) => api.get(`/game/results/${sessionId}`),
};

export const userApi = {
  updateProfile: (data: any) => api.put('/user/profile', data),
  getProfile: (id: string) => api.get(`/user/profile/${id}`),
  getStats: () => api.get('/user/stats'),
};
