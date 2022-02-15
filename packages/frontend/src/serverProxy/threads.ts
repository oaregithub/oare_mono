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
  let _status: number = 0;
  if (request.filters.status.includes("New")) {
    _status = 1;
  }
  if (request.filters.status.includes("Pending")) {
    _status = 2;
  }
  if (request.filters.status.includes("In Progress")) {
    _status = 3;
  }
  if (request.filters.status.includes("Completed")) {
    _status = 4;
  }

  const _body = {
    status: _status.toString(),
    thread: request.filters.thread,
    item: request.filters.item,
    comment: request.filters.comment,
    sortType: request.sort.type.toString(),
    sortDesc: request.sort.desc ? '1' : '0',
    page: request.pagination.page,
    limit: request.pagination.limit,
    filter: request.pagination.filter || "",
    isUserComments: request.isUserComments ? '1' : '0',
  };

  const { data } = await axios.get('/threads', {
    params: _body
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
