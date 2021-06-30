import { DenylistAllowlistItem, DenylistAllowlistPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getGroupTextEditPermissions(
  groupId: number
): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get(`/group_edit_permissions/${groupId}/text`);
  return data;
}

async function getGroupCollectionEditPermissions(
  groupId: number
): Promise<DenylistAllowlistItem[]> {
  const { data } = await axios.get(
    `/group_edit_permissions/${groupId}/collection`
  );
  return data;
}

async function addItemsToGroupEditPermissions(
  payload: DenylistAllowlistPayload,
  groupId: number
): Promise<void> {
  await axios.post(`/group_edit_permissions/${groupId}`, payload);
}

async function removeItemsFromGroupEditPermissions(
  uuids: string[],
  groupId: number
): Promise<void> {
  await Promise.all(
    uuids.map(uuid =>
      axios.delete(`/group_edit_permissions/${groupId}/${uuid}`)
    )
  );
}

export default {
  getGroupTextEditPermissions,
  getGroupCollectionEditPermissions,
  addItemsToGroupEditPermissions,
  removeItemsFromGroupEditPermissions,
};
