import axios from '../axiosInstance';
import {
  User,
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';

async function getGroupUsers(groupId: number): Promise<User[]> {
  let { data: groupUsers } = await axios.get(`/user_groups/${groupId}`);
  return groupUsers;
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
) {
  await axios.delete(`/user_groups/${groupId}`, {
    params: payload,
  });
}

export default {
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup,
};
