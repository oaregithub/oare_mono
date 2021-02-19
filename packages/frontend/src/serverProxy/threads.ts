import {
  Thread,
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

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
  updateThreadName,
};
