import { LoginPayload, LoginRegisterResponse } from '@oare/types';
import axios from '../axiosInstance';

async function login(payload: LoginPayload): Promise<LoginRegisterResponse> {
  const { data } = await axios.post('/login', payload);
  return data;
}

export default {
  login,
};
