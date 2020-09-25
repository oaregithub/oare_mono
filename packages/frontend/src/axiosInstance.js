import axios from 'axios';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

const axiosInstance = axios.create({
  baseURL: `${host}/api/v2`,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  res => res,
  async error => {
    if (error.config && error.response && error.response.status === 401) {
      await axiosInstance.get('/refresh_token');
      return axiosInstance(error.config);
    }
    throw error;
  }
);

export default axiosInstance;
