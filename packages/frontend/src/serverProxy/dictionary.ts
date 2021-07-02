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
  ParseTree,
  AddFormPayload,
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
  await axios.post(`/dictionary/forms/${formUuid}`, payload);
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
  spellingUuid: string,
  pagination: Pagination
): Promise<SpellingOccurrenceResponseRow[]> {
  const { data } = await axios.get(
    `/dictionary/spellings/${spellingUuid}/texts`,
    {
      params: pagination,
    }
  );
  return data;
}

async function getSpellingTotalOccurrences(
  spellingUuid: string,
  pagination?: Partial<Pagination>
): Promise<number> {
  const { data } = await axios.get(
    `/dictionary/spellings/${spellingUuid}/occurrences`,
    {
      params: pagination,
    }
  );
  return data;
}

async function getDictionaryInfoByDiscourseUuid(
  discourseUuid: string
): Promise<Word | null> {
  const { data } = await axios.get(
    `/dictionary/textDiscourse/${discourseUuid}`
  );
  return data;
}

async function getParseTree(): Promise<ParseTree> {
  const { data } = await axios.get('/dictionary/tree/parse');
  return data;
}

async function addForm(payload: AddFormPayload): Promise<void> {
  await axios.post('/dictionary/addform', payload);
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
  getParseTree,
  addForm,
};
