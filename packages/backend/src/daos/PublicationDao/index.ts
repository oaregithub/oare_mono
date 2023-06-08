import knex from '@/connection';
import { Publication } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

class PublicationDao {
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

export default new PublicationDao();
