import axios from '@/axiosInstance';
import { SearchNullDiscourseResultRow } from '@oare/types';

async function insertDiscourseRow(
  spelling: string,
  occurrences: SearchNullDiscourseResultRow[]
): Promise<void> {
  await Promise.all(
    occurrences.map(occurrence =>
      axios.post('/text_discourse', {
        spelling,
        epigraphyUuids: occurrence.epigraphyUuids,
        textUuid: occurrence.textUuid,
      })
    )
  );
}

export default {
  insertDiscourseRow,
};
