import knex from '@/connection';
import { MarkupUnit } from '@oare/types';

class TextMarkupDao {
  async getMarkups(textUuid: string, line?: number): Promise<MarkupUnit[]> {
    let query = knex('text_markup')
      .select(
        'text_markup.reference_uuid AS referenceUuid',
        'text_markup.type AS type',
        'text_markup.num_value AS value',
        'text_markup.start_char AS startChar',
        'text_markup.end_char as endChar'
      )
      .innerJoin(
        'text_epigraphy',
        'text_markup.reference_uuid',
        'text_epigraphy.uuid'
      )
      .where('text_epigraphy.text_uuid', textUuid);

    if (typeof line !== 'undefined') {
      query = query.andWhere('text_epigraphy.line', line);
    }
    const rows: MarkupUnit[] = await query;
    return rows;
  }
}

export default new TextMarkupDao();
