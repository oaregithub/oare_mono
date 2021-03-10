import axios from '@/axiosInstance';
import { User } from '@oare/types';

async function refreshToken(): Promise<User> {
  const { data } = await axios.get('/refresh_token');
  return data;
}

export default {
  refreshToken,
};
