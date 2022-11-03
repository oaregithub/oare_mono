import { PersonListItem } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(letter: string): Promise<PersonListItem[]> {
  const { data } = await axios.get(`/people/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getPeople,
};
