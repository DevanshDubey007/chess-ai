import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api/monitor',
  timeout: 10000,
});

export const fetchStats = () => API.get('/stats').then(r => r.data);
export const fetchArchitecture = () => API.get('/architecture').then(r => r.data);
