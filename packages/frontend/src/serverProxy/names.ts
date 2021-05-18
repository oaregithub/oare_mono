import { Word } from '@oare/types';
import axios from '../axiosInstance';

async function getNames(letter: string): Promise<Word[]> {
  const { data } = await axios.get(`/names/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getNames,
};
