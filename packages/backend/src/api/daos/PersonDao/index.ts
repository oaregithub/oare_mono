import { knexRead, knexWrite } from '@/connection';
import {
  PersonRow,
  Pagination,
  TextOccurrencesRow,
  PersonInfo,
  PersonCore,
  PersonRole,
  TaxonomyTree,
} from '@oare/types';
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
        'person.type',
        'descriptor'
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

  async createDisplay(
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

  getChildrenUuids(taxonomyTree: TaxonomyTree[]): string[] {
    const childrenUuids: string[] = [];
    taxonomyTree.forEach(node => {
      if (
        node.children === null &&
        node.objParentUuid === 'aa76828a-355b-de16-0a41-671d7e45526c'
      ) {
        childrenUuids.push(node.objectUuid);
      } else if (node.children) {
        const uuids = this.getChildrenUuids(node.children);
        uuids.forEach(uuid => childrenUuids.push(uuid));
      }
    });
    return childrenUuids;
  }

  async getRolesList(
    type: 'temporary' | 'durable',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const HierarchyDao = sl.get('HierarchyDao');
    const typeUuid =
      type === 'temporary'
        ? 'e6309c7d-62e4-45fb-a15d-e8c61183c2d9'
        : '4d1283d6-aa93-bfac-0b60-047fed4af699';
    const hierarchyUuid = await k('hierarchy')
      .select('uuid')
      .where('object_uuid', typeUuid)
      .where('type', 'taxonomy')
      .first()
      .then(row => row.uuid);
    const taxonomy = await HierarchyDao.getChildren(hierarchyUuid, null, trx);
    const rolesList: string[] = [];
    if (taxonomy) {
      const uuids = this.getChildrenUuids(taxonomy);
      uuids.forEach(uuid => rolesList.push(uuid));
    }
    return rolesList;
  }

  async getPersonRoles(
    personUuid: string,
    type: 'temporary' | 'durable',
    trx?: Knex.Transaction
  ): Promise<PersonRole[]> {
    const k = trx || knexRead();
    const rolesList = await this.getRolesList(type, trx);
    const roles = await k('item_properties AS ip1')
      .select('ip1.value_uuid AS roleUuid', 'a1.name AS role')
      .innerJoin('alias AS a1', 'ip1.value_uuid', 'a1.reference_uuid')
      .innerJoin(
        'item_properties AS ip2',
        'ip1.reference_uuid',
        'ip2.reference_uuid'
      )
      .innerJoin('text_discourse AS td', 'ip1.reference_uuid', 'td.uuid')
      .where('a1.type', 'label')
      .where('ip2.object_uuid', personUuid)
      .whereIn('ip1.value_uuid', rolesList);
    return roles;
  }

  async getPersonsByRelation(
    personUuid: string,
    fatherUuid: string,
    variableUuid: string,
    trx?: Knex.Transaction
  ): Promise<PersonCore[]> {
    const k = trx || knexRead();
    const relativeUuids: string[] = await k('item_properties AS ip')
      .pluck('ip.object_uuid')
      .innerJoin('person AS p', 'p.uuid', 'ip.reference_uuid')
      .where('ip.reference_uuid', fatherUuid)
      .where('ip.variable_uuid', variableUuid)
      .whereNot('ip.object_uuid', personUuid);
    const relatives: PersonRow[] = await k('person AS p')
      .select(
        'p.name_uuid AS nameUuid',
        'p.relation AS relation',
        'p.relation_name_uuid AS relationNameUuid',
        'p.label',
        'p.descriptor',
        'p.uuid'
      )
      .whereIn('uuid', relativeUuids);

    const displays = await Promise.all(
      relatives.map(rel =>
        this.createDisplay(
          rel.nameUuid,
          rel.relation,
          rel.relationNameUuid,
          rel.label,
          trx
        )
      )
    );

    const relativesCores: PersonCore[] = relatives.map((rel, idx) => ({
      display: displays[idx],
      nameUuid: rel.nameUuid,
      relation: rel.relation,
      relationNameUuid: rel.relationNameUuid,
      uuid: rel.uuid,
      descriptor: rel.descriptor,
    }));

    return relativesCores;
  }

  async getParent(
    personUuid: string,
    variableUuid: string,
    trx?: Knex.Transaction
  ): Promise<PersonCore | null> {
    const k = trx || knexRead();
    const parent:
      | {
          uuid: string;
          nameUuid: string | null;
          relation: string | null;
          relationNameUuid: string | null;
          label: string;
          descriptor: string | null;
        }
      | undefined = await k('item_properties AS ip')
      .select(
        'ip.reference_uuid AS uuid',
        'p.name_uuid AS nameUuid',
        'p.relation AS relation',
        'p.label',
        'p.relation_name_uuid AS relationNameUuid',
        'p.descriptor'
      )
      .innerJoin('person AS p', 'p.uuid', 'ip.reference_uuid')
      .where('ip.object_uuid', personUuid)
      .where('ip.variable_uuid', variableUuid)
      .first();
    if (!parent) {
      return null;
    }
    const display = await this.createDisplay(
      parent.nameUuid,
      parent.relation,
      parent.relationNameUuid,
      parent.label,
      trx
    );
    return {
      display,
      nameUuid: parent.nameUuid,
      relation: parent.relation,
      relationNameUuid: parent.relationNameUuid,
      uuid: parent.uuid,
      descriptor: parent.descriptor,
    };
  }

  async getHusbands(
    personUuid: string,
    variableUuids: string[],
    trx?: Knex.Transaction
  ): Promise<PersonCore[]> {
    const k = trx || knexRead();
    const husbands: PersonRow[] = await k('item_properties AS ip')
      .select(
        'p.name_uuid AS nameUuid',
        'p.relation AS relation',
        'p.relation_name_uuid AS relationNameUuid',
        'p.label',
        'p.descriptor',
        'p.uuid'
      )
      .innerJoin('person AS p', 'p.uuid', 'ip.reference_uuid')
      .where('ip.object_uuid', personUuid)
      .whereIn('ip.variable_uuid', variableUuids);

    const displays = await Promise.all(
      husbands.map(rel =>
        this.createDisplay(
          rel.nameUuid,
          rel.relation,
          rel.relationNameUuid,
          rel.label,
          trx
        )
      )
    );

    const husbandsCores: PersonCore[] = husbands.map((rel, idx) => ({
      display: displays[idx],
      nameUuid: rel.nameUuid,
      relation: rel.relation,
      relationNameUuid: rel.relationNameUuid,
      uuid: rel.uuid,
      descriptor: rel.descriptor,
    }));

    return husbandsCores;
  }

  async getPersonInfo(
    personUuid: string,
    trx?: Knex.Transaction
  ): Promise<PersonInfo> {
    const k = trx || knexRead();
    const FieldDao = sl.get('FieldDao');
    const mainPerson: PersonRow = await k('person AS p1')
      .select(
        'p1.uuid',
        'p1.name_uuid AS nameUuid',
        'p1.relation',
        'p1.relation_name_uuid AS relationNameUuid',
        'p1.label',
        'p1.descriptor'
      )
      .first()
      .where('uuid', personUuid);
    const display = await this.createDisplay(
      mainPerson.nameUuid,
      mainPerson.relation,
      mainPerson.relationNameUuid,
      mainPerson.label,
      trx
    );
    const father = await this.getParent(
      personUuid,
      '89ee2ef8-1885-34cd-5370-b6615326e7bb',
      trx
    );
    const mother = await this.getParent(
      personUuid,
      '4998b8df-a55b-4f41-dc82-df928a415e06',
      trx
    );
    const husbands = await this.getHusbands(
      personUuid,
      [
        'fc3d82ad-220a-7c3e-ef76-c221f9112b31',
        '6fb177f5-dfb5-0eb8-c288-b62b367ea360',
      ],
      trx
    );
    const siblings = father
      ? await this.getPersonsByRelation(
          personUuid,
          father.uuid,
          '89ee2ef8-1885-34cd-5370-b6615326e7bb',
          trx
        )
      : [];
    const children = await this.getPersonsByRelation(
      personUuid,
      personUuid,
      '89ee2ef8-1885-34cd-5370-b6615326e7bb',
      trx
    );
    const asshatumWives = await this.getPersonsByRelation(
      personUuid,
      personUuid,
      'fc3d82ad-220a-7c3e-ef76-c221f9112b31',
      trx
    );
    const amtumWives = await this.getPersonsByRelation(
      personUuid,
      personUuid,
      '6fb177f5-dfb5-0eb8-c288-b62b367ea360',
      trx
    );
    const durableRoles = await this.getPersonRoles(personUuid, 'durable', trx);
    const temporaryRoles = await this.getPersonRoles(
      personUuid,
      'temporary',
      trx
    );

    const discussion = await FieldDao.getByReferenceUuid(personUuid, trx);

    return {
      person: mainPerson,
      display,
      father,
      mother,
      asshatumWives,
      amtumWives,
      husbands,
      siblings,
      children,
      durableRoles,
      temporaryRoles,
      discussion,
    };
  }
}

export default new PersonDao();
