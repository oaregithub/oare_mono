import { WordsResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getDictionaryWords(letter: string): Promise<WordsResponse> {
  const { data } = await axios.get(`/words/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getDictionaryWords,
};
