import axios from '../axiosInstance';
import { NamesOrPlaces } from '../types/names';

async function getNames(): Promise<NamesOrPlaces[]> {
  const { data } = await axios.get('/names');
  return data;
}

export default {
  getNames
};
