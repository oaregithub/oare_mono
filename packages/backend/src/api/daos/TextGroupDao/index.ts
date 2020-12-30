import { Text, Blacklists, CollectionListItem } from '@oare/types';
import knex from '@/connection';
import userGroupDao from '../UserGroupDao';
import textDao from '../TextDao';
import AliasDao from '../AliasDao';
import PublicBlacklistDao from '../PublicBlacklistDao';
import { UserRow } from '../UserDao';

export interface TextGroupRow {
  text_uuid: string;
  group_id: number;
  can_write: boolean;
  can_read: boolean;
}

class TextGroupDao {
  async getUserBlacklist(user: UserRow | null): Promise<Blacklists> {
    if (user && user.isAdmin) {
      return { blacklist: [], whitelist: [] };
    }

    const userTexts = await PublicBlacklistDao.getBlacklistedTexts();

    if (user) {
      const groupIds = await userGroupDao.getGroupsOfUser(user.id);
      for (let i = 0; i < groupIds.length; i += 1) {
        const groupId = groupIds[i];
        const texts = await this.getTexts(groupId);
        texts.forEach((text) => {
          userTexts.push(text);
        });
      }
    }

    const whitelistedUuids = userTexts.filter((text) => text.canRead).map((text) => text.uuid);
    const blacklistedUuids = userTexts
      .filter((text) => !text.canRead && !whitelistedUuids.includes(text.uuid))
      .map((text) => text.uuid);

    if (!user || !user?.isAdmin) {
      const unpublishedTextUuids = await textDao.getUnpublishedTextUuids();
      unpublishedTextUuids.forEach((uuid) => {
        blacklistedUuids.push(uuid);
      });
    }

    return {
      blacklist: blacklistedUuids,
      whitelist: whitelistedUuids,
    };
  }

  async getTexts(groupId: number): Promise<Text[]> {
    const results: Text[] = await knex('text_group')
      .select(
        'text_group.text_uuid AS uuid',
        'text_group.can_read AS canRead',
        'text_group.can_write AS canWrite',
        'alias.name',
      )
      .innerJoin('hierarchy', 'hierarchy.uuid', 'text_group.text_uuid')
      .innerJoin('alias', 'text_group.text_uuid', 'alias.reference_uuid')
      .where('group_id', groupId)
      .groupBy('text_group.text_uuid');

    return results.map((item) => ({
      ...item,
      canWrite: !!item.canWrite,
      canRead: !!item.canRead,
    }));
  }

  async userHasWritePermission(uuid: string, userId: number): Promise<boolean> {
    const groupIds = await userGroupDao.getGroupsOfUser(userId);

    // Select all rows for given uuid
    const textRows = await knex('text_group')
      .select()
      .where('text_uuid', uuid)
      .andWhere('can_write', true)
      .andWhere(function () {
        this.whereIn('group_id', groupIds);
      });
    if (textRows.length > 0) {
      return true;
    }
    return false;
  }

  async containsAssociation(groupId: number, textUuid: string): Promise<boolean> {
    const row = await knex('text_group').first().where('text_uuid', textUuid).andWhere('group_id', groupId);
    return !!row;
  }

  async update(groupId: number, textUuid: string, canWrite: boolean, canRead: boolean): Promise<void> {
    await knex('text_group')
      .where('text_uuid', textUuid)
      .andWhere('group_id', groupId)
      .update({
        can_write: canRead ? canWrite : false,
        can_read: canRead,
      });
  }

  async addTexts(texts: TextGroupRow[]): Promise<number[]> {
    const ids: number[] = await knex('text_group').insert(texts);
    return ids;
  }

  async removeText(groupId: number, uuid: string): Promise<void> {
    await knex('text_group').where('text_uuid', uuid).andWhere('group_id', groupId).del();
  }
}

export default new TextGroupDao();
