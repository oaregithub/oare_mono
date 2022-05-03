import knex from '@/connection';
import { Knex } from 'knex';

class LoggingEditsDao {
  async logEdit(
    type: 'UPDATE' | 'DELETE' | 'INSERT',
    userUuid: string,
    tableName: string,
    uuid: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    let prevRow: string | null = null;

    if (type === 'UPDATE' || type === 'DELETE') {
      prevRow = await k(tableName).where({ uuid }).first();
    }
    await k('logging_edits').insert({
      type,
      user_uuid: userUuid,
      time: new Date(),
      reference_table: tableName,
      uuid,
      object_values: prevRow ? JSON.stringify(prevRow) : null,
    });
  }
}

export default new LoggingEditsDao();
