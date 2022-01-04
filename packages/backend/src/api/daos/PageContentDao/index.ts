import knex from '@/connection';

class PageContentDao {
  async getContent(routeName: string) {
    const content: string | null = await knex('page_content')
      .first('content')
      .where(routeName);
    return content;
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
