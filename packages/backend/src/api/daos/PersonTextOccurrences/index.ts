import { knexRead } from '@/connection';
import { Knex } from 'knex';

interface PersonTextOccurrenceRow {
  personUuid: string;
  count: number;
  distinctCount: number;
}

interface PersonTextOccurrenceCounts {
  count: number;
  distinctCount: number;
}

class PersonTextOccurrencesDao {
  async getAll(
    trx?: Knex.Transaction
  ): Promise<Record<string, PersonTextOccurrenceCounts>> {
    const k = trx || knexRead();
    const peopleOccurrences: PersonTextOccurrenceRow[] = await k(
      'person_text_occurrences'
    ).select(
      'person_text_occurrences.person_uuid AS personUuid',
      'person_text_occurrences.count',
      'person_text_occurrences.distinct_count AS distinctCount'
    );

    return this.reduceToCountByPersonUuid(peopleOccurrences);
  }

  private reduceToCountByPersonUuid(
    rows: PersonTextOccurrenceRow[]
  ): Record<string, PersonTextOccurrenceCounts> {
    return rows.reduce(
      (
        prev: Record<string, PersonTextOccurrenceCounts>,
        personText: PersonTextOccurrenceRow
      ) => {
        prev[personText.personUuid] = {
          count: personText.count,
          distinctCount: personText.distinctCount,
        } as PersonTextOccurrenceCounts;
        return prev;
      },
      {}
    );
  }
}

export default new PersonTextOccurrencesDao();
