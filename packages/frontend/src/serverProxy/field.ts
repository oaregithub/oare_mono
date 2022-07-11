import axios from '@/axiosInstance';

async function updatePropertyDescriptionField(
  uuid: string,
  description: string,
  primacy: number
) {
  await axios.patch('/update_field_description', {
    uuid,
    description,
    primacy,
  });
}

async function createNewPropertyDescriptionField(
  referenceUuid: string,
  newDescription: string,
  primacy: number,
  language: string
) {
  await axios.post('/update_field_description', {
    referenceUuid,
    newDescription,
    primacy,
    language,
  });
}

async function getFieldInfo(
  referenceUuid: string
): Promise<{
  uuid: string | null;
  field: string | null;
  primacy: number | null;
  language: string | null;
}> {
  const { data } = await axios.get(`/field_description/${referenceUuid}`);
  return data;
}

export default {
  updatePropertyDescriptionField,
  createNewPropertyDescriptionField,
  getFieldInfo,
};
