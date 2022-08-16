import axios from '@/axiosInstance';
import { EditFieldPayload, FieldInfo, NewFieldPayload } from '@oare/types';

async function updatePropertyDescriptionField(
  payload: EditFieldPayload
): Promise<void> {
  await axios.patch('/update_field_description', {
    ...payload,
  });
}

async function createNewPropertyDescriptionField(
  payload: NewFieldPayload
): Promise<void> {
  await axios.post('/update_field_description', {
    ...payload,
  });
}

async function getFieldInfo(referenceUuid: string): Promise<FieldInfo> {
  const { data } = await axios.get(`/field_description/${referenceUuid}`);
  return data;
}

export default {
  updatePropertyDescriptionField,
  createNewPropertyDescriptionField,
  getFieldInfo,
};
