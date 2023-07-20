import axios from '@/axiosInstance';
import {
  PermissionItem,
  UpdatePermissionPayload,
  PermissionName,
} from '@oare/types';

async function getUserPermissions(): Promise<PermissionItem[]> {
  const { data } = await axios.get('/user_permissions');
  return data;
}

async function getGroupPermissions(groupId: number): Promise<PermissionItem[]> {
  const { data } = await axios.get(`/permissions/${groupId}`);
  return data;
}

async function addGroupPermission(
  groupId: string,
  payload: UpdatePermissionPayload
): Promise<void> {
  await axios.post(`/permissions/${groupId}`, payload);
}

async function removeGroupPermission(
  groupId: string,
  permission: PermissionName
): Promise<void> {
  await axios.delete(`/permissions/${groupId}/${permission}`);
}

async function getAllPermissions(): Promise<PermissionItem[]> {
  const { data } = await axios.get('/all_permissions');
  return data;
}

export default {
  getUserPermissions,
  getGroupPermissions,
  getAllPermissions,
  addGroupPermission,
  removeGroupPermission,
};
