import knex from '@/connection';
import { PermissionItem, PermissionName } from '@oare/types';
import UserDao from '../UserDao';
import UserGroupDao from '../UserGroupDao';

class PermissionsDao {
  readonly ALL_PERMISSIONS: PermissionItem[] = [
    {
      name: 'WORDS',
      type: 'pages',
      description:
        'Allow group users to view "Words" tab and access associated pages',
    },
    {
      name: 'NAMES',
      type: 'pages',
      description:
        'Allow group users to view "Names" tab and access associated pages',
    },
    {
      name: 'PLACES',
      type: 'pages',
      description:
        'Allow group users to view "Places" tab and access associated pages',
    },
    {
      name: 'PEOPLE',
      type: 'pages',
      description:
        'Allow group users to view "People" tab and access associated pages',
    },
    {
      name: 'UPDATE_FORM',
      type: 'dictionary',
      description: 'Allow group users to make changes to form(s) of words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'UPDATE_TRANSLATION',
      type: 'dictionary',
      description:
        'Allow group users to make changes to translations of existing words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'UPDATE_WORD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to change the spelling of existing words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'ADD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to add new spellings to existing words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'VIEW_EPIGRAPHY_IMAGES',
      type: 'text',
      description:
        'Allow group users to view images associated with text epigraphies',
    },
    {
      name: 'VIEW_TEXT_DISCOURSE',
      type: 'text',
      description:
        'Allow group users to view text discourses associated with text epigraphies',
    },
    {
      name: 'INSERT_DISCOURSE_ROWS',
      type: 'dictionary',
      description:
        'Allow group users to insert new text discourse rows where missing',
      dependencies: ['UPDATE_FORM'],
    },
    {
      name: 'ADD_FORM',
      type: 'dictionary',
      description: 'Allow group users to add new forms to words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
  ];

  getAllPermissions(): PermissionItem[] {
    return this.ALL_PERMISSIONS;
  }

  async getUserPermissions(userUuid: string | null): Promise<PermissionItem[]> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid) : null;

    if (user && user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.uuid);

      const userPermissions: PermissionName[] = (
        await knex('permissions')
          .select('permission')
          .whereIn('group_id', groupIds)
      ).map(row => row.permission);
      return this.ALL_PERMISSIONS.filter(permission =>
        userPermissions.includes(permission.name)
      );
    }

    return [];
  }

  async getGroupPermissions(groupId: number): Promise<PermissionItem[]> {
    const permissions: string[] = (
      await knex('permissions').select('permission').where('group_id', groupId)
    ).map(row => row.permission);

    return this.ALL_PERMISSIONS.filter(permission =>
      permissions.includes(permission.name)
    );
  }

  async addGroupPermission(groupId: number, { type, name }: PermissionItem) {
    await knex('permissions').insert({
      group_id: groupId,
      type,
      permission: name,
    });
  }

  async removePermission(groupId: number, permission: PermissionName) {
    await knex('permissions')
      .where('group_id', groupId)
      .andWhere('permission', permission)
      .del();
  }
}

export default new PermissionsDao();
