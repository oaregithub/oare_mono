import knex from '@/connection';
import {
  PersonRow,
  Pagination,
  TextOccurrencesRow,
  PersonCore,
  PersonRole,
  LinkItem,
  Person,
  PersonRoleWithOccurrences,
} from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class PersonDao {
  /**
   * Retrieves the number of occurrences of a person in texts.
   * @param personUuid The UUID of the person whose occurrences to retrieve.
   * @param userUuid The UUID of the user. Used to filter out occurrences in texts that the user does not have access to.
   * @param pagination Partial Pagination object. Used to apply a search filter.
   * @param roleUuid The UUID of the role to filter by. If not provided, all occurrences will be returned. If set to 'noRole', only occurrences that do not have an associated role will be returned.
   * @param trx Knex Transaction. Optional.
   * @returns Number of occurrences of the person in texts, with the applicable filters applied.
   */
  public async getPersonOccurrencesCount(
    personUuid: string,
    userUuid: string | null,
    pagination: Partial<Pagination> = {},
    roleUuid?: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    let rolesList: string[] = [];

    if (roleUuid === 'noRole') {
      const temporaryRoles = await this.getRolesList('temporary');
      const durableRoles = await this.getRolesList('durable');
      rolesList = [...temporaryRoles, ...durableRoles];
    }

    const discourseUuids = await k('item_properties')
      .pluck('item_properties.reference_uuid')
      .where('item_properties.object_uuid', personUuid)
      .whereIn(
        'item_properties.reference_uuid',
        k('text_discourse').select('uuid')
      )
      .modify(async qb => {
        if (roleUuid === 'noRole') {
          qb.leftJoin('item_properties AS ip2', function () {
            this.on(
              'item_properties.reference_uuid',
              'ip2.reference_uuid'
            ).andOnIn('ip2.value_uuid', rolesList);
          }).whereNull('ip2.id');
        } else if (roleUuid) {
          qb.innerJoin(
            'item_properties AS ip2',
            'item_properties.reference_uuid',
            'ip2.reference_uuid'
          ).where('ip2.value_uuid', roleUuid);
        }
      });

    const count = await k('text_discourse')
      .countDistinct({ count: 'text_discourse.uuid' })
      .innerJoin('text', 'text.uuid', 'text_discourse.text_uuid')
      .whereIn('text_discourse.uuid', discourseUuids)
      .whereNotIn('text.uuid', textsToHide)
      .modify(qb => {
        if (pagination.filter) {
          qb.where('text.display_name', 'like', `%${pagination.filter}%`);
        }
      })
      .first();

    return count ? Number(count.count) : 0;
  }

  /**
   * Retrieves a paginated list of text occurrences for a given array of persons and an optional role.
   * @param personUuids Array of person UUIDs to retrieve text occurrences for.
   * @param userUuid The UUID of the user making the request. Used to filter out occurrences that appera in texts that the user does not have access to.
   * @param pagination Pagination object used to limit the number of results returned and apply a search filter.
   * @param roleUuid The UUID of the role to filter by. If not provided, all occurrences will be returned. If set to 'noRole', only occurrences that do not have an associated role will be returned.
   * @param trx Knex Transaction. Optional.
   * @returns Array of TextOccurrencesRow objects.
   */
  public async getPersonOccurrencesTexts(
    personUuids: string[],
    userUuid: string | null,
    { limit, page, filter }: Pagination,
    roleUuid?: string,
    trx?: Knex.Transaction
  ): Promise<TextOccurrencesRow[]> {
    const k = trx || knex;

    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsTohide = await CollectionTextUtils.textsToHide(userUuid, trx);

    let rolesList: string[] = [];

    if (roleUuid === 'noRole') {
      const temporaryRoles = await this.getRolesList('temporary');
      const durableRoles = await this.getRolesList('durable');
      rolesList = [...temporaryRoles, ...durableRoles];
    }

    const discourseUuids = await k('item_properties')
      .pluck('item_properties.reference_uuid')
      .whereIn('item_properties.object_uuid', personUuids)
      .whereIn(
        'item_properties.reference_uuid',
        k('text_discourse').select('uuid')
      )
      .modify(async qb => {
        if (roleUuid === 'noRole') {
          qb.leftJoin('item_properties AS ip2', function () {
            this.on(
              'item_properties.reference_uuid',
              'ip2.reference_uuid'
            ).andOnIn('ip2.value_uuid', rolesList);
          }).whereNull('ip2.id');
        } else if (roleUuid) {
          qb.innerJoin(
            'item_properties AS ip2',
            'item_properties.reference_uuid',
            'ip2.reference_uuid'
          ).where('ip2.value_uuid', roleUuid);
        }
      });

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

  /**
   * Retrieves a single person row by UUID
   * @param uuid The UUID of the person row to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns A single person row.
   * @throws Error if no person is found.
   */
  private async getPersonRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<PersonRow> {
    const k = trx || knex;

    const row: PersonRow | undefined = await k('person')
      .select(
        'uuid',
        'name_uuid as nameUuid',
        'relation',
        'relation_name_uuid as relationNameUuid',
        'label',
        'type',
        'descriptor'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error('No person found');
    }

    return row;
  }

  /**
   * Constructs a person core object for a given person UUID.
   * @param uuid The UUID of the person core object to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single person core object.
   * @throws Error if no person is found.
   */
  public async getPersonCoreByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<PersonCore> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const personRow = await this.getPersonRowByUuid(uuid, trx);

    const display = await this.createPersonDisplay(
      personRow.nameUuid,
      personRow.relation,
      personRow.relationNameUuid,
      personRow.label,
      trx
    );

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const personCore: PersonCore = {
      ...personRow,
      display,
      properties,
    };

    return personCore;
  }

  /**
   * Construct a full person object for a given person UUID.
   * @param uuid The UUID of the person object to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single person object.
   * @throws Error if no person is found.
   */
  public async getPersonByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Person> {
    const FieldDao = sl.get('FieldDao');

    const personCore = await this.getPersonCoreByUuid(uuid, trx);

    const fatherUuid = await this.getParentUuid(
      uuid,
      '89ee2ef8-1885-34cd-5370-b6615326e7bb',
      trx
    );
    const father = fatherUuid
      ? await this.getPersonCoreByUuid(fatherUuid)
      : null;

    const motherUuid = await this.getParentUuid(
      uuid,
      '4998b8df-a55b-4f41-dc82-df928a415e06',
      trx
    );
    const mother = motherUuid
      ? await this.getPersonCoreByUuid(motherUuid)
      : null;

    const husbandsUuids = await this.getHusbandsUuids(uuid, trx);
    const husbands = await Promise.all(
      husbandsUuids.map(husbandUuid =>
        this.getPersonCoreByUuid(husbandUuid, trx)
      )
    );

    const siblingUuids = father
      ? await this.getPersonUuidsByRelation(
          uuid,
          father.uuid,
          '89ee2ef8-1885-34cd-5370-b6615326e7bb',
          trx
        )
      : [];
    const siblings = await Promise.all(
      siblingUuids.map(siblingUuid =>
        this.getPersonCoreByUuid(siblingUuid, trx)
      )
    );

    const childrenUuids = await this.getPersonUuidsByRelation(
      uuid,
      uuid,
      '89ee2ef8-1885-34cd-5370-b6615326e7bb',
      trx
    );
    const children = await Promise.all(
      childrenUuids.map(childUuid => this.getPersonCoreByUuid(childUuid, trx))
    );

    const asshatumWivesUuids = await this.getPersonUuidsByRelation(
      uuid,
      uuid,
      'fc3d82ad-220a-7c3e-ef76-c221f9112b31',
      trx
    );
    const asshatumWives = await Promise.all(
      asshatumWivesUuids.map(wifeUuid =>
        this.getPersonCoreByUuid(wifeUuid, trx)
      )
    );

    const amtumWivesUuids = await this.getPersonUuidsByRelation(
      uuid,
      uuid,
      '6fb177f5-dfb5-0eb8-c288-b62b367ea360',
      trx
    );
    const amtumWives = await Promise.all(
      amtumWivesUuids.map(wifeUuid => this.getPersonCoreByUuid(wifeUuid, trx))
    );

    const discussion = await FieldDao.getFieldRowsByReferenceUuidAndType(
      uuid,
      'description',
      trx
    );

    const person: Person = {
      ...personCore,
      father,
      mother,
      asshatumWives,
      amtumWives,
      husbands,
      siblings,
      children,
      discussion,
      temporaryRoles: [], // Will be added in the cache filter
      durableRoles: [], // Will be added in the cache filter
      roleNotYetAssigned: 0, // Will be added in the cache filter
    };

    return person;
  }

  /**
   * Retrieves a list of person UUIDs by letter.
   * @param letter The letter string to search for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of person UUIDs.
   */
  public async getPersonUuidsByLetter(
    letter: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const letters = letter.split('/');
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

    const uuids: string[] = await k('person')
      .pluck('person.uuid')
      .leftJoin('dictionary_word', 'person.name_uuid', 'dictionary_word.uuid')
      .where('person.type', 'person')
      .andWhere(qb => {
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

    return uuids;
  }

  /**
   * Creates a person display string. This is the string that is displayed in the UI. It uses the name, relation, and relation name to construct the display string.
   * @param nameUuid The name UUID of the person.
   * @param relation The relation of the person.
   * @param relationNameUuid The relation name UUID of the person.
   * @param label The label of the person.
   * @param trx Knex Transaction. Optional.
   * @returns A display string for the person.
   */
  private async createPersonDisplay(
    nameUuid: string | null,
    relation: string | null,
    relationNameUuid: string | null,
    label: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const DictionaryWordDao = sl.get('DictionaryWordDao');

    if (nameUuid && relation && relationNameUuid) {
      const nameRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        nameUuid,
        trx
      );
      const relationNameRow = await DictionaryWordDao.getDictionaryWordRowByUuid(
        relationNameUuid,
        trx
      );
      if (!nameRow || !relationNameRow) {
        return label;
      }
      const name = nameRow.word;
      const relationName = relationNameRow.word;
      return `${name} ${relation} ${relationName}`;
    }
    return label;
  }

  /**
   * Retrieves a list of UUIDs of each possible person role for a given type.
   * @param type The type of roles to retrieve. Either 'temporary' or 'durable'.
   * @param trx Knex Transaction. Optional.
   * @returns Array of role UUIDs.
   */
  private async getRolesList(
    type: 'temporary' | 'durable',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const HierarchyDao = sl.get('HierarchyDao');

    const typeObjectUuid =
      type === 'temporary'
        ? 'e6309c7d-62e4-45fb-a15d-e8c61183c2d9'
        : '4d1283d6-aa93-bfac-0b60-047fed4af699';

    const hierarchyRows = await HierarchyDao.getHierarchyRowsByObjectUuidAndType(
      typeObjectUuid,
      'taxonomy',
      trx
    );

    const hierarchyUuid =
      hierarchyRows.length > 0 ? hierarchyRows[0].uuid : undefined;
    if (!hierarchyUuid) {
      throw new Error('Could not find person roles hierarchy.');
    }

    const variables = await HierarchyDao.getVariablesByParent(
      hierarchyUuid,
      null,
      trx
    );

    const rolesList: string[] = [];
    const uuids = HierarchyDao.getRecursiveObjectUuidsByObjectParentUuids(
      variables,
      'aa76828a-355b-de16-0a41-671d7e45526c'
    );

    uuids.forEach(uuid => rolesList.push(uuid));

    return rolesList;
  }

  /**
   * Retrieves a list of person roles for a given person.
   * @param personUuid The UUID of the person.
   * @param roleUuids The UUIDs of the roles to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of person roles.
   */
  private async getPersonRoles(
    personUuid: string,
    roleUuids: string[],
    trx?: Knex.Transaction
  ): Promise<PersonRole[]> {
    const k = trx || knex;

    const roles: PersonRole[] = await k('item_properties AS ip1')
      .distinct('ip1.value_uuid AS uuid', 'a1.name AS name')
      .innerJoin('alias AS a1', 'ip1.value_uuid', 'a1.reference_uuid')
      .innerJoin(
        'item_properties AS ip2',
        'ip1.reference_uuid',
        'ip2.reference_uuid'
      )
      .innerJoin('text_discourse AS td', 'ip1.reference_uuid', 'td.uuid')
      .where('a1.type', 'label')
      .where('ip2.object_uuid', personUuid)
      .whereIn('ip1.value_uuid', roleUuids);

    return roles;
  }

  /**
   * Retrieves a list of person roles with number of occurrences for a given person. Used in the person cache filter.
   * @param personUuid The UUID of the person.
   * @param type The type of roles to retrieve. Either 'temporary' or 'durable'.
   * @param userUuid The UUID of the user making the request. Used to filter out occurrences that the user does not have access to.
   * @param trx Knex Transaction. Optional.
   * @returns Array of person roles with number of occurrences.
   */
  public async getPersonRolesWithOccurrences(
    personUuid: string,
    type: 'temporary' | 'durable',
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<PersonRoleWithOccurrences[]> {
    const rolesList = await this.getRolesList(type, trx);

    const roles = await this.getPersonRoles(personUuid, rolesList, trx);

    const occurrences = await Promise.all(
      roles.map(role =>
        this.getPersonOccurrencesCount(
          personUuid,
          userUuid,
          undefined,
          role.uuid,
          trx
        )
      )
    );

    const rolesWithOccurrences: PersonRoleWithOccurrences[] = roles.map(
      (role, idx) => ({
        ...role,
        occurrences: occurrences[idx],
      })
    );

    return rolesWithOccurrences.filter(role => role.occurrences > 0);
  }

  /**
   * Retrieves a list of person UUIDs for a given relation.
   * @param personUuid The person UUID.
   * @param fatherUuid The father UUID.
   * @param variableUuid The variable UUID. This is the variable that defines which type of relation to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of person UUIDs.
   */
  private async getPersonUuidsByRelation(
    personUuid: string,
    fatherUuid: string,
    variableUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const relativeUuids: string[] = await k('person')
      .innerJoin('item_properties as ip', 'ip.reference_uuid', 'person.uuid')
      .pluck('ip.object_uuid')
      .where({
        'ip.reference_uuid': fatherUuid,
        'ip.variable_uuid': variableUuid,
      })
      .whereNot({ 'ip.object_uuid': personUuid });

    return relativeUuids;
  }

  /**
   * Retrieves the parent UUID of a person.
   * @param personUuid The person UUID.
   * @param variableUuid The variable UUID. This is the variable that defines which parent relationship to retrieve (mother or father).
   * @param trx Knex Transaction. Optional.
   * @returns The parent UUID or null if no parent is found.
   */
  private async getParentUuid(
    personUuid: string,
    variableUuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knex;

    const parent: { uuid: string } | undefined = await k('person')
      .innerJoin('item_properties as ip', 'ip.reference_uuid', 'person.uuid')
      .select('ip.reference_uuid as uuid')
      .where({ 'ip.object_uuid': personUuid, 'ip.variable_uuid': variableUuid })
      .first();

    if (!parent) {
      return null;
    }

    return parent.uuid;
  }

  /**
   * Retrieves a list of person UUIDs for a person's husbands
   * @param personUuid The person UUID.
   * @param trx Knex Transaction. Optional.
   * @returns Array of person UUIDs.
   */
  private async getHusbandsUuids(
    personUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const husbandsUuids: string[] = await k('person')
      .innerJoin('item_properties as ip', 'ip.reference_uuid', 'person.uuid')
      .pluck('person.uuid')
      .where({ 'ip.object_uuid': personUuid })
      .whereIn('ip.variable_uuid', [
        'fc3d82ad-220a-7c3e-ef76-c221f9112b31',
        '6fb177f5-dfb5-0eb8-c288-b62b367ea360',
      ]);

    return husbandsUuids;
  }

  /**
   * Searches for persons by label or UUID. Used for autocomplete when connecting link properties.
   * @param search The search string. Could be a UUID or a label.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  public async searchPersonsLinkProperties(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;

    const rows: LinkItem[] = await k('person')
      .select('person.uuid as objectUuid', 'person.label as objectDisplay')
      .where(k.raw('LOWER(person.label)'), 'like', `%${search.toLowerCase()}%`)
      .orWhereRaw('binary person.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(person.label) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(person.label) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(person.label) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(person.label)');

    return rows;
  }
}

/**
 * PersonDao instance as a singleton
 */
export default new PersonDao();
