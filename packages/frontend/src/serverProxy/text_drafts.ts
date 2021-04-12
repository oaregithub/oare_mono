import {
  TextDraft,
  CreateDraftPayload,
  TextDraftsResponse,
  DraftQueryOptions,
  DraftPayload,
  CreateDraftResponse,
} from '@oare/types';
import axios from '../axiosInstance';

async function createDraft(
  payload: CreateDraftPayload
): Promise<CreateDraftResponse> {
  const { data } = await axios.post('/text_drafts', payload);
  return data;
}

async function updateDraft(textUuid: string, payload: DraftPayload) {
  await axios.patch(`/text_drafts/${textUuid}`, payload);
}

async function getDrafts(userUuid: string): Promise<TextDraft[]> {
  const { data } = await axios.get(`/text_drafts/user/${userUuid}`);
  return data;
}

async function getAllDrafts(
  options: DraftQueryOptions
): Promise<TextDraftsResponse> {
  const { data } = await axios.get('/text_drafts', {
    params: options,
  });
  return data;
}

export default {
  createDraft,
  getDrafts,
  getAllDrafts,
  updateDraft,
};
