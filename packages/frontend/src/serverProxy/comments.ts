import axios from '../axiosInstance';
import { CommentRequest, CommentResponse } from '@oare/types';

async function insertComment(
  request: CommentRequest
): Promise<CommentResponse> {
  const { data } = await axios.post('/comments', request);
  return data;
}

async function deleteComment(uuid: string): Promise<boolean> {
  const { data } = await axios.delete(`/comments/${encodeURIComponent(uuid)}`);
  return data;
}

export default {
  insertComment,
  deleteComment,
};
