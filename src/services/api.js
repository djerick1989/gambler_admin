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
  getUserInformation: async () => {
    const response = await apiClient.get('/api/Auth/getUserInformation');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const languageService = {
  getAll: async () => {
    const response = await apiClient.get('/api/Language/GetAll');
    return response.data;
  }
};

export const mediaService = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/Media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export const onboardingService = {
  getAllByLanguage: async (languageId, page = 1, pageSize = 10) => {
    const response = await apiClient.get(`/api/OnBoardingConfig/GetAllByLanguageId`, {
      params: { languageId, page, pageSize }
    });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/api/OnBoardingConfig/getOnBoardingConfigById/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/api/OnBoardingConfig/createOnBoardingConfig', data);
    return response.data;
  },
  update: async (data) => {
    const response = await apiClient.put('/api/OnBoardingConfig/updateOnBoardingConfig', data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/api/OnBoardingConfig/deleteOnBoardingConfig/${id}`);
    return response.data;
  }
};

export const i18nService = {
  // Namespace operations
  createNamespace: async (data) => {
    const response = await apiClient.post('/api/I18n/createNamespace', data);
    return response.data;
  },
  updateNamespace: async (data) => {
    const response = await apiClient.put('/api/I18n/namespaceUpdate', data);
    return response.data;
  },
  deleteNamespace: async (id) => {
    const response = await apiClient.delete(`/api/I18n/namespaceDelete/${id}`);
    return response.data;
  },
  getNamespaceById: async (id) => {
    const response = await apiClient.get(`/api/I18n/getNamespaceById/${id}`);
    return response.data;
  },
  getAllNamespaces: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/I18n/getAllNamespaces', {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Key operations
  createKey: async (data) => {
    const response = await apiClient.post('/api/I18n/keyCreate', data);
    return response.data;
  },
  updateKey: async (data) => {
    const response = await apiClient.put('/api/I18n/keyUpdate', data);
    return response.data;
  },
  deleteKey: async (id) => {
    const response = await apiClient.delete(`/api/I18n/keyDelete/${id}`);
    return response.data;
  },
  getKeyById: async (id, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get(`/api/I18n/GetKeyById/${id}`, { headers });
    return response.data;
  },
  getKeysByNamespaceId: async (namespaceId, page = 1, pageSize = 200, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get('/api/I18n/getKeysByNamespaceId', {
      params: { namespaceId, page, pageSize },
      headers
    });
    return response.data;
  },

  // Translation operations
  updateTranslation: async (data) => {
    const response = await apiClient.put('/api/I18n/translationUpdate', data);
    return response.data;
  }
};

export default apiClient;
