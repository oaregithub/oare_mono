import {
  EditPropertiesPayload,
  ItemPropertyRow,
  TaxonomyPropertyTree,
  LinkItem,
  TableReferenceType,
  LinkPropertiesSearchPayload,
  AppliedProperty,
} from '@oare/types';
import axios from '../axiosInstance';

async function editPropertiesByReferenceUuid(
  referenceUuid: string,
  properties: AppliedProperty[],
  wordUuid?: string
): Promise<void> {
  const payload: EditPropertiesPayload = {
    properties,
    wordUuid,
  };
  await axios.patch(`/properties/edit/${referenceUuid}`, payload);
}

async function getPropertiesByReferenceUuid(
  referenceUuid: string
): Promise<ItemPropertyRow[]> {
  const { data } = await axios.get(`properties/${referenceUuid}`);
  return data;
}

async function getTaxonomyPropertyTree(): Promise<TaxonomyPropertyTree> {
  const { data } = await axios.get('properties_taxonomy_tree');
  return data;
}

async function searchLinkProperties(
  search: string,
  tableReference: TableReferenceType
): Promise<LinkItem[]> {
  const params: LinkPropertiesSearchPayload = {
    search,
    tableReference,
  };
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
