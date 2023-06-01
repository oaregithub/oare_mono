import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
  User,
} from '@oare/types';
import axios from '../axiosInstance';

async function getGroupUsers(groupId: number): Promise<User[]> {
  const { data } = await axios.get(`/user_groups/${groupId}`);
  return data;
}

async function addUsersToGroup(
  groupId: number,
  userUuids: string[]
): Promise<void> {
  const payload: AddUsersToGroupPayload = { userUuids };
  await axios.post(`/user_groups/${groupId}`, payload);
}

async function removeUsersFromGroup(
  groupId: number,
  userUuids: string[]
): Promise<void> {
  const payload: RemoveUsersFromGroupPayload = { userUuids };
  await axios.delete(`/user_groups/${groupId}`, {
    params: payload,
  });
}

export default {
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup,
};
