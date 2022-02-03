import knex from '@/connection';
import { PublicationResponse, PublicationText } from '@oare/types';
import sl from '@/serviceLocator';

class PublicationDao {
  async getPublicationByPrfx(
    prfx: string,
    userUuid: string | null
  ): Promise<PublicationResponse | null> {
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid
    );
    const publicationRows: PublicationText[] = await knex('text')
      .select(
        'text.uuid as textUuid',
        'text.type as type',
        'text.display_name as name',
        'text.excavation_prfx as excavationPrefix',
        'text.excavation_no as excavationNumber',
        'text.museum_prfx as museumPrefix',
        'text.museum_no as museumNumber',
        'text.publication_prfx as publicationPrefix',
        'text.publication_no as publicationNumber'
      )
      .where('text.publication_prfx', prfx)
      .whereNotIn('text.uuid', textsToHide);

    const publicationTexts: PublicationText[] = await Promise.all(
      publicationRows.map(publicationRow =>
        this.generateDisplayName(publicationRow)
      )
    );

    const publication: PublicationResponse = {
      prefix: prfx,
      textNumbers: publicationTexts,
    };
    return publication || null;
  }

  async getAllPublications(): Promise<string[]> {
    const publicationRows: Array<{ prefix: string }> = await knex('text')
      .distinct('text.publication_prfx as prefix')
      .whereNotNull('text.publication_prfx')
      .orderBy('text.publication_prfx');

    const publicationPrefixes: string[] = publicationRows.map(
      ({ prefix }) => prefix
    );

    return publicationPrefixes;
  }

  async generateDisplayName(
    publicationText: PublicationText
  ): Promise<PublicationText> {
    let displayName: string = '';
    if (publicationText.publicationNumber) {
      displayName = publicationText.publicationNumber;
      if (
        publicationText.excavationPrefix &&
        publicationText.excavationNumber
      ) {
        displayName += ` (${publicationText.excavationPrefix} ${publicationText.excavationNumber})`;
      } else if (publicationText.museumPrefix && publicationText.museumNumber) {
        displayName += ` (${publicationText.museumPrefix} ${publicationText.museumNumber})`;
      }
    } else {
      displayName = publicationText.name;
    }

    const pubText: PublicationText = {
      textUuid: publicationText.textUuid,
      type: publicationText.type,
      name: displayName,
      excavationPrefix: publicationText.excavationPrefix,
      excavationNumber: publicationText.excavationNumber,
      museumPrefix: publicationText.museumPrefix,
      museumNumber: publicationText.museumPrefix,
      publicationPrefix: publicationText.publicationPrefix,
      publicationNumber: publicationText.publicationNumber,
    };

    return pubText;
  }
}

export default new PublicationDao();
