import axios from '@/axiosInstance';
import { SearchTextsResponse, SearchTextsPayload } from '@oare/types';

async function searchTexts(
  payload: SearchTextsPayload
): Promise<SearchTextsResponse> {
  let { data } = await axios.get('/search', { params: payload });
  return data;
}

export default {
  searchTexts,
};
