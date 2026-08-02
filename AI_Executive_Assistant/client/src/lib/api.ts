import axios from 'axios';

export const api = axios.create({
  baseURL: '', // Use relative URL so Vite proxy forwards /api and /auth to 3001 seamlessly
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

