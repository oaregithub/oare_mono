import {
  AddUsersToGroupPayload,
  RemoveUsersFromGroupPayload,
} from '@oare/types';
import axios from '../axiosInstance';

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
