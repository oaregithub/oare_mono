import axios from '../axiosInstance';
import { User } from '@oare/types';

async function getAllUsers(): Promise<User[]> {
  let { data } = await axios.get('/users');
  return data;
}

export default {
  getAllUsers,
};
