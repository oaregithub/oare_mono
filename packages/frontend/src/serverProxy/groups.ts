import {
  Group,
  CreateGroupPayload,
  UpdateGroupDescriptionPayload,
} from '@oare/types';
import axios from '@/axiosInstance';

async function getGroup(id: number): Promise<Group> {
  const { data } = await axios.get(`/groups/${id}`);
  return data;
}

async function deleteGroup(id: number): Promise<void> {
  await axios.delete(`/groups/${id}`);
}

async function updateGroupDescription(
  id: number,
  payload: UpdateGroupDescriptionPayload
): Promise<void> {
  await axios.patch(`/groups/${id}`, payload);
}

async function getAllGroups(): Promise<Group[]> {
  const { data } = await axios.get('/groups');
  return data;
}

async function createGroup(payload: CreateGroupPayload): Promise<number> {
  const { data } = await axios.post('/groups', payload);
  return data;
}

export default {
  getGroup,
  deleteGroup,
  updateGroupDescription,
  getAllGroups,
  createGroup,
};
