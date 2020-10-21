import axios from '@/axiosInstance';
import { LoginRegisterResponse } from '@oare/types';

async function refreshToken(): Promise<LoginRegisterResponse> {
  const { data } = await axios.get('/refresh_token');
  return data;
}

export default {
  refreshToken,
};
