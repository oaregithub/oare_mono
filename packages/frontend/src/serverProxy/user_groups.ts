import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
  User,
} from '@oare/types';
import axios from '@/axiosInstance';

async function getGroupUsers(groupId: number): Promise<User[]> {
  const { data } = await axios.get(`/user_groups/${groupId}`);
  return data;
}

async function addUsersToGroup(
  groupId: number,
  payload: AddUsersToGroupPayload
): Promise<void> {
  await axios.post(`/user_groups/${groupId}`, payload);
}

async function removeUsersFromGroup(
  groupId: number,
  payload: RemoveUsersFromGroupPayload
): Promise<void> {
  await axios.delete(`/user_groups/${groupId}`, {
    params: payload,
  });
}

export default {
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup,
};
