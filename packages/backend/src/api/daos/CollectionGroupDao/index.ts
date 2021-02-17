import _ from 'lodash';
import { CollectionPermissionsItem } from '@oare/types';
import knex from '@/connection';
import UserGroupDao from '../UserGroupDao';
import AliasDao from '../AliasDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import TextGroupDao from '../TextGroupDao';
import HierarchyDao from '../HierarchyDao';
import { UserRow } from '../UserDao';

export interface CollectionGroupRow {
  collection_uuid: string;
  group_id: number;
  can_read: boolean;
  can_write: boolean;
}

class CollectionGroupDao {
  async getUserCollectionBlacklist(user: UserRow | null): Promise<string[]> {
    if (user && user.isAdmin) {
      return [];
    }

    const { whitelist } = await TextGroupDao.getUserBlacklist(user);
    const collectionsWithWhitelistedTexts: string[] = (
      await knex('hierarchy')
        .select('parent_uuid AS uuid')
        .where('type', 'text')
        .andWhere(function () {
          this.whereIn('uuid', whitelist);
        })
    ).map(collection => collection.uuid);

    const userCollections: CollectionPermissionsItem[] = (
      await PublicBlacklistDao.getBlacklistedCollections()
    ).map(collection => ({
      ...collection,
      canRead: false,
      canWrite: false,
    }));

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const collections = await this.getCollections(groupId);
        collections.forEach(collection => {
          userCollections.push(collection);
        });
      }
    }

    const whitelistedUuids = userCollections
      .filter(
        collection =>
          collection.canRead ||
          collectionsWithWhitelistedTexts.includes(collection.uuid)
      )
      .map(collection => collection.uuid);
    const blacklistedUuids = userCollections
      .filter(
        collection =>
          !collection.canRead && !whitelistedUuids.includes(collection.uuid)
      )
      .map(collection => collection.uuid);

    return blacklistedUuids;
  }

  async collectionIsBlacklisted(
    uuid: string,
    user: UserRow | null
  ): Promise<boolean> {
    if (user && user.isAdmin) {
      return false;
    }

    let userCollections: CollectionPermissionsItem[] = (
      await PublicBlacklistDao.getBlacklistedCollections()
    ).map(collection => ({
      ...collection,
      canRead: false,
      canWrite: false,
    }));

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.id);
      const groupCollections = await Promise.all(
        groupIds.map(id => this.getCollections(id))
      );
      userCollections = [...userCollections, ..._.flatten(groupCollections)];
    }

    const whitelistedUuids = userCollections
      .filter(collection => collection.canRead)
      .map(collection => collection.uuid);
    const blacklistedUuids = userCollections
      .filter(
        collection =>
          !collection.canRead && !whitelistedUuids.includes(collection.uuid)
      )
      .map(collection => collection.uuid);

    if (blacklistedUuids.includes(uuid)) {
      return true;
    }
    return false;
  }

  async canViewCollection(
    collectionUuid: string,
    user: UserRow | null
  ): Promise<boolean> {
    const isBlacklisted = await this.collectionIsBlacklisted(
      collectionUuid,
      user
    );

    if (isBlacklisted) {
      if (user) {
        // Check if collection contains any WHITELISTED texts
        const userTexts = await TextGroupDao.getTextsByUser(user.id);
        const userTextCollections = await Promise.all(
          userTexts
            .filter(text => text.canRead)
            .map(text => HierarchyDao.getEpigraphyCollection(text.uuid))
        );

        return userTextCollections
          .map(collection => collection.uuid)
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
    const collectionNames = await Promise.all(
      results.map(collection => AliasDao.textAliasNames(collection.uuid))
    );

    return results.map((collection, index) => ({
      ...collection,
      name: collectionNames[index],
      canWrite: !!collection.canWrite,
      canRead: !!collection.canRead,
    }));
  }

  async userHasWritePermission(uuid: string, userId: number): Promise<boolean> {
    const groupIds = await UserGroupDao.getGroupsOfUser(userId);

    const collectionUuid = await knex('hierarchy')
      .select('parent_uuid AS uuid')
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
