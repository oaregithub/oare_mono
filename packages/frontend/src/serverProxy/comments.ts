import axios from '../axiosInstance';
import { CommentRequest, CommentResponse } from '@oare/types';

async function insertComment(
  request: CommentRequest
): Promise<CommentResponse> {
  const { data } = await axios.post('/comments', request);
  return data;
}

async function deleteComment(uuid: string): Promise<void> {
  await axios.delete(`/comments/${encodeURIComponent(uuid)}`);
}

export default {
  insertComment,
  deleteComment,
};
