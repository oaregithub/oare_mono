import { v4 } from 'uuid';
import knex from '@/connection';
import { FormSpelling } from '@oare/types';
import Knex from 'knex';
import TextDiscourseDao from '../TextDiscourseDao';

export interface PersonHeading {
    name: string;
    relation: string;
    relationName: string;
    relationUuid: string;
    label: string;
}

class PersonDao{
    async getPersonHeading(
        personUuid: string,
    ): Promise<PersonHeading> {
        const name = await knex('dictionary_word')
            .select('word')
            .where('uuid', '=',
                knex('person').select('name_uuid').where('uuid', personUuid));
        const relation = await knex('person')
            .select('relation')
            .where('uuid', personUuid);
        const relationName = await knex('dictionary_word')
            .select('word')
            .where('uuid', '=',
                knex('person').select('relation_name_uuid').where('uuid', personUuid));
        const relationUuid = await knex('item_properties')
            .select()
        const label = await knex('person')
            .select('label')
            .where('uuid', personUuid);
        const personHeading: PersonHeading = // assign each of the above to the personHeading object..
        }
        return personHeading;
    }

async getpersonRoles(personUuid: string): Promise<string[]> {
    const personRoles = await knex({ ip1: 'item_properties' })
        .join({ td: 'text_discourse'}, 'td.uuid', 'ip1.reference_uuid')
        .rightJoin({ ps: 'person' }, 'ip1.object_uuid', 'ps.uuid')
        .leftjoin({ ip2: 'item_properties' }, 'ip2.reference_uuid', 'td.uuid')
        .select('value_uuid');
    return personRoles;
}
    
async getRefCount(personUuid: string): Promise < number > {
    const refCount = await knex('text_discourse')
        .whereIn('uuid', knex('item_properties').select('reference_uuid').where('object_uuid', personUuid));
    return refCount;
    }
}