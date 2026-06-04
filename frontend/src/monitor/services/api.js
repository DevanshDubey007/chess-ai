import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const API = axios.create({
  baseURL: `${API_BASE}/api/monitor`,
  timeout: 10000,
});

export const fetchStats = () => API.get('/stats').then(r => r.data);
export const fetchArchitecture = () => API.get('/architecture').then(r => r.data);
