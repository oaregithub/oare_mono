import axios from '../axiosInstance';

/**
 * @typedef {object} User
 * @property {number} id The ID of the user
 * @property {string} first_name The user's first name
 * @property {string} last_name The user's last name
 * @property {string} email The user's email address
 */
/**
 * Return users belonging to a group
 * @param {number} groupId The ID of the group to get users of
 * @returns {Promise<User[]>} A list of all users belonging to the group
 */
async function getGroupUsers(groupId) {
  let { data: groupUsers } = await axios.get('/user_groups', {
    params: {
      group_id: groupId
    }
  });
  return groupUsers;
}

/**
 * Add a list of users to a group
 * @param {number} groupId The ID of the group to add users to
 * @param {number[]} userIds A list of user IDs to add to the group
 */
async function addUsersToGroup(groupId, userIds) {
  await axios.post('/user_groups', {
    group_id: groupId,
    user_ids: userIds
  });
}

/**
 * Remove users from a given group
 * @param {number} groupId The ID of the group to remove users from
 * @param {number[]} userIds A list of IDs of users to remove from the group
 */
async function removeUsersFromGroup(groupId, userIds) {
  await axios.delete('/user_groups', {
    params: {
      group_id: groupId,
      user_ids: userIds
    }
  });
}

export default {
  getGroupUsers,
  addUsersToGroup,
  removeUsersFromGroup
};
