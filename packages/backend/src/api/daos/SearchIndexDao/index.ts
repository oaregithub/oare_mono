import knex from '@/connection';
import { QueryBuilder } from 'knex';
import {
  SearchIndexRow,
  Pagination,
  SearchIndexCooccurrence,
} from '@oare/types';
import CollectionTextUtils from '@/api/daos/CollectionTextUtils';

interface Text {
  textName: string;
  textUuid: string;
}

function buildSearchQuery(
  query: QueryBuilder,
  characterOccurrences: string[][]
): void {
  if (characterOccurrences.length === 0) {
    return;
  }

  query.modify(qb => qb.whereIn('sign_uuid_sequence', characterOccurrences[0]));

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

  async getNegativeTextUuids(negativeOccurrences: string[]): Promise<string[]> {
    const textUuids = await knex('search_index')
      .distinct('text_uuid')
      .pluck('text_uuid')
      .whereIn('sign_uuid_sequence', negativeOccurrences);
    return textUuids;
  }

  async getMatchingTexts(
    characterOccurrences: SearchIndexCooccurrence[],
    title: string,
    userUuid: string | null,
    { limit, page }: Pagination
  ): Promise<Text[]> {
    const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

    if (characterOccurrences.length === 0) {
      return knex('text')
        .select('uuid AS textUuid', 'name AS textName')
        .where('name', 'like', `%${title}%`)
        .whereNotIn('uuid', textsToHide)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy('name');
    }

    const query = knex('search_index')
      .distinct('text_uuid AS textUuid', 'text_name AS textName')
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy('text_name');

    if (textsToHide.length > 0) {
      query.modify(qb => qb.whereNotIn('text_uuid', textsToHide));
    }

    if (title) {
      query.modify(qb => qb.where('text_name', 'like', `%${title}%`));
    }

    const occurrences = characterOccurrences
      .filter(({ type }) => type === 'AND')
      .map(({ uuids }) => uuids);

    const negativeOccurrences = characterOccurrences
      .filter(({ type }) => type === 'NOT')
      .map(({ uuids }) => uuids)
      .flat();

    if (negativeOccurrences.length > 0) {
      const negativeTextUuids = await this.getNegativeTextUuids(
        negativeOccurrences
      );
      query.modify(qb => qb.whereNotIn('text_uuid', negativeTextUuids));
    }

    buildSearchQuery(query, occurrences);

    return query;
  }

  async getMatchingTextLines(
    characterOccurrences: SearchIndexCooccurrence[],
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
    characterOccurrences: SearchIndexCooccurrence[],
    title: string,
    userUuid: string | null
  ): Promise<number> {
    const textsToHide = await CollectionTextUtils.textsToHide(userUuid);
    let query;

    if (characterOccurrences.length === 0) {
      query = knex('text')
        .countDistinct({ count: 'uuid' })
        .where('name', 'like', `%${title}%`)
        .whereNotIn('uuid', textsToHide)
        .first();
    }

    query = knex('search_index').countDistinct({ count: 'text_uuid' }).first();

    if (textsToHide.length > 0) {
      query.modify(qb => qb.whereNotIn('text_uuid', textsToHide));
    }

    if (title) {
      query.modify(qb => qb.where('text_name', 'like', `%${title}%`));
    }

    const occurrences = characterOccurrences
      .filter(({ type }) => type === 'AND')
      .map(({ uuids }) => uuids);

    const negativeOccurrences = characterOccurrences
      .filter(({ type }) => type === 'NOT')
      .map(({ uuids }) => uuids)
      .flat();

    if (negativeOccurrences.length > 0) {
      const negativeTextUuids = await this.getNegativeTextUuids(
        negativeOccurrences
      );
      query.modify(qb => qb.whereNotIn('text_uuid', negativeTextUuids));
    }

    buildSearchQuery(query, occurrences);

    const row = await query;

    return row ? Number(row.count) : 0;
  }
}

export default new SearchIndexDao();
