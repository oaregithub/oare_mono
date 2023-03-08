import {
  DictItemComboboxDisplay,
  WordsInTextsSearchResponse,
  WordsInTextSearchPayloadUnparsed,
} from '@oare/types';
import axios from '../axiosInstance';

async function getWordsInTextSearchResults(
  payload: WordsInTextSearchPayloadUnparsed
): Promise<WordsInTextsSearchResponse> {
  const { data } = await axios.post('/searchWordsInTexts', payload);
  return data;
}

async function getDictItems(): Promise<DictItemComboboxDisplay[]> {
  const { data } = await axios.get('/dictItems');
  return data;
}

export default {
  getWordsInTextSearchResults,
  getDictItems,
};
