import {
  DenylistAllowlistItem,
  GroupEditPermissionsPayload,
} from '@oare/types';
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
  uuids: string[],
  type: 'text' | 'collection',
  groupId: number
): Promise<void> {
  const payload: GroupEditPermissionsPayload = { uuids, type };
  await axios.post(`/group_edit_permissions/${groupId}`, payload);
}

async function removeItemFromGroupEditPermissions(
  uuid: string,
  groupId: number
): Promise<void> {
  await axios.delete(`/group_edit_permissions/${groupId}/${uuid}`);
}

export default {
  getGroupTextEditPermissions,
  getGroupCollectionEditPermissions,
  addItemsToGroupEditPermissions,
  removeItemFromGroupEditPermissions,
};
