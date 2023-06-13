import knex from '@/connection';
import {
  DiscourseLineSpelling,
  Pagination,
  SearchDiscourseSpellingRow,
  TextOccurrencesRow,
  DiscourseUnit,
  DiscourseUnitType,
  TextDiscourseRow,
  WordsInTextSearchPayload,
  WordsInTextsSearchResponse,
  DiscourseRow,
} from '@oare/types';
import { Knex } from 'knex';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import _ from 'lodash';
import {
  createNestedDiscourses,
  setDiscourseReading,
  createTextWithDiscourseUuidsArray,
  getTextDiscourseForWordsInTextsSearch,
  getDiscourseAndTextUuidsQuery,
} from './utils';

// FIXME

export interface SearchDiscourseSpellingDaoResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
}

export interface TextWithDiscourseUuids {
  textUuid: string;
  discourseUuids: string[];
}

class TextDiscourseDao {
  async updateSpellingUuid(
    uuid: string,
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('text_discourse')
      .update('spelling_uuid', spellingUuid)
      .where({ uuid });
  }

  async searchTextDiscourseSpellings(
    spelling: string,
    { page, limit }: Pagination,
    trx?: Knex.Transaction
  ): Promise<SearchDiscourseSpellingDaoResponse> {
    const k = trx || knex;
    const createBaseQuery = () =>
      k('text_discourse AS td')
        .where('explicit_spelling', spelling)
        .andWhere('spelling_uuid', null);

    const countRow = await createBaseQuery().count({ count: 'uuid' }).first();
    const totalResults = countRow && countRow.count ? countRow.count : 0;

    const rows: SearchDiscourseSpellingRow[] = await createBaseQuery()
      .select(
        'td.uuid',
        'td.text_uuid AS textUuid',
        'te.line',
        'td.word_on_tablet AS wordOnTablet',
        'text.name AS textName'
      )
      .innerJoin('text_epigraphy AS te', 'te.discourse_uuid', 'td.uuid')
      .innerJoin('text', 'text.uuid', 'td.text_uuid')
      .orderBy('text.name', 'te.line')
      .groupBy('td.uuid')
      .limit(limit)
      .offset(page * limit);

    return {
      totalResults: Number(totalResults),
      rows,
    };
  }

  async getTextSpellings(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<DiscourseLineSpelling[]> {
    const k = trx || knex;
    const rows = await k('text_discourse')
      .select(
        'word_on_tablet AS wordOnTablet',
        'explicit_spelling AS spelling',
        'transcription'
      )
      .from('text_discourse')
      .where('text_uuid', textUuid)
      .andWhere(function () {
        this.where('type', 'word');
        this.orWhere('type', 'number');
      })
      .andWhereNot('explicit_spelling', null)
      .orderBy('wordOnTablet');

    return rows;
  }

  /* Get the uuids of the rows in text discourse associated with a 
  particular form. */
  async getDiscourseUuidsByFormUuid(
    formUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;
    const rows: Record<'uuid', string>[] = await k('text_discourse')
      .select('text_discourse.uuid')
      .innerJoin(
        'dictionary_spelling',
        'dictionary_spelling.uuid',
        'text_discourse.spelling_uuid'
      )
      .where('dictionary_spelling.reference_uuid', formUuid);
    return rows.map(row => row.uuid);
  }

  async wordsInTextsSearch(
    { items, sequenced, page, rows, sortBy }: WordsInTextSearchPayload,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<WordsInTextsSearchResponse> {
    const k = trx || knex;
    const TextDao = sl.get('TextDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const textsToHide: string[] = await CollectionTextUtils.textsToHide(
      userUuid
    );
    const wordsBetween: (number | null)[] = items.map(
      item => item.numWordsBefore
    );

    const searchItems: string[][] = await Promise.all(
      items.map(async payloadObject => {
        let dictItemSearchUuids: string[] = [];
        if (payloadObject.type === 'form/spelling/number') {
          dictItemSearchUuids = payloadObject.uuids as string[];
        }
        const spellingOrDiscourseUuidsArray = await k(
          'dictionary_spelling as ds'
        )
          .pluck('ds.uuid')
          .whereIn('ds.reference_uuid', dictItemSearchUuids)
          .orWhereIn('ds.uuid', dictItemSearchUuids)
          .union(function () {
            this.select('td.uuid')
              .from('text_discourse as td')
              .whereIn('td.explicit_spelling', dictItemSearchUuids);
          })
          .modify(qb => {
            if (dictItemSearchUuids.includes('-1')) {
              qb.union(function () {
                this.select('td.uuid')
                  .from('text_discourse as td')
                  .where('td.type', 'number')
                  .andWhere('td.explicit_spelling', '<>', 'LÁ');
              });
            }
          });
        return spellingOrDiscourseUuidsArray;
      })
    );

    const textUuids: Array<{
      textUuid: string;
    }> = await getDiscourseAndTextUuidsQuery(
      searchItems,
      wordsBetween,
      textsToHide,
      sequenced,
      sortBy,
      trx
    )
      .join('text', 'text.uuid', 'td0.text_uuid')
      .select({
        textName: 'text.display_name',
        textUuid: 'td0.text_uuid',
      })
      .modify(qb => {
        if (sortBy !== 'textNameOnly') {
          if (
            sortBy === 'followingLastMatch' ||
            sortBy === 'precedingFirstMatch'
          ) {
            qb.select({
              transcription: 'td_orderBy.transcription',
              wordOnTablet: 'td_orderBy.word_on_tablet',
            });
          }
          if (sortBy === 'ascendingNum' || sortBy === 'descendingNum') {
            const numSelectArray = searchItems.map(
              (_s, idx) => `td${idx}.explicit_spelling`
            );
            qb.select([numSelectArray]);
          }
        }
      })
      .then(
        (
          textRows: Array<{
            textName: string;
            textUuid: string;
            transcription: string | null | undefined;
            wordOnTablet: number | null | undefined;
          }>
        ) => {
          if (sortBy === 'textNameOnly') {
            return [
              ...new Set(
                textRows
                  .sort((a, b) => a.textName.localeCompare(b.textName))
                  .slice((page - 1) * rows, (page - 1) * rows + rows)
                  .map(({ textUuid }) => ({ textUuid }))
              ),
            ];
          }
          const uniqueTexts: {
            textName: string;
            textUuid: string;
            transcription: string | null | undefined;
            wordOnTablet: number | null | undefined;
            numberArray: number[] | null | undefined;
          }[] = [];
          textRows.forEach(tr => {
            const compareTextRow = uniqueTexts.find(
              uniqueText => uniqueText.textUuid === tr.textUuid
            );
            if (
              compareTextRow &&
              ((sortBy === 'followingLastMatch' &&
                Number(tr.wordOnTablet) >
                  Number(compareTextRow.wordOnTablet)) ||
                (sortBy === 'precedingFirstMatch' &&
                  Number(tr.wordOnTablet) <
                    Number(compareTextRow.wordOnTablet)))
            ) {
              uniqueTexts.find((uniqueText, idx) => {
                if (compareTextRow === uniqueText) {
                  uniqueTexts[idx] = {
                    ...tr,
                    numberArray: null,
                  };
                }
                return true;
              });
            } else if (!compareTextRow) {
              const numberArray: number[] = [];
              Object.entries(tr).forEach(entry => {
                if (
                  (Number(entry[0]) || Number(entry[0]) === 0) &&
                  Number(entry[1])
                ) {
                  numberArray.push(Number(entry[1]));
                }
              });
              uniqueTexts.push({
                ...tr,
                numberArray,
              });
            }
          });
          const sortedTextRows = uniqueTexts.sort((a, b) => {
            if (
              (sortBy === 'ascendingNum' || sortBy === 'descendingNum') &&
              a.numberArray &&
              b.numberArray
            ) {
              const aNumArraySorted =
                sortBy === 'ascendingNum'
                  ? a.numberArray.sort()
                  : a.numberArray.sort((x, y) => x - y);
              const bNumArraySorted =
                sortBy === 'ascendingNum'
                  ? b.numberArray.sort()
                  : b.numberArray.sort((x, y) => y - x);
              const smallestArray =
                aNumArraySorted.length <= bNumArraySorted.length
                  ? aNumArraySorted.length
                  : bNumArraySorted.length;
              for (let i = 0; i < smallestArray; i += 1) {
                if (aNumArraySorted[i] !== bNumArraySorted[i]) {
                  if (sortBy === 'ascendingNum') {
                    return aNumArraySorted[i] - bNumArraySorted[i];
                  }
                  return bNumArraySorted[i] - aNumArraySorted[i];
                }
              }
            }
            if (a.textUuid === b.textUuid) {
              if (sortBy === 'followingLastMatch') {
                return Number(b.wordOnTablet) - Number(a.wordOnTablet);
              }
              if (sortBy === 'precedingFirstMatch') {
                return Number(a.wordOnTablet) - Number(b.wordOnTablet);
              }
            }
            if (
              a.transcription &&
              (!b.transcription || b.transcription.includes('...'))
            ) {
              return -1;
            }
            if (
              (!a.transcription || a.transcription.includes('...')) &&
              b.transcription
            ) {
              return 1;
            }
            if (a.transcription && b.transcription) {
              return a.transcription.localeCompare(b.transcription);
            }

            return a.textName.localeCompare(b.textName);
          });
          return sortedTextRows
            .map(({ textUuid }) => ({ textUuid }))
            .slice((page - 1) * rows, (page - 1) * rows + rows);
        }
      );

    const textWithDiscourseUuidsArray: TextWithDiscourseUuids[] = await getDiscourseAndTextUuidsQuery(
      searchItems,
      wordsBetween,
      textsToHide,
      sequenced,
      sortBy,
      trx
    )
      .whereIn(
        'td0.text_uuid',
        textUuids.map(({ textUuid }) => textUuid)
      )
      .select('td0.uuid as discourseUuid', 'td0.text_uuid as textUuid')
      .modify(innerQuery => {
        for (let i = 1; i < items.length; i += 1) {
          innerQuery.select(`td${i}.uuid as discourse${i}Uuid`);
        }
      })
      .then(async discourseRows => {
        const textAndDiscourseUuids: TextWithDiscourseUuids[] = await createTextWithDiscourseUuidsArray(
          discourseRows,
          textUuids
        );
        return textAndDiscourseUuids;
      });

    const { count }: { count: number } = await getDiscourseAndTextUuidsQuery(
      searchItems,
      wordsBetween,
      textsToHide,
      sequenced,
      sortBy,
      trx
    )
      .select(k.raw('count(distinct td0.text_uuid) as count'))
      .first();

    const textNames = (
      await Promise.all(
        textWithDiscourseUuidsArray.map(({ textUuid }) =>
          TextDao.getTextByUuid(textUuid, trx)
        )
      )
    ).map(text => (text ? text.name : ''));

    const discourseUnits: DiscourseUnit[][] = await Promise.all(
      textWithDiscourseUuidsArray.map(async textWithDiscourseUuids => {
        const discourseReading = await getTextDiscourseForWordsInTextsSearch(
          textWithDiscourseUuids.textUuid,
          textWithDiscourseUuids.discourseUuids,
          trx
        );
        return discourseReading;
      })
    );

    const response: WordsInTextsSearchResponse = {
      results: textWithDiscourseUuidsArray.map((text, index) => ({
        uuid: text.textUuid,
        name: textNames[index] || '',
        discourseUnits: discourseUnits[index],
        discourseUuids: text.discourseUuids,
      })),
      total: count,
    };

    return response;
  }

  async hasSpelling(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const row = await k('text_discourse')
      .select()
      .where('spelling_uuid', spellingUuid)
      .first();
    return !!row;
  }

  async getTextDiscourseUnits(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<DiscourseUnit[]> {
    const k = trx || knex;
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
        'text_epigraphy.side',
        'text_discourse.child_num AS childNum'
      )
      .leftJoin(
        'text_epigraphy',
        'text_epigraphy.discourse_uuid',
        'text_discourse.uuid'
      )
      .leftJoin('alias', 'alias.reference_uuid', 'text_discourse.uuid')
      .leftJoin('field', 'field.reference_uuid', 'text_discourse.uuid')
      .where('text_discourse.text_uuid', textUuid)
      .groupBy('text_discourse.uuid')
      .orderBy('text_discourse.obj_in_text');
    const discourseRows: DiscourseRow[] = await discourseQuery;

    const discourseRowsWithRegionLineNumbers = discourseRows.reduce<
      DiscourseRow[]
    >((newUnits, unit) => {
      if (unit.type === 'region') {
        const { objInText } = unit;

        const prevUnitIdx = _.findLastIndex(
          newUnits,
          backUnit => backUnit.line !== null && backUnit.objInText < objInText
        );

        let objLine: number | null = null;
        if (prevUnitIdx === -1) {
          objLine = 0.1;
        } else if (newUnits[prevUnitIdx].line !== null) {
          objLine = newUnits[prevUnitIdx].line! + 0.1;
        }

        return [...newUnits, { ...unit, line: objLine }];
      }

      return [...newUnits, unit];
    }, []);

    const nestedDiscourses = createNestedDiscourses(
      discourseRowsWithRegionLineNumbers,
      null
    );
    nestedDiscourses.forEach(nestedDiscourse =>
      setDiscourseReading(nestedDiscourse)
    );
    return nestedDiscourses;
  }

  async getSpellingOccurrencesCount(
    spellingUuid: string,
    textsToHide: string[],
    pagination: Partial<Pagination> = {},
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const count = await k('text_discourse')
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .whereNotIn('text_discourse.text_uuid', textsToHide)
      .modify(qb => {
        if (pagination.filter) {
          qb.where('text.display_name', 'like', `%${pagination.filter}%`);
        }
      })
      .count({ count: 'text_discourse.uuid' })
      .first();

    return count && count.count ? Number(count.count) : 0;
  }

  async getSpellingOccurrencesTexts(
    spellingUuids: string[],
    userUuid: string | null,
    { limit, page, filter }: Pagination,
    trx?: Knex.Transaction
  ): Promise<TextOccurrencesRow[]> {
    const k = trx || knex;

    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const rows: TextOccurrencesRow[] = await k('text_discourse')
      .distinct(
        'text_discourse.uuid AS discourseUuid',
        'display_name AS textName',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.spelling_uuid', spellingUuids)
      .whereNotIn('text.uuid', textsToHide)
      .modify(qb => {
        if (filter) {
          qb.andWhere('text.display_name', 'like', `%${filter}%`);
        }
      })
      .orderBy('text.display_name')
      .limit(limit)
      .offset((page - 1) * limit);

    return rows;
  }

  async uuidsBySpellingUuid(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;
    const rows: { uuid: string }[] = await k('text_discourse')
      .select('uuid')
      .where('spelling_uuid', spellingUuid);
    return rows.map(r => r.uuid);
  }

  async unsetSpellingUuid(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('text_discourse')
      .update('spelling_uuid', null)
      .where('spelling_uuid', spellingUuid);
  }

  async getSpellingByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;
    const spelling = await k('text_discourse')
      .select('explicit_spelling as spelling')
      .where('uuid', discourseUuid)
      .first();
    return spelling;
  }

  async getSpellingUuidsByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;
    const rows: { spellingUuid: string }[] = await k('text_discourse')
      .select('spelling_uuid AS spellingUuid')
      .where('uuid', discourseUuid);
    return rows
      .filter(row => row.spellingUuid !== null)
      .map(r => r.spellingUuid);
  }

  async textDiscourseExists(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const row = await k('text_discourse')
      .select()
      .where('uuid', discourseUuid)
      .first();
    return !!row;
  }

  async getParentUuidByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;
    const row: { uuid: string } = await k('text_discourse')
      .where({
        text_uuid: textUuid,
        type: 'discourseUnit',
      })
      .select('uuid')
      .first();
    return row.uuid;
  }

  async insertNewDiscourseRow(
    spelling: string,
    formUuid: string,
    epigraphyUuids: string[],
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const DictionarySpellingDao = sl.get('DictionarySpellingDao');
    const DictionaryFormDao = sl.get('DictionaryFormDao');

    const discourseUuid = v4();
    const anchorInfo = await TextEpigraphyDao.getAnchorInfo(
      epigraphyUuids,
      textUuid,
      trx
    );
    const parentUuid = await this.getParentUuidByTextUuid(textUuid, trx);
    const spellingUuid = await DictionarySpellingDao.getUuidBySpelling(
      spelling,
      formUuid,
      trx
    );
    const spellingReferenceUuids = await DictionarySpellingDao.getReferenceUuidsBySpellingUuid(
      spellingUuid,
      trx
    );
    const transcription = await DictionaryFormDao.getTranscriptionBySpellingUuids(
      spellingReferenceUuids,
      trx
    );

    await this.incrementChildNum(
      textUuid,
      parentUuid,
      anchorInfo.childNum,
      1,
      trx
    );
    await this.incrementObjInText(textUuid, anchorInfo.objInText, 1, trx);
    await this.incrementWordOnTablet(textUuid, anchorInfo.wordOnTablet, 1, trx);

    await k('text_discourse').insert({
      uuid: discourseUuid,
      type: 'word',
      child_num: anchorInfo.childNum,
      word_on_tablet: anchorInfo.wordOnTablet,
      text_uuid: textUuid,
      tree_uuid: anchorInfo.treeUuid,
      parent_uuid: parentUuid,
      spelling_uuid: spellingUuid,
      spelling,
      explicit_spelling: spelling,
      transcription,
      obj_in_text: anchorInfo.objInText,
    });
    await TextEpigraphyDao.addDiscourseUuid(epigraphyUuids, discourseUuid, trx);
  }

  async hasSpellingOccurrence(
    spellingUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;
    const row = await k('text_discourse')
      .where('spelling_uuid', spellingUuid)
      .first();
    return !!row;
  }

  async disconnectSpelling(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('text_discourse')
      .update('spelling_uuid', null)
      .where('uuid', discourseUuid);
  }

  async insertDiscourseRow(row: TextDiscourseRow, trx?: Knex.Transaction) {
    const k = trx || knex;
    await k('text_discourse').insert({
      uuid: row.uuid,
      type: row.type,
      obj_in_text: row.objInText,
      word_on_tablet: row.wordOnTablet,
      child_num: row.childNum,
      text_uuid: row.textUuid,
      tree_uuid: row.treeUuid,
      parent_uuid: row.parentUuid,
      spelling_uuid: row.spellingUuid,
      spelling: row.spelling,
      explicit_spelling: row.explicitSpelling,
      transcription: row.transcription,
    });
  }

  async getDiscourseRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextDiscourseRow> {
    const k = trx || knex;
    const row: TextDiscourseRow = await k('text_discourse')
      .select(
        'uuid',
        'type',
        'obj_in_text as objInText',
        'word_on_tablet as wordOnTablet',
        'child_num as childNum',
        'text_uuid as textUuid',
        'tree_uuid as treeUuid',
        'parent_uuid as parentUuid',
        'spelling_uuid as spellingUuid',
        'spelling',
        'explicit_spelling as explicitSpelling',
        'transcription'
      )
      .where({ uuid })
      .first();
    return row;
  }

  async incrementChildNum(
    textUuid: string,
    parentUuid: string,
    childNum: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    if (childNum) {
      await k('text_discourse')
        .where({
          text_uuid: textUuid,
          parent_uuid: parentUuid,
        })
        .andWhere('child_num', '>=', childNum)
        .increment('child_num', amount);
    }
  }

  async incrementWordOnTablet(
    textUuid: string,
    wordOnTablet: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    if (wordOnTablet) {
      await k('text_discourse')
        .where({
          text_uuid: textUuid,
        })
        .andWhere('word_on_tablet', '>=', wordOnTablet)
        .increment('word_on_tablet', amount);
    }
  }

  async incrementObjInText(
    textUuid: string,
    objInText: number | null,
    amount: number,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    if (objInText) {
      await k('text_discourse')
        .where({
          text_uuid: textUuid,
        })
        .andWhere('obj_in_text', '>=', objInText)
        .increment('obj_in_text', amount);
    }
  }

  async updateParentUuid(
    newParentUuid: string,
    newChildUuids: string[],
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    await k('text_discourse')
      .update('parent_uuid', newParentUuid)
      .whereIn('uuid', newChildUuids);
  }

  async updateChildNum(
    uuid: string,
    newChildNum: number | null,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    await k('text_discourse').update('child_num', newChildNum).where({ uuid });
  }

  async getChildrenUuids(
    parentUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;
    const rows = await k('text_discourse')
      .pluck('uuid')
      .where('parent_uuid', parentUuid)
      .orderBy('child_num');
    return rows;
  }

  async getNumDiscourseRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;
    const countResult = await k('text_discourse')
      .where({ text_uuid: textUuid })
      .count({ count: 'text_discourse.uuid' })
      .first();
    return countResult && countResult.count ? (countResult.count as number) : 0;
  }

  async getSubwordsByDiscourseUuid(
    discourseUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const type: DiscourseUnitType = await k('text_discourse')
      .select('type')
      .where({ uuid: discourseUuid })
      .first()
      .then(row => row.type);

    if (type === 'discourseUnit') {
      return [];
    }

    if (type === 'word' || type === 'number' || type === 'region') {
      return [discourseUuid];
    }

    const subwords: string[] = await k('text_discourse')
      .pluck('uuid')
      .where({ parent_uuid: discourseUuid });

    const discourseUuids = (
      await Promise.all(
        subwords.map(uuid => this.getSubwordsByDiscourseUuid(uuid, trx))
      )
    ).flat();

    return discourseUuids;
  }

  async searchDiscourse(
    search: string,
    textUuidFilter: string,
    trx?: Knex.Transaction
  ): Promise<DiscourseUnit[]> {
    const k = trx || knex;

    const matches: DiscourseUnit[] = [];

    const discourseUnits = await this.getTextDiscourseUnits(
      textUuidFilter,
      trx
    );

    const searchDiscourseUnits = (units: DiscourseUnit[]) => {
      units.forEach(unit => {
        if (
          unit.explicitSpelling &&
          unit.explicitSpelling.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        } else if (
          unit.transcription &&
          unit.transcription.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        } else if (
          unit.translation &&
          unit.translation.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        } else if (
          unit.paragraphLabel &&
          unit.paragraphLabel.toLowerCase().includes(search.toLowerCase())
        ) {
          matches.push(unit);
        }
        searchDiscourseUnits(unit.units);
      });
    };

    searchDiscourseUnits(discourseUnits);

    return matches;
  }
}

export default new TextDiscourseDao();
