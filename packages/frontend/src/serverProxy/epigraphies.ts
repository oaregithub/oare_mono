import axios from '@/axiosInstance';
import { CreateTextsPayload, EditTextPayload, Epigraphy } from '@oare/types';

async function getEpigraphies(textUuid: string): Promise<Epigraphy> {
  const { data } = await axios.get(`/epigraphies/${textUuid}`);
  return data;
}

async function createText(payload: CreateTextsPayload): Promise<void> {
  await axios.post('/epigraphies', payload);
}

async function editText(payload: EditTextPayload): Promise<void> {
  await axios.patch('/epigraphies', payload);
}

export default {
  getEpigraphies,
  createText,
  editText,
};
