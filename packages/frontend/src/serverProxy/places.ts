import { DictionaryWordResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getPlaces(letter: string): Promise<DictionaryWordResponse[]> {
  const { data } = await axios.get(`/places/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getPlaces,
};
