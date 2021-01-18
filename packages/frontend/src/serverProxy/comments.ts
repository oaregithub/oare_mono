import axios from '../axiosInstance';
import { CommentRequest } from '@oare/types';

async function insertComment(request: CommentRequest): Promise<boolean> {
  const { data } = await axios.post('/comments', request);
  return data;
}

export default {
  insertComment,
};
