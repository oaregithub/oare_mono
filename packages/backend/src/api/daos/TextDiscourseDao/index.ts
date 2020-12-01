import knex from '@/connection';
import { SpellingText, DiscourseLineSpelling, Pagination } from '@oare/types';
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

export interface SearchDiscourseSpellingRow {
  uuid: string;
  textUuid: string;
  line: number;
  wordOnTablet: number;
}

export interface SearchDiscourseSpellingDaoResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
}

class TextDiscourseDao {
  async updateSpellingUuid(uuid: string, spellingUuid: string): Promise<void> {
    await knex('text_discourse').update('spelling_uuid', spellingUuid).where({ uuid });
  }

  async searchTextDiscourseSpellings(
    spelling: string,
    { page, limit }: Pagination,
  ): Promise<SearchDiscourseSpellingDaoResponse> {
    const createBaseQuery = () => knex('text_discourse AS td').where('explicit_spelling', spelling);

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

  async getSpellingTexts(spellingUuid: string): Promise<SpellingText[]> {
    interface SpellingTextRow {
      textUuid: string;
      name: string;
      primacy: null | number;
    }
    const rows: SpellingTextRow[] = await knex('text_discourse')
      .select('text_discourse.text_uuid AS textUuid', 'alias.name', 'alias.primacy')
      .innerJoin('alias', 'alias.reference_uuid', 'text_discourse.text_uuid')
      .where('text_discourse.spelling_uuid', spellingUuid)
      .groupBy('text_discourse.text_uuid', 'alias.primacy');

    const textUuids = [...new Set(rows.map((r) => r.textUuid))];

    return textUuids
      .map((textUuid) => {
        const spellingTextRows = rows
          .filter((r) => r.textUuid === textUuid)
          .sort((a, b) => {
            if (a.primacy === null) {
              return -1;
            }
            if (b.primacy === null) {
              return 1;
            }
            if (a.primacy < b.primacy) {
              return -1;
            }
            if (a.primacy > b.primacy) {
              return 1;
            }
            return 0;
          });

        if (spellingTextRows.length === 1) {
          return {
            uuid: textUuid,
            text: spellingTextRows[0].name,
          };
        }
        return {
          uuid: textUuid,
          text: `${spellingTextRows[0].name} (${spellingTextRows[1].name})`,
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
}

export default new TextDiscourseDao();
