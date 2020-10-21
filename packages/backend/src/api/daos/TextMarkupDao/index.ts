import knex from '@/connection';

export interface MarkupRow {
  referenceUuid: string;
  type: string;
  value: number | null;
  startChar: number | null;
  endChar: number | null;
}
class TextMarkupDao {
  async getMarkups(textUuid: string): Promise<MarkupRow[]> {
    const query = await knex('text_markup')
      .select(
        'text_markup.reference_uuid AS referenceUuid',
        'text_markup.type AS type',
        'text_markup.#_value AS value',
        'text_markup.start_char AS startChar',
        'text_markup.end_char as endChar',
      )
      .innerJoin('text_epigraphy', 'text_markup.reference_uuid', 'text_epigraphy.uuid')
      .where('text_epigraphy.text_uuid', textUuid);
    const rows: MarkupRow[] = await query;
    return rows;
  }
}

export default new TextMarkupDao();
