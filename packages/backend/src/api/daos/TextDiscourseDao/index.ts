import knex from '@/connection';
import {
  DiscourseLineSpelling,
  Pagination,
  SearchDiscourseSpellingRow,
  SpellingOccurrenceRow,
  DiscourseUnit,
  DiscourseUnitType,
} from '@oare/types';
import Knex from 'knex';
import { v4 } from 'uuid';
import TextEpigraphyDao, { AnchorInfo } from '../TextEpigraphyDao';
import {
  createdNestedDiscourses,
  setDiscourseReading,
  incrementChildNum,
  incrementWordOnTablet,
  incrementObjInText,
} from './utils';

export interface DiscourseRow {
  uuid: string;
  type: DiscourseUnitType;
  wordOnTablet: number | null;
  parentUuid: string | null;
  spelling: string | null;
  transcription: string | null;
  line: number | null;
  paragraphLabel: string | null;
  translation: string | null;
}

export interface NewDiscourseRow extends DiscourseRow {
  childNum: number | null;
  textUuid: string;
  treeUuid: string | null;
  explicitSpelling: string | null;
  spellingUuid: string | null;
  objInText: number | null;
  textEpigraphyUuids: string[];
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
    const totalResults = countRow?.count || 0;

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
      .select('word_on_tablet AS wordOnTablet', 'explicit_spelling AS spelling')
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
        'text_discourse.transcription',
        'text_epigraphy.line',
        'alias.name AS paragraphLabel',
        'field.field AS translation'
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

    const nestedDiscourses = createdNestedDiscourses(discourseRows, null);
    nestedDiscourses.forEach(nestedDiscourse =>
      setDiscourseReading(nestedDiscourse)
    );
    return nestedDiscourses;
  }

  private createSpellingTextsQuery(
    spellingUuid: string,
    { filter }: Partial<Pagination> = {}
  ) {
    let query = knex('text_discourse')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid');

    if (filter) {
      query = query.andWhere('text.name', 'like', `%${filter}%`);
    }

    return query;
  }

  async getTotalSpellingTexts(
    spellingUuid: string,
    pagination: Partial<Pagination> = {}
  ): Promise<number> {
    const countRow = await this.createSpellingTextsQuery(
      spellingUuid,
      pagination
    )
      .count({ count: 'text_discourse.uuid' })
      .first();

    return (countRow?.count as number) || 0;
  }

  async getSpellingTextOccurrences(
    spellingUuid: string,
    { limit, page, filter }: Pagination
  ) {
    const query = this.createSpellingTextsQuery(spellingUuid, { filter })
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
      .orderBy('text.name')
      .limit(limit)
      .offset(page * limit);

    const rows: SpellingOccurrenceRow[] = await query;
    const totalResults = await this.getTotalSpellingTexts(spellingUuid, {
      filter,
    });

    return {
      totalResults,
      rows,
    };
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

  async insertNewDiscourseRowFromTextEpigraphy(
    newDiscourseRow: NewDiscourseRow,
    spellingUuid: string,
    explicitSpelling: string,
    transcription: string
  ): Promise<void> {
    newDiscourseRow.uuid = v4();
    const anchorInfo = await TextEpigraphyDao.getAnchorInfo(
      newDiscourseRow.textEpigraphyUuids
    );
    await this.getRowInfoWithAnchorInfo(anchorInfo, newDiscourseRow);
    await incrementWordOnTablet(
      newDiscourseRow.textUuid,
      newDiscourseRow.wordOnTablet
    );
    await incrementObjInText(
      newDiscourseRow.textUuid,
      newDiscourseRow.objInText
    );
    await knex('text_discourse').insert({
      uuid: newDiscourseRow.uuid,
      type: newDiscourseRow.type,
      child_num: newDiscourseRow.childNum,
      word_on_tablet: newDiscourseRow.wordOnTablet,
      text_uuid: newDiscourseRow.textUuid,
      tree_uuid: newDiscourseRow.treeUuid,
      parent_uuid: newDiscourseRow.parentUuid,
      spelling_uuid: spellingUuid,
      explicit_spelling: explicitSpelling,
      transcription,
      obj_in_text: newDiscourseRow.wordOnTablet,
    });
    await this.addDiscourseUuid(
      newDiscourseRow.textEpigraphyUuids,
      newDiscourseRow.uuid
    );
  }

  async addDiscourseUuid(
    textEpigraphyUuids: string[],
    uuid: string
  ): Promise<void> {
    textEpigraphyUuids.forEach(txtEpigUuid =>
      knex('text_epigraphy')
        .update('discourse_uuid', uuid)
        .where('uuid', txtEpigUuid)
    );
  }

  async getRowInfoWithAnchorInfo(
    anchorInfo: AnchorInfo,
    newDiscourseRow: NewDiscourseRow
  ): Promise<void> {
    newDiscourseRow = await knex('text_discourse')
      .where('uuid', anchorInfo.anchorUuid)
      .select(
        'word_on_tablet AS wordOnTablet',
        'obj_in_text AS objInText',
        'child_num AS childNum',
        'text_uuid AS textUUid',
        'tree_uuid AS treeUuid'
      )
      .first();
    newDiscourseRow.parentUuid = await knex('text_discourse')
      .where({
        text_uuid: newDiscourseRow.textUuid,
        type: 'discourseUnit',
      })
      .pluck('uuid')
      .first();
    newDiscourseRow.type = 'word';
    newDiscourseRow.childNum = await knex('text_discourse')
      .where('parent_uuid', newDiscourseRow.parentUuid)
      .pluck('child_num AS childNum')
      .orderBy('child_num', 'desc')
      .first();
    if (newDiscourseRow.childNum) newDiscourseRow.childNum += 1;
    if (
      newDiscourseRow.wordOnTablet &&
      newDiscourseRow.objInText &&
      anchorInfo.anchorDirection === 'up'
    ) {
      newDiscourseRow.wordOnTablet += 1;
      newDiscourseRow.objInText += 1;
    }
  }
}
export default new TextDiscourseDao();
