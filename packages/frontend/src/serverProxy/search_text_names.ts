import axios from '@/axiosInstance';
import { SearchTextNamesPayload, SearchTextNamesResponse } from '@oare/types';

async function searchTextNames(
  payload: SearchTextNamesPayload
): Promise<SearchTextNamesResponse> {
  const { data } = await axios.get('/search_text_names', {
    params: payload,
  });
  return data;
}

export default {
  searchTextNames,
};
