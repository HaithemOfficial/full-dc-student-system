import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly refresh cookie
});

// In-memory access token — never stored in localStorage
let _accessToken = null;
let _refreshing = null; // pending refresh promise

export const setAccessToken = (t) => { _accessToken = t; };
export const clearAccessToken = () => { _accessToken = null; };

api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const isLoginReq   = err.config?.url?.includes('/auth/login');
    const isRefreshReq = err.config?.url?.includes('/auth/refresh');
    const isLogoutReq  = err.config?.url?.includes('/auth/logout');

    if (err.response?.status === 401 && !isLoginReq && !isRefreshReq && !isLogoutReq) {
      // Try to refresh once
      if (!_refreshing) {
        _refreshing = api.post('/auth/refresh')
          .then(r => {
            setAccessToken(r.data.token);
            return r.data.token;
          })
          .catch(() => {
            clearAccessToken();
            window.location.href = '/login';
            return null;
          })
          .finally(() => { _refreshing = null; });
      }

      const newToken = await _refreshing;
      if (newToken) {
        err.config.headers.Authorization = `Bearer ${newToken}`;
        return api(err.config);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
