import axios from '@/axiosInstance';
import { EnvironmentInfo } from '@oare/types';

async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const { data } = await axios.get('/environment_info');
  return data;
}

async function getReadOnlyStatus(): Promise<boolean> {
  const { data } = await axios.get('/environment_readonly');
  return data;
}

export default {
  getEnvironmentInfo,
  getReadOnlyStatus,
};
