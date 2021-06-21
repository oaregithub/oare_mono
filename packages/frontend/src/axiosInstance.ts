import axios from 'axios';
import store from '@/ts-store';
import firebase from '@/firebase';
import actions from '@/globalActions';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: '/.netlify/functions/server',
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
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true);
          store.setToken(idTokenResult);
        } catch (err) {
          if (err.code === 'auth/quota-exceeded') {
            error.config.isRefreshing = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            actions.logError(err.code, err);
          }
        }
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
