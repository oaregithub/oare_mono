import knex from '../../../connection';
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
