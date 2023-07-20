import axios from 'axios';
import firebase from '@/firebase';
import { FirebaseError } from '@firebase/util';
import i18n from '@/i18n';
import sl from '@/serviceLocator';

/**
 * The hostname for the server where the API is hosted.
 */
const host =
  process.env.NODE_ENV === 'development'
    ? `http://${window.location.hostname}:8081`
    : '';

/**
 * The axios instance used throughout the application to make requests to the API.
 */
const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
});

// Uses response interceptor to renew auth tokens after timeout. Also handles errors.
axiosInstance.interceptors.response.use(
  res => res,
  async error => {
    const server = sl.get('serverProxy');
    const store = sl.get('store');
    const router = sl.get('router');

    if (
      error.config &&
      error.response &&
      error.response.status === 407 &&
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
            await server.logError({
              description: (err as FirebaseError).code,
              stacktrace: error && error.stack ? error.stack : null,
            });
          }
        }
      }

      return axiosInstance(error.config);
    }

    if (error.response) {
      if (error.response.status === 403) {
        router.replace({
          name: '403',
          params: { message: error.response?.data?.message || undefined },
        });
        return Promise.resolve(error);
      }

      if (error.response.status === 401) {
        router.replace({
          name: '401',
          params: { message: error.response?.data?.message || undefined },
        });
        return Promise.resolve(error);
      }

      if (error.response.status === 404) {
        router.replace({
          name: '404',
          params: { message: error.response?.data?.message || undefined },
        });
        return Promise.resolve(error);
      }
    }

    return Promise.reject(
      new Error(error.response?.data?.message || undefined)
    );
  }
);

// Uses request interceptor to add auth token and locale information to requests.
axiosInstance.interceptors.request.use(config => {
  const store = sl.get('store');

  if (store.getters.idToken) {
    config.headers.Authorization = store.getters.idToken;
    config.headers.Locale = i18n.locale;
  }
  return config;
});

export default axiosInstance;
