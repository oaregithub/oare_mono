import axios from '../axiosInstance';
import { TextDraft } from '../types/textDrafts';

async function createDraft(textUuid: string, content: string) {
  await axios.post('/text_drafts', {
    text_uuid: textUuid,
    content,
  });
}

async function getDrafts(textUuid: string | null = null): Promise<TextDraft[]> {
  let params: { text_uuid?: string } = {};
  if (textUuid) {
    params.text_uuid = textUuid;
  }
  const { data } = await axios.get('/text_drafts', { params });
  return data;
}

export default {
  createDraft,
  getDrafts,
};
