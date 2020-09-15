import axios from '../axiosInstance';
import { NamesOrPlaces } from '../types/names';

async function getPlaces(): Promise<NamesOrPlaces[]> {
  const { data } = await axios.get('/places');
  return data;
}

export default {
  getPlaces
};
