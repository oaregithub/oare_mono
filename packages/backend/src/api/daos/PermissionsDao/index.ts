import knex from '@/connection';
import { PermissionResponse, DictionaryPermissionRow, PagesPermissionRow } from '@oare/types';
import sl from '@/serviceLocator';
import { UserRow } from '../UserDao';

class PermissionsDao {
  async getUserPermissions(user: UserRow | null): Promise<PermissionResponse> {
    const UserGroupDao = sl.get('UserGroupDao');
    if (user && user.isAdmin) {
      return {
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
}

export default new PermissionsDao();
