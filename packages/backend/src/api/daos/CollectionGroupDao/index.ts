import { CollectionListItem } from '@oare/types';
import knex from '@/connection';
import userGroupDao from '../UserGroupDao';
import AliasDao from '../AliasDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import TextGroupDao from '../TextGroupDao';
import { UserRow } from '../UserDao';

export interface CollectionPermissionsItem extends CollectionListItem {
  can_read: boolean;
  can_write: boolean;
}

class CollectionGroupDao {
  async getUserCollectionBlacklist(user: UserRow | null): Promise<CollectionListItem[]> {
    const { whitelist } = await TextGroupDao.getUserBlacklist(user);
    const collectionsWithWhitelistedTexts: string[] = (
      await knex('hierarchy')
        .select('parent_uuid AS uuid')
        .where('type', 'text')
        .andWhere(function () {
          this.whereIn('uuid', whitelist);
        })
    ).map((collection) => collection.uuid);

    const userCollections: CollectionPermissionsItem[] = (await PublicBlacklistDao.getBlacklistedCollections()).map(
      (collection) => ({
        ...collection,
        can_read: false,
        can_write: false,
      }),
    );

    if (user) {
      const groupIds = await userGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const collections = await this.getCollections(groupId);
        collections.forEach((collection) => {
          userCollections.push(collection);
        });
      }
    }

    const whitelistedUuids = userCollections
      .filter((collection) => collection.can_read || collectionsWithWhitelistedTexts.includes(collection.uuid))
      .map((collection) => collection.uuid);
    const blacklistedUuids = userCollections
      .filter((collection) => !collection.can_read && !whitelistedUuids.includes(collection.uuid))
      .map((collection) => collection.uuid);

    const collectionNames = await Promise.all(blacklistedUuids.map((uuid) => AliasDao.textAliasNames(uuid)));

    return blacklistedUuids.map((uuid, index) => ({
      uuid,
      name: collectionNames[index],
    }));
  }

  async collectionIsBlacklisted(uuid: string, user: UserRow | null): Promise<boolean> {
    const userCollections: CollectionPermissionsItem[] = (await PublicBlacklistDao.getBlacklistedCollections()).map(
      (collection) => ({
        ...collection,
        can_read: false,
        can_write: false,
      }),
    );

    if (user) {
      const groupIds = await userGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const collections = await this.getCollections(groupId);
        collections.forEach((collection) => {
          userCollections.push(collection);
        });
      }
    }

    const whitelistedUuids = userCollections
      .filter((collection) => collection.can_read)
      .map((collection) => collection.uuid);
    const blacklistedUuids = userCollections
      .filter((collection) => !collection.can_read && !whitelistedUuids.includes(collection.uuid))
      .map((collection) => collection.uuid);

    if (blacklistedUuids.includes(uuid)) {
      return true;
    }
    return false;
  }

  async getCollections(groupId: number): Promise<CollectionPermissionsItem[]> {
    const results: CollectionPermissionsItem[] = await knex('collection_group')
      .select('collection_group.collection_uuid AS uuid', 'collection_group.can_read', 'collection_group.can_write')
      .where('group_id', groupId);

    return results.map((item) => ({
      ...item,
      can_write: !!item.can_write,
      can_read: !!item.can_read,
    }));
  }

  async userHasWritePermission(uuid: string, userId: number): Promise<boolean> {
    const groupIds = await userGroupDao.getGroupsOfUser(userId);

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
}

export default new CollectionGroupDao();
