import axios from '../axiosInstance';
import { User } from '@/types/users';

async function getAllUsers(): Promise<User[]> {
  let { data } = await axios.get('/users');
  return data;
}

export default {
  getAllUsers,
};
