import knex from '@/connection';
import { Knex } from 'knex';

class PageContentDao {
  async getContent(routeName: string, trx?: Knex.Transaction): Promise<string> {
    const k = trx || knex;
    const row = await k('page_content')
      .first('content')
      .where('page', routeName);
    return row.content;
  }

  async editContent(
    routeName: string,
    newContent: string,
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;
    await k('page_content')
      .update({
        content: newContent,
      })
      .where('page', routeName);
  }
}

export default new PageContentDao();
