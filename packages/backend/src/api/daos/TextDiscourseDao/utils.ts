import { DiscourseUnit } from '@oare/types';
import { knexRead } from '@/connection';
import { Knex } from 'knex';
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
      if (u.transcription) {
        return u.transcription;
      }
      return u.explicitSpelling || '';
    })
    .join(' ');
}

export function getDiscourseAndTextUuidsByWordOrFormUuidsQuery(
  spellingUuids: string[][],
  numWordsBetween: (number | null)[],
  textsToHide: string[],
  sequenced: boolean,
  sortBy: 'precedingFirstMatch' | 'followingLastMatch' | 'textNameOnly',
  trx?: Knex.Transaction
) {
  const k = trx || knexRead();
  let query = k('text_discourse as td0').whereIn(
    'td0.spelling_uuid',
    spellingUuids[0]
  );
  if (spellingUuids.length > 1) {
    query = query.modify(qb => {
      for (let i = 1; i < spellingUuids.length; i += 1) {
        qb.join(`text_discourse as td${i}`, function () {
          this.on(`td${i}.text_uuid`, `td${sequenced ? i - 1 : 0}.text_uuid`);
          const currentNumWordsBetween: number = numWordsBetween[i] ?? -1;
          if (sequenced) {
            if (currentNumWordsBetween > -1) {
              this.andOn(
                k.raw(
                  `td${i}.word_on_tablet <= (td${
                    i - 1
                  }.word_on_tablet + ? + 1)`,
                  [currentNumWordsBetween]
                )
              ).andOn(
                k.raw(`td${i}.word_on_tablet > td${i - 1}.word_on_tablet`)
              );
            } else {
              this.andOn(
                k.raw(`td${i}.word_on_tablet > td${i - 1}.word_on_tablet`)
              );
            }
          } else if (currentNumWordsBetween > -1) {
            this.andOn(
              k.raw(
                `ABS(td${i}.word_on_tablet - td${
                  i - 1
                }.word_on_tablet) <= (? + 1)`,
                [currentNumWordsBetween]
              )
            );
          }
        }).whereIn(`td${i}.spelling_uuid`, spellingUuids[i]);
      }
    });
  }

  if (sortBy === 'precedingFirstMatch') {
    query.leftJoin('text_discourse as td_orderBy', function () {
      this.on('td0.text_uuid', 'td_orderBy.text_uuid').andOn(
        k.raw('td_orderBy.word_on_tablet = (td0.word_on_tablet - 1)')
      );
    });
  }
  if (sortBy === 'followingLastMatch') {
    query.leftJoin('text_discourse as td_orderBy', function () {
      this.on(
        `td${spellingUuids.length - 1}.text_uuid`,
        'td_orderBy.text_uuid'
      ).andOn(
        k.raw(
          `td_orderBy.word_on_tablet = (td${
            spellingUuids.length - 1
          }.word_on_tablet + 1)`
        )
      );
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
  discourseUuids: string[],
  trx?: Knex.Transaction
): Promise<DiscourseUnit[]> {
  const k = trx || knexRead();
  const minMax = await k('text_discourse')
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
    max,
    trx
  );

  return discourseUnits;
}

export async function getTextDiscourseUnitsForWordsInTexts(
  textUuid: string,
  min: number,
  max: number,
  trx?: Knex.Transaction
): Promise<DiscourseUnit[]> {
  const k = trx || knexRead();
  const discourseQuery = k('text_discourse')
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
