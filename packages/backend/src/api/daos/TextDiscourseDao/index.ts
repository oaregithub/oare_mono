import knex from '@/connection';
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

class TextDiscourseDao {
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
}

export default new TextDiscourseDao();
