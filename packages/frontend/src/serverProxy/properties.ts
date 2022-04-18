import { ParseTreeProperty } from '@oare/types';
import axios from '../axiosInstance';

async function editPropertiesByReferenceUuid(
  referenceUuid: string,
  properties: ParseTreeProperty[]
): Promise<void> {
  await axios.patch(`/properties/edit/${referenceUuid}`, { properties });
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
