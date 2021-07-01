import { DenylistAllowlistItem, DenylistAllowlistPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getGroupAllowlistTexts(
  groupId: number
): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get(`/group_allowlist/${groupId}/text`);
  return data;
}

async function getGroupAllowlistCollections(
  groupId: number
): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get(`/group_allowlist/${groupId}/collection`);
  return data;
}

async function addItemsToGroupAllowlist(
  payload: DenylistAllowlistPayload,
  groupId: number
): Promise<void> {
  await axios.post(`/group_allowlist/${groupId}`, payload);
}

async function removeItemsFromGroupAllowlist(
  uuids: string[],
  groupId: number
): Promise<void> {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/group_allowlist/${groupId}/${uuid}`))
  );
}

export default {
  getGroupAllowlistTexts,
  getGroupAllowlistCollections,
  addItemsToGroupAllowlist,
  removeItemsFromGroupAllowlist,
};
