import { CreateCommentPayload } from '@oare/types';
import axios from '@/axiosInstance';

async function createComment(payload: CreateCommentPayload): Promise<void> {
  await axios.post('/comments', payload);
}

async function deleteComment(uuid: string): Promise<void> {
  await axios.delete(`/comments/${uuid}`);
}

export default {
  createComment,
  deleteComment,
};
