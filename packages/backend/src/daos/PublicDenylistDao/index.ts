import knex from '@/connection';
import sl from '@/serviceLocator';
import { DenylistAllowlistType } from '@oare/types';
import { Knex } from 'knex';

class PublicDenylistDao {
  /**
   * Retrieves the public denylist for the given type.
   * @param type The type of items to retrieve
   * @param trx Knex Transaction. Optional.
   * @returns Array of UUIDs of the items in the denylist.
   */
  public async getDenylist(
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const QuarantineTextDao = sl.get('QuarantineTextDao');
    const quarantinedTextUuids = await QuarantineTextDao.getAllQuarantinedTextUuids(
      trx
    );

    const uuids = await k('public_denylist')
      .pluck('uuid')
      .where({ type })
      .whereNotIn('uuid', quarantinedTextUuids);

    return uuids;
  }

  /**
   * Adds items to the public denylist.
   * @param uuids The UUIDs of the items to add.
   * @param type The type of the items to add.
   * @param trx Knex Transaction. Optional.
   */
  public async addItemsToDenylist(
    uuids: string[],
    type: DenylistAllowlistType,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    const insertRows = uuids.map(uuid => ({
      uuid,
      type,
    }));

    await k('public_denylist').insert(insertRows);
  }

  /**
   * Removes item from the public denylist.
   * @param uuid The UUID of the item to remove.
   * @param trx Knex Transaction. Optional.
   */
  public async removeItemFromDenylist(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('public_denylist').where({ uuid }).del();
  }

  /**
   * Checks if a text is publicly viewable.
   * @param textUuid The UUID of the text to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the text is publicly viewable.
   */
  public async textIsPubliclyViewable(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const textDenylist = await this.getDenylist('text', trx);

    if (textDenylist.includes(textUuid)) {
      return false;
    }

    return true;
  }
}

/**
 * PublicDenylistDao instance as a singleton.
 */
export default new PublicDenylistDao();
