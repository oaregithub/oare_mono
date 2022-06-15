import { WordsResponse, AddWordPayload } from '@oare/types';
import axios from '../axiosInstance';

async function getDictionaryWords(letter: string): Promise<WordsResponse> {
  const { data } = await axios.get(`/words/${encodeURIComponent(letter)}`);
  return data;
}

async function addWord(payload: AddWordPayload): Promise<void> {
  await axios.post('/words/addword', payload);
}
export default {
  getDictionaryWords,
  addWord,
};
