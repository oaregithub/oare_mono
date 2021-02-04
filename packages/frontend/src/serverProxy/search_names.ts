import axios from '@/axiosInstance';
import { SearchNamesPayload, SearchNamesResponse } from '@oare/types';

async function searchNames(
  payload: SearchNamesPayload
): Promise<SearchNamesResponse> {
  const { data } = await axios.get('/search_names', {
    params: payload,
  });
  return data;
}

export default {
  searchNames,
};
