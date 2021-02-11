import {
  CollectionListItem,
  CollectionResponse,
  CollectionInfo,
} from '@oare/types';
import axios from '../axiosInstance';

/**
 * Returns the list of collections in the corpus
 */
async function getAllCollections(): Promise<CollectionListItem[]> {
  const { data } = await axios.get('/collections');
  return data;
}

/**
 * Returns the texts in a given collection
 */
async function getCollectionTexts(
  uuid: string,
  { page, rows, query }: { page: number; rows: number; query: string }
): Promise<CollectionResponse> {
  const { data: texts } = await axios.get(`/collections/${uuid}`, {
    params: {
      page,
      rows,
      query,
    },
  });

  return texts;
}

async function getCollectionInfo(uuid: string): Promise<CollectionInfo> {
  const { data } = await axios.get(`/collection_info/${uuid}`);
  return data;
}

export default {
  getAllCollections,
  getCollectionTexts,
  getCollectionInfo,
};
