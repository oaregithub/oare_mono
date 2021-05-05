import { PersonDisplay } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(letter: string): Promise<PersonDisplay[]> {
  const { data } = await axios.get(`/people/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getPeople,
};
