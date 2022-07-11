import { Word } from '@oare/types';
import axios from '../axiosInstance';

async function getDictionaryWords(letter: string): Promise<Word[]> {
  const { data } = await axios.get(`/words/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getDictionaryWords,
};
