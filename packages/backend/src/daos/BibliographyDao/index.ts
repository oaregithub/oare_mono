import { Knex } from 'knex';
import knex from '@/connection';
import { Bibliography, BibliographyRow } from '@oare/types';
import sl from '@/serviceLocator';

class BibliographyDao {
  /**
   * Retreives a bibliography row by UUID
   * @param uuid The UUID of the bibliography row
   * @param trx Knex Transaction. Optional.
   * @returns The bibliography row
   */
  public async getBibliographyRowByUuid(
    // FIXME - could maybe be private with some updates
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<BibliographyRow> {
    const k = trx || knex;

    const bibliography: BibliographyRow = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('uuid', uuid)
      .first();

    return bibliography;
  }

  /**
   * Retrieves all bibliography rows
   * @param trx Knex Transaction. Optional.
   * @returns Array of bibliography rows
   */
  public async getAllBibliographyUuids(
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('bibliography').pluck('uuid');

    return uuids;
  }

  /**
   * Contructs complete Bibliography object for the given UUID
   * @param uuid The UUID of the bibliography
   * @param citationStyle The citation style to use for Zotero
   * @param trx Knex Transaction. Optional.
   * @returns Bibliography object.
   */
  public async getBibliographyByUuid(
    uuid: string,
    citationStyle: string,
    trx?: Knex.Transaction
  ): Promise<Bibliography> {
    const utils = sl.get('utils');

    const bibliographyRow = await this.getBibliographyRowByUuid(uuid, trx);

    const zoteroData = await utils.getZoteroData(
      bibliographyRow.zoteroKey,
      citationStyle
    );

    const bibliography: Bibliography = {
      title: zoteroData?.data?.title ? zoteroData.data.title : null,
      authors: zoteroData?.data?.creators
        ? zoteroData.data.creators
            .filter(creator => creator.creatorType === 'author')
            .map(creator => `${creator.firstName} ${creator.lastName}`)
        : [],
      date: zoteroData?.data?.date ? zoteroData.data.date : null,
      bibliography: {
        bib: zoteroData?.bib ? zoteroData.bib : null,
        url: '', // Will be added in cache filter
      },
      itemType: zoteroData?.data?.itemType ? zoteroData.data.itemType : null,
      uuid: bibliographyRow.uuid,
    };

    return bibliography;
  }

  // FIXME - should deprecate - only used for threads which will be revamped anyways.
  async getBibliographyByZotItemKey(
    zotItemKey: string,
    trx?: Knex.Transaction
  ): Promise<BibliographyRow> {
    const k = trx || knex;
    const bibliography: BibliographyRow = await k('bibliography')
      .select('uuid', 'zot_item_key as zoteroKey', 'short_cit as citation')
      .where('zot_item_key', zotItemKey)
      .first();
    return bibliography;
  }
}

/**
 * BibliographyDao instance as a singleton
 */
export default new BibliographyDao();
