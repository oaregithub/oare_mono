import { v4 } from 'uuid';
import knex from '@/connection';
import { FormSpelling } from '@oare/types';
import Knex from 'knex';
import TextDiscourseDao from '../TextDiscourseDao';

class DictionarySpellingDao {
  async updateSpelling(uuid: string, newSpelling: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;
    await k('dictionary_spelling').update('explicit_spelling', newSpelling).where({ uuid });
  }

  async getFormSpellings(formUuid: string): Promise<FormSpelling[]> {
    interface FormSpellingRow {
      uuid: string;
      spelling: string;
    }

    const rows: FormSpellingRow[] = await knex('dictionary_spelling')
      .select('uuid', 'explicit_spelling AS spelling')
      .where('reference_uuid', formUuid);

    const spellingOccurrences = await Promise.all(rows.map((r) => TextDiscourseDao.getTotalSpellingTexts(r.uuid)));

    return rows.map((r, i) => ({
      ...r,
      totalOccurrences: spellingOccurrences[i],
    }));
  }

  async spellingExistsOnForm(formUuid: string, spelling: string): Promise<boolean> {
    const row = await knex('dictionary_spelling')
      .select()
      .where({
        reference_uuid: formUuid,
        explicit_spelling: spelling,
      })
      .first();

    return !!row;
  }

  async addSpelling(formUuid: string, spelling: string): Promise<string> {
    const uuid = v4();
    await knex('dictionary_spelling').insert({
      uuid,
      reference_uuid: formUuid,
      spelling,
      explicit_spelling: spelling,
    });
    return uuid;
  }

  async deleteSpelling(spellingUuid: string, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('dictionary_spelling').del().where('uuid', spellingUuid);
  }

  async getSpellingByUuid(spellingUuid: string): Promise<string> {
    const row: { explicit_spelling: string } = await knex('dictionary_spelling')
      .where('uuid', spellingUuid)
      .select('explicit_spelling')
      .first();

    return row.explicit_spelling;
  }
}

export default new DictionarySpellingDao();
