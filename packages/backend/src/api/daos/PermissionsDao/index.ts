import knex from '@/connection';
import { PermissionResponse, DictionaryPermissionRow, PagesPermissionRow } from '@oare/types';
import sl from '@/serviceLocator';
import { UserRow } from '../UserDao';

class PermissionsDao {
  readonly ALL_PERMISSIONS: PermissionResponse = {
    dictionary: [
      'ADD_TRANSLATION',
      'DELETE_TRANSLATION',
      'UPDATE_FORM',
      'UPDATE_TRANSLATION',
      'UPDATE_TRANSLATION_ORDER',
      'UPDATE_WORD_SPELLING',
      'ADD_SPELLING',
    ],
    pages: ['WORDS', 'NAMES', 'PLACES'],
  };

  async getUserPermissions(user: UserRow | null): Promise<PermissionResponse> {
    const UserGroupDao = sl.get('UserGroupDao');
    if (user && user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    const userPermissions: PermissionResponse = {
      dictionary: [],
      pages: [],
    };

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.id);

      const dictionaryPermissions = await Promise.all(
        groupIds.map((groupId) => this.getDictionaryPermissions(groupId)),
      );
      dictionaryPermissions.forEach((groupId) => {
        groupId.map((row) => userPermissions.dictionary.push(row.permission));
      });

      const pagesPermissions = await Promise.all(groupIds.map((groupId) => this.getPagesPermissions(groupId)));
      pagesPermissions.forEach((groupId) => {
        groupId.map((row) => userPermissions.pages.push(row.permission));
      });
    }

    return userPermissions;
  }

  async getGroupPermissions(groupId: number): Promise<PermissionResponse> {
    const groupPermissions: PermissionResponse = {
      dictionary: [],
      pages: [],
    };

    const dictionaryPermissions = await this.getDictionaryPermissions(groupId);
    dictionaryPermissions.forEach((row) => groupPermissions.dictionary.push(row.permission));

    const pagesPermissions = await this.getPagesPermissions(groupId);
    pagesPermissions.forEach((row) => groupPermissions.pages.push(row.permission));

    return groupPermissions;
  }

  async getPermissionsByType<K>(groupId: number, type: string): Promise<K[]> {
    const response: K[] = await knex('permissions')
      .select('permission')
      .where('group_id', groupId)
      .andWhere('type', type);
    return response;
  }

  async getDictionaryPermissions(groupId: number) {
    return this.getPermissionsByType<DictionaryPermissionRow>(groupId, 'dictionary');
  }

  async getPagesPermissions(groupId: number) {
    return this.getPermissionsByType<PagesPermissionRow>(groupId, 'pages');
  }

  async addPermission(groupId: number, type: string, permission: string) {
    await knex('permissions').insert({
      group_id: groupId,
      type,
      permission,
    });
  }

  async removePermission(groupId: number, permission: string) {
    await knex('permissions').where('group_id', groupId).andWhere('permission', permission).del();
  }
}

export default new PermissionsDao();
