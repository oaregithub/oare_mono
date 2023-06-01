import {
  LogErrorPayload,
  ErrorsResponse,
  ErrorStatus,
  UpdateErrorStatusPayload,
  ErrorsSortType,
} from '@oare/types';
import axios from '../axiosInstance';

async function getErrorLog(
  status: ErrorStatus | '',
  user: string,
  description: string,
  stacktrace: string,
  sort: ErrorsSortType,
  desc: boolean,
  page: number,
  limit: number
): Promise<ErrorsResponse> {
  const { data } = await axios.get('/errors', {
    params: {
      status,
      user,
      description,
      stacktrace,
      sort,
      desc,
      page,
      limit,
    },
  });
  return data;
}

async function logError(
  description: string,
  stacktrace: string | null
): Promise<void> {
  const payload: LogErrorPayload = {
    description,
    stacktrace,
  };
  await axios.post('/errors', payload);
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
