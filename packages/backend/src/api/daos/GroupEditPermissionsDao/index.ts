import knex from '@/connection';

class GroupEditPermissionsDao {
  async getGroupEditPermissions(
    groupId: number,
    type: 'text' | 'collection'
  ): Promise<string[]> {
    const uuids = await knex('group_edit_permissions')
      .pluck('uuid')
      .where('group_id', groupId)
      .andWhere('type', type);

    return uuids;
  }

  async addItemsToGroupEditPermissions(
    groupId: number,
    uuids: string[],
    type: 'text' | 'collection'
  ): Promise<void> {
    const rows = uuids.map(uuid => ({
      uuid,
      type,
      group_id: groupId,
    }));
    await knex('group_edit_permissions').insert(rows);
  }

  async removeItemFromGroupEditPermissions(
    groupId: number,
    uuid: string
  ): Promise<void> {
    await knex('group_edit_permissions')
      .where('group_id', groupId)
      .andWhere({ uuid })
      .del();
  }

  async containsAssociation(uuid: string, groupId: number): Promise<boolean> {
    const containsAssociation = await knex('group_edit_permissions')
      .where({ uuid })
      .andWhere('group_id', groupId)
      .first();

    return !!containsAssociation;
  }
}

export default new GroupEditPermissionsDao();
