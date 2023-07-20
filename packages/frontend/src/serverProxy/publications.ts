import { Publication } from '@oare/types';
import axios from '@/axiosInstance';

async function getAllPublications(): Promise<Publication[]> {
  const { data } = await axios.get('/publications');
  return data;
}

export default {
  getAllPublications,
};
