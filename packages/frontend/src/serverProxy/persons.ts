import {
  Pagination,
  Person,
  PersonCore,
  TextOccurrencesCountResponseItem,
  TextOccurrencesResponseRow,
} from '@oare/types';
import axios from '@/axiosInstance';

async function getPersonsByLetter(letter: string): Promise<PersonCore[]> {
  const { data } = await axios.get(`/persons/${letter}`);
  return data;
}

async function getPersonOccurrencesCount(
  personsUuids: string[],
  filter: string,
  roleUuid?: string
): Promise<TextOccurrencesCountResponseItem[]> {
  const { data } = await axios.get('/persons/occurrences/count', {
    params: {
      personsUuids,
      filter,
      roleUuid,
    },
  });
  return data;
}

async function getPersonOccurrences(
  personsUuids: string[],
  pagination: Pagination,
  roleUuid?: string
): Promise<TextOccurrencesResponseRow[]> {
  const { data } = await axios.get('/persons/occurrences/texts', {
    params: {
      personsUuids,
      ...pagination,
      roleUuid,
    },
  });
  return data;
}

async function disconnectPersonOccurrence(
  personUuid: string,
  discourseUuid: string
): Promise<void> {
  await axios.delete(`/persons/disconnect/${personUuid}/${discourseUuid}`);
}

async function getPerson(uuid: string): Promise<Person> {
  const { data } = await axios.get(`/person/${uuid}`);
  return data;
}

export default {
  getPersonsByLetter,
  getPersonOccurrencesCount,
  getPersonOccurrences,
  disconnectPersonOccurrence,
  getPerson,
};
