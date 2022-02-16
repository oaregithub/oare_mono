import knex from '@/connection';

class PageContentDao {
  async getContent(routeName: string) {
    const row = await knex('page_content')
      .first('content')
      .where('page', routeName);
    return row.content;
  }

  async editContent(routeName: string, newContent: string) {
    await knex('page_content')
      .update({
        content: newContent,
      })
      .where('page', routeName);
  }
}

export default new PageContentDao();
