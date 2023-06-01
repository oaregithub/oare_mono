import axios from '@/axiosInstance';
import { FieldPayload, FieldRow } from '@oare/types';

async function getFieldDescriptions(
  referenceUuid: string
): Promise<FieldRow[]> {
  const { data } = await axios.get(`/field/${referenceUuid}`);
  return data;
}

async function addFieldDescription(
  uuid: string,
  description: string,
  primacy: number,
  isTaxonomy: boolean
): Promise<void> {
  const payload: FieldPayload = {
    description,
    primacy,
    isTaxonomy,
  };
  await axios.post(`/field/${uuid}`, payload);
}

async function updateFieldDescription(
  uuid: string,
  description: string,
  primacy: number,
  isTaxonomy: boolean
): Promise<void> {
  const payload: FieldPayload = {
    description,
    primacy,
    isTaxonomy,
  };
  await axios.patch(`/field/${uuid}`, payload);
}

async function deleteField(uuid: string): Promise<void> {
  await axios.delete(`/field/${uuid}`);
}

export default {
  getFieldDescriptions,
  addFieldDescription,
  updateFieldDescription,
  deleteField,
};
