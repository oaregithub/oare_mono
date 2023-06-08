import knex from '@/connection';
import sl from '@/serviceLocator';
import { DenylistAllowlistType } from '@oare/types';
import { Knex } from 'knex';

class PublicDenylistDao {
  async getDenylist(
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    // FIXME should just remove from denylist if quarantined
    const QuarantineTextDao = sl.get('QuarantineTextDao');

    const quarantinedTexts = await QuarantineTextDao.getQuarantinedTextUuids(
      trx
    );

    const uuids = await k('public_denylist')
      .pluck('uuid')
      .where({ type })
      .whereNotIn('uuid', quarantinedTexts);

    return uuids;
  }

  async addItemsToDenylist(
    uuids: string[],
    type: 'text' | 'collection' | 'img',
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));
    await k('public_denylist').insert(insertRows);
  }

  async removeItemFromDenylist(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;
    await k('public_denylist').where({ uuid }).del();
  }

  async textIsPubliclyViewable(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const PublicDenylistDao = sl.get('PublicDenylistDao');

    const textDenylist = await PublicDenylistDao.getDenylist('text', trx);

    if (textDenylist.includes(textUuid)) {
      return false;
    }

    return true;
  }
}

export default new PublicDenylistDao();
