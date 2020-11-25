import axios from '../axiosInstance';
import { GetUserResponse } from '@oare/types';

async function getAllUsers(): Promise<GetUserResponse[]> {
  let { data } = await axios.get('/users');
  return data;
}

export default {
  getAllUsers,
};
