import axios from '@/axiosInstance';
import {
  Pagination,
  SearchPotentialPermissionsListsResponse,
  SearchPotentialPermissionsListsType,
  SearchTransliterationMode,
  SearchTransliterationResponse,
  Text,
} from '@oare/types';

async function searchTransliteration(
  transliteration: string,
  mode: SearchTransliterationMode,
  pagination: Pagination
): Promise<SearchTransliterationResponse> {
  const { data } = await axios.get('/search/transliteration', {
    params: {
      transliteration,
      mode,
      ...pagination,
    },
  });
  return data;
}

// FIXME
async function searchSpellings(): Promise<void> {
  const { data } = await axios.get('/search/spellings');
  return data;
}

// FIXME
async function searchDiscourseSpellings(): Promise<void> {
  const { data } = await axios.get('/search/discourse_spellings');
  return data;
}

// FIXME
async function searchNullDiscourseSpellings(): Promise<void> {
  const { data } = await axios.get('/search/null_discourse_spellings');
  return data;
}

// FIXME
async function searchDictionary(): Promise<void> {
  const { data } = await axios.get('/search/dictionary');
  return data;
}

// FIXME
async function searchWordsInText(): Promise<void> {
  const { data } = await axios.get('/search/words_in_text');
  return data;
}

async function searchTexts(pagination: Pagination): Promise<Text> {
  const { data } = await axios.get('/search/texts', {
    params: {
      ...pagination,
    },
  });
  return data;
}

async function searchPotentialPermissionsLists(
  groupId: number | null,
  type: SearchPotentialPermissionsListsType,
  pagination: Pagination
): Promise<SearchPotentialPermissionsListsResponse> {
  const { data } = await axios.get('/search/potential_permissions_lists', {
    params: {
      groupId,
      type,
      ...pagination,
    },
  });
  return data;
}

export default {
  searchTransliteration,
  searchSpellings,
  searchDiscourseSpellings,
  searchNullDiscourseSpellings,
  searchDictionary,
  searchWordsInText,
  searchTexts,
  searchPotentialPermissionsLists,
};
