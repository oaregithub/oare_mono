import axios from '@/axiosInstance';
import { SearchTextPayload, SearchTextResultRow } from '@oare/types';

async function searchTextNames(
  payload: SearchTextPayload
): Promise<SearchTextResultRow[]> {
  const { data } = await axios.get('/search_text_names', {
    params: payload,
  });
  return data;
}

export default {
  searchTextNames,
};
