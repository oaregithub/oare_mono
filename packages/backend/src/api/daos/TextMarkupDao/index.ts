import { knexRead, knexWrite } from '@/connection';
import { MarkupUnit, TextMarkupRow } from '@oare/types';
import { Knex } from 'knex';

class TextMarkupDao {
  async getMarkups(
    textUuid: string,
    line?: number,
    epigraphyUuid?: string,
    trx?: Knex.Transaction
  ): Promise<MarkupUnit[]> {
    const k = trx || knexRead();
    let query = k('text_markup')
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

    if (epigraphyUuid) {
      query = query.andWhere('text_epigraphy.uuid', epigraphyUuid);
    }

    const markups: MarkupUnit[] = await query;

    markups.sort(a => {
      if (
        a.type === 'damage' ||
        a.type === 'partialDamage' ||
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

  async insertMarkupRow(row: TextMarkupRow, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('text_markup').insert({
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
