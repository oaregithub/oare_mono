import { knexRead } from '@/connection';
import { PublicationResponse, PublicationText } from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

class PublicationDao {
  async getPublicationsByPrfx(
    prfx: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<PublicationResponse | null> {
    const k = trx || knexRead();
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid,
      trx
    );
    const publicationRows: PublicationText[] = await k('text')
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

    const publicationTextsSorted = publicationRows
      .map(text => text)
      .sort((a, b) => {
        const floatA = parseFloat(a.publicationNumber);
        const floatB = parseFloat(b.publicationNumber);
        if (floatA !== floatB) {
          if (Number.isNaN(floatA) && !Number.isNaN(floatB)) {
            return -1;
          }
          if (!Number.isNaN(floatA) && Number.isNaN(floatB)) {
            return 1;
          }
          if (Number.isNaN(floatA) && Number.isNaN(floatB)) {
            if (!a.publicationNumber && !b.publicationNumber) {
              return a.name.localeCompare(b.name);
            }
            if (!a.publicationNumber) {
              return 1;
            }
            if (!b.publicationNumber) {
              return -1;
            }
            const aValueSplit = a.publicationNumber.split(' ');
            const bValueSplit = b.publicationNumber.split(' ');
            let aValue = 0;
            let bValue = 0;

            for (let i = 0; i < aValueSplit.length; i += 1) {
              aValue = parseFloat(aValueSplit[i]);
              if (!Number.isNaN(parseFloat(aValueSplit[i]))) {
                break;
              }
            }

            for (let i = 0; i < bValueSplit.length; i += 1) {
              bValue = parseFloat(bValueSplit[i]);
              if (!Number.isNaN(parseFloat(bValueSplit[i]))) {
                break;
              }
            }

            if (aValue !== bValue) {
              return aValue - bValue;
            }

            return a.publicationNumber.localeCompare(b.publicationNumber);
          }
          return floatA - floatB;
        }
        return a.publicationNumber.localeCompare(b.publicationNumber);
      });

    const publicationTexts: PublicationText[] = await Promise.all(
      publicationTextsSorted.map(publication =>
        this.generateDisplayName(publication)
      )
    );

    const publication: PublicationResponse = {
      prefix: prfx,
      textNumbers: publicationTexts,
    };
    return publication || null;
  }

  async getAllPublications(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();
    const publicationRows: Array<{ prefix: string }> = await k('text')
      .distinct('text.publication_prfx as prefix')
      .whereNotNull('text.publication_prfx');

    const publicationPrefixes: string[] = publicationRows.map(
      ({ prefix }) => prefix
    );

    const publicationPrefixesSorted = publicationPrefixes.sort((a, b) => {
      const aValueClean = a.toLowerCase().replace(/[.]/g, '');
      const bValueClean = b.toLowerCase().replace(/[.]/g, '');
      const aValueSplit = a.split(' ');
      const bValueSplit = b.split(' ');
      const aStringValue = aValueSplit[0];
      const bStringValue = bValueSplit[0];

      if (aStringValue === bStringValue) {
        let aNumValue = 0;
        let bNumValue = 0;
        for (let i = 0; i < aValueSplit.length; i += 1) {
          aNumValue = parseFloat(aValueSplit[i]);
          if (!Number.isNaN(aNumValue)) {
            break;
          }
        }

        for (let i = 0; i < bValueSplit.length; i += 1) {
          bNumValue = parseFloat(bValueSplit[i]);
          if (!Number.isNaN(bNumValue)) {
            break;
          }
        }
        if (Number.isNaN(aNumValue) || Number.isNaN(bNumValue)) {
          return aValueClean.localeCompare(bValueClean);
        }
        if (aNumValue !== bNumValue) {
          return aNumValue - bNumValue;
        }
      }

      return aValueClean.localeCompare(bValueClean);
    });

    return publicationPrefixesSorted;
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
