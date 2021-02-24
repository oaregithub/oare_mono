import { TextDraft, AddTextDraftPayload } from '@oare/types';
import axios from '../axiosInstance';

async function createDraft(textUuid: string, payload: AddTextDraftPayload) {
  await axios.post(`/text_drafts/${textUuid}`, payload);
}

async function getDrafts(): Promise<TextDraft[]> {
  const { data } = await axios.get('/text_drafts');
  return data;
}

export default {
  createDraft,
  getDrafts,
};
