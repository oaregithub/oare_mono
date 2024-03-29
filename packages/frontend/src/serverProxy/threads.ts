import {
  AllCommentsRequest,
  AllCommentsResponse,
  Thread,
  ThreadWithComments,
  UpdateThreadNameRequest,
  CreateThreadPayload,
} from '@oare/types';
import axios from '../axiosInstance';

async function createThread(payload: CreateThreadPayload): Promise<string> {
  const { data } = await axios.post('/threads', payload);
  return data;
}

async function getThreadsWithCommentsByReferenceUuid(
  referenceUuid: string
): Promise<ThreadWithComments[]> {
  const { data } = await axios.get(
    `/threads/${encodeURIComponent(referenceUuid)}`
  );
  return data;
}

async function updateThread(thread: Thread): Promise<void> {
  await axios.put('/threads', thread);
}

async function updateThreadName(
  threadNameRequest: UpdateThreadNameRequest
): Promise<void> {
  await axios.put('/threads/name', threadNameRequest);
}

async function getAllThreads(
  request: AllCommentsRequest
): Promise<AllCommentsResponse> {
  const { data } = await axios.get('/threads', {
    params: {
      status: request.filters.status,
      thread: request.filters.thread,
      item: request.filters.item,
      comment: request.filters.comment,
      sortType: request.sort.type,
      sortDesc: request.sort.desc ? '1' : '0',
      page: request.pagination.page,
      limit: request.pagination.limit,
      filter: request.pagination.filter || '',
      isUserComments: request.isUserComments ? '1' : '0',
    },
  });
  return data;
}

async function newThreadsExist(): Promise<boolean> {
  const { data } = await axios.get('/newthreads');
  return data;
}

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
  getAllThreads,
  updateThreadName,
  newThreadsExist,
  createThread,
};
