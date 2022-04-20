import { ParseTreeProperty } from '@oare/types';
import axios from '../axiosInstance';

async function editPropertiesByReferenceUuid(
  referenceUuid: string,
  properties: ParseTreeProperty[]
): Promise<void> {
  await axios.patch(`/properties/edit/${referenceUuid}`, { properties });
}

export default {
  editPropertiesByReferenceUuid,
};
