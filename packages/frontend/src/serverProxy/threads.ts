import {
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

async function getThreadsByUserUuid(userUuid: string): Promise<ThreadDisplay> {
  const { data } = await axios.get(
    `/threads/user/${encodeURIComponent(userUuid)}`
  );
  return data;
}

async function updateThreadName(
  threadNameRequest: UpdateThreadNameRequest
): Promise<void> {
  await axios.put('/threads/name', threadNameRequest);
}

async function getAllThreads(): Promise<ThreadDisplay> {
  const { data } = await axios.get('/threads');
  return data;
}

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
  getThreadsByUserUuid,
  getAllThreads,
  updateThreadName,
};
