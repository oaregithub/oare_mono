import {
  Group,
  CreateGroupPayload,
  UpdateGroupDescriptionPayload,
} from '@oare/types';
import axios from '../axiosInstance';

async function getAllGroups(): Promise<Group[]> {
  const { data } = await axios.get('/groups');
  return data;
}

async function getGroupInfo(groupId: number): Promise<Group> {
  const { data } = await axios.get(`/groups/${groupId}`);
  return data;
}

async function deleteGroup(groupId: number): Promise<void> {
  await axios.delete(`/groups/${groupId}`);
}

async function createGroup(payload: CreateGroupPayload): Promise<number> {
  const {
    data: { id },
  } = await axios.post('/groups', payload);
  return id;
}

async function updateGroupDescription(
  groupId: number,
  payload: UpdateGroupDescriptionPayload
): Promise<void> {
  await axios.patch(`/groups/${groupId}`, payload);
}

export default {
  getGroupInfo,
  deleteGroup,
  getAllGroups,
  createGroup,
  updateGroupDescription,
};
