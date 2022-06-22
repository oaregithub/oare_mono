import {
  CollectionResponse,
  SearchNamesResponse,
  SearchNamesResultRow,
  SearchNamesPayload,
  TaxonomyTree,
  HierarchyRow,
  SearchImagesResultRow,
  SearchImagesResponse,
} from '@oare/types';
import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';
import { Knex } from 'knex';
import { getTreeNodeQuery } from './utils';

class HierarchyDao {
  async getBySearchTerm(
    { page, limit, filter, type, groupId, showExcluded }: SearchNamesPayload,
    trx?: Knex.Transaction
  ): Promise<SearchNamesResponse> {
    const k = trx || knexRead();
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

  async getCollectionTexts(
    userUuid: string | null,
    collectionUuid: string,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<CollectionResponse> {
    const k = trx || knexRead();
    const TextEpigraphyDao = sl.get('TextEpigraphyDao');
    const CollectionTextUtils = sl.get('CollectionTextUtils');

    const textsToHide = await CollectionTextUtils.textsToHide(userUuid, trx);

    const collectionTextQuery = () => {
      const finalSearch: string = `%${search
        .replace(/\W/g, '%')
        .toLowerCase()}%`;

      const query = k('hierarchy')
        .leftJoin('text', 'text.uuid', 'hierarchy.object_uuid')
        .where('hierarchy.obj_parent_uuid', collectionUuid)
        .whereNotIn('hierarchy.object_uuid', textsToHide)
        .andWhere(function () {
          this.whereRaw('LOWER(text.display_name) LIKE ?', [finalSearch])
            .orWhereRaw(
              "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) LIKE ?",
              [finalSearch]
            )
            .orWhereRaw(
              "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) LIKE ?",
              [finalSearch]
            )
            .orWhereRaw(
              "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) LIKE ?",
              [finalSearch]
            );
        });
      return query;
    };

    const countRow = await collectionTextQuery()
      .count({
        count: k.raw('distinct hierarchy.id'),
      })
      .first();

    let totalTexts = 0;
    if (countRow && countRow.count) {
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
      texts.map(text => TextEpigraphyDao.hasEpigraphy(text.uuid, trx))
    );

    return {
      totalTexts,
      texts: texts.map((text, idx) => ({
        ...text,
        hasEpigraphy: hasEpigraphies[idx],
      })),
    };
  }

  async getImages(
    { page, limit, filter }: SearchNamesPayload,
    trx?: Knex.Transaction
  ): Promise<SearchImagesResponse> {
    const k = trx || knexRead();
    const s3 = new AWS.S3();

    const totalNum = await k('link')
      .innerJoin('resource', 'link.obj_uuid', 'resource.uuid')
      .innerJoin('text', 'text.uuid', 'link.reference_uuid')
      .where('resource.container', 'oare-image-bucket')
      .andWhere('text.display_name', 'like', `%${filter}%`)
      .whereNotIn(
        'resource.uuid',
        k('public_denylist').select('uuid').where('type', 'img')
      )
      .count({
        count: 'text.display_name',
      })
      .first();

    const totalCount = totalNum ? Number(totalNum.count) : 0;

    const imgUUIDs: string[] = await k('link')
      .innerJoin('resource', 'link.obj_uuid', 'resource.uuid')
      .innerJoin('text', 'text.uuid', 'link.reference_uuid')
      .pluck('resource.uuid')
      .where('resource.container', 'oare-image-bucket')
      .andWhere('text.display_name', 'like', `%${filter}%`)
      .whereNotIn(
        'resource.uuid',
        k('public_denylist').select('uuid').where('type', 'img')
      )
      .limit(limit)
      .offset((page - 1) * limit);

    const words = await Promise.all(
      imgUUIDs.map(uuid =>
        k('text')
          .select('display_name')
          .whereIn(
            'uuid',
            k('link').select('reference_uuid').where('obj_uuid', uuid)
          )
          .first()
      )
    );

    const resourceLinks: string[] = await k('link')
      .innerJoin('resource', 'link.obj_uuid', 'resource.uuid')
      .innerJoin('text', 'text.uuid', 'link.reference_uuid')
      .pluck('resource.link')
      .where('resource.container', 'oare-image-bucket')
      .andWhere('text.display_name', 'like', `%${filter}%`)
      .whereNotIn(
        'resource.uuid',
        k('public_denylist').select('uuid').where('type', 'img')
      )
      .limit(limit)
      .offset((page - 1) * limit);

    const signedUrls = await Promise.all(
      resourceLinks.map(key => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: key,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    const result: SearchImagesResultRow[] = signedUrls.map((element, idx) => {
      const imageInfo = {
        uuid: imgUUIDs[idx],
        name: words[idx].display_name,
        imgUrl: element,
      };
      return imageInfo;
    });

    return {
      items: result,
      count: totalCount,
    };
  }

  async isPublished(
    hierarchyUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const row: { published: boolean } = await k('hierarchy')
      .first('published')
      .where('object_uuid', hierarchyUuid);
    return row.published;
  }

  async hasChild(hierarchyUuid: string, trx?: Knex.Transaction) {
    const k = trx || knexRead();
    const rows = await k('hierarchy').where('parent_uuid', hierarchyUuid);
    if (rows && rows.length > 0) {
      return true;
    }
    return false;
  }

  async getChildren(
    hierarchyUuid: string,
    level: number | null,
    trx?: Knex.Transaction
  ): Promise<TaxonomyTree[] | null> {
    const AliasDao = sl.get('AliasDao');
    const hasChild = await this.hasChild(hierarchyUuid, trx);

    if (hasChild) {
      const rows: TaxonomyTree[] = await getTreeNodeQuery(trx).where(
        'parent_uuid',
        hierarchyUuid
      );
      if (rows.every(row => row.variableUuid) && level !== null) {
        level += 1;
      }
      const results = await Promise.all(
        rows.map(async row => {
          const names = await AliasDao.getAliasNames(row.objectUuid, trx);

          return {
            ...row,
            aliasName: names[0] || null,
            level,
            children: await this.getChildren(row.uuid, level || 0, trx),
          };
        })
      );
      return results;
    }
    return null;
  }

  async createTaxonomyTree(trx?: Knex.Transaction): Promise<TaxonomyTree> {
    const AliasDao = sl.get('AliasDao');

    const topNode: TaxonomyTree = await getTreeNodeQuery(trx)
      .where('hierarchy.type', 'taxonomy')
      .andWhere('hierarchy.role', 'tree')
      .first();

    const names = await AliasDao.getAliasNames(topNode.objectUuid, trx);

    const tree = {
      ...topNode,
      aliasName: names[0] || null,
      children: await this.getChildren(topNode.uuid, null, trx),
    };
    return tree;
  }

  async getTextsInCollection(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const rows = await k('hierarchy')
      .pluck('object_uuid')
      .where('obj_parent_uuid', collectionUuid);

    return rows;
  }

  async getParentUuidByCollection(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knexRead();
    const results = await k('hierarchy')
      .select('parent_uuid AS parentUuid')
      .where('obj_parent_uuid', collectionUuid)
      .first();
    return results.parentUuid;
  }

  async insertHierarchyRow(row: HierarchyRow, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('hierarchy').insert({
      uuid: row.uuid,
      parent_uuid: row.parentUuid,
      type: row.type,
      role: row.role,
      object_uuid: row.objectUuid,
      obj_parent_uuid: row.objectParentUuid,
      published: row.published,
    });
  }

  async removeHierarchyTextRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('hierarchy').del().where({ object_uuid: textUuid, type: 'text' });
  }
}

export default new HierarchyDao();
