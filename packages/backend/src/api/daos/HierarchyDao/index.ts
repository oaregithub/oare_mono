import {
  CollectionResponse,
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
  TaxonomyTree,
  HierarchyRow,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { getTreeNodeQuery } from './utils';

class HierarchyDao {
  async getBySearchTerm({
    page,
    limit,
    filter,
    type,
    groupId,
    showExcluded,
  }: SearchNamesPayload): Promise<SearchNamesResponse> {
    const CollectionDao = sl.get('CollectionDao');
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');

    function createBaseQuery() {
      const query = knex('hierarchy')
        .distinct('hierarchy.object_uuid as uuid')
        .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
        .where('hierarchy.type', type.toLowerCase())
        .andWhere('alias.name', 'like', `%${filter}%`);
      if (groupId && showExcluded) {
        return query.whereNotIn(
          'hierarchy.object_uuid',
          knex('group_edit_permissions')
            .select('uuid')
            .where('group_id', groupId)
        );
      }
      if (groupId) {
        return query
          .whereIn(
            'hierarchy.object_uuid',
            knex('public_denylist').select('uuid').where({ type })
          )
          .modify(qb => {
            if (type === 'Text') {
              qb.orWhereIn(
                'hierarchy.object_uuid',
                knex('hierarchy')
                  .select('object_uuid')
                  .whereIn(
                    'obj_parent_uuid',
                    knex('public_denylist')
                      .select('uuid')
                      .where('type', 'collection')
                  )
              );
            }
          })
          .whereNotIn(
            'hierarchy.object_uuid',
            knex('group_allowlist').select('uuid').where('group_id', groupId)
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
          searchResponse.map(text => TextDao.getTextByUuid(text.uuid))
        )
      ).map(text => (text ? text.name : ''));
    } else if (type === 'Collection') {
      names = (
        await Promise.all(
          searchResponse.map(collection =>
            CollectionDao.getCollectionByUuid(collection.uuid)
          )
        )
      ).map(collection => (collection ? collection.name : ''));
    }

    let epigraphyStatus: boolean[] = [];
    if (type === 'Text') {
      epigraphyStatus = await Promise.all(
        searchResponse.map(item => TextEpigraphyDao.hasEpigraphy(item.uuid))
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
        count: knex.raw('distinct hierarchy.object_uuid'),
      })
      .first();
    let totalItems = 0;
    if (count?.count) {
      totalItems = count.count as number;
    }

    return {
      items: matchingItems,
      count: totalItems,
    };
  }

  async getCollectionTexts(
    userUuid: string | null,
    collectionUuid: string,
    { page = 1, rows = 10, search = '' }
  ): Promise<CollectionResponse> {
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid);

    const collectionTextQuery = () => {
      const query = knex('hierarchy')
        .leftJoin('text', 'text.uuid', 'hierarchy.object_uuid')
        .where('hierarchy.obj_parent_uuid', collectionUuid)
        .andWhere('text.name', 'like', `%${search}%`)
        .whereNotIn('hierarchy.object_uuid', textsToHide);

      return query;
    };

    const countRow = await collectionTextQuery()
      .count({
        count: knex.raw('distinct hierarchy.id'),
      })
      .first();

    let totalTexts = 0;
    if (countRow?.count) {
      totalTexts = countRow.count as number;
    }

    const texts = await collectionTextQuery()
      .distinct(
        'hierarchy.id',
        'hierarchy.object_uuid as uuid',
        'hierarchy.type',
        'text.display_name as name',
        'text.excavation_prfx as excavationPrefix',
        'text.excavation_no as excavationNumber',
        'text.museum_prfx as museumPrefix',
        'text.museum_no as museumNumber',
        'text.publication_prfx as publicationPrefix',
        'text.publication_no as publicationNumber'
      )
      .groupBy('hierarchy.object_uuid')
      .orderBy('text.display_name')
      .limit(rows)
      .offset((page - 1) * rows);

    const hasEpigraphies = await Promise.all(
      texts.map(text => TextEpigraphyDao.hasEpigraphy(text.uuid))
    );

    return {
      totalTexts,
      texts: texts.map((text, idx) => ({
        ...text,
        hasEpigraphy: hasEpigraphies[idx],
      })),
    };
  }

  async isPublished(hierarchyUuid: string): Promise<boolean> {
    const row: { published: boolean } = await knex('hierarchy')
      .first('published')
      .where('object_uuid', hierarchyUuid);
    return row.published;
  }

  async hasChild(hierarchyUuid: string) {
    const rows = await knex('hierarchy').where('parent_uuid', hierarchyUuid);
    if (rows && rows.length > 0) {
      return true;
    }
    return false;
  }

  async getChildren(
    hierarchyUuid: string,
    level: number | null
  ): Promise<TaxonomyTree[] | null> {
    const AliasDao = sl.get('AliasDao');
    const hasChild = await this.hasChild(hierarchyUuid);

    if (hasChild) {
      const rows: TaxonomyTree[] = await getTreeNodeQuery().where(
        'parent_uuid',
        hierarchyUuid
      );
      if (rows.every(row => row.variableUuid) && level !== null) {
        level += 1;
      }
      const results = await Promise.all(
        rows.map(async row => {
          const names = await AliasDao.getAliasNames(row.objectUuid);

          return {
            ...row,
            aliasName: names[0] || null,
            level,
            children: await this.getChildren(row.uuid, level || 0),
          };
        })
      );
      return results;
    }
    return null;
  }

  async createTaxonomyTree(): Promise<TaxonomyTree> {
    const AliasDao = sl.get('AliasDao');

    const topNode: TaxonomyTree = await getTreeNodeQuery()
      .where('hierarchy.type', 'taxonomy')
      .andWhere('hierarchy.role', 'tree')
      .first();

    const names = await AliasDao.getAliasNames(topNode.objectUuid);

    const tree = {
      ...topNode,
      aliasName: names[0] || null,
      children: await this.getChildren(topNode.uuid, null),
    };
    return tree;
  }

  async getTextsInCollection(collectionUuid: string): Promise<string[]> {
    const rows = await knex('hierarchy')
      .pluck('object_uuid')
      .where('obj_parent_uuid', collectionUuid);

    return rows;
  }

  async getParentUuidByCollection(collectionUuid: string): Promise<string> {
    const results = await knex('hierarchy')
      .select('parent_uuid AS parentUuid')
      .where('obj_parent_uuid', collectionUuid)
      .first();
    return results.parentUuid;
  }

  async insertHierarchyRow(row: HierarchyRow) {
    await knex('hierarchy').insert({
      uuid: row.uuid,
      parent_uuid: row.parentUuid,
      type: row.type,
      role: row.role,
      object_uuid: row.objectUuid,
      obj_parent_uuid: row.objectParentUuid,
      published: row.published,
    });
  }
}

export default new HierarchyDao();
