import axios from '@/axiosInstance';
import { AddFormPayload, UpdateFormSpellingPayload } from '@oare/types';

async function updateFormSpelling(
  uuid: string,
  payload: UpdateFormSpellingPayload
): Promise<void> {
  await axios.patch(`/dictionary_form/${uuid}`, payload);
}

async function addForm(payload: AddFormPayload): Promise<void> {
  await axios.post('/dictionary_form', payload);
}

export default {
  updateFormSpelling,
  addForm,
};
