import {
  ErrorsPayload,
  ErrorsResponse,
  ErrorStatus,
  UpdateErrorStatusPayload,
  GetErrorsPayload,
} from '@oare/types';
import axios from '../axiosInstance';

async function logError(payload: ErrorsPayload): Promise<void> {
  await axios.post('/errors', payload);
}

async function getErrorLog(payload: GetErrorsPayload): Promise<ErrorsResponse> {
  const { data } = await axios.get('/errors', {
    params: {
      payload,
    },
  });
  return data;
}

async function updateErrorStatus(
  uuids: string[],
  status: ErrorStatus
): Promise<void> {
  const payload: UpdateErrorStatusPayload = {
    uuids,
    status,
  };
  await axios.patch('/errors', payload);
}

async function newErrorsExist(): Promise<boolean> {
  const { data } = await axios.get('/newerrors');
  return data;
}

export default {
  logError,
  getErrorLog,
  updateErrorStatus,
  newErrorsExist,
};
