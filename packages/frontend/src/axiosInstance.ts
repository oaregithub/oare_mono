import axios from 'axios';
import store from '@/ts-store';
import firebase from '@/firebase';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(async config => {
  // If expiration is less than 5 minutes away, refresh
  if (!store.getters.isTokenValid) {
    const { currentUser } = firebase.auth();

    if (currentUser) {
      const idTokenResult = await currentUser.getIdTokenResult(true);
      store.setToken(idTokenResult);
      config.headers.Authorization = idTokenResult.token;
    }
  } else {
    config.headers.Authorization = store.getters.idToken;
  }
  return config;
});

export default axiosInstance;
