import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// One axios instance used by the whole app
const api = axios.create({ baseURL: API_URL });

// Attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is no longer valid (for example the backend restarted), send the user to the login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('sr_token');
      localStorage.removeItem('sr_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Turn any axios error into a readable message
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) return 'Cannot reach the server. Is the backend running on port 8080?';
  return err.message || 'Something went wrong';
}

export default api;
