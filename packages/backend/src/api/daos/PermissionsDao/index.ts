import knex from '@/connection';
import { PermissionResponse, AllPermissions, PermissionItem } from '@oare/types';
import sl from '@/serviceLocator';
import { UserRow } from '../UserDao';

class PermissionsDao {
  readonly ALL_PERMISSIONS: AllPermissions = {
    dictionary: [
      {
        name: 'ADD_TRANSLATION',
        description: 'Allow group users to add translations to existing words',
      },
      {
        name: 'DELETE_TRANSLATION',
        description: 'Allow group users to delete existing word translations',
      },
      {
        name: 'UPDATE_FORM',
        description: 'Allow group users to make changes to form(s) of words',
      },
      {
        name: 'UPDATE_TRANSLATION',
        description: 'Allow group users to make changes to translations of existing words',
      },
      {
        name: 'UPDATE_TRANSLATION_ORDER',
        description: 'Allow group users to adjust the order of existing word translations',
      },
      {
        name: 'UPDATE_WORD_SPELLING',
        description: 'Allow group users to change the spelling of existing words',
      },
      {
        name: 'ADD_SPELLING',
        description: 'Allow group users to add new spellings to existing words',
      },
    ],
    pages: [
      {
        name: 'WORDS',
        description: 'Allow group users to view "Words" tab and access associated pages',
      },
      {
        name: 'NAMES',
        description: 'Allow group users to view "Names" tab and access associated pages',
      },
      {
        name: 'PLACES',
        description: 'Allow group users to view "Places" tab and access associated pages',
      },
    ],
  };

  async getAllPermissions(): Promise<AllPermissions> {
    return this.ALL_PERMISSIONS;
  }

  async getUserPermissions(user: UserRow | null): Promise<Partial<PermissionResponse>> {
    const UserGroupDao = sl.get('UserGroupDao');

    let userPermissions = {};
    if (user && user.isAdmin) {
      const types = Object.keys(this.ALL_PERMISSIONS);
      const permissions = Object.values(this.ALL_PERMISSIONS);
      types.forEach((type, index) => {
        userPermissions = {
          ...userPermissions,
          [type]: permissions[index].map((item: PermissionItem<any>) => item.name),
        };
      });
      return userPermissions;
    }

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
