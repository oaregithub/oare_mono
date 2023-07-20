import axios from '@/axiosInstance';
import { EnvironmentInfo } from '@oare/types';

async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const { data } = await axios.get('/environment');
  return data;
}

export default {
  getEnvironmentInfo,
};
