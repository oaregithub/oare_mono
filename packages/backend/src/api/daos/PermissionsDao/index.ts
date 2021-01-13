import knex from '@/connection';
import { PermissionResponse, DictionaryPermissionRow, PagesPermissionRow } from '@oare/types';
import UserGroupDao from '@/api/daos/UserGroupDao';
import { UserRow } from '../UserDao';

class PermissionsDao {
  async getUserPermissions(user: UserRow | null): Promise<PermissionResponse> {

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

      for (let i = 0; i < groupIds.length; i += 1) {
        const dictionaryPermissions = await this.getDictionaryPermissions(groupIds[i]);
        dictionaryPermissions.forEach((row) => {
          userPermissions.dictionary.push(row.permission);
        });

        const pagesPermissions = await this.getPagesPermissions(groupIds[i]);
        pagesPermissions.forEach((row) => {
          userPermissions.pages.push(row.permission);
        });
      }
    }

    return userPermissions;
  }

  async getDictionaryPermissions(groupId: number): Promise<DictionaryPermissionRow[]> {
    const response: DictionaryPermissionRow[] = await knex('permissions')
      .select('permission')
      .where('group_id', groupId)
      .andWhere('type', 'dictionary');
    return response;
  }

  async getPagesPermissions(groupId: number): Promise<PagesPermissionRow[]> {
    const response: PagesPermissionRow[] = await knex('permissions')
      .select('permission')
      .where('group_id', groupId)
      .andWhere('type', 'pages');
    return response;
  }
}

export default new PermissionsDao();
