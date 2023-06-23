import knex from '@/connection';
import { PermissionItem, PermissionName, PermissionType } from '@oare/types';
import { Knex } from 'knex';
import UserDao from '../UserDao';
import UserGroupDao from '../UserGroupDao';

// COMPLETE

class PermissionsDao {
  // FIXME update the permissions

  /**
   * All permissions in the system. This is the "source-of-truth" for permissions.
   */
  private ALL_PERMISSIONS: PermissionItem[] = [
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
      name: 'PERSONS',
      type: 'pages',
      description:
        'Allow group users to view "Persons" tab and access associated pages',
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
      name: 'PERIODS',
      type: 'pages',
      description:
        'Allow group users to view "Periods" page and associated data',
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
      name: 'DISCONNECT_OCCURRENCES',
      type: 'dictionary',
      description: 'Allow group users to disconnect occurrences',
      dependencies: ['WORDS', 'NAMES', 'PLACES', 'PERSONS'],
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
      description: 'Allow group users to add new texts to a collection.',
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

  /**
   * Retrieves a list of all permissions in the system.
   * @returns Array of all permission objects.
   */
  public getAllPermissions(): PermissionItem[] {
    return this.ALL_PERMISSIONS;
  }

  /**
   * Retrieves a list of permissions that a given user has.
   * @param userUuid The UUID of the user to retrieve permissions for. If null, returns an empty array.
   * @param trx Knex Transaction. Optional.
   * @returns Array of permissions that the user has.
   * @throws Error if the user does not exist.
   */
  public async getUserPermissions(
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<PermissionItem[]> {
    const user = userUuid ? await UserDao.getUserByUuid(userUuid, trx) : null;
    if (!user) {
      return [];
    }

    if (user.isAdmin) {
      return this.ALL_PERMISSIONS;
    }

    const groupIds = await UserGroupDao.getGroupsOfUser(user.uuid, trx);

    const userPermissions = (
      await Promise.all(groupIds.map(id => this.getGroupPermissions(id, trx)))
    )
      .flat()
      .map(p => p.name);

    return this.ALL_PERMISSIONS.filter(permission =>
      userPermissions.includes(permission.name)
    );
  }

  /**
   * Retrieves a list of permissions that a given group has.
   * @param groupId The ID of the group to retrieve permissions for.
   * @param trx Knex Transaction. Optional.
   * @returns Array of permissions that the group has.
   */
  public async getGroupPermissions(
    groupId: number,
    trx?: Knex.Transaction
  ): Promise<PermissionItem[]> {
    const k = trx || knex;

    const permissions: string[] = await k('permissions')
      .pluck('permission')
      .where('group_id', groupId);

    return this.ALL_PERMISSIONS.filter(permission =>
      permissions.includes(permission.name)
    );
  }

  /**
   * Adds a permission to a group.
   * @param groupId The ID of the group to add the permission to.
   * @param type The type of the permission.
   * @param name The name of the permission.
   * @param trx Knex.Transaction. Optional.
   */
  public async addGroupPermission(
    groupId: number,
    type: PermissionType,
    name: PermissionName,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('permissions').insert({
      group_id: groupId,
      type,
      permission: name,
    });
  }

  /**
   * Removes a permission from a group.
   * @param groupId The ID of the group to remove the permission from.
   * @param permission The name of the permission to remove.
   * @param trx Knex.Transaction. Optional.
   */
  public async removeGroupPermission(
    groupId: number,
    permission: PermissionName,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    await k('permissions').where({ group_id: groupId, permission }).del();
  }
}

/**
 * PermissionsDao instance as a singleton
 */
export default new PermissionsDao();
