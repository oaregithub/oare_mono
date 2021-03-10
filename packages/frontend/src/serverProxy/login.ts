import { LoginPayload, User } from '@oare/types';
import axios from '../axiosInstance';

async function login(payload: LoginPayload): Promise<User> {
  const { data } = await axios.post('/login', payload);
  return data;
}

export default {
  login,
};
