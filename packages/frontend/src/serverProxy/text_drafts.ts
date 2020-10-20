import axios from '../axiosInstance';
import { TextDraft, AddTextDraftPayload } from '@oare/types';

async function createDraft(textUuid: string, payload: AddTextDraftPayload) {
  await axios.post(`/text_drafts/${textUuid}`, payload);
}

async function getDrafts(): Promise<TextDraft[]> {
  const { data } = await axios.get('/text_drafts');
  return data;
}

async function getSingleDraft(textUuid: string): Promise<TextDraft> {
  const { data } = await axios.get(`/text_drafts/${textUuid}`);
  return data;
}

export default {
  createDraft,
  getDrafts,
  getSingleDraft,
};
