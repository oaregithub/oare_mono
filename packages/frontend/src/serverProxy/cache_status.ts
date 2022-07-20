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
  await axios.delete('/cache/flush', {
    params: {
      propogate: 'true',
    },
  });
}

async function clearCacheRoute(
  url: string,
  level: 'exact' | 'startsWith'
): Promise<void> {
  await axios.delete('/cache/clear', {
    params: {
      url,
      level,
      propogate: 'true',
    },
  });
}

async function getNumKeys(
  url: string,
  level: 'exact' | 'startsWith'
): Promise<number> {
  const { data } = await axios.get('/cache/keys', {
    params: {
      url,
      level,
    },
  });
  return data;
}

export default {
  getCacheStatus,
  enableCache,
  disableCache,
  flushCache,
  clearCacheRoute,
  getNumKeys,
};
