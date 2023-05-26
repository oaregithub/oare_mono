import knex from '@/connection';
import { Knex } from 'knex';

// VERIFIED COMPLETE

class PageContentDao {
  /**
   * Retrieves the content for a given route name.
   * @param routeName The route name to retrieve content for.
   * @param trx Knex Transaction. Optional.
   * @returns Content string.
   */
  public async getContent(
    routeName: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row = await k('page_content')
      .first('content')
      .where('page', routeName);

    return row.content;
  }

  /**
   * Updates the content for a given route name.
   * @param routeName The route name to update content for.
   * @param newContent The new content to set.
   * @param trx Knex Transaction. Optional.
   */
  public async editContent(
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

/**
 * PageContentDao instance as as singleton
 */
export default new PageContentDao();
