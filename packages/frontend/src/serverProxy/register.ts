import axios from '@/axiosInstance';
import { RegisterPayload } from '@oare/types';

async function register(payload: RegisterPayload) {
  let { data } = await axios.post('/register', payload);
  return data;
}

export default { register };
