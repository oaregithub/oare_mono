import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

class GroupAllowlistDao {
  async getGroupAllowlist(
    groupId: number,
    type: 'text' | 'collection',
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const uuids = await k('group_allowlist')
      .pluck('uuid')
      .where('group_id', groupId)
      .andWhere('type', type);

    return uuids;
  }

  async addItemsToAllowlist(
    groupId: number,
    uuids: string[],
    type: 'text' | 'collection',
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    const rows = uuids.map(uuid => ({
      uuid,
      type,
      group_id: groupId,
    }));
    await k('group_allowlist').insert(rows);
  }

  async removeItemFromAllowlist(
    groupId: number,
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('group_allowlist')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async removeItemFromAllAllowlists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('group_allowlist').where({ uuid }).del();
  }

  async textIsInAllowlist(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const collectionUuid = await CollectionDao.getTextCollectionUuid(
      textUuid,
      trx
    );
    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);

    const textAllowlist = (
      await Promise.all(
        groups.map(groupId => this.getGroupAllowlist(groupId, 'text', trx))
      )
    ).flat();

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          this.getGroupAllowlist(groupId, 'collection', trx)
        )
      )
    ).flat();

    if (textAllowlist.includes(textUuid)) {
      return true;
    }
    if (collectionUuid && collectionAllowlist.includes(collectionUuid)) {
      return true;
    }
    return false;
  }

  async collectionIsInAllowlist(
    collectionUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const UserGroupDao = sl.get('UserGroupDao');

    const groups = await UserGroupDao.getGroupsOfUser(userUuid, trx);

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId =>
          this.getGroupAllowlist(groupId, 'collection', trx)
        )
      )
    ).flat();

    if (collectionAllowlist.includes(collectionUuid)) {
      return true;
    }
    return false;
  }

  async containsAssociation(
    uuid: string,
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knexRead();
    const containsAssociation = await k('group_allowlist')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupAllowlistDao();
