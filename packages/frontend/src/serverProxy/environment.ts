import axios from '@/axiosInstance';
import { EnvironmentInfo, GoogleAnalyticsInfo } from '@oare/types';

async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const { data } = await axios.get('/environment_info');
  return data;
}

async function getGoogleAnalyticsInfo(): Promise<GoogleAnalyticsInfo> {
  const { data } = await axios.get('/analytics_info');
  return data;
}

export default {
  getEnvironmentInfo,
  getGoogleAnalyticsInfo,
};
