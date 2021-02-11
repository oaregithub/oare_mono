import { Group, CreateGroupPayload, DeleteGroupPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getAllGroups(): Promise<Group[]> {
  const { data } = await axios.get('/groups');
  return data;
}
/**
 * Get the name of a group given its ID
 * @param {number} groupId The ID of the group whose name to get
 */
async function getGroupName(groupId: number): Promise<string> {
  const {
    data: { name },
  } = await axios.get(`/groups/${groupId}`);
  return name;
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

export default {
  getGroupName,
  deleteGroup,
  getAllGroups,
  createGroup,
};
