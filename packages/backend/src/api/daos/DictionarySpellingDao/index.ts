import knex from '@/connection';
import { FormSpelling } from '@oare/types';
import TextDiscourseDao from '../TextDiscourseDao';

class DictionarySpellingDao {
  async getFormSpellings(formUuid: string): Promise<FormSpelling[]> {
    interface FormSpellingRow {
      uuid: string;
      spelling: string;
    }

    const rows: FormSpellingRow[] = await knex('dictionary_spelling')
      .select('uuid', 'spelling')
      .where('reference_uuid', formUuid);

    const spellingTexts = await Promise.all(rows.map((r) => TextDiscourseDao.getSpellingTexts(r.uuid)));

    return rows.map((r, i) => ({
      ...r,
      texts: spellingTexts[i],
    }));
  }
}

export default new DictionarySpellingDao();
