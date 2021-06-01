import axios from '@/axiosInstance';
import {
  SearchTextsResponse,
  SearchTextsCountPayload,
  SearchTextsPayload,
  SearchSpellingResultRow,
  SearchDiscourseSpellingResponse,
  Pagination,
  SearchNullDiscourseResultRow,
} from '@oare/types';

async function searchTexts(
  payload: SearchTextsPayload
): Promise<SearchTextsResponse> {
  const { data } = await axios.get('/search', { params: payload });
  return data;
}

async function searchTextsTotal(
  payload: SearchTextsCountPayload
): Promise<number> {
  const { data } = await axios.get('/search/count', { params: payload });
  return data;
}

async function searchSpellings(
  spelling: string
): Promise<SearchSpellingResultRow[]> {
  const { data } = await axios.get('/search/spellings', {
    params: {
      spelling,
    },
  });

  return data;
}

async function searchSpellingDiscourse(
  spelling: string,
  { page, limit }: Pagination
): Promise<SearchDiscourseSpellingResponse> {
  const { data } = await axios.get('/search/spellings/discourse', {
    params: {
      spelling,
      page,
      limit,
    },
  });

  return data;
}

async function searchNullDiscourse(
  characters: string,
  page: number,
  limit: number,
  includeSuperfluous: boolean
): Promise<SearchNullDiscourseResultRow[]> {
  const { data } = await axios.get('/search/discourse/null', {
    params: {
      characters,
      page,
      limit,
      includeSuperfluous,
    },
  });
  return data;
}

async function searchNullDiscourseCount(
  characters: string,
  includeSuperfluous: boolean
): Promise<number> {
  const { data } = await axios.get('/search/discourse/null/count', {
    params: {
      characters,
      includeSuperfluous,
    },
  });
  return data;
}

export default {
  searchSpellings,
  searchSpellingDiscourse,
  searchTexts,
  searchTextsTotal,
  searchNullDiscourse,
  searchNullDiscourseCount,
};
