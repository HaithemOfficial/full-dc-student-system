import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly studentRefreshToken cookie
});

// In-memory access token — never stored in localStorage
let _accessToken = null;
let _refreshing = null;

export const setStudentAccessToken = (t) => { _accessToken = t; };
export const clearStudentAccessToken = () => { _accessToken = null; };

api.interceptors.request.use(config => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const isLoginReq   = err.config?.url?.includes('/student-auth/login');
    const isRefreshReq = err.config?.url?.includes('/student-auth/refresh');
    const isLogoutReq  = err.config?.url?.includes('/student-auth/logout');

    if (err.response?.status === 401 && !isLoginReq && !isRefreshReq && !isLogoutReq) {
      if (!_refreshing) {
        _refreshing = api.post('/student-auth/refresh')
          .then(r => {
            setStudentAccessToken(r.data.token);
            return r.data.token;
          })
          .catch(() => {
            clearStudentAccessToken();
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
