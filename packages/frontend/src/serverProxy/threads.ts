import { Thread, ThreadDisplay, ThreadWithComments } from '@oare/types';
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

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
  getThreadsByUserUuid,
};
