import knex from '@/connection';

interface PersonTextOccurrenceRow {
  personUuid: string;
  count: number;
}

class PersonTextOccurrencesDao {
  async getAll(): Promise<Record<string, number>> {
    const peopleOccurrences: PersonTextOccurrenceRow[] = await knex(
      'person_text_occurrences'
    ).select(
      'person_text_occurrences.person_uuid AS personUuid',
      'person_text_occurrences.count'
    );

    return this.reduceToCountByPersonUuid(peopleOccurrences);
  }

  private reduceToCountByPersonUuid(
    rows: PersonTextOccurrenceRow[]
  ): Record<string, number> {
    return rows.reduce(
      (prev: Record<string, number>, personText: PersonTextOccurrenceRow) => {
        prev[personText.personUuid] = personText.count;
        return prev;
      },
      {}
    );
  }
}

export default new PersonTextOccurrencesDao();
