import { PeriodResponse } from '@oare/types';
import axios from '@/axiosInstance';

async function getPeriods(): Promise<PeriodResponse> {
  const { data } = await axios.get('/periods');
  return data;
}

export default {
  getPeriods,
};
