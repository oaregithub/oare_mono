import {
  DictItemAutocompleteDisplay,
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

async function getWordsAndForms(): Promise<DictItemAutocompleteDisplay[]> {
  const { data } = await axios.get('/wordsAndForms');
  return data;
}

export default {
  getWordsInTextSearchResults,
  getWordsAndForms,
};
