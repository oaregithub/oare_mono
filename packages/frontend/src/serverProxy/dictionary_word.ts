import axios from '@/axiosInstance';
import {
  AddWordPayload,
  DictionaryWord,
  DictionaryWordType,
  UpdateWordSpellingPayload,
} from '@oare/types';

async function getDictionaryWords(
  letter: string,
  type: DictionaryWordType
): Promise<DictionaryWord[]> {
  const { data } = await axios.get(`/dictionary_word/${letter}/${type}`);
  return data;
}

async function getDictionaryWord(uuid: string): Promise<DictionaryWord> {
  const { data } = await axios.get(`/dictionary_word/${uuid}`);
  return data;
}

async function updateWordSpelling(
  uuid: string,
  payload: UpdateWordSpellingPayload
): Promise<void> {
  await axios.patch(`/dictionary_word/${uuid}`, payload);
}

async function addWord(payload: AddWordPayload): Promise<string> {
  const { data } = await axios.post('/dictionary_word', payload);
  return data;
}

async function addWordCheck(payload: AddWordPayload): Promise<void> {
  await axios.post('/dictionary_word/check', payload);
}

export default {
  getDictionaryWords,
  getDictionaryWord,
  updateWordSpelling,
  addWord,
  addWordCheck,
};
