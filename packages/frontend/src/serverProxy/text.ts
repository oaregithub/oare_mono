import { TextRow } from '@oare/types';
import axios from '@/axiosInstance';

async function getTextRowByUuid(textUuid: string): Promise<TextRow | null> {
  const { data } = await axios.get(`/text/${textUuid}`);
  return data;
}

export default {
  getTextRowByUuid,
};
