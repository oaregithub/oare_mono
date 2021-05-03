import { PersonDisplay } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(letter: string): Promise<PersonDisplay[]> {
  const { data } = await axios.get(`/people/${encodeURIComponent(letter)}`);
  return data;
}

async function getPeopleCount(letter: string): Promise<number> {
  const { data } = await axios.get(
    `/people/${encodeURIComponent(letter)}/count`
  );
  return data;
}

export default {
  getPeopleCount,
  getPeople,
};
