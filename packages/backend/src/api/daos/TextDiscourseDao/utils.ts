import { DiscourseUnit, WordsInTextsSearchResultRow } from '@oare/types';
import { knexWrite } from '@/connection';
import { DiscourseRow, TextWithDiscourseUuids } from './index';

export function createNestedDiscourses(
  discourseRows: DiscourseRow[],
  parentUuid: string | null
): DiscourseUnit[] {
  const children = discourseRows.filter(row => row.parentUuid === parentUuid);
  const discourses: DiscourseUnit[] = [];

  children.forEach(
    ({
      type,
      uuid,
      spelling,
      explicitSpelling,
      transcription,
      line,
      wordOnTablet,
      paragraphLabel,
      translation,
      objInText,
      side,
    }) => {
      const unitChildren = createNestedDiscourses(discourseRows, uuid);
      unitChildren.sort((a, b) => a.objInText - b.objInText);
      const unit = {
        uuid,
        type,
        units: unitChildren,
        objInText,
        translation: translation || undefined,
        paragraphLabel: paragraphLabel || undefined,
        spelling: spelling || undefined,
        explicitSpelling: explicitSpelling || undefined,
        transcription: transcription || undefined,
        line: line || undefined,
        wordOnTablet: wordOnTablet || undefined,
        side: side || undefined,
      };
      discourses.push(unit);
    }
  );

  discourses.sort((a, b) => a.objInText - b.objInText);

  return discourses;
}

export function setDiscourseReading(discourse: DiscourseUnit): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach(unit => setDiscourseReading(unit));
  // eslint-disable-next-line
  discourse.explicitSpelling = discourse.units
    .map(u => {
      if (u.transcription) return u.transcription;
      return u.explicitSpelling || '';
    })
    .join(' ');
}

export async function incrementChildNum(
  textUuid: string,
  parentUuid: string,
  childNum: number | null
): Promise<void> {
  if (childNum) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
        parent_uuid: parentUuid,
      })
      .andWhere('child_num', '>=', childNum)
      .increment('child_num', 1);
  }
}

export async function incrementWordOnTablet(
  textUuid: string,
  wordOnTablet: number | null
): Promise<void> {
  if (wordOnTablet) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('word_on_tablet', '>=', wordOnTablet)
      .increment('word_on_tablet', 1);
  }
}

export async function incrementObjInText(
  textUuid: string,
  objInText: number | null
): Promise<void> {
  if (objInText) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('obj_in_text', '>=', objInText)
      .increment('obj_in_text', 1);
  }
}

/* WORDS IN TEXT SEARCH FUNCTIONS */

export function getDiscourseAndTextUuidsByWordOrFormUuidsQuery(
  uuids: string[][],
  numWordsBetween: number[],
  textsToHide: string[],
  sequenced: boolean
) {
  let query = knex('text_discourse as td0').join(
    'dictionary_spelling as ds0',
    function () {
      this.on('ds0.uuid', 'td0.spelling_uuid').andOnIn(
        'ds0.reference_uuid',
        uuids[0]
      );
    }
  );

  for (let i = 1; i < uuids.length; i += 1) {
    query = query
      .join(`text_discourse as td${i}`, function () {
        this.on(`td${i}.text_uuid`, `td${sequenced ? i - 1 : 0}.text_uuid`);
        if (sequenced) {
          if (numWordsBetween[i - 1] > -1) {
            this.andOn(
              knex.raw(
                `td${i}.word_on_tablet <= (td${i - 1}.word_on_tablet + ?)`,
                [numWordsBetween[i - 1]]
              )
            ).andOn(
              knex.raw(`td${i}.word_on_tablet > td${i - 1}.word_on_tablet`)
            );
          } else {
            this.andOn(
              knex.raw(
                knex.raw(`td${i}.word_on_tablet > td${i - 1}.word_on_tablet`)
              )
            );
          }
        } else if (numWordsBetween[i - 1] > -1) {
          this.andOn(
            knex.raw(
              `ABS(td${i}.word_on_tablet - td${i - 1}.word_on_tablet) <= ?`,
              [numWordsBetween[i - 1]]
            )
          );
        }
      })
      .join(`dictionary_spelling as ds${i}`, function () {
        this.on(`ds${i}.uuid`, `td${i}.spelling_uuid`).andOnIn(
          `ds${i}.reference_uuid`,
          uuids[i]
        );
      });
  }

  return query.whereNotIn('td0.text_uuid', textsToHide);
}

export async function createTextWithDiscourseUuidsArray(
  rows: Array<{
    discourseUuid: string;
    discourse1Uuid: string | null;
    discourse2Uuid: string | null;
    discourse3Uuid: string | null;
    discourse4Uuid: string | null;
    textUuid: string;
  }>
): Promise<TextWithDiscourseUuids[]> {
  const usedTextUuids: string[] = [];
  const results: TextWithDiscourseUuids[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const currentTextUuid = rows[i].textUuid;
    const currentDiscourseUuids: string[] = [rows[i].discourseUuid];
    if (rows[i].discourse1Uuid) {
      currentDiscourseUuids.push(`${rows[i].discourse1Uuid}`);
    }
    if (rows[i].discourse2Uuid) {
      currentDiscourseUuids.push(`${rows[i].discourse2Uuid}`);
    }
    if (rows[i].discourse3Uuid) {
      currentDiscourseUuids.push(`${rows[i].discourse3Uuid}`);
    }
    if (rows[i].discourse4Uuid) {
      currentDiscourseUuids.push(`${rows[i].discourse4Uuid}`);
    }
    if (!usedTextUuids.includes(currentTextUuid)) {
      const result: TextWithDiscourseUuids = {
        textUuid: currentTextUuid,
        discourseUuids: currentDiscourseUuids,
      };
      results.push(result);
      usedTextUuids.push(currentTextUuid);
    } else {
      for (let j = 0; j < results.length; j += 1) {
        if (results[j].textUuid === currentTextUuid) {
          currentDiscourseUuids.forEach(uuid => {
            results[j].discourseUuids.push(uuid);
          });
          break;
        }
      }
    }
  }
  return results;
}

export async function getTextDiscourseForWordsInTextsSearch(
  textUuid: string,
  discourseUuids: string[]
): Promise<string> {
  const subqueryMax = knex('text_discourse')
    .max('word_on_tablet')
    .where('text_uuid', textUuid)
    .whereIn('uuid', discourseUuids);

  const subqueryMin = knex('text_discourse')
    .min('word_on_tablet')
    .where('text_uuid', textUuid)
    .whereIn('uuid', discourseUuids);

  const discourseRows: Array<{ transcription: string }> = await knex(
    'text_discourse'
  )
    .select(
      knex.raw(
        `IF (uuid in (${discourseUuids
          .map(uuid => '?')
          .join(
            ','
          )}), CONCAT('<mark>', COALESCE(transcription, spelling, explicit_spelling), '</mark>'), COALESCE(transcription,  spelling, explicit_spelling)) as transcription`,
        [...discourseUuids]
      )
    )
    .where('text_uuid', textUuid)
    .andWhereRaw('word_on_tablet between (? - 3) and (? + 3)', [
      subqueryMin,
      subqueryMax,
    ])
    .orderBy('word_on_tablet');

  const discourseTranscription = discourseRows
    .map(({ transcription }) => transcription)
    .join(' ');
  return discourseTranscription;
}

export function sortTextNames(
  unsortedResults: WordsInTextsSearchResultRow[]
): WordsInTextsSearchResultRow[] {
  const sortedResults = unsortedResults.sort((a, b) => {
    const aValueClean = a.name.toLowerCase().replace(/[.]/g, '');
    const bValueClean = b.name.toLowerCase().replace(/[.]/g, '');
    const aValueSplit = a.name.split(' ');
    const bValueSplit = b.name.split(' ');
    const aStringValue = aValueSplit[0];
    const bStringValue = bValueSplit[0];

    if (aStringValue === bStringValue) {
      let aNumValue = 0;
      let bNumValue = 0;
      for (let i = 0; i < aValueSplit.length; i += 1) {
        aNumValue = parseFloat(aValueSplit[i]);
        if (!Number.isNaN(aNumValue)) {
          break;
        }
      }

      for (let i = 0; i < bValueSplit.length; i += 1) {
        bNumValue = parseFloat(bValueSplit[i]);
        if (!Number.isNaN(bNumValue)) {
          break;
        }
      }
      if (Number.isNaN(aNumValue) || Number.isNaN(bNumValue)) {
        return aValueClean.localeCompare(bValueClean);
      }
      if (aNumValue !== bNumValue) {
        return aNumValue - bNumValue;
      }
    }

    return aValueClean.localeCompare(bValueClean);
  });

  return sortedResults;
}
