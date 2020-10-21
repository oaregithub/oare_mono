import { CollectionListItem, CollectionResponse, CollectionText } from '@oare/types';
import knex from '@/connection';
import textGroupDao from '../TextGroupDao';
import aliasDao from '../AliasDao';
import { UserRow } from '../UserDao';

function collectionTextQuery(uuid: string, search: string, blacklist: string[]) {
  const query = knex('hierarchy')
    .leftJoin('text_epigraphy', 'text_epigraphy.text_uuid', 'hierarchy.uuid')
    .leftJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
    .where('hierarchy.parent_uuid', uuid)
    .andWhere('alias.name', 'like', `%${search}%`)
    .andWhere(function () {
      this.whereNotIn('hierarchy.uuid', blacklist);
    });
  return query;
}

class HierarchyDao {
  async getTextsBySearchTerm(searchText: string): Promise<CollectionListItem[]> {
    const matchingTexts: CollectionListItem[] = await knex('hierarchy')
      .select('hierarchy.uuid', 'alias.name')
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
      .where('hierarchy.type', 'text')
      .andWhere('alias.name', 'like', `%${searchText}%`)
      .groupBy('alias.name')
      .orderBy('alias.name');
    return matchingTexts;
  }

  async getAllCollections(isAdmin: boolean): Promise<CollectionListItem[]> {
    let collectionsQuery = knex('hierarchy').select('hierarchy.uuid').where('hierarchy.type', 'collection');

    if (!isAdmin) {
      collectionsQuery = collectionsQuery.andWhere('hierarchy.published', true);
    }

    const collections: { uuid: string }[] = await collectionsQuery;
    const collectionNameQueries = collections.map((collection) => aliasDao.displayAliasNames(collection.uuid));
    const collectionNames = await Promise.all(collectionNameQueries);

    return collections.map(({ uuid }, idx) => ({
      name: collectionNames[idx],
      uuid,
    }));
  }

  async getCollectionTexts(
    userId: UserRow | null,
    uuid: string,
    { page = 1, rows = 10, search = '' },
  ): Promise<CollectionResponse> {
    const blacklistedTexts = await textGroupDao.getUserBlacklist(userId);
    const countRow = await collectionTextQuery(uuid, search, blacklistedTexts)
      .count({
        count: knex.raw('distinct hierarchy.id'),
      })
      .first();

    let totalTexts = 0;
    if (countRow?.count) {
      totalTexts = countRow.count as number;
    }

    const collectionRowsQuery = collectionTextQuery(uuid, search, blacklistedTexts)
      .distinct(
        'hierarchy.id',
        'hierarchy.uuid',
        'hierarchy.type',
        'alias.name',
        knex.raw(`(CASE WHEN text_epigraphy.uuid IS NULL THEN false ELSE true END) AS hasEpigraphy`),
      )
      .groupBy('hierarchy.uuid')
      .orderBy('alias.name')
      .limit(rows)
      .offset((page - 1) * rows);
    let texts: CollectionText[] = await collectionRowsQuery;

    const textNames = await Promise.all(texts.map((result) => aliasDao.displayAliasNames(result.uuid)));

    texts = texts.map((result, i) => ({
      ...result,
      name: textNames[i],
    }));

    return {
      totalTexts,
      texts,
    };
  }

  async getEpigraphyCollection(epigUuid: string): Promise<CollectionListItem> {
    const collection: CollectionListItem = await knex('hierarchy')
      .first('hierarchy.parent_uuid AS uuid', 'alias.name')
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.parent_uuid')
      .where('hierarchy.uuid', epigUuid);
    return collection;
  }

  async isPublished(hierarchyUuid: string): Promise<boolean> {
    const row: { published: boolean } = await knex('hierarchy').first('published').where('uuid', hierarchyUuid);
    return row.published;
  }
}

export default new HierarchyDao();
