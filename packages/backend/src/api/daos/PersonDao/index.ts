import { knexRead } from '@/connection';
import { PersonDisplay } from '@oare/types';
import { Knex } from 'knex';
import utils from '../utils';

class PersonDao {
  public readonly PERSON_TYPE = 'person';

  private getAllPeopleBaseQuery(letter: string, trx?: Knex.Transaction) {
    const k = trx || knexRead();
    const letters = letter.split('/');

    const orWhereRawLetters = utils.getOrWhereForLetters(
      letters,
      'dictionary_word_person.word'
    );

    return k('person')
      .leftJoin(
        'dictionary_word AS dictionary_word_person',
        'dictionary_word_person.uuid',
        'person.name_uuid'
      )
      .leftJoin(
        'dictionary_word AS dictionary_word_relation_person',
        'dictionary_word_relation_person.uuid',
        'person.relation_name_uuid'
      )
      .leftJoin('item_properties', function () {
        this.on('item_properties.reference_uuid', '=', 'person.uuid').andOn(
          k.raw(
            'item_properties.level = (SELECT MAX(ip.level) FROM item_properties AS ip WHERE ip.reference_uuid = person.uuid)'
          )
        );
      })
      .leftJoin('value', 'value.uuid', 'item_properties.value_uuid')
      .leftJoin('variable', 'variable.uuid', 'item_properties.variable_uuid')
      .leftJoin(
        'person AS obj_person',
        'obj_person.uuid',
        'item_properties.object_uuid'
      )
      .leftJoin(
        'dictionary_word AS obj_dictionary_word',
        'obj_dictionary_word.uuid',
        'obj_person.name_uuid'
      )
      .where('person.type', this.PERSON_TYPE)
      .andWhereRaw(orWhereRawLetters.andWhere, orWhereRawLetters.bindings);
  }

  async getAllPeople(
    letter: string,
    trx?: Knex.Transaction
  ): Promise<PersonDisplay[]> {
    const k = trx || knexRead();
    const people = await this.getAllPeopleBaseQuery(letter, trx)
      .select(
        'person.uuid',
        'person.name_uuid AS personNameUuid',
        k.raw('IFNULL(dictionary_word_person.word, person.label) AS word'),
        'dictionary_word_person.word AS person',
        'person.relation',
        'dictionary_word_relation_person.word AS relationPerson',
        'person.relation_name_uuid AS relationPersonUuid',
        'person.label',
        'item_properties.level',
        'value.name AS topValueRole',
        'variable.name AS topVariableRole',
        'item_properties.object_uuid AS roleObjUuid',
        'obj_dictionary_word.word AS roleObjPerson'
      )
      .orderBy('word');

    return people;
  }
}

export default new PersonDao();
