import axios from '../axiosInstance';
import {
  RemovePublicBlacklistPayload,
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

async function removeTextsFromPublicBlacklist(
  payload: RemovePublicBlacklistPayload
) {
  await axios.delete('/public_blacklist', {
    params: payload,
  });
}

export default {
  getPublicBlacklist,
  addTextsToPublicBlacklist,
  removeTextsFromPublicBlacklist,
};
