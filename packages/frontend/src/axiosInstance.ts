import axios from 'axios';
import store from '@/ts-store';
import firebase from '@/firebase';
import actions from '@/globalActions';
import router from '@/router';
import { FirebaseError } from '@firebase/util';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
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
          if ((err as FirebaseError).code === 'auth/quota-exceeded') {
            error.config.isRefreshing = false;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            actions.logError((err as FirebaseError).code, err as Error);
          }
        }
      }

      return axiosInstance(error.config);
    } else if (error.response.status === 403) {
      router.replace({ name: '403' });
      return;
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
