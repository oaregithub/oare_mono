import { Pagination, PersonDisplay } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(letter: string): Promise<PersonDisplay[]> {
  const { data } = await axios.get(`/people/${encodeURIComponent(letter)}`);
  return data;
}

async function getPersonTextOccurrences(
  uuid: string,
  pagination: Pagination
): Promise<PersonDisplay[]> {
  const { data } = await axios.get(
    `/people/person/${encodeURIComponent(uuid)}/texts`,
    {
      params: pagination,
    }
  );
  return data;
}

async function getPersonTextOccurrencesCount(
  uuid: string,
  pagination?: Partial<Pagination>
): Promise<number> {
  const { data } = await axios.get(
    `/people/person/${encodeURIComponent(uuid)}/occurrences`,
    {
      params: pagination,
    }
  );
  return data;
}

export default {
  getPeople,
  getPersonTextOccurrences,
  getPersonTextOccurrencesCount,
};
