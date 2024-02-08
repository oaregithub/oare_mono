import axios from 'axios';
import store from '@/ts-store';
import firebase from '@/firebase';
import actions from '@/globalActions';
import router from '@/router';
import { FirebaseError } from '@firebase/util';
import i18n from '@/i18n';

/**
 * The host URL for the API. It is set to the local development server when in development mode.
 */
const host =
  process.env.NODE_ENV === 'development'
    ? `http://${window.location.hostname}:8081`
    : '';

/**
 * Customized Axios instance for the application.
 */
const axiosInstance = axios.create({
  baseURL: `${host}/api/v3`,
});

// Adds response interceptors to handle errors and refresh the Firebase authentication token if necessary.
axiosInstance.interceptors.response.use(
  res => res,
  async error => {
    // If the error is due to a 407 status code, the Firebase authentication token is refreshed and the request is retried.
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
            actions.logError((err as FirebaseError).code, err as Error);
          }
        }
      }

      return axiosInstance(error.config);
    }

    if (error.response) {
      // If the error is due to a 403 status code, the user is redirected to the 403 page.
      if (error.response.status === 403) {
        router.replace({
          name: '403',
          params: { message: error.response?.data?.message || undefined },
        });
        return Promise.resolve(error);
      }

      // If the error is due to a 401 status code, the user is redirected to the 401 page.
      if (error.response.status === 401) {
        router.replace({
          name: '401',
          params: { message: error.response?.data?.message || undefined },
        });
        return Promise.resolve(error);
      }

      // If the error is due to a 404 status code, the user is redirected to the 404 page.
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

// Adds request interceptors to add the Firebase authentication token, if available, to the request headers.
axiosInstance.interceptors.request.use(config => {
  if (store.getters.idToken) {
    config.headers.Authorization = store.getters.idToken;
    config.headers.Locale = i18n.locale;
  }
  return config;
});

export default axiosInstance;
