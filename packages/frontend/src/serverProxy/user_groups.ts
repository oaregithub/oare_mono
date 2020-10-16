import axios from '../axiosInstance';
import { User } from '@oare/types';

async function getGroupUsers(groupId: number): Promise<User[]> {
  let { data: groupUsers } = await axios.get('/user_groups', {
    params: {
      group_id: groupId,
    },
  });
  return groupUsers;
}

async function addUsersToGroup(
  groupId: number,
  userIds: number[]
): Promise<void> {
  await axios.post('/user_groups', {
    group_id: groupId,
    user_ids: userIds,
  });
}

async function removeUsersFromGroup(groupId: number, userIds: number[]) {
  await axios.delete('/user_groups', {
    params: {
      group_id: groupId,
      user_ids: userIds,
    },
  });
}

export default {
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup,
};
