import axios from '@/axiosInstance';
import {
  SearchTextsResponse,
  SearchTextsPayload,
  SearchSpellingResultRow,
  SearchDiscourseSpellingRow,
} from '@oare/types';

async function searchTexts(
  payload: SearchTextsPayload
): Promise<SearchTextsResponse> {
  let { data } = await axios.get('/search', { params: payload });
  return data;
}

async function searchSpellings(
  spelling: string
): Promise<SearchSpellingResultRow[]> {
  let { data } = await axios.get('/search/spellings', {
    params: {
      spelling,
    },
  });

  return data;
}

async function searchSpellingDiscourse(
  spelling: string
): Promise<SearchDiscourseSpellingRow[]> {
  let { data } = await axios.get('/search/spellings/discourse', {
    params: {
      spelling,
    },
  });

  return data;
}

export default {
  searchSpellings,
  searchSpellingDiscourse,
  searchTexts,
};
