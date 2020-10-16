import knex from '../../../connection';
import userGroupDao from '../UserGroupDao';
import textDao from '../TextDao';
import { UserRow } from '../UserDao';

export interface TextQueryRow {
  text_uuid: string;
  can_read: boolean;
  can_write: boolean;
  name: string;
}

export interface TextGroupRow {
  text_uuid: string;
  group_id: number;
  can_write: boolean;
  can_read: boolean;
}

class TextGroupDao {
  async getUserBlacklist(user: UserRow | null) {
    const userTexts = await this.getPublicTexts();

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

    const whitelistedUuids = userTexts.filter((text) => text.can_read).map((text) => text.text_uuid);
    const blacklistedUuids = userTexts
      .filter((text) => !text.can_read && !whitelistedUuids.includes(text.text_uuid))
      .map((text) => text.text_uuid);

    if (!user || !user?.isAdmin) {
      const unpublishedTextUuids = await textDao.getUnpublishedTextUuids();
      unpublishedTextUuids.forEach((uuid) => {
        blacklistedUuids.push(uuid);
      });
    }

    return blacklistedUuids;
  }

  async getPublicTexts(): Promise<TextQueryRow[]> {
    const results: TextQueryRow[] = await knex('text_group')
      .select('text_group.text_uuid', 'text_group.can_read', 'text_group.can_write', 'alias.name')
      .innerJoin('hierarchy', 'hierarchy.uuid', 'text_group.text_uuid')
      .innerJoin('oare_group', 'oare_group.id', 'text_group.group_id')
      .innerJoin('alias', 'text_group.text_uuid', 'alias.reference_uuid')
      .where('oare_group.name', 'Public')
      .groupBy('text_group.text_uuid');

    return results.map((item) => ({
      ...item,
      can_write: !!item.can_write,
      can_read: !!item.can_read,
    }));
  }

  async getTexts(groupId: number): Promise<TextQueryRow[]> {
    const results: TextQueryRow[] = await knex('text_group')
      .select('text_group.text_uuid', 'text_group.can_read', 'text_group.can_write', 'alias.name')
      .innerJoin('hierarchy', 'hierarchy.uuid', 'text_group.text_uuid')
      .innerJoin('alias', 'text_group.text_uuid', 'alias.reference_uuid')
      .where('group_id', groupId)
      .groupBy('text_group.text_uuid');

    return results.map((item) => ({
      ...item,
      can_write: !!item.can_write,
      can_read: !!item.can_read,
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

  async containsAssociation(groupId: number, textUuid: string) {
    const row = await knex('text_group').first().where('text_uuid', textUuid).andWhere('group_id', groupId);
    return !!row;
  }

  async update(groupId: number, textUuid: string, canWrite: boolean, canRead: boolean) {
    await knex('text_group')
      .where('text_uuid', textUuid)
      .andWhere('group_id', groupId)
      .update({
        can_write: canRead ? canWrite : false,
        can_read: canRead,
      });
  }

  async addTexts(texts: TextGroupRow[]) {
    const ids: number[] = await knex('text_group').insert(texts);
    return ids;
  }

  async removeTexts(groupId: number, texts: string[]) {
    await knex('text_group').whereIn('text_uuid', texts).andWhere('group_id', groupId).del();
  }
}

export default new TextGroupDao();
