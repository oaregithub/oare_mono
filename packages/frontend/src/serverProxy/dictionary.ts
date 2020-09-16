import axios from '../axiosInstance';
import { WordWithForms } from '@/types/dictionary';

/**
 * Return forms and spellings of a dictionary word
 * @param {string} uuid The UUID of the word whose info to get
 */
async function getDictionaryInfo(uuid: string): Promise<WordWithForms> {
  let { data } = await axios.get(`/dictionary/${uuid}`);
  return data;
}

export default {
  getDictionaryInfo,
};
