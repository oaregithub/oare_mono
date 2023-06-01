import { UserWithGroups, User } from '@oare/types';
import axios from '../axiosInstance';

async function getAllUsers(): Promise<UserWithGroups[]> {
  const { data } = await axios.get('/users');
  return data;
}

async function getUser(uuid: string): Promise<User> {
  const { data } = await axios.get(`/users/${uuid}`);
  return data;
}

export default {
  getAllUsers,
  getUser,
};
