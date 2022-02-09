import { PublicationResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getAllPublications(): Promise<PublicationResponse[]> {
  const { data } = await axios.get('/publications');
  return data;
}

export default {
  getAllPublications,
};
