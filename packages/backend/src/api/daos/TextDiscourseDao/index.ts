import knex from '@/connection';
import {
  DiscourseLineSpelling,
  Pagination,
  SearchDiscourseSpellingRow,
  SpellingOccurrenceRow,
  DiscourseUnit,
  DiscourseUnitType,
  PersonOccurrenceRow,
  TextDiscourseRow,
} from '@oare/types';
import Knex from 'knex';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import {
  incrementChildNum,
  incrementObjInText,
  incrementWordOnTablet,
  createNestedDiscourses,
  setDiscourseReading,
} from './utils';

export interface DiscourseRow {
  uuid: string;
  type: DiscourseUnitType;
  wordOnTablet: number | null;
  parentUuid: string | null;
  spelling: string | null;
  explicitSpelling: string | null;
  transcription: string | null;
  line: number | null;
  paragraphLabel: string | null;
  translation: string | null;
  objInText: number;
  side: number | null;
}

export interface SearchDiscourseSpellingDaoResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
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
    { page, limit }: Pagination
  ): Promise<SearchDiscourseSpellingDaoResponse> {
    const createBaseQuery = () =>
      knex('text_discourse AS td')
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

  async getTextSpellings(textUuid: string): Promise<DiscourseLineSpelling[]> {
    const rows = await knex('text_discourse')
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
  particular form. Useful for updating the logging edits table 
  and then updating the text discourse table itself */
  async getDiscourseUuidsByFormUuid(formUuid: string): Promise<string[]> {
    const rows: Record<'uuid', string>[] = await knex('text_discourse')
      .select('text_discourse.uuid')
      .innerJoin(
        'dictionary_spelling',
        'dictionary_spelling.uuid',
        'text_discourse.spelling_uuid'
      )
      .where('dictionary_spelling.reference_uuid', formUuid);
    return rows.map(row => row.uuid);
  }

  async hasSpelling(spellingUuid: string): Promise<boolean> {
    const row = await knex('text_discourse')
      .select()
      .where('spelling_uuid', spellingUuid)
      .first();
    return !!row;
  }

  async updateDiscourseTranscription(
    uuid: string,
    newTranscription: string
  ): Promise<void> {
    await knex('text_discourse')
      .update({ transcription: newTranscription })
      .where({ uuid });
  }

  async getTextDiscourseUnits(textUuid: string): Promise<DiscourseUnit[]> {
    const discourseQuery = knex('text_discourse')
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
      .groupBy('text_discourse.uuid')
      .orderBy('text_discourse.word_on_tablet');
    const discourseRows: DiscourseRow[] = await discourseQuery;

    const nestedDiscourses = createNestedDiscourses(discourseRows, null);
    nestedDiscourses.forEach(nestedDiscourse =>
      setDiscourseReading(nestedDiscourse)
    );
    return nestedDiscourses;
  }

  private createSpellingTextsQuery(
    spellingUuids: string[],
    { filter }: Partial<Pagination> = {}
  ) {
    let query = knex('text_discourse')
      .whereIn('text_discourse.spelling_uuid', spellingUuids)
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid');

    if (filter) {
      query = query.andWhere('text.name', 'like', `%${filter}%`);
    }

    return query;
  }

  async getTotalSpellingTexts(
    spellingUuids: string[],
    userUuid: string | null,
    pagination: Partial<Pagination> = {}
  ): Promise<number> {
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

    const countRow = await this.createSpellingTextsQuery(
      spellingUuids,
      pagination
    )
      .modify(qb => {
        if (pagination.filter) {
          qb.andWhere('text.name', 'like', `%${pagination.filter}%`);
        }
      })
      .modify(qb => qb.whereNotIn('text.uuid', textsToHide))
      .count({ count: 'text_discourse.uuid' })
      .first();

    return countRow && countRow.count ? (countRow.count as number) : 0;
  }

  async getSpellingTextOccurrences(
    spellingUuids: string[],
    userUuid: string | null,
    { limit, page, filter }: Pagination
  ) {
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

    const query = this.createSpellingTextsQuery(spellingUuids, { filter })
      .distinct(
        'text_discourse.uuid AS discourseUuid',
        'name AS textName',
        'te.line',
        'text_discourse.word_on_tablet AS wordOnTablet',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin(
        'text_epigraphy AS te',
        'te.discourse_uuid',
        'text_discourse.uuid'
      )
      .modify(qb => qb.whereNotIn('text.uuid', textsToHide))
      .orderBy('text.name')
      .limit(limit)
      .offset((page - 1) * limit);

    const rows: SpellingOccurrenceRow[] = await query;
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
    cb?: (trx: Knex.Transaction) => Promise<void>
  ): Promise<void> {
    await knex.transaction(async trx => {
      await trx('text_discourse')
        .update('spelling_uuid', null)
        .where('spelling_uuid', spellingUuid);
      if (cb) {
        await cb(trx);
      }
    });
  }

  async getSpellingUuidsByDiscourseUuid(
    discourseUuid: string
  ): Promise<string[]> {
    const rows: { spellingUuid: string }[] = await knex('text_discourse')
      .select('spelling_uuid AS spellingUuid')
      .where('uuid', discourseUuid);
    return rows
      .filter(row => row.spellingUuid !== null)
      .map(r => r.spellingUuid);
  }

  async textDiscourseExists(discourseUuid: string): Promise<boolean> {
    const row = await knex('text_discourse')
      .select()
      .where('uuid', discourseUuid)
      .first();
    return !!row;
  }

  async getParentUuidByTextUuid(textUuid: string): Promise<string> {
    const row: { uuid: string } = await knex('text_discourse')
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
    textUuid: string
  ): Promise<void> {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const DictionarySpellingDao = sl.get('DictionarySpellingDao');
    const DictionaryFormDao = sl.get('DictionaryFormDao');

    const discourseUuid = v4();
    const anchorInfo = await TextEpigraphyDao.getAnchorInfo(
      epigraphyUuids,
      textUuid
    );
    const parentUuid = await this.getParentUuidByTextUuid(textUuid);
    const spellingUuid = await DictionarySpellingDao.getUuidBySpelling(
      spelling,
      formUuid
    );
    const spellingReferenceUuids = await DictionarySpellingDao.getReferenceUuidsBySpellingUuid(
      spellingUuid
    );
    const transcription = await DictionaryFormDao.getTranscriptionBySpellingUuids(
      spellingReferenceUuids
    );

    await incrementChildNum(textUuid, parentUuid, anchorInfo.childNum);
    await incrementObjInText(textUuid, anchorInfo.objInText);
    await incrementWordOnTablet(textUuid, anchorInfo.wordOnTablet);

    await knex('text_discourse').insert({
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
    await TextEpigraphyDao.addDiscourseUuid(epigraphyUuids, discourseUuid);
  }

  private getPersonTextsByItemPropertyReferenceUuidsBaseQuery(
    textDiscourseUuids: string[],
    pagination?: Partial<Pagination>
  ) {
    return knex('text_discourse')
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.uuid', textDiscourseUuids)
      .modify(qb => {
        if (pagination) {
          if (pagination.filter) {
            qb.andWhere('text.name', 'like', `%${pagination.filter}%`);
          }

          if (pagination.page && pagination.limit) {
            qb.limit(pagination.limit).offset(
              (pagination.page - 1) * pagination.limit
            );
          }
        }
      });
  }

  async getPersonTextsByItemPropertyReferenceUuids(
    textDiscourseUuids: string[],
    pagination: Pagination
  ): Promise<PersonOccurrenceRow[]> {
    const texts = await this.getPersonTextsByItemPropertyReferenceUuidsBaseQuery(
      textDiscourseUuids,
      pagination
    ).select(
      'text_discourse.uuid AS discourseUuid',
      'text_discourse.type',
      'text.name AS textName',
      'text_discourse.word_on_tablet AS wordOnTablet',
      'text_discourse.text_uuid AS textUuid'
    );

    return texts;
  }

  async getPersonTextsByItemPropertyReferenceUuidsCount(
    textDiscourseUuids: string[],
    { filter }: Partial<Pagination> = {}
  ): Promise<number> {
    const total = await this.getPersonTextsByItemPropertyReferenceUuidsBaseQuery(
      textDiscourseUuids,
      { filter }
    )
      .count({ count: 'text_discourse.uuid' })
      .first();

    return total ? Number(total.count) : 0;
  }

  async getChildrenByParentUuid(
    phraseUuid: string
  ): Promise<PersonOccurrenceRow[]> {
    const wordTexts = await knex('text_discourse')
      .select(
        'text_discourse.uuid AS discourseUuid',
        'text_discourse.type',
        'text.name AS textName',
        'text_discourse.word_on_tablet AS wordOnTablet',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .where('text_discourse.parent_uuid', phraseUuid);

    return wordTexts;
  }

  async getEpigraphicLineOfWord(discourseUuid: string): Promise<number> {
    const line = (
      await knex('text_discourse')
        .pluck('text_epigraphy.line')
        .innerJoin(
          'text_epigraphy',
          'text_epigraphy.discourse_uuid',
          'text_discourse.uuid'
        )
        .where('text_discourse.uuid', discourseUuid)
    )[0];

    return line;
  }

  async hasSpellingOccurrence(spellingUuid: string): Promise<boolean> {
    const row = await knex('text_discourse')
      .where('spelling_uuid', spellingUuid)
      .first();
    return !!row;
  }

  async disconnectSpellings(discourseUuids: string[]): Promise<void> {
    await Promise.all(
      discourseUuids.map(uuid =>
        knex('text_discourse').update('spelling_uuid', null).where('uuid', uuid)
      )
    );
  }

  async insertDiscourseRow(row: TextDiscourseRow) {
    await knex('text_discourse').insert({
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
}

export default new TextDiscourseDao();
