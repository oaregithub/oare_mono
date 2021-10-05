import axios from '@/axiosInstance';
import { SignCode } from '@oare/types';

async function getSignCode(sign: string): Promise<SignCode> {
  const { data } = await axios.get(`/sign_reading/${sign}`);
  return data;
}

export default {
  getSignCode,
};
