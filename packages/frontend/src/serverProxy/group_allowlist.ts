import {
  DenylistAllowlistItem,
  AddDenylistAllowlistPayload,
} from '@oare/types';
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

async function getGroupAllowlistImages(
  groupId: number
): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get(`/group_allowlist/${groupId}/img`);
  return data;
}

async function addItemsToGroupAllowlist(
  groupId: number,
  uuids: string[],
  type: 'text' | 'img' | 'collection'
): Promise<void> {
  const payload: AddDenylistAllowlistPayload = { uuids, type };
  await axios.post(`/group_allowlist/${groupId}`, payload);
}

async function removeItemFromGroupAllowlist(
  uuid: string,
  groupId: number
): Promise<void> {
  await axios.delete(`/group_allowlist/${groupId}/${uuid}`);
}

export default {
  getGroupAllowlistTexts,
  getGroupAllowlistCollections,
  getGroupAllowlistImages,
  addItemsToGroupAllowlist,
  removeItemFromGroupAllowlist,
};
