import axios from '@/axiosInstance';

async function getCacheStatus(): Promise<boolean> {
  const { data } = await axios.get('/cache');
  return data;
}

async function enableCache(): Promise<void> {
  await axios.patch('/cache/enable');
}

async function disableCache(): Promise<void> {
  await axios.patch('/cache/disable');
}

async function flushCache(): Promise<void> {
  await axios.delete('/cache/flush');
}

export default {
  getCacheStatus,
  enableCache,
  disableCache,
  flushCache,
};
