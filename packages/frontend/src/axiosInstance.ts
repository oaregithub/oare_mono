import axios from 'axios';
import store from '@/ts-store';
import firebase from '@/firebase';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  res => res,
  async error => {
    if (
      error.config &&
      error.response &&
      error.response.status === 401 &&
      !error.config.isRefreshing
    ) {
      error.config.isRefreshing = true;
      const { currentUser } = firebase.auth();

      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult(true);
        store.setToken(idTokenResult);
      }

      return axiosInstance(error.config);
    }

    throw error;
  }
);

axiosInstance.interceptors.request.use(config => {
  if (store.getters.idToken) {
    config.headers.Authorization = store.getters.idToken;
  }
  return config;
});

export default axiosInstance;
