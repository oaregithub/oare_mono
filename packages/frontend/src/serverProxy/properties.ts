import {
  ParseTreeProperty,
  EditPropertiesPayload,
  ItemPropertyRow,
} from '@oare/types';
import axios from '../axiosInstance';

async function editPropertiesByReferenceUuid(
  referenceUuid: string,
  properties: ParseTreeProperty[],
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

export default {
  editPropertiesByReferenceUuid,
  getPropertiesByReferenceUuid,
};
