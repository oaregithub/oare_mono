import axios from '@/axiosInstance';
import { FieldPayload, FieldRow, FieldType } from '@oare/types';

async function getField(uuid: string, type?: FieldType): Promise<FieldRow[]> {
  const { data } = await axios.get(`/field/${uuid}`, {
    params: {
      type,
    },
  });
  return data;
}

async function addField(uuid: string, payload: FieldPayload): Promise<void> {
  await axios.post(`/field/${uuid}`, payload);
}

async function updateField(uuid: string, payload: FieldPayload): Promise<void> {
  await axios.patch(`/field/${uuid}`, payload);
}

async function deleteField(uuid: string): Promise<void> {
  await axios.delete(`/field/${uuid}`);
}

export default {
  getField,
  addField,
  updateField,
  deleteField,
};
