import {
  CollectionListItem,
  CollectionResponse,
  CollectionText,
  SearchTextNamesResponse,
  SearchCollectionNamesResponse,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import textGroupDao from '../TextGroupDao';
import aliasDao from '../AliasDao';
import { UserRow } from '../UserDao';

function collectionTextQuery(
  uuid: string,
  search: string,
  collectionIsBlacklisted: boolean,
  blacklist: string[],
  whitelist: string[],
) {
  if (collectionIsBlacklisted) {
    const query = knex('hierarchy')
      .leftJoin('text_epigraphy', 'text_epigraphy.text_uuid', 'hierarchy.uuid')
      .leftJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
      .where('hierarchy.parent_uuid', uuid)
      .andWhere('alias.name', 'like', `%${search}%`)
      .andWhere(function () {
        this.whereIn('hierarchy.uuid', whitelist);
      });
    return query;
  }
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
  async getTextsBySearchTerm(
    page: number,
    rows: number,
    searchText: string,
    groupId?: number,
  ): Promise<SearchTextNamesResponse> {
    function createBaseQuery() {
      const query = knex('hierarchy')
        .distinct('hierarchy.uuid')
        .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
        .where('hierarchy.type', 'text')
        .andWhere('alias.name', 'like', `%${searchText}%`);
      if (groupId) {
        return query.whereNotIn('hierarchy.uuid', knex('text_group').select('text_uuid').where('group_id', groupId));
      }
      return query
        .leftJoin('public_blacklist', 'public_blacklist.uuid', 'hierarchy.uuid')
        .whereNull('public_blacklist.uuid');
    }

    const textsResponse = await createBaseQuery()
      .orderBy('alias.name')
      .limit(rows)
      .offset((page - 1) * rows);
    const names = await Promise.all(textsResponse.map((text) => aliasDao.textAliasNames(text.uuid)));
    const matchingTexts: CollectionListItem[] = textsResponse.map((text, index) => ({
      ...text,
      name: names[index],
    }));

    const count = await createBaseQuery()
      .count({
        count: knex.raw('distinct hierarchy.uuid'),
      })
      .first();
    let totalTexts = 0;
    if (count?.count) {
      totalTexts = count.count as number;
    }

    return {
      texts: matchingTexts,
      count: totalTexts,
    };
  }

  async getCollectionsBySearchTerm(
    page: number,
    rows: number,
    searchText: string,
    groupId?: number,
  ): Promise<SearchCollectionNamesResponse> {
    function createBaseQuery() {
      const query = knex('hierarchy')
        .distinct('hierarchy.uuid')
        .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
        .where('hierarchy.type', 'collection')
        .andWhere('alias.name', 'like', `%${searchText}%`);
      if (groupId) {
        return query.whereNotIn(
          'hierarchy.uuid',
          knex('collection_group').select('collection_uuid').where('group_id', groupId),
        );
      }
      return query
        .leftJoin('public_blacklist', 'public_blacklist.uuid', 'hierarchy.uuid')
        .whereNull('public_blacklist.uuid');
    }

    const collectionsResponse = await createBaseQuery()
      .orderBy('alias.name')
      .limit(rows)
      .offset((page - 1) * rows);
    const names = await Promise.all(collectionsResponse.map((collection) => aliasDao.textAliasNames(collection.uuid)));
    const matchingCollections: CollectionListItem[] = collectionsResponse.map((collection, index) => ({
      ...collection,
      name: names[index],
    }));

    const count = await createBaseQuery()
      .count({
        count: knex.raw('distinct hierarchy.uuid'),
      })
      .first();
    let totalCollections = 0;
    if (count?.count) {
      totalCollections = count.count as number;
    }

    return {
      collections: matchingCollections,
      count: totalCollections,
    };
  }

  async getAllCollections(isAdmin: boolean, user: UserRow | null): Promise<CollectionListItem[]> {
    const CollectionGroupDao = sl.get('CollectionGroupDao');
    const blacklistedCollections = await CollectionGroupDao.getUserCollectionBlacklist(user);
    const blacklistedUuids = blacklistedCollections.map((collection) => collection.uuid);

    let collectionsQuery = knex('hierarchy')
      .select('hierarchy.uuid')
      .whereNotIn('uuid', blacklistedUuids)
      .andWhere('hierarchy.type', 'collection');

    if (!isAdmin) {
      collectionsQuery = collectionsQuery.andWhere('hierarchy.published', true);
    }

    const collections: { uuid: string }[] = await collectionsQuery;
    const collectionNameQueries = collections.map((collection) => aliasDao.textAliasNames(collection.uuid));
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
    const CollectionGroupDao = sl.get('CollectionGroupDao');
    const collectionIsBlacklisted = await CollectionGroupDao.collectionIsBlacklisted(uuid, userId);
    const { blacklist, whitelist } = await textGroupDao.getUserBlacklist(userId);

    const countRow = await collectionTextQuery(uuid, search, collectionIsBlacklisted, blacklist, whitelist)
      .count({
        count: knex.raw('distinct hierarchy.id'),
      })
      .first();

    let totalTexts = 0;
    if (countRow?.count) {
      totalTexts = countRow.count as number;
    }

    const collectionRowsQuery = collectionTextQuery(uuid, search, collectionIsBlacklisted, blacklist, whitelist)
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

    const textNames = await Promise.all(texts.map((result) => aliasDao.textAliasNames(result.uuid)));

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
