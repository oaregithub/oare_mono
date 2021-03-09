import {
  Collection,
  CollectionResponse,
  CollectionText,
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import textGroupDao from '../TextGroupDao';
import UserDao from '../UserDao';
import TextEpigraphyDao from '../TextEpigraphyDao';
import CollectionGroupDao from '../CollectionGroupDao';
import CollectionDao from '../CollectionDao';

class HierarchyDao {
  async getBySearchTerm({
    page,
    limit,
    filter,
    type,
    groupId,
  }: SearchNamesPayload): Promise<SearchNamesResponse> {
    function createBaseQuery() {
      const query = knex('hierarchy')
        .distinct('hierarchy.uuid')
        .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.uuid')
        .where('hierarchy.type', type.toLowerCase())
        .andWhere('alias.name', 'like', `%${filter}%`);
      if (groupId) {
        if (type === 'Text') {
          return query.whereNotIn(
            'hierarchy.uuid',
            knex('text_group').select('text_uuid').where('group_id', groupId)
          );
        }
        if (type === 'Collection') {
          return query.whereNotIn(
            'hierarchy.uuid',
            knex('collection_group')
              .select('collection_uuid')
              .where('group_id', groupId)
          );
        }
      }
      return query
        .leftJoin('public_blacklist', 'public_blacklist.uuid', 'hierarchy.uuid')
        .whereNull('public_blacklist.uuid');
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
        count: knex.raw('distinct hierarchy.uuid'),
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

  async getAllCollections(userUuid: string | null): Promise<Collection[]> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;
    const isAdmin = user ? user.isAdmin : false;

    const blacklistedUuids = await CollectionGroupDao.getUserCollectionBlacklist(
      userUuid
    );

    let collectionsQuery = knex('hierarchy')
      .select('hierarchy.uuid')
      .whereNotIn('uuid', blacklistedUuids)
      .andWhere('hierarchy.type', 'collection');

    if (!isAdmin) {
      collectionsQuery = collectionsQuery.andWhere('hierarchy.published', true);
    }

    const collections: { uuid: string }[] = await collectionsQuery;

    const collectionNames = (
      await Promise.all(
        collections.map(({ uuid }) => CollectionDao.getCollectionByUuid(uuid))
      )
    ).map(collection => (collection ? collection.name : ''));

    return collections.map(({ uuid }, idx) => ({
      name: collectionNames[idx],
      uuid,
    }));
  }

  async getCollectionTexts(
    userUuid: string | null,
    uuid: string,
    { page = 1, rows = 10, search = '' }
  ): Promise<CollectionResponse> {
    const collectionTextQuery = (
      collectionUuid: string,
      textSearch: string,
      collectionIsBlacklisted: boolean,
      blacklist: string[],
      whitelist: string[]
    ) => {
      const query = knex('hierarchy')
        .leftJoin('text', 'text.uuid', 'hierarchy.uuid')
        .where('hierarchy.parent_uuid', collectionUuid)
        .andWhere('text.name', 'like', `%${textSearch}%`);

      if (collectionIsBlacklisted) {
        return query.andWhere(function () {
          this.whereIn('hierarchy.uuid', whitelist);
        });
      }

      return query.andWhere(function () {
        this.whereNotIn('hierarchy.uuid', blacklist);
      });
    };

    const collectionIsBlacklisted = await CollectionGroupDao.collectionIsBlacklisted(
      uuid,
      userUuid
    );
    const { blacklist, whitelist } = await textGroupDao.getUserBlacklist(
      userUuid
    );

    const countRow = await collectionTextQuery(
      uuid,
      search,
      collectionIsBlacklisted,
      blacklist,
      whitelist
    )
      .count({
        count: knex.raw('distinct hierarchy.id'),
      })
      .first();

    let totalTexts = 0;
    if (countRow?.count) {
      totalTexts = countRow.count as number;
    }

    const texts: Omit<
      CollectionText,
      'hasEpigraphy'
    >[] = await collectionTextQuery(
      uuid,
      search,
      collectionIsBlacklisted,
      blacklist,
      whitelist
    )
      .distinct('hierarchy.id', 'hierarchy.uuid', 'hierarchy.type', 'text.name')
      .groupBy('hierarchy.uuid')
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

  async getEpigraphyCollection(epigUuid: string): Promise<Collection> {
    const collection: Collection = await knex('hierarchy')
      .first('hierarchy.parent_uuid AS uuid', 'alias.name')
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.parent_uuid')
      .where('hierarchy.uuid', epigUuid);
    return collection;
  }

  async isPublished(hierarchyUuid: string): Promise<boolean> {
    const row: { published: boolean } = await knex('hierarchy')
      .first('published')
      .where('uuid', hierarchyUuid);
    return row.published;
  }

  async getCollectionOfText(uuid: string): Promise<string> {
    const collection: Collection = await knex('hierarchy')
      .first('parent_uuid AS uuid')
      .where('uuid', uuid);
    return collection.uuid;
  }
}

export default new HierarchyDao();
