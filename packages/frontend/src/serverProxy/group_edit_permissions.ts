import { GroupEditPermissionsPayload, Text } from '@oare/types';
import axios from '@/axiosInstance';

async function getGroupEditPermissions(groupId: number): Promise<Text[]> {
  const { data } = await axios.get(`/group_edit_permissions/${groupId}`);
  return data;
}

async function addToGroupEditPermissions(
  groupId: number,
  payload: GroupEditPermissionsPayload
): Promise<void> {
  await axios.post(`/group_edit_permissions/${groupId}`, payload);
}

async function removeFromGroupEditPermissions(
  groupId: number,
  uuid: string
): Promise<void> {
  await axios.delete(`/group_edit_permissions/${groupId}/${uuid}`);
}

export default {
  getGroupEditPermissions,
  addToGroupEditPermissions,
  removeFromGroupEditPermissions,
};
