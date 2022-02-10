import axios from '@/axiosInstance';
import { SearchNullDiscourseResultRow, DiscourseProperties } from '@oare/types';

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

async function getDiscourseProperties(
  discourseUuid: string
): Promise<DiscourseProperties> {
  const { data } = await axios.get(
    `/text_discourse/properties/${discourseUuid}`
  );
  return data;
}

async function updateDiscourseTranslation(
  uuid: string,
  newTranslation: string
) {
  await axios.patch(`/text_discourse/${uuid}`, {
    newTranslation,
  });
}

export default {
  insertDiscourseRow,
  getDiscourseProperties,
  updateDiscourseTranslation,
};
