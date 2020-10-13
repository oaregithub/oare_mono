import knex from '../../../connection';

class LoggingEditsDao {
  async logEdit(type: 'UPDATE' | 'DELETE' | 'INSERT', userUuid: string, tableName: string, uuid: string) {
    const prevRow = await knex(tableName).where({ uuid }).first();
    await knex('logging_edits').insert({
      type,
      user_uuid: userUuid,
      time: new Date(),
      reference_table: tableName,
      uuid,
      object_values: JSON.stringify(prevRow),
    });
  }
}

export default new LoggingEditsDao();
