import knex from '@/connection';
import { Publication } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

// COMPLETE

class PublicationDao {
  /**
   * Retrieves the UUIDs of all texts in a publication.
   * @param prefix The prefix of the publication whose texts to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text UUIDs.
   */
  private async getTextUuidsByPublicationPrefix(
    prefix: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const textUuids = await k('text')
      .pluck('uuid')
      .where({ publication_prfx: prefix });

    return textUuids;
  }

  /**
   * Retrieves all publication prefixes.
   * @param trx Knex Transaction. Optional.
   * @returns Array of publication prefixes.
   */
  public async getAllPublicationPrefixes(
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const publicationPrefixes = await k('text')
      .distinct('publication_prfx')
      .whereNotNull('publication_prfx')
      .then(rows => rows.map(row => row.publication_prfx));

    return publicationPrefixes;
  }

  /**
   * Retrieves a publication by its prefix.
   * @param prefix The prefix of the publication to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A single Publication object.
   * @throws Error if one or more publication texts are not found.
   */
  public async getPublicationByPrefix(
    prefix: string,
    trx?: Knex.Transaction
  ): Promise<Publication> {
    const k = trx || knex;

    const TextDao = sl.get('TextDao');

    const textUuids = await this.getTextUuidsByPublicationPrefix(prefix, trx);

    const texts = await Promise.all(
      textUuids.map(uuid => TextDao.getTextByUuid(uuid, trx))
    );

    const publication: Publication = {
      prefix,
      texts,
    };

    return publication;
  }
}

/**
 * PublicationDao instance as a singleton.
 */
export default new PublicationDao();
