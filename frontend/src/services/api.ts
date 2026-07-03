const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rentmate_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text || 'An error occurred' };
  }

  if (!response.ok) {
    throw new Error(data.message || response.statusText || 'API request failed');
  }
  return data;
};

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      next: { revalidate: 0 } // Disable Next caching to get live updates
    });
    return handleResponse(res);
  },

  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (endpoint: string, body?: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  delete: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

// Endpoints
export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (userData: any) => api.post('/auth/signup', userData),
  verifyOtp: (payload: any) => api.post('/auth/verify-otp', payload),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload: any) => api.post('/auth/reset-password', payload),
  checkPasswordStrength: (password: string) => api.post('/auth/password-strength', { password }),
};

export const listingsApi = {
  getAll: (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
    }
    const queryStr = params.toString();
    return api.get(`/listings${queryStr ? `?${queryStr}` : ''}`);
  },
  getById: (id: string) => api.get(`/listings/${id}`),
  create: (listingData: any) => api.post('/listings', listingData),
  update: (id: string, listingData: any) => api.put(`/listings/${id}`, listingData),
  delete: (id: string) => api.delete(`/listings/${id}`),
  toggleFilled: (id: string, isFilled?: boolean) => api.put(`/listings/${id}/filled`, { isFilled }),
};

export const interestsApi = {
  express: (listingId: string, message?: string) => api.post('/interests', { listingId, message }),
  getAll: () => api.get('/interests'),
  updateStatus: (id: string, status: 'accepted' | 'rejected') => api.put(`/interests/${id}/status`, { status }),
};

export const aiApi = {
  getCompatibility: (listingId: string) => api.post('/ai/compatibility', { listingId }),
};

export const chatsApi = {
  getAll: () => api.get('/chats'),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, text: string) => api.post('/chats/messages', { chatId, text }),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData: any) => api.put('/users/profile', profileData),
  updatePassword: (passwordData: any) => api.put('/users/password', passwordData),
  deleteAccount: () => api.delete('/users/delete-account'),
};
