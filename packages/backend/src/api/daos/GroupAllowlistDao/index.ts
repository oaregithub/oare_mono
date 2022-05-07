import { knexRead, knexWrite } from '@/connection';
import sl from '@/serviceLocator';

class GroupAllowlistDao {
  async getGroupAllowlist(
    groupId: number,
    type: 'text' | 'collection'
  ): Promise<string[]> {
    const uuids = await knexRead()('group_allowlist')
      .pluck('uuid')
      .where('group_id', groupId)
      .andWhere('type', type);

    return uuids;
  }

  async addItemsToAllowlist(
    groupId: number,
    uuids: string[],
    type: 'text' | 'collection'
  ): Promise<void> {
    const rows = uuids.map(uuid => ({
      uuid,
      type,
      group_id: groupId,
    }));
    await knexWrite()('group_allowlist').insert(rows);
  }

  async removeItemFromAllowlist(groupId: number, uuid: string): Promise<void> {
    await knexWrite()('group_allowlist')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async textIsInAllowlist(
    textUuid: string,
    userUuid: string | null
  ): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const UserGroupDao = sl.get('UserGroupDao');

    const collectionUuid = await CollectionDao.getTextCollectionUuid(textUuid);
    const groups = await UserGroupDao.getGroupsOfUser(userUuid);

    const textAllowlist = (
      await Promise.all(
        groups.map(groupId => this.getGroupAllowlist(groupId, 'text'))
      )
    ).flat();

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId => this.getGroupAllowlist(groupId, 'collection'))
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
    userUuid: string | null
  ): Promise<boolean> {
    const UserGroupDao = sl.get('UserGroupDao');

    const groups = await UserGroupDao.getGroupsOfUser(userUuid);

    const collectionAllowlist = (
      await Promise.all(
        groups.map(groupId => this.getGroupAllowlist(groupId, 'collection'))
      )
    ).flat();

    if (collectionAllowlist.includes(collectionUuid)) {
      return true;
    }
    return false;
  }

  async containsAssociation(uuid: string, groupId: number): Promise<boolean> {
    const containsAssociation = await knexRead()('group_allowlist')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupAllowlistDao();
