import { DenylistAllowlistItem, DenylistAllowlistPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getPublicDenylist() {
  const { data } = await axios.get('/public_denylist');
  return data;
}

async function getDenylistCollections() {
  const { data } = await axios.get('/public_denylist/collections');
  return data;
}

async function getDenylistImages(): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get('/public_denylist/images');
  return data;
}

async function addItemsToPublicDenylist(
  payload: DenylistAllowlistPayload
): Promise<number[]> {
  return axios.post('/public_denylist', payload);
}

async function removeItemsFromPublicDenylist(uuids: string[]) {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/public_denylist/${uuid}`))
  );
}

export default {
  getPublicDenylist,
  getDenylistCollections,
  getDenylistImages,
  addItemsToPublicDenylist,
  removeItemsFromPublicDenylist,
};
