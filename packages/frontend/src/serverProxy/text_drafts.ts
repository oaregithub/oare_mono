import axios from '../axiosInstance';
import { TextDraft, AddTextDraftPayload } from '@oare/types';

async function createDraft(payload: AddTextDraftPayload) {
  await axios.post('/text_drafts', payload);
}

async function getDrafts(): Promise<TextDraft[]> {
  const { data } = await axios.get('/text_drafts');
  return data;
}

async function getSingleDraft(textUuid: string): Promise<TextDraft> {
  const { data } = await axios.get('/text_drafts', {
    params: { textUuid },
  });
  return data;
}

export default {
  createDraft,
  getDrafts,
  getSingleDraft,
};
