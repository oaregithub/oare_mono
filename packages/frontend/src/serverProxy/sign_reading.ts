import axios from '@/axiosInstance';
import { Sign } from '@oare/types';

async function getAllSigns(): Promise<Sign[]> {
  const { data } = await axios.get('/signs');
  return data;
}

async function getSign(uuid: string): Promise<Sign> {
  const { data } = await axios.get(`/signs/${uuid}`);
  return data;
}

async function getSignByReading(reading: string): Promise<Sign> {
  const { data } = await axios.get(`/signs/reading/${reading}`);
  return data;
}

export default {
  getAllSigns,
  getSign,
  getSignByReading,
};
