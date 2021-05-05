import axios from '@/axiosInstance';
import { SearchNullDiscourseResultRow } from '@oare/types';

async function insertDiscourseRow(
  spelling: string,
  occurrences: SearchNullDiscourseResultRow[]
): Promise<void> {
  await axios.post('/text_discourse', {
    spelling,
    occurrences,
  });
}

export default {
  insertDiscourseRow,
};
