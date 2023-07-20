import {
  EditPropertiesPayload,
  ItemPropertyRow,
  TaxonomyPropertyTree,
  LinkItem,
  LinkPropertiesSearchPayload,
} from '@oare/types';
import axios from '@/axiosInstance';

async function getPropertiesByReferenceUuid(
  referenceUuid: string
): Promise<ItemPropertyRow[]> {
  const { data } = await axios.get(`properties/${referenceUuid}`);
  return data;
}

async function editPropertiesByReferenceUuid(
  referenceUuid: string,
  payload: EditPropertiesPayload
): Promise<void> {
  await axios.patch(`/properties/${referenceUuid}`, payload);
}

async function getTaxonomyPropertyTree(): Promise<TaxonomyPropertyTree> {
  const { data } = await axios.get('properties_taxonomy_tree');
  return data;
}

async function searchLinkProperties(
  params: LinkPropertiesSearchPayload
): Promise<LinkItem[]> {
  const { data } = await axios.get('properties_links', {
    params,
  });
  return data;
}

export default {
  editPropertiesByReferenceUuid,
  getPropertiesByReferenceUuid,
  getTaxonomyPropertyTree,
  searchLinkProperties,
};
