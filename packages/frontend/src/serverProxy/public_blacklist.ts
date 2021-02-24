import { AddPublicBlacklistPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getPublicBlacklist() {
  const { data } = await axios.get('/public_blacklist');
  return data;
}

async function getBlacklistCollections() {
  const { data } = await axios.get('/public_blacklist/collections');
  return data;
}

async function addTextsToPublicBlacklist(
  items: AddPublicBlacklistPayload
): Promise<number[]> {
  return axios.post('/public_blacklist', items);
}

async function removeTextsFromPublicBlacklist(uuids: string[]) {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/public_blacklist/${uuid}`))
  );
}

export default {
  getPublicBlacklist,
  getBlacklistCollections,
  addTextsToPublicBlacklist,
  removeTextsFromPublicBlacklist,
};
