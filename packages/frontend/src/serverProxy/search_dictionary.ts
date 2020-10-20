import { DictionarySearchResult, DictionarySearchPayload } from '@oare/types';
import axios from '@/axiosInstance';

async function searchDictionary(
  payload: DictionarySearchPayload
): Promise<DictionarySearchResult> {
  let { data } = await axios.get('/search_dictionary', {
    params: payload,
  });
  return data;
}

export default {
  searchDictionary,
};
