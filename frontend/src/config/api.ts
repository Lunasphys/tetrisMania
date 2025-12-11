import axios from 'axios';

// Auto-detect backend URL based on current hostname
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3001') {
    return import.meta.env.VITE_API_URL;
  }
  
  // If accessing via IP (not localhost), use the same IP for backend
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  
  // Default to localhost
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed?.access_token) {
      config.headers.Authorization = `Bearer ${parsed.access_token}`;
    }
  }
  return config;
});

export default api;

