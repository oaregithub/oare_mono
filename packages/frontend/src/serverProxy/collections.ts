import { Collection, CollectionRow } from '@oare/types';
import axios from '@/axiosInstance';

async function getAllCollections(): Promise<CollectionRow[]> {
  const { data } = await axios.get('/collections');
  return data;
}

async function getCollection(uuid: string): Promise<Collection> {
  const { data } = await axios.get(`/collection/${uuid}`);
  return data;
}

export default {
  getAllCollections,
  getCollection,
};
