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

async function updateThread(thread: Thread): Promise<boolean> {
  const { data } = await axios.put('/threads', thread);
  return data;
}

export default {
  getThreadsWithCommentsByReferenceUuid,
  updateThread,
};
