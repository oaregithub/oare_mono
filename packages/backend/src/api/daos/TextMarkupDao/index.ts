import { knexRead, knexWrite } from '@/connection';
import { MarkupUnit, TextMarkupRow } from '@oare/types';

class TextMarkupDao {
  async getMarkups(textUuid: string, line?: number): Promise<MarkupUnit[]> {
    let query = knexRead()('text_markup')
      .select(
        'text_markup.reference_uuid AS referenceUuid',
        'text_markup.type AS type',
        'text_markup.num_value AS value',
        'text_markup.start_char AS startChar',
        'text_markup.end_char as endChar',
        'text_markup.alt_reading as altReading',
        'text_markup.alt_reading_uuid as altReadingUuid'
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

    let markups: MarkupUnit[] = await query;
    const refTypes: { [key: string]: Set<string> } = {};
    markups = markups.filter(markup => {
      if (refTypes[markup.referenceUuid]) {
        if (refTypes[markup.referenceUuid].has(markup.type)) {
          return false;
        }
      } else {
        refTypes[markup.referenceUuid] = new Set();
      }

      refTypes[markup.referenceUuid].add(markup.type);
      return true;
    });
    markups.sort(a => {
      if (a.type === 'damage' || a.type === 'partialDamage') {
        return -1;
      }
      if (
        a.type === 'isCollatedReading' ||
        a.type === 'isEmendedReading' ||
        a.type === 'uncertain'
      ) {
        return -1;
      }
      return 0;
    });
    return markups;
  }

  async insertMarkupRow(row: TextMarkupRow) {
    await knexWrite()('text_markup').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      type: row.type,
      num_value: row.numValue,
      alt_reading_uuid: row.altReadingUuid,
      alt_reading: row.altReading,
      start_char: row.startChar,
      end_char: row.endChar,
      obj_uuid: row.objectUuid,
    });
  }
}

export default new TextMarkupDao();
