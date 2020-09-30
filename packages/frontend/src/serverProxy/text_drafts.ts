import axios from '../axiosInstance';
import { TextDraft } from '../types/textDrafts';

async function createDraft(textUuid: string, content: string, notes: string) {
  await axios.post('/text_drafts', {
    textUuid,
    content,
    notes,
  });
}

async function getDrafts(textUuid: string | null = null): Promise<TextDraft[]> {
  let params: { textUuid?: string } = {};
  if (textUuid) {
    params.textUuid = textUuid;
  }
  const { data } = await axios.get('/text_drafts', { params });
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
