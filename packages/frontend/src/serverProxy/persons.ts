import {
  DisconnectPersonsPayload,
  Pagination,
  PersonListItem,
  TextOccurrencesCountResponseItem,
  TextOccurrencesResponseRow,
} from '@oare/types';
import axios from '../axiosInstance';

async function getPersons(letter: string): Promise<PersonListItem[]> {
  const { data } = await axios.get(`/persons/${encodeURIComponent(letter)}`);
  return data;
}

async function getPersonsOccurrencesCounts(
  personUuids: string[],
  pagination?: Partial<Pagination>
): Promise<TextOccurrencesCountResponseItem[]> {
  const { data } = await axios.post('/persons/occurrences/count', personUuids, {
    params: {
      ...pagination,
    },
  });
  return data;
}

async function getPersonsOccurrencesTexts(
  personsUuids: string[],
  pagination: Pagination
): Promise<TextOccurrencesResponseRow[]> {
  const { data } = await axios.get('/persons/occurrences/texts', {
    params: {
      ...pagination,
      personsUuids,
    },
  });
  return data;
}

async function disconnectPersons(
  discourseUuids: string[],
  personUuid: string
): Promise<void> {
  const payload: DisconnectPersonsPayload = {
    discourseUuids,
    personUuid,
  };
  await axios.patch('/persons/disconnect', payload);
}

export default {
  getPersons,
  getPersonsOccurrencesCounts,
  getPersonsOccurrencesTexts,
  disconnectPersons,
};
