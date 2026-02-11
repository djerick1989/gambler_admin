import axios from 'axios';

const API_BASE_URL = 'https://2evbm9ctw5.us-east-2.awsapprunner.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Only add the token if it looks like a real token and NOT HTML content
  if (token && !token.trim().startsWith('<!doctype') && !token.trim().startsWith('<html')) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    // If it's garbage (HTML), remove it to prevent further errors
    localStorage.removeItem('token');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  signin: async (data) => {
    const response = await apiClient.post('/api/Auth/signin', data);
    const token = response.data?.token || response.data?.accessToken || response.data?.data?.token;

    // Only store the token if it's found and is NOT HTML content
    if (token && typeof token === 'string' && !token.trim().startsWith('<!doctype') && !token.trim().startsWith('<html')) {
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
  },
  listAWSMedia: async (pageSize = 10, continuationToken = null) => {
    const response = await apiClient.get('/api/Media/list', {
      params: { pageSize, continuationToken }
    });
    return response.data;
  },
  deleteAWSMedia: async (key) => {
    const response = await apiClient.delete('/api/Media/delete', {
      params: { key }
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

export const newsService = {
  getAllNews: async (page = 1, pageSize = 10, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get('/api/News/getAllNews', {
      params: { page, pageSize },
      headers
    });
    return response.data;
  },
  getNewsById: async (id, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get(`/api/News/getNewsById/${id}`, { headers });
    return response.data;
  },
  createNews: async (data) => {
    const response = await apiClient.post('/api/News/createNews', data);
    return response.data;
  },
  updateNews: async (data) => {
    const response = await apiClient.put('/api/News/updateNews', data);
    return response.data;
  },
  deleteNews: async (id) => {
    const response = await apiClient.delete(`/api/News/deleteNews/${id}`);
    return response.data;
  }
};

export const newsCommentService = {
  createNewsComment: async (data) => {
    const response = await apiClient.post('/api/NewsComment/createNewsComment', data);
    return response.data;
  },
  updateNewsComment: async (data) => {
    const response = await apiClient.put('/api/NewsComment/updateNewsComment', data);
    return response.data;
  },
  deleteNewsComment: async (id) => {
    const response = await apiClient.delete(`/api/NewsComment/deleteNewsComment/${id}`);
    return response.data;
  },
  getCommentsByNewsId: async (newsId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/NewsComment/getCommentsByNewsId', {
      params: { newsId, page, pageSize }
    });
    return response.data;
  },
  getCommentsByUserId: async (userId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/NewsComment/getCommentsByUserId', {
      params: { userId, page, pageSize }
    });
    return response.data;
  },
  getNewsCommentById: async (id) => {
    const response = await apiClient.get(`/api/NewsComment/getNewsCommentById/${id}`);
    return response.data;
  },
  getAllNewsComments: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/NewsComment/getAllNewsComments', {
      params: { page, pageSize }
    });
    return response.data;
  }
};

export const gamblerService = {
  getAllGamblers: async (page = 1, pageSize = 10, nickname = '') => {
    const response = await apiClient.get('/api/Gambler/getAllGamblers', {
      params: { page, pageSize, nickname }
    });
    return response.data;
  },
  getInactiveGamblers: async (page = 1, pageSize = 10, nickname = '') => {
    const response = await apiClient.get('/api/Gambler/getInactiveGamblers', {
      params: { page, pageSize, nickname }
    });
    return response.data;
  },
  getGamblerById: async (id) => {
    const response = await apiClient.get(`/api/Gambler/getGamblerById/${id}`);
    return response.data;
  },
  getGamblerByUserId: async (userId) => {
    const response = await apiClient.get(`/api/Gambler/getGamblerByUserId/${userId}`);
    return response.data;
  },
  updateGambler: async (data) => {
    const response = await apiClient.put('/api/Gambler/updateGambler', data);
    return response.data;
  },
  deleteGambler: async (id) => {
    const response = await apiClient.delete(`/api/Gambler/deleteGambler/${id}`);
    return response.data;
  },
  updateGamblerConfiguration: async (data) => {
    const response = await apiClient.put('/api/Gambler/updateConfiguration', data);
    return response.data;
  },
  updateNotificationConfiguration: async (data) => {
    const response = await apiClient.put('/api/Gambler/updateNotificationConfiguration', data);
    return response.data;
  }
};

export const postService = {
  createPost: async (data) => {
    const response = await apiClient.post('/api/Post/createPost', data);
    return response.data;
  },
  updatePost: async (data) => {
    const response = await apiClient.put('/api/Post/updatePost', data);
    return response.data;
  },
  getPostById: async (id, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get(`/api/Post/getPostById/${id}`, { headers });
    return response.data;
  },
  getAllPosts: async (userId, page = 1, pageSize = 100, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get('/api/Post/getAllPosts', {
      params: { userId, page, pageSize },
      headers
    });
    return response.data;
  },
  getPostsByUserId: async (userId, page = 1, pageSize = 10, languageId = null) => {
    const headers = languageId ? { languageId } : {};
    const response = await apiClient.get('/api/Post/getPostsByUserId', {
      params: { userId, page, pageSize },
      headers
    });
    return response.data;
  },
  deletePost: async (id) => {
    const response = await apiClient.delete(`/api/Post/deletePost/${id}`);
    return response.data;
  }
};

export const postCommentService = {
  createPostComment: async (data) => {
    const response = await apiClient.post('/api/PostComment/createPostComment', data);
    return response.data;
  },
  updatePostComment: async (data) => {
    const response = await apiClient.put('/api/PostComment/updatePostComment', data);
    return response.data;
  },
  deletePostComment: async (id) => {
    const response = await apiClient.delete(`/api/PostComment/deletePostComment/${id}`);
    return response.data;
  },
  getPostCommentById: async (id) => {
    const response = await apiClient.get(`/api/PostComment/getPostCommentById/${id}`);
    return response.data;
  },
  getAllPostCommentByPostId: async (postId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostComment/getAllPostCommentByPostId', {
      params: { postId, page, pageSize }
    });
    return response.data;
  },
  getAllPostCommentByUserId: async (userId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostComment/getAllPostCommentByUserId', {
      params: { userId, page, pageSize }
    });
    return response.data;
  }
};

export const postLikeService = {
  createPostLike: async (data) => {
    const response = await apiClient.post('/api/PostLike/createPostLike', data);
    return response.data;
  },
  updatePostLike: async (data) => {
    const response = await apiClient.put('/api/PostLike/updatePostLike', data);
    return response.data;
  },
  deletePostLike: async (id) => {
    const response = await apiClient.delete(`/api/PostLike/deletePostLike/${id}`);
    return response.data;
  },
  getPostLikeById: async (id) => {
    const response = await apiClient.get(`/api/PostLike/getPostLikeById/${id}`);
    return response.data;
  },
  getAllPostLikeByPostId: async (postId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostLike/getAllPostLikeByPostId', {
      params: { postId, page, pageSize }
    });
    return response.data;
  },
  getAllPostLikeByUserId: async (userId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostLike/getAllPostLikeByUserId', {
      params: { userId, page, pageSize }
    });
    return response.data;
  }
};

export const postViewedService = {
  createPostViewed: async (data) => {
    const response = await apiClient.post('/api/PostViewed/createPostViewed', data);
    return response.data;
  },
  getAllPostViewedByUserId: async (userId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostViewed/GetAllPostViewedByUserId', {
      params: { userId, page, pageSize }
    });
    return response.data;
  },
  getAllPostViewedByPostId: async (postId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostViewed/GetAllPostViewedByPostId', {
      params: { postId, page, pageSize }
    });
    return response.data;
  }
};

export const postSharedService = {
  sharePost: async (data) => {
    const response = await apiClient.post('/api/PostShared/sharePost', data);
    return response.data;
  },
  getAllPostSharedByPostId: async (postId, page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/PostShared/getAllPostSharedByPostId', {
      params: { postId, page, pageSize }
    });
    return response.data;
  }
};

export const statusService = {
  getLatestStatuses: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/api/Status/latest', {
      params: { page, pageSize }
    });
    return response.data;
  },
  createStatus: async (data) => {
    const response = await apiClient.post('/api/Status', data);
    return response.data;
  },
  deleteStatus: async (id) => {
    const response = await apiClient.delete(`/api/Status/${id}`);
    return response.data;
  },
  reactToStatus: async (id, type) => {
    const response = await apiClient.post(`/api/Status/${id}/react`, { type });
    return response.data;
  },
  getStatusReactions: async (id) => {
    const response = await apiClient.get(`/api/Status/${id}/reactions`);
    return response.data;
  }
};

export const chatService = {
  getChats: async () => {
    const response = await apiClient.get('/api/Chat');
    return response.data;
  },
  getMessages: async (chatId) => {
    const response = await apiClient.get(`/api/Chat/${chatId}/messages`);
    return response.data;
  },
  createDirectChat: async (otherUserId) => {
    const response = await apiClient.post(`/api/Chat/direct/${otherUserId}`);
    return response.data;
  },
  createGroupChat: async (data) => {
    const response = await apiClient.post('/api/Chat', data);
    return response.data;
  },
  sendMessage: async (chatId, content) => {
    const response = await apiClient.post(`/api/Chat/${chatId}/messages`, { content });
    return response.data;
  }
};

export const achievementService = {
  createAchievement: async (data) => {
    const response = await apiClient.post('/api/Achievement/createAchievement', data);
    return response.data;
  },
  getAllAchievements: async () => {
    const response = await apiClient.get('/api/Achievement/getAllAchievements');
    return response.data;
  },
  getAchievementById: async (id) => {
    const response = await apiClient.get(`/api/Achievement/getAchievementById/${id}`);
    return response.data;
  },
  updateAchievement: async (data) => {
    const response = await apiClient.put('/api/Achievement/updateAchievement', data);
    return response.data;
  },
  deleteAchievement: async (id) => {
    const response = await apiClient.delete(`/api/Achievement/deleteAchievement/${id}`);
    return response.data;
  },
  assignAchievementToGambler: async (gamblerId, achievementId, isCompleted = false) => {
    const response = await apiClient.post('/api/Achievement/assignAchievementToGambler', null, {
      params: { gamblerId, achievementId, isCompleted }
    });
    return response.data;
  },
  updateGamblerAchievementProgress: async (gamblerId, achievementId, isCompleted) => {
    const response = await apiClient.put('/api/Achievement/updateGamblerAchievementProgress', null, {
      params: { gamblerId, achievementId, isCompleted }
    });
    return response.data;
  },
  getGamblerAchievements: async (gamblerId) => {
    const response = await apiClient.get(`/api/Achievement/getGamblerAchievements/${gamblerId}`);
    return response.data;
  }
};

export default apiClient;
