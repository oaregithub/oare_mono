import axios from '../axiosInstance';
import {
  User,
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';

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
  addUsersToGroup,
  removeUsersFromGroup,
};
