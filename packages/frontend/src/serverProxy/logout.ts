import axios from '@/axiosInstance';

async function logout(): Promise<void> {
  await axios.get('/logout');
}

export default {
  logout,
};
