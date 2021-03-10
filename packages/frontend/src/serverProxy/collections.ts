import {
  Collection,
  CollectionResponse,
  CollectionInfo,
  Pagination,
} from '@oare/types';
import axios from '../axiosInstance';

/**
 * Returns the list of collections in the corpus
 */
async function getAllCollections(): Promise<Collection[]> {
  const { data } = await axios.get('/collections');
  return data;
}

/**
 * Returns the texts in a given collection
 */
async function getCollectionTexts(
  uuid: string,
  pagination: Pagination
): Promise<CollectionResponse> {
  const { data: texts } = await axios.get(`/collections/${uuid}`, {
    params: pagination,
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
