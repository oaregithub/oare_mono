import {
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
  HierarchyRow,
  TaxonomyPropertyTree,
  HierarchyData,
  HierarchyTopNode,
  PropertyVariable,
  VariableRow,
  PropertyValue,
  ValueRow,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import { getHierarchyRowQuery } from './utils';

class HierarchyDao {
  async getBySearchTerm(
    { page, limit, filter, type, groupId, showExcluded }: SearchNamesPayload,
    trx?: Knex.Transaction
  ): Promise<SearchNamesResponse> {
    const k = trx || knex;
    const CollectionDao = sl.get('CollectionDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    function createBaseQuery() {
      const query = k('hierarchy')
        .distinct('hierarchy.object_uuid as uuid')
        .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
        .where('hierarchy.type', type.toLowerCase())
        .andWhere('alias.name', 'like', `%${filter}%`)
        .whereNotIn('hierarchy.object_uuid', quarantinedTexts);
      if (groupId && showExcluded) {
        return query.whereNotIn(
          'hierarchy.object_uuid',
          k('group_edit_permissions').select('uuid').where('group_id', groupId)
        );
      }
      if (groupId) {
        return query
          .whereIn(
            'hierarchy.object_uuid',
            k('public_denylist').select('uuid').where({ type })
          )
          .modify(qb => {
            if (type === 'Text') {
              qb.orWhereIn(
                'hierarchy.object_uuid',
                k('hierarchy')
                  .select('object_uuid')
                  .whereIn(
                    'obj_parent_uuid',
                    k('public_denylist')
                      .select('uuid')
                      .where('type', 'collection')
                  )
              );
            }
          })
          .whereNotIn(
            'hierarchy.object_uuid',
            k('group_allowlist').select('uuid').where('group_id', groupId)
          );
      }
      return query
        .leftJoin(
          'public_denylist',
          'public_denylist.uuid',
          'hierarchy.object_uuid'
        )
        .whereNull('public_denylist.uuid');
    }

    const searchResponse: Array<{ uuid: string }> = await createBaseQuery()
      .orderBy('alias.name')
      .limit(limit)
      .offset((page - 1) * limit);

    let names: string[];
    if (type === 'Text') {
      const TextDao = sl.get('TextDao');
      names = (
        await Promise.all(
          searchResponse.map(text => TextDao.getTextByUuid(text.uuid, trx))
        )
      ).map(text => (text ? text.name : ''));
    } else if (type === 'Collection') {
      names = (
        await Promise.all(
          searchResponse.map(collection =>
            CollectionDao.getCollectionByUuid(collection.uuid, trx)
          )
        )
      ).map(collection => (collection ? collection.name : ''));
    }

    let epigraphyStatus: boolean[] = [];
    if (type === 'Text') {
      epigraphyStatus = await Promise.all(
        searchResponse.map(item =>
          TextEpigraphyDao.hasEpigraphy(item.uuid, trx)
        )
      );
    }
    const matchingItems: SearchNamesResultRow[] = searchResponse.map(
      (item, index) => ({
        ...item,
        name: names[index],
        hasEpigraphy: type === 'Text' ? epigraphyStatus[index] : false,
      })
    );

    const count = await createBaseQuery()
      .count({
        count: k.raw('distinct hierarchy.object_uuid'),
      })
      .first();
    let totalItems = 0;

    if (count && count.count) {
      totalItems = count.count as number;
    }

    return {
      items: matchingItems,
      count: totalItems,
    };
  }

  async isPublished(
    hierarchyUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row: { published: boolean } | undefined = await k('hierarchy')
      .first('published')
      .where({ object_uuid: hierarchyUuid });

    return row ? row.published : false;
  }

  async hasChild(hierarchyUuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;
    const rows = await k('hierarchy').where('parent_uuid', hierarchyUuid);
    if (rows && rows.length > 0) {
      return true;
    }
    return false;
  }

  async createPropertiesTaxonomyTree(
    trx?: Knex.Transaction
  ): Promise<TaxonomyPropertyTree> {
    const AliasDao = sl.get('AliasDao');
    const FieldDao = sl.get('FieldDao');

    const topNodeHierarchy: HierarchyData = await getHierarchyRowQuery(trx)
      .where('hierarchy.type', 'taxonomy')
      .where('hierarchy.role', 'tree')
      .first();

    const names = await AliasDao.getAliasNamesByReferenceUuid(
      topNodeHierarchy.objectUuid,
      trx
    );

    const fieldRows = await FieldDao.getFieldRowsByReferenceUuidAndType(
      topNodeHierarchy.objectUuid,
      'description',
      trx
    );

    const topNode: HierarchyTopNode = {
      hierarchy: topNodeHierarchy,
      name: names[0] ?? null,
      fieldInfo: fieldRows[0] ?? null,
      variables: await this.getVariablesByParent(
        topNodeHierarchy.uuid,
        null,
        trx
      ),
    };

    return {
      tree: topNode,
    };
  }

  async getVariablesByParent(
    hierarchyUuid: string,
    level: number | null,
    trx?: Knex.Transaction
  ): Promise<PropertyVariable[]> {
    const FieldDao = sl.get('FieldDao');

    const hasChild = await this.hasChild(hierarchyUuid, trx);

    if (hasChild) {
      const hierarchyRows: HierarchyData[] = await getHierarchyRowQuery(
        trx
      ).where('hierarchy.parent_uuid', hierarchyUuid);

      const variableRows = await Promise.all(
        hierarchyRows.map(row => this.getVariableRowByUuid(row.objectUuid, trx))
      );

      const fieldRows = await Promise.all(
        hierarchyRows.map(row =>
          FieldDao.getFieldRowsByReferenceUuidAndType(
            row.objectUuid,
            'description',
            trx
          )
        )
      );

      const propertyVariables: PropertyVariable[] = await Promise.all(
        variableRows.map(async (row, idx) => ({
          ...row,
          hierarchy: hierarchyRows[idx],
          level,
          fieldInfo: fieldRows[idx][0] ?? null,
          values: await this.getValuesByParent(
            hierarchyRows[idx].uuid,
            level === null ? 1 : level + 1,
            trx
          ),
        }))
      );

      return propertyVariables;
    }
    return [];
  }

  async getVariableRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<VariableRow> {
    const k = trx || knex;

    const variable: VariableRow = await k('variable')
      .select(
        'uuid',
        'name',
        'abbreviation',
        'type',
        'table_reference as tableReference'
      )
      .where({ uuid })
      .first();

    return variable;
  }

  async getValuesByParent(
    hierarchyUuid: string,
    level: number | null,
    trx?: Knex.Transaction
  ): Promise<PropertyValue[]> {
    const FieldDao = sl.get('FieldDao');

    const hasChild = await this.hasChild(hierarchyUuid, trx);

    if (hasChild) {
      const hierarchyRows: HierarchyData[] = await getHierarchyRowQuery(
        trx
      ).where('hierarchy.parent_uuid', hierarchyUuid);

      const valueRows = await Promise.all(
        hierarchyRows.map(row => this.getValueRowByUuid(row.objectUuid, trx))
      );

      const fieldRows = await Promise.all(
        hierarchyRows.map(row =>
          FieldDao.getFieldRowsByReferenceUuidAndType(
            row.objectUuid,
            'description',
            trx
          )
        )
      );

      const propertyValues: PropertyValue[] = await Promise.all(
        valueRows.map(async (row, idx) => ({
          ...row,
          hierarchy: hierarchyRows[idx],
          fieldInfo: fieldRows[idx][0] ?? null,
          variables: await this.getVariablesByParent(
            hierarchyRows[idx].uuid,
            level,
            trx
          ),
        }))
      );

      return propertyValues;
    }
    return [];
  }

  async getValueRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ValueRow> {
    const k = trx || knex;

    const value: ValueRow = await k('value')
      .select('uuid', 'name', 'abbreviation')
      .where({ uuid })
      .first();

    return value;
  }

  async getTextUuidsByCollectionUuid(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows = await k('hierarchy')
      .pluck('object_uuid')
      .where('obj_parent_uuid', collectionUuid);

    return rows;
  }

  async getParentUuidByCollection(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;
    const results = await k('hierarchy')
      .select('uuid')
      .where({ object_uuid: collectionUuid, type: 'collection' })
      .first();
    return results.uuid;
  }

  async insertHierarchyRow(row: HierarchyRow, trx?: Knex.Transaction) {
    const k = trx || knex;
    await k('hierarchy').insert({
      uuid: row.uuid,
      parent_uuid: row.parentUuid,
      type: row.type,
      role: row.role,
      object_uuid: row.objectUuid,
      obj_parent_uuid: row.objectParentUuid,
      published: row.published,
      custom: row.custom,
    });
  }

  async removeHierarchyTextRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('hierarchy').del().where({ object_uuid: textUuid, type: 'text' });
  }

  async getHierarchyRowsByObjectUuid(
    objectUuid: string,
    trx?: Knex.Transaction
  ): Promise<HierarchyRow[]> {
    const k = trx || knex;

    const rows = await k('hierarchy')
      .select(
        'uuid',
        'parent_uuid as parentUuid',
        'type',
        'role',
        'object_uuid as objectUuid',
        'obj_parent_uuid as objectParentUuid',
        'published',
        'custom'
      )
      .where({ object_uuid: objectUuid });

    return rows;
  }
}

export default new HierarchyDao();