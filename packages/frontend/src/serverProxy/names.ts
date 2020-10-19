import axios from '../axiosInstance';
import { NameOrPlace } from '@oare/types';

async function getNames(): Promise<NameOrPlace[]> {
  const { data } = await axios.get('/names');
  return data;
}

export default {
  getNames,
};
