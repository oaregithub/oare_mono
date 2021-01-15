import axios from '../axiosInstance';
import { NameOrPlace } from '@oare/types';

async function getNames(letter: string): Promise<NameOrPlace[]> {
  const { data } = await axios.get(`/names/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getNames,
};
