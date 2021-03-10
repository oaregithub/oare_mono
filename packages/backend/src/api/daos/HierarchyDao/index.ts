import {
  CollectionResponse,
  CollectionText,
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import textGroupDao from '../TextGroupDao';
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

  async isPublished(hierarchyUuid: string): Promise<boolean> {
    const row: { published: boolean } = await knex('hierarchy')
      .first('published')
      .where('uuid', hierarchyUuid);
    return row.published;
  }
}

export default new HierarchyDao();
