import {
  ErrorsPayload,
  Pagination,
  ErrorsRow,
  UpdateErrorStatusPayload,
} from '@oare/types';
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

async function updateErrorStatus(
  payload: UpdateErrorStatusPayload
): Promise<void> {
  await axios.patch('/errors', payload);
}

export default {
  logError,
  getErrorLog,
  updateErrorStatus,
};
