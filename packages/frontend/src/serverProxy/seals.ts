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

async function updateSealName(uuid: string, name: string): Promise<void> {
  await axios.patch(`/seals/${uuid}`, { name });
}

export default {
  getAllSeals,
  getSealByUuid,
  updateSealName,
};
