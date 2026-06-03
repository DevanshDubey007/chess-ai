import axios from 'axios';

const API_BASE_URL = 'https://chess-ai-9zv4.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAIStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getAIMove = async (fen) => {
  const response = await api.post('/move', { fen });
  return response.data;
};

export default api;
