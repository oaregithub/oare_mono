import { CollectionListItem } from '@oare/types';
import knex from '@/connection';
import UserGroupDao from '../UserGroupDao';
import AliasDao from '../AliasDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import TextGroupDao from '../TextGroupDao';
import { UserRow } from '../UserDao';

export interface CollectionPermissionsItem extends CollectionListItem {
  canRead: boolean;
  canWrite: boolean;
}

<<<<<<< HEAD
export interface CollectionGroupRow {
  collectionUuid: string;
  groupId: number;
  canRead: boolean;
  canWrite: boolean;
}

=======
>>>>>>> master
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
        canRead: false,
        canWrite: false,
      }),
    );

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const collections = await this.getCollections(groupId);
        collections.forEach((collection) => {
          userCollections.push(collection);
        });
      }
    }

    const whitelistedUuids = userCollections
      .filter((collection) => collection.canRead || collectionsWithWhitelistedTexts.includes(collection.uuid))
      .map((collection) => collection.uuid);
    const blacklistedUuids = userCollections
      .filter((collection) => !collection.canRead && !whitelistedUuids.includes(collection.uuid))
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
        canRead: false,
        canWrite: false,
      }),
    );

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const collections = await this.getCollections(groupId);
        collections.forEach((collection) => {
          userCollections.push(collection);
        });
      }
    }

    const whitelistedUuids = userCollections
      .filter((collection) => collection.canRead)
      .map((collection) => collection.uuid);
    const blacklistedUuids = userCollections
      .filter((collection) => !collection.canRead && !whitelistedUuids.includes(collection.uuid))
      .map((collection) => collection.uuid);

    if (blacklistedUuids.includes(uuid)) {
      return true;
    }
    return false;
  }

  async getCollections(groupId: number): Promise<CollectionPermissionsItem[]> {
    const results: CollectionPermissionsItem[] = await knex('collection_group')
      .select('collection_uuid AS uuid', 'can_read AS canRead', 'can_write AS canWrite')
      .where('group_id', groupId);

    return results.map((collection) => ({
      ...collection,
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
<<<<<<< HEAD

  async containsAssociation(groupId: number, collectionUuid: string): Promise<boolean> {
    const row = await knex('collection_group')
      .first()
      .where('collection_uuid', collectionUuid)
      .andWhere('group_id', groupId);
    return !!row;
  }

  async update(groupId: number, collectionUuid: string, canWrite: boolean, canRead: boolean): Promise<void> {
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

  async removeCollections(groupId: number, uuid: string): Promise<void> {
    await knex('collection_group').where('collection_uuid', uuid).andWhere('group_id', groupId).del();
  }
=======
>>>>>>> master
}

export default new CollectionGroupDao();
