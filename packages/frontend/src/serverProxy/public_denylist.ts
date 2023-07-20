import { DenylistAllowlist, AddDenylistAllowlistPayload } from '@oare/types';
import axios from '@/axiosInstance';

async function getPublicDenylist(): Promise<DenylistAllowlist> {
  const { data } = await axios.get('/public_denylist');
  return data;
}

async function addItemsToPublicDenylist(
  payload: AddDenylistAllowlistPayload
): Promise<void> {
  return axios.post('/public_denylist', payload);
}

async function removeItemFromPublicDenylist(uuid: string): Promise<void> {
  await axios.delete(`/public_denylist/${uuid}`);
}

export default {
  getPublicDenylist,
  addItemsToPublicDenylist,
  removeItemFromPublicDenylist,
};
