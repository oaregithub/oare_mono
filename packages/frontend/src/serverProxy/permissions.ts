import axios from '@/axiosInstance';
import { PermissionResponse, UpdatePermissionPayload } from '@oare/types';

async function getPermissions(): Promise<PermissionResponse> {
  const { data } = await axios.get('/userpermissions');
  return data;
}

async function getGroupPermissions(
  groupId: number
): Promise<PermissionResponse> {
  const { data } = await axios.get(`/permissions/${groupId}`);
  return data;
}

async function getAllPermissions(): Promise<PermissionResponse> {
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
  permission: string
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
