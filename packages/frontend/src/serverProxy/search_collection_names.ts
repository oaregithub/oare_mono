import axios from '@/axiosInstance';
import {
  SearchCollectionNamesPayload,
  SearchCollectionNamesResponse,
} from '@oare/types';

async function searchCollectionNames(
  payload: SearchCollectionNamesPayload
): Promise<SearchCollectionNamesResponse> {
  const { data } = await axios.get('/search_collection_names', {
    params: payload,
  });
  return data;
}

export default {
  searchCollectionNames,
};
