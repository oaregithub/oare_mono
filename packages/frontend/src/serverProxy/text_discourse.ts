import axios from '@/axiosInstance';
import { InsertParentDiscourseRowPayload, TextDiscourse } from '@oare/types';

async function insertParentDiscourseRow(
  payload: InsertParentDiscourseRowPayload
): Promise<void> {
  await axios.post('/text_discourse/parent', payload);
}

async function getTextDiscourse(uuid: string): Promise<TextDiscourse> {
  const { data } = await axios.get(`/text_discourse/${uuid}`);
  return data;
}

export default {
  insertParentDiscourseRow,
  getTextDiscourse,
};
