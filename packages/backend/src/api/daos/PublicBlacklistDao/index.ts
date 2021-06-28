import knex from '@/connection';
import sl from '@/serviceLocator';

class PublicBlacklistDao {
  async getDenylistTextUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knex('public_blacklist')
      .select('uuid')
      .where('type', 'text');

    return rows.map(({ uuid }) => uuid);
  }

  async getDenylistCollectionUuids(): Promise<string[]> {
    const rows: Array<{ uuid: string }> = await knex('public_blacklist')
      .select('uuid')
      .where('type', 'collection');

    return rows.map(({ uuid }) => uuid);
  }

  async addItemsToDenylist(
    uuids: string[],
    type: 'text' | 'collection'
  ): Promise<void> {
    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));
    await knex('public_blacklist').insert(insertRows);
  }

  async removeItemFromDenylist(uuid: string): Promise<void> {
    await knex('public_blacklist').where({ uuid }).del();
  }

  async textIsPubliclyViewable(textUuid: string): Promise<boolean> {
    const CollectionDao = sl.get('CollectionDao');
    const PBDao = sl.get('PublicBlacklistDao');

    const textDenylist = await PBDao.getDenylistTextUuids();
    const collectionDenylist = await PBDao.getDenylistCollectionUuids();

    const collectionUuidOfText = await CollectionDao.getTextCollectionUuid(
      textUuid
    );

    if (textDenylist.includes(textUuid)) {
      return false;
    }
    if (
      collectionUuidOfText &&
      collectionDenylist.includes(collectionUuidOfText)
    ) {
      return false;
    }
    return true;
  }

  async collectionIsPubliclyViewable(collectionUuid: string): Promise<boolean> {
    const collectionDenylist = await this.getDenylistCollectionUuids();

    if (collectionDenylist.includes(collectionUuid)) {
      return false;
    }
    return true;
  }
}

export default new PublicBlacklistDao();
