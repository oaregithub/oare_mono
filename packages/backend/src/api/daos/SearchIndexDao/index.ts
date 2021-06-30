import knex from '@/connection';
import { QueryBuilder } from 'knex';
import { SearchIndexRow, Pagination, SearchCooccurrence } from '@oare/types';

interface Text {
  textName: string;
  textUuid: string;
}

function buildSearchQuery(
  query: QueryBuilder,
  characterOccurrences: SearchCooccurrence[]
): void {
  if (characterOccurrences.length === 0) {
    return;
  }

  query.modify(qb =>
    qb.whereIn('sign_uuid_sequence', characterOccurrences[0].uuids)
  );

  if (characterOccurrences.length > 1) {
    const subQuery = knex('search_index').select('text_uuid');
    buildSearchQuery(subQuery, characterOccurrences.slice(1));
    query.modify(qb => qb.whereIn('text_uuid', subQuery));
  }
}

class SearchIndexDao {
  async insertSequence({ line, signUuidSequence, textUuid }: SearchIndexRow) {
    await knex('search_index').insert({
      sign_uuid_sequence: signUuidSequence,
      text_uuid: textUuid,
      line,
    });
  }

  async getMatchingTextUuids(
    characterOccurrences: SearchCooccurrence[],
    { limit, page }: Pagination
  ): Promise<Text[]> {
    if (characterOccurrences.length < 1) {
      return [];
    }

    const query = knex('search_index')
      .distinct('text_uuid AS textUuid', 'text_name AS textName')
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy('text_name');

    buildSearchQuery(query, characterOccurrences);

    return query;
  }

  async getMatchingTextLines(
    characterOccurrences: SearchCooccurrence[],
    textUuid: string
  ): Promise<string[]> {
    interface TextLine {
      line: number;
      lineReading: string;
    }

    const query = knex('search_index')
      .distinct('line', 'line_reading AS lineReading')
      .whereIn(
        'sign_uuid_sequence',
        characterOccurrences.map(({ uuids }) => uuids).flat()
      )
      .andWhere('text_uuid', textUuid)
      .orderBy('line');

    const matchingLines: TextLine[] = await query;

    return matchingLines.map(
      ({ line, lineReading }) => `${line}. ${lineReading}`
    );
  }

  async getMatchingTextCount(
    characterOccurrences: SearchCooccurrence[]
  ): Promise<number> {
    const query = knex('search_index')
      .countDistinct({ count: 'text_uuid' })
      .first();
    buildSearchQuery(query, characterOccurrences);

    const row = await query;

    return row ? Number(row.count) : 0;
  }
}

export default new SearchIndexDao();
