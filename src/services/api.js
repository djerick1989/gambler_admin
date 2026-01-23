import axios from 'axios';

const API_BASE_URL = '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  signin: async (data) => {
    const response = await apiClient.post('/api/Auth/signin', data);
    // Be more flexible with token property name (token, accessToken, data.token, etc.)
    const token = response.data?.token || response.data?.accessToken || response.data?.data?.token || (typeof response.data === 'string' ? response.data : null);

    if (token) {
      localStorage.setItem('token', token);
    }
    return response.data;
  },
  signup: async (data) => {
    const response = await apiClient.post('/api/Auth/signup', data);
    return response.data;
  },
  verifyEmail: async (data) => {
    const response = await apiClient.post('/api/Auth/verifyEmail', data);
    return response.data;
  },
  resendVerificationCode: async (data) => {
    const response = await apiClient.post('/api/Auth/resendVerificationCode', data);
    return response.data;
  },
  recoveryPassword: async (data) => {
    const response = await apiClient.post('/api/Auth/recoveryPassword', data);
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await apiClient.post('/api/Auth/resetPassword', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

export default apiClient;
