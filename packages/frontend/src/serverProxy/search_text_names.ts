import axios from '@/axiosInstance';
import { SearchTextNamesPayload, SearchTextNamesResultRow } from '@oare/types';

async function searchTextNames(
  payload: SearchTextNamesPayload
): Promise<SearchTextNamesResultRow[]> {
  const { data } = await axios.get('/search_text_names', {
    params: payload,
  });
  return data;
}

export default {
  searchTextNames,
};
