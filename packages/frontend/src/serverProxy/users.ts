import { GetUserResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getAllUsers(): Promise<GetUserResponse[]> {
  const { data } = await axios.get('/users');
  return data;
}

export default {
  getAllUsers,
};
