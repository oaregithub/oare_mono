import axios from '../axiosInstance';
import { Group, CreateGroupPayload, DeleteGroupPayload } from '@oare/types';

async function getAllGroups(): Promise<Group[]> {
  const { data } = await axios.get('/groups');
  return data;
}
/**
 * Get the name of a group given its ID
 * @param {number} groupId The ID of the group whose name to get
 */
async function getGroupName(groupId: number): Promise<string> {
  let {
    data: { name },
  } = await axios.get(`/groups/${groupId}`);
  return name;
}

async function deleteGroups(payload: DeleteGroupPayload) {
  await axios.delete('/groups', {
    params: payload,
  });
}

async function createGroup(payload: CreateGroupPayload): Promise<number> {
  let {
    data: { id },
  } = await axios.post('/groups', payload);
  return id;
}

export default {
  getGroupName,
  deleteGroups,
  getAllGroups,
  createGroup,
};
