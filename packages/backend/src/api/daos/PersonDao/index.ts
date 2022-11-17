import { knexRead, knexWrite } from '@/connection';
import { PersonRow, Pagination, TextOccurrencesRow } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class PersonDao {
  async getPersonOccurrencesCount(
    uuid: string,
    userUuid: string | null,
    pagination: Partial<Pagination> = {},
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsTohide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const discourseUuids = await k('item_properties')
      .pluck('reference_uuid')
      .where('object_uuid', uuid)
      .whereIn('reference_uuid', k('text_discourse').select('uuid'));

    const count = await k('text_discourse')
      .countDistinct({ count: 'text_discourse.uuid' })
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.uuid', discourseUuids)
      .whereNotIn('text.uuid', textsTohide)
      .modify(qb => {
        if (pagination.filter) {
          qb.where('text.display_name', 'like', `%${pagination.filter}%`);
        }
      })
      .first();

    return count ? Number(count.count) : 0;
  }

  async getPersonOccurrencesTexts(
    personUuids: string[],
    userUuid: string | null,
    { limit, page, filter }: Pagination,
    trx?: Knex.Transaction
  ): Promise<TextOccurrencesRow[]> {
    const k = trx || knexRead();

    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsTohide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const discourseUuids = await k('item_properties')
      .pluck('reference_uuid')
      .whereIn('object_uuid', personUuids)
      .whereIn('reference_uuid', k('text_discourse').select('uuid'));

    const rows: TextOccurrencesRow[] = await k('text_discourse')
      .distinct(
        'text_discourse.uuid AS discourseUuid',
        'display_name AS textName',
        'text_discourse.text_uuid AS textUuid'
      )
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.uuid', discourseUuids)
      .whereNotIn('text.uuid', textsTohide)
      .modify(qb => {
        if (filter) {
          qb.andWhere('text.display_name', 'like', `%${filter}%`);
        }
      })
      .orderBy('text.display_name')
      .limit(limit)
      .offset((page - 1) * limit);

    return rows;
  }

  async getPersonsRowsByLetter(
    letter: string,
    trx?: Knex.Transaction
  ): Promise<PersonRow[]> {
    const k = trx || knexRead();
    const letters = letter.split('/');
    let query = k('person')
      .select(
        'person.uuid',
        'name_uuid AS nameUuid',
        'relation',
        'relation_name_uuid AS relationNameUuid',
        'label',
        'person.type'
      )
      .leftJoin('dictionary_word', 'person.name_uuid', 'dictionary_word.uuid')
      .where('person.type', 'person');

    letters.forEach(possibleVowel => {
      switch (possibleVowel) {
        case 'a':
          return letters.push('ā');
        case 'e':
          return letters.push('ē');
        case 'i':
          return letters.push('ī');
        case 'o':
          return letters.push('ō');
        case 'u':
          return letters.push('ū');
        default:
          return letters;
      }
    });

    query = query.andWhere(qb => {
      letters.forEach(l => {
        qb.orWhere('word', 'like', `${l.toLocaleUpperCase()}%`)
          .orWhere('word', 'like', `(${l.toLocaleUpperCase()}%`)
          .orWhere('word', 'like', `${l.toLocaleLowerCase()}%`)
          .orWhere('word', 'like', `(${l.toLocaleLowerCase()}%`)
          .orWhere('word', null)
          .andWhere(qb1 => {
            qb1
              .orWhere('label', 'like', `${l.toLocaleUpperCase()}%`)
              .orWhere('label', 'like', `(${l.toLocaleUpperCase()}%`)
              .orWhere('label', 'like', `${l.toLocaleLowerCase()}%`)
              .orWhere('label', 'like', `(${l.toLocaleLowerCase()}%`);
          });
      });
    });

    return query;
  }

  async disconnectPerson(
    discourseUuid: string,
    personUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('item_properties')
      .where({ reference_uuid: discourseUuid, object_uuid: personUuid })
      .del();
  }
}

export default new PersonDao();
