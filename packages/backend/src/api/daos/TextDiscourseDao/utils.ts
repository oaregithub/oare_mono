import { DiscourseUnit, WordsInTextsSearchResultRow } from '@oare/types';
import { knexWrite, knexRead } from '@/connection';
import { DiscourseRow, TextWithDiscourseUuids } from './index';

export function createNestedDiscourses(
  discourseRows: DiscourseRow[],
  baseParentUuid: string | null
): DiscourseUnit[] {
  const children = discourseRows.filter(
    row => row.parentUuid === baseParentUuid
  );
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
      parentUuid,
      childNum,
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
        parentUuid: parentUuid || undefined,
        childNum: childNum || undefined,
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

export function setDiscourseReadingForWordsInTexts(
  discourse: DiscourseUnit,
  discourseUuids: string[]
): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach(unit => setDiscourseReading(unit));
  discourse.explicitSpelling = discourse.units
    .map(u => {
      if (discourseUuids.includes(u.uuid)) {
        if (u.transcription) return `<mark>${u.transcription}</mark>`;
        if (u.explicitSpelling) return `<mark>${u.explicitSpelling}</mark>`;
        return '';
      }
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

export function getDiscourseAndTextUuidsByWordOrFormUuidsQuery(
  spellingUuids: string[][],
  numWordsBetween: number[],
  textsToHide: string[],
  sequenced: boolean
) {
  let query = knexRead()('text_discourse as td0').whereIn(
    'td0.spelling_uuid',
    spellingUuids[0]
  );
  if (spellingUuids.length > 1) {
    query = query.modify(qb => {
      for (let i = 1; i < spellingUuids.length; i += 1) {
        qb.join(`text_discourse as td${i}`, function () {
          this.on(`td${i}.text_uuid`, `td${sequenced ? i - 1 : 0}.text_uuid`);
          if (sequenced) {
            if (numWordsBetween[i - 1] > -1) {
              this.andOn(
                knexRead().raw(
                  `td${i}.word_on_tablet <= (td${i - 1}.word_on_tablet + ?)`,
                  [numWordsBetween[i - 1]]
                )
              ).andOn(
                knexRead().raw(
                  `td${i}.word_on_tablet > td${i - 1}.word_on_tablet`
                )
              );
            } else {
              this.andOn(
                knexRead().raw(
                  knexRead().raw(
                    `td${i}.word_on_tablet > td${i - 1}.word_on_tablet`
                  )
                )
              );
            }
          } else if (numWordsBetween[i - 1] > -1) {
            this.andOn(
              knexRead().raw(
                `ABS(td${i}.word_on_tablet - td${i - 1}.word_on_tablet) <= ?`,
                [numWordsBetween[i - 1]]
              )
            );
          }
        }).whereIn(`td${i}.spelling_uuid`, spellingUuids[i]);
      }
    });
  }

  return query.whereNotIn('td0.text_uuid', textsToHide);
}

export async function createTextWithDiscourseUuidsArray(
  discourseRows: Array<{
    discourseUuid: string;
    discourse1Uuid: string | null;
    discourse2Uuid: string | null;
    discourse3Uuid: string | null;
    discourse4Uuid: string | null;
    textUuid: string;
  }>,
  textUuids: Array<{
    textUuid: string;
  }>
): Promise<TextWithDiscourseUuids[]> {
  const textWithDiscourseUuidsArray: TextWithDiscourseUuids[] = [];
  textUuids.forEach(({ textUuid }) => {
    const discourseUuidsToCompile: Array<{
      discourseUuid: string;
      discourse1Uuid: string | null;
      discourse2Uuid: string | null;
      discourse3Uuid: string | null;
      discourse4Uuid: string | null;
      textUuid: string;
    }> = discourseRows.filter(row => row.textUuid === textUuid);

    const currentDiscourseUuids = discourseUuidsToCompile.flatMap(row => {
      const textDiscourseUuids = [row.discourseUuid];

      if (row.discourse1Uuid) {
        textDiscourseUuids.push(row.discourse1Uuid);
      }
      if (row.discourse2Uuid) {
        textDiscourseUuids.push(row.discourse2Uuid);
      }
      if (row.discourse3Uuid) {
        textDiscourseUuids.push(row.discourse3Uuid);
      }
      if (row.discourse4Uuid) {
        textDiscourseUuids.push(row.discourse4Uuid);
      }

      return textDiscourseUuids;
    });

    textWithDiscourseUuidsArray.push({
      textUuid,
      discourseUuids: currentDiscourseUuids,
    });
  });
  return textWithDiscourseUuidsArray;
}

export async function getTextDiscourseForWordsInTextsSearch(
  textUuid: string,
  discourseUuids: string[]
): Promise<DiscourseUnit[]> {
  const minMax = await knexRead()('text_discourse')
    .max({ max: 'word_on_tablet ' })
    .min({ min: 'word_on_tablet' })
    .where('text_uuid', textUuid)
    .whereIn('uuid', discourseUuids)
    .first();

  const min = minMax?.min;
  const max = minMax?.max;

  const discourseUnits: DiscourseUnit[] = await getTextDiscourseUnitsForWordsInTexts(
    textUuid,
    min,
    max
  );

  return discourseUnits;
}

export async function getTextDiscourseUnitsForWordsInTexts(
  textUuid: string,
  min: number,
  max: number
): Promise<DiscourseUnit[]> {
  const discourseQuery = knexRead()('text_discourse')
    .select(
      'text_discourse.uuid',
      'text_discourse.type',
      'text_discourse.word_on_tablet AS wordOnTablet',
      'text_discourse.parent_uuid AS parentUuid',
      'text_discourse.spelling',
      'text_discourse.explicit_spelling AS explicitSpelling',
      'text_discourse.transcription',
      'text_epigraphy.line',
      'alias.name AS paragraphLabel',
      'field.field AS translation',
      'text_discourse.obj_in_text AS objInText',
      'text_epigraphy.side'
    )
    .leftJoin(
      'text_epigraphy',
      'text_epigraphy.discourse_uuid',
      'text_discourse.uuid'
    )
    .leftJoin('alias', 'alias.reference_uuid', 'text_discourse.uuid')
    .leftJoin('field', 'field.reference_uuid', 'text_discourse.uuid')
    .where('text_discourse.text_uuid', textUuid)
    .where(function () {
      this.whereBetween('text_discourse.word_on_tablet', [
        min - 3,
        max + 3,
      ]).orWhereNull('text_discourse.word_on_tablet');
    })
    .groupBy('text_discourse.uuid')
    .orderBy('text_discourse.word_on_tablet');
  const discourseRows: DiscourseRow[] = await discourseQuery;

  const nestedDiscourses = createNestedDiscourses(discourseRows, null);
  nestedDiscourses.forEach(nestedDiscourse =>
    setDiscourseReading(nestedDiscourse)
  );

  return nestedDiscourses;
}