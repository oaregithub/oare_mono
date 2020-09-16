import axios from '../axiosInstance';

/**
 * @typedef {object} User
 * @property {number} id The ID of the user
 * @property {string} first_name The user's first name
 * @property {string} last_name The user's last name
 * @property {string} email The user's email address
 */
/**
 * Return all users registered in the system
 * @returns {Promise<User[]>} A list of all users
 */
async function getAllUsers() {
  let { data } = await axios.get('/users');
  return data;
}

export default {
  getAllUsers,
};
