import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
};

export const transactionsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.transaction;
  },
  create: async (data: any) => {
    const response = await api.post('/transactions', data);
    return response.data.transaction;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data.transaction;
  },
  flag: async (id: number) => {
    const response = await api.post(`/transactions/${id}/flag`);
    return response.data.transaction;
  },
  delete: async (id: number) => {
    await api.delete(`/transactions/${id}`);
  },
};

export const analyticsApi = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
  getTrends: async (period: string = 'daily', days: number = 30) => {
    const response = await api.get('/analytics/trends', {
      params: { period, days },
    });
    return response.data.trends;
  },
  getRiskDistribution: async () => {
    const response = await api.get('/analytics/risk-distribution');
    return response.data.distribution;
  },
};

export default api;

