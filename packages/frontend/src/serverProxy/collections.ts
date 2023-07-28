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
async function getCollectionTexts(uuid: string): Promise<CollectionResponse> {
  const { data } = await axios.get(`/collections/${uuid}`);
  return data;
}

async function getCollectionInfo(uuid: string): Promise<CollectionInfo> {
  const { data } = await axios.get(`/collection_info/${uuid}`);
  return data;
}

async function getHierarchyParentUuidByCollection(
  collectionUuid: string
): Promise<string> {
  const { data } = await axios.get(`/collection_hierarchy/${collectionUuid}`);
  return data;
}

export default {
  getAllCollections,
  getCollectionTexts,
  getCollectionInfo,
  getHierarchyParentUuidByCollection,
};
