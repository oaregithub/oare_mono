import _ from 'lodash';
import { CollectionPermissionsItem, Blacklists } from '@oare/types';
import knex from '@/connection';
import UserGroupDao from '../UserGroupDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import TextGroupDao from '../TextGroupDao';
import UserDao from '../UserDao';
import CollectionDao from '../CollectionDao';

export interface CollectionGroupRow {
  collection_uuid: string;
  group_id: number;
  can_read: boolean;
  can_write: boolean;
}

class CollectionGroupDao {
  async getUserCollectionBlacklist(
    userUuid: string | null
  ): Promise<Blacklists> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;

    if (user && user.isAdmin) {
      return { blacklist: [], whitelist: [] };
    }

    let userCollections: CollectionPermissionsItem[] = (
      await PublicBlacklistDao.getBlacklistedCollections()
    ).map(collection => ({
      ...collection,
      canRead: false,
      canWrite: false,
    }));

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.uuid);
      await Promise.all(
        groupIds.map(async groupId => {
          const collections = await this.getCollections(groupId);
          userCollections = [...userCollections, ...collections];
        })
      );
    }

    const whitelistedCollections = userCollections
      .filter(collection => collection.canRead)
      .map(collection => collection.uuid);

    const blacklistedCollections = userCollections
      .filter(
        collection =>
          !collection.canRead &&
          !whitelistedCollections.includes(collection.uuid)
      )
      .map(collection => collection.uuid);

    return {
      blacklist: blacklistedCollections,
      whitelist: whitelistedCollections,
    };
  }

  async canViewCollection(
    collectionUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;

    const {
      blacklist: collectionBlacklist,
    } = await this.getUserCollectionBlacklist(userUuid);
    const isBlacklisted = collectionBlacklist.includes(collectionUuid);

    if (isBlacklisted) {
      if (user) {
        // Check if collection contains any WHITELISTED texts
        const userTexts = await TextGroupDao.getTextsByUser(user.uuid);
        const userTextCollections = await Promise.all(
          userTexts
            .filter(text => text.canRead)
            .map(text => CollectionDao.getTextCollection(text.uuid))
        );

        return userTextCollections
          .map(collection => (collection ? collection.uuid : ''))
          .includes(collectionUuid);
      }
      return false;
    }

    return true;
  }

  async getCollections(groupId: number): Promise<CollectionPermissionsItem[]> {
    const results: CollectionPermissionsItem[] = await knex('collection_group')
      .select(
        'collection_uuid AS uuid',
        'can_read AS canRead',
        'can_write AS canWrite'
      )
      .where('group_id', groupId);
    const collections = await Promise.all(
      results.map(({ uuid }) => CollectionDao.getCollectionByUuid(uuid))
    );
    const collectionNames = collections.map(collection =>
      collection ? collection.name : ''
    );

    return results.map((collection, index) => ({
      ...collection,
      name: collectionNames[index],
      canWrite: !!collection.canWrite,
      canRead: !!collection.canRead,
    }));
  }

  async userHasWritePermission(
    uuid: string,
    userUuid: string
  ): Promise<boolean> {
    const groupIds = await UserGroupDao.getGroupsOfUser(userUuid);

    const collectionUuid = await knex('hierarchy')
      .select('obj_parent_uuid AS uuid')
      .where('uuid', uuid)
      .andWhere('type', 'text')
      .first();

    const collectionRows = await knex('collection_group')
      .select()
      .where('collection_uuid', collectionUuid.uuid)
      .andWhere('can_write', true)
      .andWhere(function () {
        this.whereIn('group_id', groupIds);
      });
    if (collectionRows.length > 0) {
      return true;
    }
    return false;
  }

  async containsAssociation(
    groupId: number,
    collectionUuid: string
  ): Promise<boolean> {
    const row = await knex('collection_group')
      .first()
      .where('collection_uuid', collectionUuid)
      .andWhere('group_id', groupId);
    return !!row;
  }

  async update(
    groupId: number,
    collectionUuid: string,
    canWrite: boolean,
    canRead: boolean
  ): Promise<void> {
    await knex('collection_group')
      .where('collection_uuid', collectionUuid)
      .andWhere('group_id', groupId)
      .update({
        can_write: canRead ? canWrite : false,
        can_read: canRead,
      });
  }

  async addCollections(collections: CollectionGroupRow[]): Promise<number[]> {
    const ids: number[] = await knex('collection_group').insert(collections);
    return ids;
  }

  async removeCollection(groupId: number, uuid: string): Promise<void> {
    await knex('collection_group')
      .where('collection_uuid', uuid)
      .andWhere('group_id', groupId)
      .del();
  }
}

export default new CollectionGroupDao();
