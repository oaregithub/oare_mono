import axios from '@/axiosInstance';
import { PermissionItem, UpdatePermissionPayload } from '@oare/types';

async function getPermissions(): Promise<PermissionItem[]> {
  const { data } = await axios.get('/userpermissions');
  return data;
}

async function getGroupPermissions(groupId: number): Promise<PermissionItem[]> {
  const { data } = await axios.get(`/permissions/${groupId}`);
  return data;
}

async function getAllPermissions(): Promise<PermissionItem[]> {
  const { data } = await axios.get('/permissions');
  return data;
}

async function addPermission(
  groupId: string,
  payload: UpdatePermissionPayload
): Promise<void> {
  await axios.post(`/permissions/${groupId}`, payload);
}

async function removePermission(
  groupId: string,
  permission: PermissionItem['name']
): Promise<void> {
  await axios.delete(`/permissions/${groupId}/${permission}`);
}

export default {
  getPermissions,
  getGroupPermissions,
  getAllPermissions,
  addPermission,
  removePermission,
};
