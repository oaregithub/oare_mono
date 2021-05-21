import axios from '@/axiosInstance';
import { SearchNullDiscourseResultRow } from '@oare/types';

async function insertDiscourseRow(
  spelling: string,
  formUuid: string,
  occurrences: SearchNullDiscourseResultRow[]
): Promise<void> {
  const uniqueTextUuids = [...new Set(occurrences.map(occ => occ.textUuid))];
  const occurrencesByText: SearchNullDiscourseResultRow[][] = uniqueTextUuids.map(
    textUuid => occurrences.filter(occ => occ.textUuid === textUuid)
  );

  await Promise.all(
    occurrencesByText.map(occurrenceBatch =>
      axios.post('/text_discourse', {
        spelling,
        formUuid,
        occurrences: occurrenceBatch,
      })
    )
  );
}

export default {
  insertDiscourseRow,
};
