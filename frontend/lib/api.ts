import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Attach JWT ─────────────────────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let _refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!_refreshing) {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('no_refresh');

          _refreshing = axios
            .post(`${BASE_URL}/auth/refresh`, { refreshToken })
            .then((r) => {
              const { accessToken } = r.data.data;
              localStorage.setItem('access_token', accessToken);
              _refreshing = null;
              return accessToken;
            })
            .catch((e) => {
              _refreshing = null;
              throw e;
            });
        }

        const newToken = await _refreshing;
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    api.patch('/auth/me', data),
};

// ── Organizations ──────────────────────────────────────────────────────────────
export const orgApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/organizations', { params }),
  get: (id: string) =>
    api.get(`/organizations/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post('/organizations', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/organizations/${id}`, data),
  delete: (id: string) =>
    api.delete(`/organizations/${id}`),
  myOrgs: () =>
    api.get('/organizations/mine'),
};

// ── Events ─────────────────────────────────────────────────────────────────────
export const eventApi = {
  list: (orgId: string, params?: Record<string, unknown>) =>
    api.get(`/organizations/${orgId}/events`, { params }),
  get: (orgId: string, eventId: string) =>
    api.get(`/organizations/${orgId}/events/${eventId}`),
  create: (orgId: string, data: Record<string, unknown>) =>
    api.post(`/organizations/${orgId}/events`, data),
  update: (orgId: string, eventId: string, data: Record<string, unknown>) =>
    api.patch(`/organizations/${orgId}/events/${eventId}`, data),
  delete: (orgId: string, eventId: string) =>
    api.delete(`/organizations/${orgId}/events/${eventId}`),
};

// ── Products ───────────────────────────────────────────────────────────────────
export const productApi = {
  list: (orgId: string, params?: Record<string, unknown>) =>
    api.get(`/organizations/${orgId}/products`, { params }),
  get: (orgId: string, productId: string) =>
    api.get(`/organizations/${orgId}/products/${productId}`),
  create: (orgId: string, data: Record<string, unknown>) =>
    api.post(`/organizations/${orgId}/products`, data),
  update: (orgId: string, productId: string, data: Record<string, unknown>) =>
    api.patch(`/organizations/${orgId}/products/${productId}`, data),
  delete: (orgId: string, productId: string) =>
    api.delete(`/organizations/${orgId}/products/${productId}`),
};

// ── Feed ───────────────────────────────────────────────────────────────────────
export const feedApi = {
  get: (params?: Record<string, unknown>) =>
    api.get('/feed', { params }),
};

// ── Search ─────────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (params: Record<string, unknown>) =>
    api.get('/search', { params }),
};

// ── Interactions ───────────────────────────────────────────────────────────────
export const interactionApi = {
  toggle: (data: { item_type: 'event' | 'product'; item_id: string; interaction_type: 'like' | 'save' | 'register' }) =>
    api.post('/interactions', data),
  getUserInteractions: (params?: Record<string, unknown>) =>
    api.get('/interactions/me', { params }),
};

export type ApiError = AxiosError<{ message: string; errors?: unknown }>;
