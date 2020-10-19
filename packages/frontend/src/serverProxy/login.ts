import { LoginPayload, LoginResponse } from '@oare/types';
import axios from '../axiosInstance';

async function login(payload: LoginPayload): Promise<LoginResponse> {
  let { data } = await axios.post('/login', payload);
  return data;
}

export default {
  login,
};
