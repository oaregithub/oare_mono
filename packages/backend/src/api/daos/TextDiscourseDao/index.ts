import knex from '@/connection';
import {
  SpellingOccurrencesResponse,
  DiscourseLineSpelling,
  Pagination,
  SearchDiscourseSpellingRow,
  SpellingOccurrenceRow,
} from '@oare/types';
import Knex from 'knex';
import AliasDao from '../AliasDao';
import { createdNestedDiscourses, setDiscourseReading } from './utils';

export interface DiscourseRow {
  uuid: string;
  type: string | null;
  wordOnTablet: number | null;
  parentUuid: string | null;
  spelling: string | null;
  transcription: string | null;
  line: number | null;
  paragraphLabel: string | null;
  translation: string | null;
}

export interface NestedDiscourse {
  uuid: string;
  type: string | null;
  spelling?: string;
  transcription?: string;
  line?: number;
  wordOnTablet?: number;
  units: NestedDiscourse[];
  paragraphLabel?: string;
  translation?: string;
}
export interface SearchDiscourseSpellingDaoResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
}

class TextDiscourseDao {
  async updateSpellingUuid(uuid: string, spellingUuid: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;
    await k('text_discourse').update('spelling_uuid', spellingUuid).where({ uuid });
  }

  async searchTextDiscourseSpellings(
    spelling: string,
    { page, limit }: Pagination,
  ): Promise<SearchDiscourseSpellingDaoResponse> {
    const createBaseQuery = () =>
      knex('text_discourse AS td').where('explicit_spelling', spelling).andWhere('spelling_uuid', null);

    const countRow = await createBaseQuery().count({ count: 'uuid' }).first();
    const totalResults = countRow?.count || 0;

    const rows: SearchDiscourseSpellingRow[] = await createBaseQuery()
      .select('td.uuid', 'td.text_uuid AS textUuid', 'te.line', 'td.word_on_tablet AS wordOnTablet')
      .innerJoin('text_epigraphy AS te', 'te.discourse_uuid', 'td.uuid')
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
      .innerJoin('dictionary_spelling', 'dictionary_spelling.uuid', 'text_discourse.spelling_uuid')
      .where('dictionary_spelling.reference_uuid', formUuid);
    return rows.map((row) => row.uuid);
  }

  async hasSpelling(spellingUuid: string): Promise<boolean> {
    const row = await knex('text_discourse').select().where('spelling_uuid', spellingUuid).first();
    return !!row;
  }

  async updateDiscourseTranscription(uuid: string, newTranscription: string): Promise<void> {
    await knex('text_discourse').update({ transcription: newTranscription }).where({ uuid });
  }

  async getTextDiscourseUnits(textUuid: string): Promise<NestedDiscourse[]> {
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
        'field.field AS translation',
      )
      .leftJoin('text_epigraphy', 'text_epigraphy.discourse_uuid', 'text_discourse.uuid')
      .leftJoin('alias', 'alias.reference_uuid', 'text_discourse.uuid')
      .leftJoin('field', 'field.reference_uuid', 'text_discourse.uuid')
      .where('text_discourse.text_uuid', textUuid)
      .groupBy('text_discourse.uuid')
      .orderBy('text_discourse.word_on_tablet');
    const discourseRows: DiscourseRow[] = await discourseQuery;

    const nestedDiscourses = createdNestedDiscourses(discourseRows, null);
    nestedDiscourses.forEach((nestedDiscourse) => setDiscourseReading(nestedDiscourse));
    return nestedDiscourses;
  }

  private createSpellingTextsQuery(spellingUuid: string, { filter }: Partial<Pagination> = {}) {
    let query = knex('text_discourse')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid');

    if (filter) {
      query = query.andWhere('text.name', 'like', `%${filter}%`);
    }

    return query;
  }

  async getTotalSpellingTexts(spellingUuid: string, pagination: Partial<Pagination> = {}): Promise<number> {
    const countRow = await this.createSpellingTextsQuery(spellingUuid, pagination)
      .count({ count: 'text_discourse.uuid' })
      .first();

    return (countRow?.count as number) || 0;
  }

  async getSpellingTextOccurrences(
    spellingUuid: string,
    { limit, page, filter }: Pagination,
  ): Promise<SpellingOccurrencesResponse> {
    const query = this.createSpellingTextsQuery(spellingUuid, { filter })
      .select(
        'text.name AS textName',
        'te.line',
        'text_discourse.word_on_tablet AS wordOnTablet',
        'text_discourse.uuid AS discourseUuid',
        'text_discourse.text_uuid AS textUuid',
      )
      .innerJoin('text_epigraphy AS te', 'te.discourse_uuid', 'text_discourse.uuid')
      .orderBy('text.name')
      .limit(limit)
      .offset(page * limit);

    const rows: SpellingOccurrenceRow[] = await query;
    const totalResults = await this.getTotalSpellingTexts(spellingUuid, { filter });

    return {
      totalResults,
      rows,
    };
  }

  async uuidsBySpellingUuid(spellingUuid: string, trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;
    const rows: { uuid: string }[] = await k('text_discourse').select('uuid').where('spelling_uuid', spellingUuid);
    return rows.map((r) => r.uuid);
  }

  async unsetSpellingUuid(spellingUuid: string, cb?: (trx: Knex.Transaction) => Promise<void>): Promise<void> {
    await knex.transaction(async (trx) => {
      await trx('text_discourse').update('spelling_uuid', null).where('spelling_uuid', spellingUuid);
      if (cb) {
        await cb(trx);
      }
    });
  }
}

export default new TextDiscourseDao();
