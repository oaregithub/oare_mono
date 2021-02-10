import { ErrorsPayload, Pagination, ErrorsRow } from '@oare/types';
import axios from '../axiosInstance';

async function logError(payload: ErrorsPayload): Promise<void> {
  await axios.post('/errors', payload);
}

async function getErrorLog(payload: Pagination): Promise<ErrorsRow[]> {
  const { data } = await axios.get('/errors', {
    params: payload,
  });
  return data;
}

export default {
  logError,
  getErrorLog,
};
