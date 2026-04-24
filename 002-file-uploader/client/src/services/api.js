import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
};

export const fileAPI = {
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/files');
    return response.data;
  },

  delete: async (filename) => {
    const response = await api.delete(`/files/${filename}`);
    return response.data;
  },

  getFileUrl: (filename) => {
    return `${API_BASE_URL}/files/${filename}`;
  },
};

export default api;
