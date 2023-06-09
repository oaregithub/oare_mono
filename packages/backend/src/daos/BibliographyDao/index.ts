import { Knex } from 'knex';
import knex from '@/connection';
import { Bibliography, BibliographyRow, Citation } from '@oare/types';
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

  public async getCitationsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Citation[]> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const utils = sl.get('utils');

    const bibliographyUuids: string[] = await ItemPropertiesDao.getBibliographyUuidsByReference(
      textUuid,
      trx
    );

    const bibliographyRows = await Promise.all(
      bibliographyUuids.map(uuid => this.getBibliographyRowByUuid(uuid, trx))
    );

    const zoteroResponses = await Promise.all(
      bibliographyRows.map(row =>
        utils.getZoteroData(row.zoteroKey, 'chicago-author-date')
      )
    );

    const citationStrings = zoteroResponses.map(response =>
      response && response.citation
        ? response.citation.replace(/<[span/]{4,5}>/gi, '')
        : null
    );

    const beginPages = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5ce1f5a2-b68f-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const endPages = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5cf077ed-b68f-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const beginPlates = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5d42c28a-b1fe-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const endPlates = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5d600469-b1fe-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const notes = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5d6b0f28-b1fe-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const publicationNumbers = await Promise.all(
      bibliographyUuids.map(uuid =>
        ItemPropertiesDao.getCitationReferringLocation(
          '5d771785-b1fe-11ec-bcc3-0282f921eac9',
          textUuid,
          uuid,
          trx
        )
      )
    );

    const citations: Citation[] = bibliographyUuids.map((uuid, idx) => ({
      bibliographyUuid: uuid,
      citation: citationStrings[idx],
      beginPage: beginPages[idx] ? Number(beginPages[idx]) : null,
      endPage: endPages[idx] ? Number(endPages[idx]) : null,
      beginPlate: beginPlates[idx] ? Number(beginPlates[idx]) : null,
      endPlate: endPlates[idx] ? Number(endPlates[idx]) : null,
      note: notes[idx],
      publicationNumber: publicationNumbers[idx]
        ? Number(publicationNumbers[idx])
        : null,
      urls: {
        general: '', // Will be added in cache filter
        page: '', // Will be added in cache filter
        plate: '', // Will be added in cache filter
      },
    }));

    return citations;
  }
}

/**
 * BibliographyDao instance as a singleton
 */
export default new BibliographyDao();
