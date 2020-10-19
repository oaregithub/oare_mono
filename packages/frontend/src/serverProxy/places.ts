import axios from '../axiosInstance';
import { NameOrPlace } from '@oare/types';

async function getPlaces(): Promise<NameOrPlace[]> {
  const { data } = await axios.get('/places');
  return data;
}

export default {
  getPlaces,
};
