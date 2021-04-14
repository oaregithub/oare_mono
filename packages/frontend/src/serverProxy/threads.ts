import {
  AllCommentsRequest,
  AllCommentsResponse,
  Thread,
  ThreadDisplay,
  ThreadWithComments,
  UpdateThreadNameRequest,
} from '@oare/types';
import axios from '../axiosInstance';

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
      request,
    },
  });
  return data;
}

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
  getAllThreads,
  updateThreadName,
};
