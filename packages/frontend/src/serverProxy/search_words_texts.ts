import {
  WordsInTextSearchPayload,
  WordFormAutocompleteDisplay,
  Word,
  UuidPayload,
} from '@oare/types';
import axios from '../axiosInstance';

async function getWordsInTextSearchResults(
  payload: WordsInTextSearchPayload
): Promise<any> {
  const { data } = await axios.get('/searchWordsInTexts', {
    params: payload,
  });
  return data;
}

async function getWordsAndForms(): Promise<WordFormAutocompleteDisplay[]> {
  const { data } = await axios.get('/wordsAndForms');
  return data;
}

async function getFormOptions(payload: UuidPayload): Promise<Word> {
  const { data } = await axios.get('/formOptions', { params: payload });
  return data;
}

export default {
  getWordsInTextSearchResults,
  getWordsAndForms,
  getFormOptions,
};
