import { knexRead, knexWrite } from '@/connection';
import { PermissionItem, PermissionName } from '@oare/types';
import { Knex } from 'knex';
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
      name: 'BIBLIOGRAPHY',
      type: 'pages',
      description:
        'Allow group users to view "Bibliography" page and associated data',
    },
    {
      name: 'SEALS',
      type: 'pages',
      description: 'Allow group users to view "Seals" page and associated data',
    },
    {
      name: 'EDIT_SEAL',
      type: 'seals',
      description: 'Allow group users to edit seal data',
      dependencies: ['SEALS'],
    },
    {
      name: 'ADD_SEAL_LINK',
      type: 'seals',
      description:
        'Allow group users to connect a seal impression in a text to a seal',
      dependencies: ['SEALS'],
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
      name: 'INSERT_PARENT_DISCOURSE_ROWS',
      type: 'text',
      description:
        'Allow group users to articulate discourse hierarchy and insert new parent rows.',
      dependencies: ['VIEW_TEXT_DISCOURSE'],
    },
    {
      name: 'EDIT_TRANSLATION',
      type: 'text',
      description: "Allow group users to edit a text's discourse translations",
    },
    {
      name: 'INSERT_DISCOURSE_ROWS',
      type: 'text',
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
    {
      name: 'ADD_LEMMA',
      type: 'dictionary',
      description: 'Allow group users to add new words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'CONNECT_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to connect spelling occurrences to words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'DISCONNECT_SPELLING',
      type: 'dictionary',
      description:
        'Allow group users to disconnect spelling occurrences from words',
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'EDIT_TRANSLITERATION_STATUS',
      type: 'dictionary',
      description:
        "Allow group users to edit a text's transliteration status (visible in stoplight)",
      dependencies: ['WORDS', 'NAMES', 'PLACES'],
    },
    {
      name: 'ADD_NEW_TEXTS',
      type: 'text',
      description:
        'Allow group users to add new texts to a collection. Currently requires user to have beta access',
    },
    {
      name: 'EDIT_TEXT_INFO',
      type: 'text',
      description:
        "Allow group users to edit a text's prefix and number information",
    },
    {
      name: 'UPLOAD_EPIGRAPHY_IMAGES',
      type: 'text',
      description:
        'Allow group users to upload additional images to an existing epigraphy page',
    },
    {
      name: 'VIEW_TEXT_FILE',
      type: 'text',
      description: 'Allow group users to view text source file',
    },
    {
      name: 'COPY_TEXT_TRANSLITERATION',
      type: 'text',
      description:
        'Allow group users to copy a string representation of text transliterations',
    },
    {
      name: 'EDIT_ITEM_PROPERTIES',
      type: 'general',
      description: 'Allow group users to edit item properties for a given item',
    },
    {
      name: 'VIEW_TEXT_CITATIONS',
      type: 'text',
      description: 'Allow group users to view the citation(s) of text',
    },
    {
      name: 'COPY_TEXT_TRANSLITERATION',
      type: 'text',
      description:
        'Allow group users to copy a string representation of text transliterations',
    },
    {
      name: 'ADD_COMMENTS',
      type: 'general',
      description: 'Allow group users to add comments',
    },
    {
      name: 'ADD_EDIT_FIELD_DESCRIPTION',
      type: 'general',
      description:
        'Allow group users to add or edit taxonomy field descriptions where primacy = 1',
    },
    {
      name: 'VIEW_FIELD_DESCRIPTION',
      type: 'general',
      description:
        'Allow group users to view taxonomy field descriptions where primacy = 2',
    },
  ];

  getAllPermissions(): PermissionItem[] {
    return this.ALL_PERMISSIONS;
  }

  async getUserPermissions(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<PermissionItem[]> {
    const k = trx || knexRead();
    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;

    if (user && user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    if (user) {
      const groupIds = await UserGroupDao.getGroupsOfUser(user.uuid, trx);

      const userPermissions: PermissionName[] = (
        await k('permissions')
          .select('permission')
          .whereIn('group_id', groupIds)
      ).map(row => row.permission);
      return this.ALL_PERMISSIONS.filter(permission =>
        userPermissions.includes(permission.name)
      );
    }

    return [];
  }

  async getGroupPermissions(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<PermissionItem[]> {
    const k = trx || knexRead();
    const permissions: string[] = (
      await k('permissions').select('permission').where('group_id', groupId)
    ).map(row => row.permission);

    return this.ALL_PERMISSIONS.filter(permission =>
      permissions.includes(permission.name)
    );
  }

  async addGroupPermission(
    groupId: number,
    { type, name }: PermissionItem,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('permissions').insert({
      group_id: groupId,
      type,
      permission: name,
    });
  }

  async removePermission(
    groupId: number,
    permission: PermissionName,
    trx?: Knex.Transaction
  ) {
    const k = trx || knexWrite();
    await k('permissions')
      .where('group_id', groupId)
      .andWhere('permission', permission)
      .del();
  }
}

export default new PermissionsDao();
