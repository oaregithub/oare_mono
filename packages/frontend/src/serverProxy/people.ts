import { GetAllPeopleRequest, PersonDisplay } from '@oare/types';
import axios from '../axiosInstance';

async function getPeople(
  request: GetAllPeopleRequest
): Promise<PersonDisplay[]> {
  const { data } = await axios.get('/people', {
    params: {
      request,
    },
  });
  return data;
}

export default {
  getPeople,
};
