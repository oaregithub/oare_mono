import axios from '../axiosInstance';
import {
  AddPublicBlacklistPayload,
} from '@oare/types';

async function getPublicBlacklist() {
  let { data } = await axios.get('/public_blacklist');
  return data;
}

async function addTextsToPublicBlacklist(
  texts: AddPublicBlacklistPayload
): Promise<number[]> {
  return await axios.post('/public_blacklist', texts);
}

async function removeTextsFromPublicBlacklist(uuids: string[]) {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/public_blacklist/${uuid}`))
  );
}

export default {
  getPublicBlacklist,
  addTextsToPublicBlacklist,
  removeTextsFromPublicBlacklist,
};
