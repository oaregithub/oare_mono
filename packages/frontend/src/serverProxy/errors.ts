import axios from '@/axiosInstance';
import {
  ErrorStatus,
  ErrorsResponse,
  ErrorsSortType,
  LogErrorPayload,
  Pagination,
  UpdateErrorStatusPayload,
} from '@oare/types';

async function getErrorLog(
  status: ErrorStatus,
  user: string,
  description: string,
  stacktrace: string,
  sort: ErrorsSortType,
  desc: boolean,
  pagination: Pagination
): Promise<ErrorsResponse> {
  const { data } = await axios.get('/errors', {
    params: {
      status,
      user,
      description,
      stacktrace,
      sort,
      desc,
      ...pagination,
    },
  });
  return data;
}

async function logError(payload: LogErrorPayload): Promise<void> {
  await axios.post('/errors', payload);
}

async function updateErrorStatus(
  payload: UpdateErrorStatusPayload
): Promise<void> {
  await axios.patch('/errors', payload);
}

async function newErrorsExist(): Promise<boolean> {
  const { data } = await axios.get('/new_errors');
  return data;
}

export default {
  getErrorLog,
  logError,
  updateErrorStatus,
  newErrorsExist,
};
