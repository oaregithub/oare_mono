import { AddSealLinkPayload, Seal, SealInfo } from '@oare/types';
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

async function addSealLink(payload: AddSealLinkPayload): Promise<void> {
  await axios.post('/connect/seal_impression', payload);
}

export default {
  addSealLink,
  getAllSeals,
  getSealByUuid,
  updateSealName,
};
