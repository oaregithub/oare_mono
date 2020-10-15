import axios from '../axiosInstance';
import { WordWithForms } from '@/types/dictionary';

interface UpdateWordPayload {
  word: string;
  translations: {
    uuid: string;
    translation: string;
  }[];
}

interface UpdateWordResponse {
  translations: {
    uuid: string;
    translation: string;
  }[];
}
/**
 * Return forms and spellings of a dictionary word
 * @param {string} uuid The UUID of the word whose info to get
 */
async function getDictionaryInfo(uuid: string): Promise<WordWithForms> {
  let { data } = await axios.get(`/dictionary/${uuid}`);
  return data;
}

async function editWord(
  uuid: string,
  payload: UpdateWordPayload
): Promise<UpdateWordResponse> {
  const { data } = await axios.post(`/dictionary/${uuid}`, payload);
  return data;
}

export default {
  getDictionaryInfo,
  editWord,
};
