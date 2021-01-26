import axios from '../axiosInstance';
import { CommentRequest, CommentResponse } from '@oare/types';

async function insertComment(
  request: CommentRequest
): Promise<CommentResponse> {
  const { data } = await axios.post('/comments', request);
  return data;
}

export default {
  insertComment,
};
