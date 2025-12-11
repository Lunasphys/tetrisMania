import axios from 'axios';
import { supabase } from './supabase';

// Auto-detect backend URL based on current hostname
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3001') {
    let url = import.meta.env.VITE_API_URL;
    // Remove trailing slash if present
    return url.endsWith('/') ? url.slice(0, -1) : url;
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
// Ensure no trailing slash and proper path construction
const normalizedBaseUrl = API_BASE_URL.replace(/\/+$/, ''); // Remove all trailing slashes

// Construct baseURL - ensure it doesn't already contain /api/v1
let finalBaseURL = normalizedBaseUrl;
if (!finalBaseURL.includes('/api/v1')) {
  finalBaseURL = `${normalizedBaseUrl}/api/v1`;
}

console.log('[API Config] Base URL:', finalBaseURL);

export const api = axios.create({
  baseURL: finalBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  
  // Normalize URL to prevent double slashes
  // Axios combines baseURL + url, so we need to ensure proper formatting
  if (config.url && config.baseURL) {
    // Remove any trailing slashes from baseURL
    const cleanBaseURL = config.baseURL.replace(/\/+$/, '');
    // Ensure url starts with a single slash (remove any leading slashes first, then add one)
    const cleanURL = '/' + config.url.replace(/^\/+/, '');
    config.baseURL = cleanBaseURL;
    config.url = cleanURL;
    
    // Debug log to see the final URL
    const finalURL = cleanBaseURL + cleanURL;
    console.log('[API Request]', config.method?.toUpperCase(), finalURL);
  }
  
  return config;
});

export default api;

