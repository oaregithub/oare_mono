import {
  Word,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  UpdateFormSpellingPayload,
  UpdateFormPayload,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
  CheckSpellingResponse,
  Pagination,
  SpellingOccurrenceResponseRow,
  TaxonomyTree,
  AddFormPayload,
  AddWordPayload,
  ParseTreeProperty,
  AddWordCheckPayload,
  ConnectSpellingDiscoursePayload,
} from '@oare/types';
import axios from '../axiosInstance';

/**
 * Return forms and spellings of a dictionary word
 * @param {string} uuid The UUID of the word whose info to get
 */
async function getDictionaryInfo(uuid: string): Promise<Word> {
  const { data } = await axios.get(`/dictionary/${uuid}`);
  return data;
}

async function editWord(
  uuid: string,
  payload: UpdateDictionaryWordPayload
): Promise<void> {
  await axios.patch(`/dictionary/${uuid}`, payload);
}

async function editTranslations(
  uuid: string,
  payload: UpdateDictionaryTranslationPayload
): Promise<void> {
  await axios.patch(`/dictionary/translations/${uuid}`, payload);
}

async function updateForm(
  formUuid: string,
  payload: UpdateFormPayload
): Promise<void> {
  await axios.patch(`/dictionary/forms/${formUuid}`, payload);
}

async function updateSpelling(
  spellingUuid: string,
  newSpelling: string,
  discourseUuids: string[]
): Promise<void> {
  const payload: UpdateFormSpellingPayload = {
    spelling: newSpelling,
    discourseUuids,
  };
  await axios.put(`/dictionary/spellings/${spellingUuid}`, payload);
}

async function addSpelling(
  payload: AddFormSpellingPayload
): Promise<AddFormSpellingResponse> {
  const { data } = await axios.post('/dictionary/spellings', payload);
  return data;
}

async function removeSpelling(spellingUuid: string): Promise<void> {
  await axios.delete(`/dictionary/spellings/${spellingUuid}`);
}

async function checkSpelling(spelling: string): Promise<CheckSpellingResponse> {
  const { data } = await axios.get('/dictionary/spellings/check', {
    params: {
      spelling,
    },
  });

  return data;
}

async function getSpellingTextOccurrences(
  spellingUuids: string[],
  pagination: Pagination
): Promise<SpellingOccurrenceResponseRow[]> {
  const { data } = await axios.get('/dictionary/spelling_occurrences/texts', {
    params: {
      ...pagination,
      spellingUuids,
    },
  });
  return data;
}

async function getSpellingTotalOccurrences(
  spellingUuids: string[],
  pagination?: Partial<Pagination>
): Promise<number> {
  const { data } = await axios.get(
    '/dictionary/spellings/spelling_occurrences/occurrences',
    {
      params: {
        ...pagination,
        spellingUuids,
      },
    }
  );
  return data;
}

async function disconnectSpellings(discourseUuids: string[]): Promise<void> {
  const payload = {
    discourseUuids,
  };
  await axios.patch('/disconnect/spellings', payload);
}

async function connectSpelling(
  payload: ConnectSpellingDiscoursePayload
): Promise<void> {
  await axios.patch('/connect/spellings', payload);
}

async function getDictionaryInfoBySpellingUuid(
  spellingUuid: string
): Promise<Word | null> {
  const { data } = await axios.get(
    `/dictionary/textDiscourse/spelling/${spellingUuid}`
  );
  return data;
}

async function getDictionaryInfoByDiscourseUuid(
  discourseUuid: string
): Promise<Word | null> {
  const { data } = await axios.get(
    `/dictionary/textDiscourse/discourse/${discourseUuid}`
  );
  return data;
}

async function getTaxonomyTree(): Promise<TaxonomyTree> {
  const { data } = await axios.get('/dictionary/tree/taxonomy');
  return data;
}

async function addForm(payload: AddFormPayload): Promise<void> {
  await axios.post('/dictionary/addform', payload);
}

async function checkNewWord(
  wordSpelling: string,
  properties: ParseTreeProperty[]
): Promise<boolean> {
  const payload: AddWordCheckPayload = { wordSpelling, properties };
  const { data } = await axios.post('/dictionary/checknewword', payload);
  return data;
}

async function addWord(payload: AddWordPayload): Promise<string> {
  const { data } = await axios.post('/dictionary/addword', payload);
  return data;
}

export default {
  addSpelling,
  updateForm,
  getDictionaryInfo,
  editTranslations,
  editWord,
  updateSpelling,
  removeSpelling,
  checkSpelling,
  getSpellingTextOccurrences,
  getDictionaryInfoByDiscourseUuid,
  getSpellingTotalOccurrences,
  getTaxonomyTree,
  addForm,
  disconnectSpellings,
  connectSpelling,
  getDictionaryInfoBySpellingUuid,
  checkNewWord,
  addWord,
};
