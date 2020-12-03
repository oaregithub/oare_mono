import axios from '../axiosInstance';
import {
  PublicBlacklistPayloadItem,
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

export default {
  getPublicBlacklist,
  addTextsToPublicBlacklist,
};
