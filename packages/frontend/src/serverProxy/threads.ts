import {
  CreateThreadPayload,
  Pagination,
  Thread,
  ThreadStatus,
  ThreadsSortType,
  UpdateThreadNamePayload,
  UpdateThreadStatusPayload,
} from '@oare/types';
import axios from '@/axiosInstance';

async function getThreadsByReferenceUuid(
  referenceUuid: string
): Promise<Thread[]> {
  const { data } = await axios.get(`/threads/${referenceUuid}`);
  return data;
}

async function updateThreadStatus(
  uuid: string,
  payload: UpdateThreadStatusPayload
): Promise<void> {
  await axios.patch(`/threads/status/${uuid}`, payload);
}

async function updateThreadName(
  uuid: string,
  payload: UpdateThreadNamePayload
): Promise<void> {
  await axios.patch(`/threads/name/${uuid}`, payload);
}

async function getThreads(
  status: ThreadStatus | '',
  name: string,
  sort: ThreadsSortType,
  desc: boolean,
  pagination: Pagination
): Promise<Thread[]> {
  const { data } = await axios.get('/threads', {
    params: {
      status,
      name,
      sort,
      desc,
      ...pagination,
    },
  });
  return data;
}

async function createThread(payload: CreateThreadPayload): Promise<void> {
  const { data } = await axios.post('/threads', payload);
  return data;
}

async function newThreadsExist(): Promise<boolean> {
  const { data } = await axios.get('/new_threads');
  return data;
}

export default {
  getThreadsByReferenceUuid,
  updateThreadStatus,
  updateThreadName,
  getThreads,
  createThread,
  newThreadsExist,
};
