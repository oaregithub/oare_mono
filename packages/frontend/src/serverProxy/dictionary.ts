import axios from '../axiosInstance';
import {
  DictionaryWordResponse,
  UpdateDictionaryWordPayload,
  UpdateDictionaryTranslationPayload,
  UpdateDictionaryResponse,
  UpdateDictionaryTranslationsResponse,
  DictionaryForm,
} from '@oare/types';

/**
 * Return forms and spellings of a dictionary word
 * @param {string} uuid The UUID of the word whose info to get
 */
async function getDictionaryInfo(
  uuid: string
): Promise<DictionaryWordResponse> {
  let { data } = await axios.get(`/dictionary/${uuid}`);
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

export default {
  updateForm,
  getDictionaryInfo,
  editTranslations,
  editWord,
};
