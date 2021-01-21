import axios from '../axiosInstance';
import { NameOrPlace } from '@oare/types';

async function getPlaces(letter: string): Promise<NameOrPlace[]> {
  const { data } = await axios.get(`/places/${encodeURIComponent(letter)}`);
  return data;
}

export default {
  getPlaces,
};
