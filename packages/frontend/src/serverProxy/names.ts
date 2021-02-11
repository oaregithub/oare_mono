import { NameOrPlace } from '@oare/types';
import axios from '../axiosInstance';

async function getNames(letter: string): Promise<NameOrPlace[]> {
  const { data } = await axios.get(`/names/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getNames,
};
