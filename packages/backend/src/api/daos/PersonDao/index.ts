import { knexRead } from '@/connection';
import { PersonDisplay, PersonRow } from '@oare/types';
import knex, { Knex } from 'knex';
import sl from '@/serviceLocator';

class PersonDao {
  public readonly PERSON_TYPE = 'person';

  async getPersonTextOccurrences(
    uuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();
    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const textsTohide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const subquery = k
      .select('uuid')
      .from('text_discourse')
      .whereNotIn('text_uuid', textsTohide);

    const count = await k('item_properties')
      .count({ count: 'uuid' })
      .whereIn('reference_uuid', subquery)
      .andWhere('object_uuid', uuid)
      .first();

    return count ? Number(count.count) : 0;
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
}

export default new PersonDao();
