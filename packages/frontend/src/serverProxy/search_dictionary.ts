import { DictionarySearchResult } from '@/types/search_dictionary';
import axios from '@/axiosInstance';

async function searchDictionary(
  search: string,
  page: number,
  rows: number
): Promise<DictionarySearchResult> {
  let { data } = await axios.get('/search_dictionary', {
    params: {
      search,
      page,
      rows
    }
  });
  return data;
}

export default {
  searchDictionary
};
