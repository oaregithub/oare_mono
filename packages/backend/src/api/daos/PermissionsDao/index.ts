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

  async getAllPermissions(): Promise<PermissionResponse> {
    return this.ALL_PERMISSIONS;
  }

  async getUserPermissions(user: UserRow | null): Promise<Partial<PermissionResponse>> {
    const UserGroupDao = sl.get('UserGroupDao');
    if (user && user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    let userPermissions = {};

    const types = Object.keys(await this.getAllPermissions());
    const groupIds: number[] = [];

    if (user) {
      const groups = await UserGroupDao.getGroupsOfUser(user.id);
      groups.forEach((group) => groupIds.push(group));
    }
    const permissions = (
      await Promise.all(
        types.map((type) =>
          knex('permissions').select('permission').whereIn('group_id', groupIds).andWhere('type', type),
        ),
      )
    ).map((item) => item.map((permissionObject) => permissionObject.permission));

    types.forEach((type, index) => {
      userPermissions = {
        ...userPermissions,
        [type]: permissions[index],
      };
    });

    return userPermissions;
  }

  async getGroupPermissions(groupId: number): Promise<Partial<PermissionResponse>> {
    let groupPermissions = {};

    const types = Object.keys(await this.getAllPermissions());
    const permissions = (
      await Promise.all(
        types.map((type) => knex('permissions').select('permission').where('group_id', groupId).andWhere('type', type)),
      )
    ).map((item) => item.map((permissionObject) => permissionObject.permission));

    types.forEach((type, index) => {
      groupPermissions = {
        ...groupPermissions,
        [type]: permissions[index],
      };
    });

    return groupPermissions;
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
