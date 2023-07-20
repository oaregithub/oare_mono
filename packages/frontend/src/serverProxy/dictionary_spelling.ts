import axios from '@/axiosInstance';
import {
  AddSpellingPayload,
  CheckSpellingResponse,
  ConnectSpellingPayload,
  DisconnectSpellingPayload,
  Pagination,
  TextOccurrencesCountResponseItem,
  TextOccurrencesResponseRow,
  UpdateSpellingPayload,
} from '@oare/types';

async function addSpelling(payload: AddSpellingPayload): Promise<void> {
  await axios.post('/dictionary_spelling', payload);
}

async function checkSpelling(spelling: string): Promise<CheckSpellingResponse> {
  const { data } = await axios.get('/dictionary_spelling/check', {
    params: {
      spelling,
    },
  });
  return data;
}

async function getSpellingOccurrencesCount(
  spellingUuids: string[],
  pagination: Pagination
): Promise<TextOccurrencesCountResponseItem[]> {
  const { data } = await axios.get('/dictionary_spelling/occurrences/count', {
    params: {
      spellingUuids,
      ...pagination,
    },
  });
  return data;
}

async function getSpellingOccurrences(
  spellingUuids: string[],
  pagination: Pagination
): Promise<TextOccurrencesResponseRow[]> {
  const { data } = await axios.get('/dictionary_spelling/occurrences/texts', {
    params: {
      spellingUuids,
      ...pagination,
    },
  });
  return data;
}

async function disconnectSpelling(
  payload: DisconnectSpellingPayload
): Promise<void> {
  await axios.patch('/dictionary_spelling/disconnect', payload);
}

async function connectSpelling(payload: ConnectSpellingPayload): Promise<void> {
  await axios.patch('/dictionary_spelling/connect', payload);
}

async function updateSpelling(
  uuid: string,
  payload: UpdateSpellingPayload
): Promise<void> {
  await axios.patch(`/dictionary_spelling/${uuid}`, payload);
}

async function deleteSpelling(uuid: string): Promise<void> {
  await axios.delete(`/dictionary_spelling/${uuid}`);
}

export default {
  addSpelling,
  checkSpelling,
  getSpellingOccurrencesCount,
  getSpellingOccurrences,
  disconnectSpelling,
  connectSpelling,
  updateSpelling,
  deleteSpelling,
};
