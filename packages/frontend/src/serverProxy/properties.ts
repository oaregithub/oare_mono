import { ParseTreeProperty, EditPropertiesPayload } from '@oare/types';
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

async function haveSameTableReference(uuids: string[]): Promise<boolean> {
  const { data } = await axios.get('/properties/verify_source', {
    params: {
      uuids,
    },
  });
  return data;
}

export default {
  editPropertiesByReferenceUuid,
  haveSameTableReference,
};
