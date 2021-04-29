import { GetAllPeopleRequest, PersonDisplay } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(
  request: GetAllPeopleRequest
): Promise<PersonDisplay[]> {
  const { data } = await axios.get(
    `/people/${encodeURIComponent(request.letter)}`,
    {
      params: {
        limit: request.limit,
        page: request.page,
      },
    }
  );
  return data;
}

async function getPeopleCount(letter: string): Promise<number> {
  const { data } = await axios.get(
    `/people/${encodeURIComponent(letter)}/count`
  );
  return data;
}

async function getPeopleTextOccurrenceCount(uuid: string): Promise<number> {
  const { data } = await axios.get(
    `people/${encodeURIComponent(uuid)}/occurrences/count`
  );
  return data;
}

export default {
  getPeopleCount,
  getPeople,
  getPeopleTextOccurrenceCount,
};
