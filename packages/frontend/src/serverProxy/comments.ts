import axios from '../axiosInstance';
import { CommentRequest } from '@oare/types';

async function insertComment(request: CommentRequest): Promise<void> {
  const { data } = await axios.post('/comments', request);
  return data;
}

export default {
  insertComment,
};
