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

async function updateDiscourseTranscription(
  uuid: string,
  newTranscription: string
) {
  await axios.patch(`/text_discourse/${uuid}`, {
    newTranscription,
  });
}

async function updateDiscourseSpelling(uuid: string, newSpelling: string) {
  await axios.patch(`/text_discourse/${uuid}/spelling`, {
    newSpelling,
  });
}

async function updateDiscourseTranslation(
  uuid: string,
  newTranslation: string
) {
  await axios.patch(`/text_discourse/${uuid}/translation`, {
    newTranslation,
  });
}

async function updateDiscourseParagraphLabel(
  uuid: string,
  newParagraphLabel: string
) {
  await axios.patch(`/text_discourse/${uuid}/paragraph_label`, {
    newParagraphLabel,
  });
}

export default {
  insertDiscourseRow,
  updateDiscourseTranscription,
  updateDiscourseSpelling,
  updateDiscourseTranslation,
  updateDiscourseParagraphLabel,
};
