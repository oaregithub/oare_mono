import axios from 'axios';
import store from '@/ts-store';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(config => {
  if (store.getters.idToken) {
    config.headers.Authorization = store.getters.idToken;
  }
  return config;
});

export default axiosInstance;
