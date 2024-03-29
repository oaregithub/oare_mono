import axios from '@/axiosInstance';
import {
  SearchNullDiscourseResultRow,
  DiscourseProperties,
  DiscourseUnit,
  InsertParentDiscourseRowPayload,
  EditTranslationPayload,
  DiscourseSpellingResponse,
  AppliedProperty,
} from '@oare/types';

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
  newTranslation: string,
  textUuid: string
) {
  const payload: EditTranslationPayload = {
    newTranslation,
    textUuid,
  };
  await axios.patch(`/text_discourse/${uuid}`, payload);
}

async function createDiscourseTranslation(
  uuid: string,
  newTranslation: string,
  textUuid: string
) {
  const payload: EditTranslationPayload = {
    newTranslation,
    textUuid,
  };
  await axios.post(`/text_discourse/${uuid}`, payload);
}

async function insertParentDiscourseRow(
  textUuid: string,
  discourseSelections: DiscourseUnit[],
  discourseType: string,
  newContent: string,
  properties: AppliedProperty[]
) {
  const payload: InsertParentDiscourseRowPayload = {
    textUuid,
    discourseSelections,
    discourseType,
    newContent,
    properties,
  };
  await axios.post('/text_discourse_parent', payload);
}

async function getSpellingByDiscourseUuid(
  discourseUuid: string
): Promise<DiscourseSpellingResponse> {
  const { data } = await axios.get(`/text_discourse/spelling/${discourseUuid}`);
  return data;
}

export default {
  insertDiscourseRow,
  getDiscourseProperties,
  updateDiscourseTranslation,
  createDiscourseTranslation,
  insertParentDiscourseRow,
  getSpellingByDiscourseUuid,
};
