import axios from '../axiosInstance';
import { Thread, ThreadWithComments } from '@oare/types';

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

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
};
