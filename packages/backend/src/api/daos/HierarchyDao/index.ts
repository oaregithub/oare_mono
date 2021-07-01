import {
  CollectionResponse,
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
  ParseTree,
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
        'text.name'
      )
      .groupBy('hierarchy.object_uuid')
      .orderBy('text.name')
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
    level: number
  ): Promise<ParseTree[] | null> {
    const hasChild = await this.hasChild(hierarchyUuid);

    if (hasChild) {
      const rows: ParseTree[] = await getTreeNodeQuery().where(
        'parent_uuid',
        hierarchyUuid
      );
      if (rows.every(row => row.variableUuid)) {
        level += 1;
      }
      const results = await Promise.all(
        rows.map(async row => ({
          ...row,
          level,
          children: await this.getChildren(row.uuid, level),
        }))
      );
      return results;
    }
    return null;
  }

  async createParseTree(): Promise<ParseTree> {
    const parseRow: ParseTree = await getTreeNodeQuery()
      .where('value.name', 'Parse')
      .first();
    const rootRow: ParseTree = await getTreeNodeQuery()
      .where('hierarchy.uuid', parseRow.parentUuid)
      .first();

    const tree = {
      ...rootRow,
      children: await this.getChildren(rootRow.uuid, 0),
    };
    return tree;
  }

  async getTextsInCollection(collectionUuid: string): Promise<string[]> {
    const rows = await knex('hierarchy')
      .pluck('object_uuid')
      .where('obj_parent_uuid', collectionUuid);

    return rows;
  }
}

export default new HierarchyDao();
