import axios from 'axios';

// Enterprise API Client for Django JWT Authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Token Refresh on 401
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access, refresh } = res.data;
          localStorage.setItem('access_token', access);
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return authClient(originalRequest);
        } catch (refreshError) {
          // If refresh fails but we have cached user data (demo/offline mode), keep session intact
          const cachedUser = localStorage.getItem('user_data');
          if (cachedUser) {
            return Promise.reject(refreshError);
          }
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          const baseUrl = import.meta.env.BASE_URL || '/';
          const target = baseUrl.endsWith('/') ? `${baseUrl}sign-in` : `${baseUrl}/sign-in`;
          window.location.href = target;
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
