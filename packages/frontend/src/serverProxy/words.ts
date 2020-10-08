import { WordsResponse } from '@/types/words';
import axios from '../axiosInstance';

async function getDictionaryWords(): Promise<WordsResponse> {
  const { data } = await axios.get('/words');
  return data;
}

export default {
  getDictionaryWords,
};
