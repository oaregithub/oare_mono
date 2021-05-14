import {
  DictionaryWordResponse,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  UpdateDictionaryResponse,
  UpdateDictionaryTranslationsResponse,
  UpdateFormSpellingPayload,
  DictionaryForm,
  AddFormSpellingPayload,
  AddFormSpellingResponse,
  CheckSpellingResponse,
  Pagination,
  SpellingOccurrenceResponseRow,
} from '@oare/types';
import axios from '../axiosInstance';

/**
 * Return forms and spellings of a dictionary word
 * @param {string} uuid The UUID of the word whose info to get
 */
async function getDictionaryInfo(
  uuid: string
): Promise<DictionaryWordResponse> {
  const { data } = await axios.get(`/dictionary/${uuid}`);
  return data;
}

async function editWord(
  uuid: string,
  payload: UpdateDictionaryWordPayload
): Promise<UpdateDictionaryResponse> {
  const { data } = await axios.post(`/dictionary/${uuid}`, payload);
  return data;
}

async function editTranslations(
  uuid: string,
  payload: UpdateDictionaryTranslationPayload
): Promise<UpdateDictionaryTranslationsResponse> {
  const { data } = await axios.post(
    `/dictionary/translations/${uuid}`,
    payload
  );
  return data;
}

async function updateForm(form: DictionaryForm): Promise<void> {
  await axios.post(`/dictionary/forms/${form.uuid}`, form);
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
): Promise<DictionaryWordResponse | null> {
  const { data } = await axios.get(
    `/dictionary/textDiscourse/${discourseUuid}`
  );
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
};
