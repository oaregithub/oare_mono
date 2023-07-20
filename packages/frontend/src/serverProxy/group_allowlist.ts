import { AddDenylistAllowlistPayload, DenylistAllowlist } from '@oare/types';
import axios from '@/axiosInstance';

async function getGroupAllowlist(groupId: number): Promise<DenylistAllowlist> {
  const { data } = await axios.get(`/group_allowlist/${groupId}`);
  return data;
}

async function addToGroupAllowlist(
  groupId: number,
  payload: AddDenylistAllowlistPayload
): Promise<void> {
  await axios.post(`/group_allowlist/${groupId}`, payload);
}

async function removeFromGroupAllowlist(
  groupId: number,
  uuid: string
): Promise<void> {
  await axios.delete(`/group_allowlist/${groupId}/${uuid}`);
}

export default {
  getGroupAllowlist,
  addToGroupAllowlist,
  removeFromGroupAllowlist,
};
