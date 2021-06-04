import { CreateCommentPayload } from '@oare/types';
import axios from '../axiosInstance';

async function insertComment(payload: CreateCommentPayload): Promise<string> {
  const { data } = await axios.post('/comments', payload);
  return data;
}

async function deleteComment(uuid: string): Promise<void> {
  await axios.delete(`/comments/${encodeURIComponent(uuid)}`);
}

export default {
  insertComment,
  deleteComment,
};
