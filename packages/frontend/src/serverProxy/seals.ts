import axios from '@/axiosInstance';
import {
  ConnectSealImpressionPayload,
  ItemProperty,
  Seal,
  SealCore,
} from '@oare/types';

async function getSeals(): Promise<SealCore[]> {
  const { data } = await axios.get('/seals');
  return data;
}

async function getSeal(uuid: string): Promise<Seal> {
  const { data } = await axios.get(`/seals/${uuid}`);
  return data;
}

async function updateSealName(uuid: string, name: string): Promise<void> {
  await axios.patch(`/seals/${uuid}`, { name });
}

async function addSealLink(
  payload: ConnectSealImpressionPayload
): Promise<void> {
  await axios.patch('/seal_impression', payload);
}

async function getSealImpression(uuid: string): Promise<ItemProperty> {
  const { data } = await axios.get(`/seal_impression/${uuid}`);
  return data;
}

export default {
  getSeals,
  getSeal,
  updateSealName,
  addSealLink,
  getSealImpression,
};
