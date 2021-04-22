import knex from '@/connection';
import { PersonDisplay } from '@oare/types';
import utils from '../utils';

class PersonDao {
  public readonly PERSON_TYPE = 'person';

  public readonly CURRENT_PERSON_TYPE = 'current person';

  async getAllPeople(letter: string): Promise<PersonDisplay[]> {
    const letters = letter.split('/');

    const orWhereRawLetters = utils.getOrWhereForLetters(
      letters,
      'dictionary_word_person.word'
    );

    const people = await knex('person')
      .select(
        'dictionary_word_person.uuid AS uuid',
        knex.raw('IFNULL(dictionary_word_person.word, person.label) AS word'),
        'dictionary_word_person.word AS person',
        'person.relation',
        'dictionary_word_relation_person.word AS relationPerson',
        'dictionary_word_relation_person.uuid AS relationPersonUuid',
        'person.label',
        'item_properties.level',
        'value.name AS topValueRole',
        'variable.name AS topVariableRole',
        'item_properties.object_uuid AS roleObjUuid',
        'obj_dictionary_word.word AS roleObjPerson'
      )
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
          knex.raw(
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
      .andWhereRaw(orWhereRawLetters);

    return people;
  }

  // Stub for now
  async getPersonReferences(personNameUuid: string): Promise<string[]> {
    return [];
  }

  async getSpellingUuidsByPerson(
    personNameUuid: string | null
  ): Promise<string[]> {
    if (personNameUuid === null) {
      return [];
    }

    const personSpellings = await knex('person')
      .select('dictionary_spelling.uuid')
      .leftJoin(
        'dictionary_form',
        'dictionary_form.reference_uuid',
        'person.name_uuid'
      )
      .innerJoin(
        'dictionary_spelling',
        'dictionary_spelling.reference_uuid',
        'dictionary_form.uuid'
      )
      .where('person.name_uuid', personNameUuid);

    return personSpellings.map(spelling => spelling.uuid);
  }
}

// async getpersonRoles(personUuid: string): Promise<string[]> {
//     const personRoles = await knex({ ip1: 'item_properties' })
//         .join({ td: 'text_discourse'}, 'td.uuid', 'ip1.reference_uuid')
//         .rightJoin({ ps: 'person' }, 'ip1.object_uuid', 'ps.uuid')
//         .leftjoin({ ip2: 'item_properties' }, 'ip2.reference_uuid', 'td.uuid')
//         .select('value_uuid');
//     return personRoles;
// }
//
// async getRefCount(personUuid: string): Promise < number > {
//     const refCount = await knex('text_discourse')
//         .whereIn('uuid', knex('item_properties').select('reference_uuid').where('object_uuid', personUuid));
//     return refCount;
//     }

export default new PersonDao();
