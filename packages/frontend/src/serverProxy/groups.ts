import {
  Group,
  CreateGroupPayload,
  UpdateGroupDescriptionPayload,
} from '@oare/types';
import axios from '../axiosInstance';

async function getGroup(id: number): Promise<Group> {
  const { data } = await axios.get(`/groups/${id}`);
  return data;
}

async function deleteGroup(id: number): Promise<void> {
  await axios.delete(`/groups/${id}`);
}

async function updateGroupDescription(
  id: number,
  description: string
): Promise<void> {
  const payload: UpdateGroupDescriptionPayload = {
    description,
  };
  await axios.patch(`/groups/${id}`, payload);
}

async function getAllGroups(): Promise<Group[]> {
  const { data } = await axios.get('/groups');
  return data;
}

async function createGroup(name: string, description: string): Promise<void> {
  const payload: CreateGroupPayload = {
    name,
    description,
  };
  await axios.post('/groups', payload);
}

export default {
  getGroup,
  deleteGroup,
  updateGroupDescription,
  getAllGroups,
  createGroup,
};
