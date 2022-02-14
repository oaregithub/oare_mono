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
    _status += 8;
  }
  if (request.filters.status.includes("Pending")) {
    _status += 4;
  }
  if (request.filters.status.includes("In Progress")) {
    _status += 2;
  }
  if (request.filters.status.includes("Completed")) {
    _status += 1;
  }
  
  const requestTo: string = '/threads/' + _status + '/'
  + request.filters.thread + '/' + request.filters.item + '/'
  + request.filters.comment + '/' + request.sort.type.toString() + '/'
  + request.sort.desc ? '1' : '0' + '/' + request.pagination.page + '/'
  + request.pagination.limit + '/' + request.pagination.filter || "" + '/'
  + request.isUserComments ? '1' : '0';

  const { data } = await axios.get(requestTo);
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
