import { Group, GroupRow } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class OareGroupDao {
  /**
   * Checks if a group with the given name exists.
   * @param name The name to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether or not a group with the given name already exists.
   */
  public async groupNameExists(
    name: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const group = await k('oare_group').first().where({ name });

    return !!group;
  }

  /**
   * Retrieves a group row by its ID.
   * @param id The ID of the group row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The group row object.
   * @throws Error if no group row found.
   */
  private async getGroupRowById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<GroupRow> {
    const k = trx || knex;

    const group: GroupRow | undefined = await k('oare_group')
      .select('id', 'name', 'created_on as createdOn', 'description')
      .first()
      .where({ id });

    if (!group) {
      throw new Error(`Group with id ${id} does not exist`);
    }

    return group;
  }

  /**
   * Retrieves a group by its ID.
   * @param id The ID of the group row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns The group object.
   * @throws Error if no group found.
   */
  public async getGroupById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<Group> {
    const UserGroupDao = sl.get('UserGroupDao');

    const groupRow = await this.getGroupRowById(id, trx);

    const numUsers = await UserGroupDao.getNumberOfUsersInGroup(id, trx);

    return {
      ...groupRow,
      numUsers,
    };
  }

  /**
   * Checks if a group exists.
   * @param id The ID of the group to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the group exists.
   */
  public async groupExists(
    id: number,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const group = await k('oare_group').first().where({ id });

    return !!group;
  }

  /**
   * Retrieves a list of all group IDs
   * @param trx Knex Transaction. Optional.
   * @returns An array of group IDs.
   */
  public async getAllGroupIds(trx?: Knex.Transaction): Promise<number[]> {
    const k = trx || knex;

    return k('oare_group').pluck('id');
  }

  /**
   * Creates a new group.
   * @param name The name of the group.
   * @param description A description of the group.
   * @param trx Knex Transaction. Optional.
   * @returns The ID of the newly created group.
   */
  public async createGroup(
    name: string,
    description: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const ids: number[] = await k('oare_group').insert({
      name,
      description,
    });

    return ids[0];
  }

  /**
   * Deletes a group by its ID.
   * @param id The ID of the group to delete.
   * @param trx Knex Transaction. Optional.
   */
  public async deleteGroup(id: number, trx?: Knex.Transaction): Promise<void> {
    const k = trx || knex;

    await k('oare_group').where({ id }).del();
  }

  /**
   * Updates a group's description.
   * @param id The ID of the group to update.
   * @param description The new description.
   * @param trx Knex Transaction. Optional.
   */
  public async updateGroupDescription(
    id: number,
    description: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('oare_group').where({ id }).update({ description });
  }
}

/**
 * OareGroupDao instance as as singleton
 */
export default new OareGroupDao();
