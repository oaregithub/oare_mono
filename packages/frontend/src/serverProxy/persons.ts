import { PersonListItem } from '@oare/types';
import axios from '../axiosInstance';

async function getPersons(letter: string): Promise<PersonListItem[]> {
  const { data } = await axios.get(`/persons/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getPersons,
};
