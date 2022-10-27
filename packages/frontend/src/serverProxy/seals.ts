import { Seal, SealInfo } from '@oare/types';
import axios from '../axiosInstance';

async function getAllSeals(): Promise<SealInfo[]> {
  const { data } = await axios.get('/seals');
  return data;
}

async function getSealByUuid(uuid: string): Promise<Seal> {
  const { data } = await axios.get(`/seals/${uuid}`);
  return data;
}

export default {
  getAllSeals,
  getSealByUuid,
};
