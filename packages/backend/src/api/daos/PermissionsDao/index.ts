import knex from '@/connection';
import { PermissionItem } from '@oare/types';
import sl from '@/serviceLocator';
import { UserRow } from '../UserDao';

class PermissionsDao {
  readonly ALL_PERMISSIONS: PermissionItem[] = [
    {
      name: 'WORDS',
      type: 'pages',
      description: 'Allow group users to view "Words" tab and access associated pages',
    },
    {
      name: 'NAMES',
      type: 'pages',
      description: 'Allow group users to view "Names" tab and access associated pages',
    },
    {
      name: 'PLACES',
      type: 'pages',
      description: 'Allow group users to view "Places" tab and access associated pages',
    },
    {
      name: 'ADD_TRANSLATION',
      type: 'dictionary',
      description: 'Allow group users to add translations to existing words',
      dependency: 'WORDS',
    },
    {
      name: 'DELETE_TRANSLATION',
      type: 'dictionary',
      description: 'Allow group users to delete existing word translations',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_FORM',
      type: 'dictionary',
      description: 'Allow group users to make changes to form(s) of words',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_TRANSLATION',
      type: 'dictionary',
      description: 'Allow group users to make changes to translations of existing words',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_TRANSLATION_ORDER',
      type: 'dictionary',
      description: 'Allow group users to adjust the order of existing word translations',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_WORD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to change the spelling of existing words',
      dependency: 'WORDS',
    },
    {
      name: 'ADD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to add new spellings to existing words',
      dependency: 'WORDS',
    },
  ];

  getAllPermissions(): PermissionItem[] {
    return this.ALL_PERMISSIONS;
  }

  async getUserPermissions(user: UserRow | null): Promise<PermissionItem[]> {
    const UserGroupDao = sl.get('UserGroupDao');

    if (user && user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    if (user) {
      const groupIds: number[] = [];
      const groups = await UserGroupDao.getGroupsOfUser(user.id);
      groups.forEach((group) => groupIds.push(group));

      const permissions: string[] = (await knex('permissions').select('permission').whereIn('group_id', groupIds)).map(
        (row) => row.permission,
      );
      return this.ALL_PERMISSIONS.filter((permission) => permissions.includes(permission.name));
    }

    return [];
  }

  async getGroupPermissions(groupId: number): Promise<PermissionItem[]> {
    const permissions: string[] = (await knex('permissions').select('permission').where('group_id', groupId)).map(
      (row) => row.permission,
    );

    return this.ALL_PERMISSIONS.filter((permission) => permissions.includes(permission.name));
  }

  async addPermission(groupId: number, { type, name }: PermissionItem) {
    await knex('permissions').insert({
      group_id: groupId,
      type,
      permission: name,
    });
  }

  async removePermission(groupId: number, permission: PermissionItem['name']) {
    await knex('permissions').where('group_id', groupId).andWhere('permission', permission).del();
  }
}

export default new PermissionsDao();
