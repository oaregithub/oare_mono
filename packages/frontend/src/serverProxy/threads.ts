import axios from '../axiosInstance';
import { ThreadWithComments } from '@oare/types';

async function getThreadsWithCommentsByReferenceUuid(
  referenceUuid: string
): Promise<ThreadWithComments[]> {
  const { data } = await axios.get(`/threads/${encodeURIComponent(referenceUuid)}`);
  return data;
}

export default {
  getThreadsWithCommentsByReferenceUuid,
};
