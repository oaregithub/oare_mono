import knex from '@/connection';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import { ResourceRow, LinkRow, Image, CitationUrls } from '@oare/types';
import { Knex } from 'knex';
import axios from 'axios';

// MOSTLY COMPLETE

class ResourceDao {
  /**
   * Calculates the relative page and plate offsets for a PDF resource.
   * This allows for the PDF to be opened to the correct offset page.
   * @param format The format of the PDF. Ex: 'a-0-0'.
   * @param beginPage The beginning page in the data.
   * @param beginPlate The beginning plate in the data.
   * @returns An object containing the relative page and plate offsets.
   */
  private calcPDFPageNum = (
    format: string,
    beginPage: number | null,
    beginPlate: number | null
  ) => {
    const splitFormat: string[] = format.split('-');
    const layout: string = splitFormat[0];
    const pageOffset: number = Number(splitFormat[1]);
    const plateOffset: number = Number(splitFormat[2]);
    let page = 0;
    let plate = 0;
    if (layout === 'a') {
      if (beginPage) {
        page = beginPage + pageOffset;
      }
      if (beginPlate && plateOffset) {
        plate = beginPlate + plateOffset;
      }
    }
    if (layout === 'b') {
      if (beginPage) {
        page = -Math.floor(-beginPage / 2) + pageOffset;
      }
      if (beginPlate && plateOffset) {
        plate = -Math.floor(-beginPlate / 2) + plateOffset;
      }
    }
    if (layout === 'c') {
      if (beginPage) {
        page = Math.floor(beginPage / 2) + pageOffset;
      }
      if (beginPlate && plateOffset) {
        plate = Math.floor(beginPlate / 2) + plateOffset;
      }
    }

    return {
      plate,
      page,
    };
  };

  /**
   * Retrieves all images for a given text UUID.
   * @param textUuid The UUID of the text whose images to retrieve.
   * @param userUuid The UUID of the user making the request. Can be null if no authenticated user.
   * @param trx Knex Transaction. Optional.
   * @returns Array of images.
   * @throws Error if the text doesn't exist or one or more of the images doesn't exist.
   */
  public async getImagesByTextUuid(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const s3Links = await this.getS3ImagesByTextUuid(textUuid, userUuid, trx);
    const cdliLinks = await this.getCdliImagesByTextUuid(textUuid, trx);
    const metLinks = await this.getMetImagesByTextUuid(textUuid, trx);

    const response = [...s3Links, ...cdliLinks, ...metLinks];

    return response;
  }

  /**
   * Retrieves the name of the text source file for a given text UUID.
   * @param uuid The UUID of the text whose text file name to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Name of the text source file. Can be null if the text does not have a source file.
   */
  private async getTextFileNameByTextUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knex;

    const fileName = await k('resource')
      .select('link')
      .where('container', 'oare-texttxt-bucket')
      .whereIn(
        'uuid',
        k('link').select('obj_uuid').where('reference_uuid', uuid)
      )
      .first()
      .then((row: ResourceRow | undefined) => row?.link);

    return fileName || null;
  }

  /**
   * Retrieves the text source file content string for a given text UUID.
   * @param uuid The UUID of the text whose text file content to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Text source file content string. Can be null if the text does not have a source file.
   */
  public async getTextFileByTextUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const utils = sl.get('utils');

    const textSourceFileName = await this.getTextFileNameByTextUuid(uuid, trx);

    if (textSourceFileName) {
      const textSourceFileBody = await utils.getS3ObjectBody(
        'oare-texttxt-bucket',
        textSourceFileName
      );

      const textContent = textSourceFileBody
        ? textSourceFileBody.toString('utf-8')
        : null;

      if (textContent) {
        return textContent;
      }
    }

    return null;
  }

  /**
   * Retrieves a bibliography PDF URL for a given bibliography UUID.
   * @param uuid The UUID of the bibliography whose PDF URL to retrieve.
   * @param beginPage Optional beginning page number. If provided, one of the returned URLs will include a page number.
   * @param beginPlate Optional beginning plate number. If provided, one of the returned URLs will include a plate number.
   * @param trx Knex Transaction. Optional.
   * @returns Citation URLs object. Includes general, page, and plate URLs.
   * @throws Error if one or more of the resources doesn't exist.
   */
  public async getPDFUrlByBibliographyUuid(
    uuid: string,
    beginPage?: number,
    beginPlate?: number,
    trx?: Knex.Transaction
  ): Promise<CitationUrls | null> {
    const s3 = new AWS.S3();

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(
      uuid,
      undefined,
      'pdf',
      trx
    );
    const resourceRows = await Promise.all(
      resourceUuids.map(resourceUuid =>
        this.getResourceRowByUuid(resourceUuid, trx)
      )
    );

    const resourceRow = resourceRows.length > 0 ? resourceRows[0] : null;
    if (!resourceRow) {
      return null;
    }

    let generalUrl: string | null;
    let page: number | null = null;
    let plate: number | null = null;

    try {
      generalUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: resourceRow.container,
        Key: resourceRow.link,
        Expires: 60 * 60 * 2,
      });
    } catch {
      generalUrl = null;

      const citationurls: CitationUrls = {
        general: null,
        page: null,
        plate: null,
      };

      return citationurls;
    }

    if (resourceRow.format) {
      const pdfPageNumResponse = this.calcPDFPageNum(
        resourceRow.format,
        beginPage || null,
        beginPlate || null
      );
      page = pdfPageNumResponse.page;
      plate = pdfPageNumResponse.plate;
    }

    const pageUrl = page ? `${generalUrl}#page=${page}` : null;
    const plateUrl = plate ? `${generalUrl}#page=${plate}` : null;

    const citationUrls: CitationUrls = {
      general: generalUrl,
      page: pageUrl,
      plate: plateUrl,
    };

    return citationUrls;
  }

  /**
   * Retrieves a single S3 image for a given image UUID.
   * @param uuid The UUID of the image to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single image.
   * @throws Error if no image found for the given UUID.
   */
  public async getS3ImageByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Image> {
    const s3 = new AWS.S3();

    const PersonDao = sl.get('PersonDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const TextDao = sl.get('TextDao');

    const resourceRow = await this.getResourceRowByUuid(uuid, trx);

    const textUuid = await this.getLinkReferenceUuidByObjUuid(uuid, trx);

    const text = await TextDao.getTextByUuid(textUuid, trx);

    const source = resourceRow.sourceUuid
      ? (await PersonDao.getPersonRowByUuid(resourceRow.sourceUuid, trx))
          ?.label || null
      : null;

    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: resourceRow.container,
      Key: resourceRow.link,
    });

    const imageProperties = await ItemPropertiesDao.getImagePropertyDetails(
      uuid,
      trx
    );

    const image: Image = {
      resourceRow,
      source,
      url,
      side: imageProperties.side,
      view: imageProperties.view,
      text,
    };

    return image;
  }

  /**
   * Retrieves all Met Museum images for a given text UUID.
   * @param textUuid The UUID of the text whose Met Museum images to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of Met Museum images.
   * @throws Error if the text doesn't exist or the resource rows don't exist.
   */
  private async getMetImagesByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const TextDao = sl.get('TextDao');

    const text = await TextDao.getTextByUuid(textUuid, trx);

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(
      textUuid,
      'metmuseum',
      'img',
      trx
    );

    const resourceRows = await Promise.all(
      resourceUuids.map(uuid => this.getResourceRowByUuid(uuid, trx))
    );

    const relevantResourceRow =
      resourceRows.length > 0 ? resourceRows[0] : null;
    if (!relevantResourceRow) {
      return [];
    }

    const metLink = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${relevantResourceRow.link}`;

    const {
      data,
    }: {
      data: {
        primaryImage: string;
        additionalImages: string[];
      };
    } = await axios.get(metLink);

    const urls = [data.primaryImage, ...data.additionalImages];

    const images: Image[] = urls.map(url => ({
      resourceRow: relevantResourceRow,
      source: 'The Metropolitan Museum of Art',
      url,
      side: null,
      view: null,
      text,
    }));

    return images;
  }

  /**
   * Retrieves all CDLI images for a given text UUID.
   * @param textUuid The UUID of the text whose CDLI images to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of CDLI images.
   */
  private async getCdliImagesByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const TextDao = sl.get('TextDao');

    const text = await TextDao.getTextByUuid(textUuid, trx);

    if (!text.cdliNum) {
      return [];
    }

    const PHOTO_URL = `https://cdli.mpiwg-berlin.mpg.de/dl/photo/${text.cdliNum}.jpg`;
    const LINE_ART_URL = `https://cdli.mpiwg-berlin.mpg.de/dl/lineart/${text.cdliNum}.jpg`;

    const urls: string[] = [];

    try {
      await axios.head(PHOTO_URL);
      urls.push(PHOTO_URL);
    } catch {
      // Do nothing. Image does not exist.
    }

    try {
      await axios.head(LINE_ART_URL);
      urls.push(LINE_ART_URL);
    } catch {
      // Do nothing. Image line art does not exist.
    }

    const images: Image[] = urls.map(url => ({
      resourceRow: null,
      source: 'CDLI',
      url,
      side: null,
      view: null,
      text,
    }));

    return images;
  }

  /**
   * Retrieves all S3 images for a given text UUID.
   * @param textUuid The UUID of the text whose S3 images to retrieve.
   * @param userUuid The UUID of the user making the request. Can be null if no user is logged in.
   * @param trx Knex Transaction. Optional.
   * @returns Array of S3 images.
   * @throws Error if the text doesn't exist or the resource rows don't exist.
   */
  private async getS3ImagesByTextUuid(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const s3 = new AWS.S3();

    const CollectionTextUtils = sl.get('CollectionTextUtils');
    const PersonDao = sl.get('PersonDao');
    const TextDao = sl.get('TextDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const imagesToHide = await CollectionTextUtils.imagesToHide(userUuid);

    const text = await TextDao.getTextByUuid(textUuid, trx);

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(
      textUuid,
      'oare-image-bucket',
      'img',
      trx
    );

    const allowedResourceUuids = resourceUuids.filter(
      uuid => !imagesToHide.includes(uuid)
    );

    const resourceRows = await Promise.all(
      allowedResourceUuids.map(uuid => this.getResourceRowByUuid(uuid, trx))
    );

    const sources = (
      await Promise.all(
        resourceRows.map(row =>
          row.sourceUuid
            ? PersonDao.getPersonRowByUuid(row.sourceUuid, trx)
            : null
        )
      )
    ).map(row => (row ? row.label : null));

    const urls = await Promise.all(
      resourceRows.map(row =>
        s3.getSignedUrlPromise('getObject', {
          Bucket: 'oare-image-bucket',
          Key: row.link,
        })
      )
    );

    const imageProperties = await Promise.all(
      resourceRows.map(
        row => ItemPropertiesDao.getImagePropertyDetails(row.uuid, trx) // FIXME would like to revamp this function
      )
    );

    const images: Image[] = resourceRows.map((row, idx) => ({
      resourceRow: row,
      source: sources[idx],
      url: urls[idx],
      side: imageProperties[idx].side,
      view: imageProperties[idx].view,
      text,
    }));

    return images;
  }

  /**
   * Retrieves a single resource row by its UUID.
   * @param uuid The UUID of the resource row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single resource row.
   * @throws Error if no resource row with the given UUID exists.
   */
  private async getResourceRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ResourceRow> {
    const k = trx || knex;

    const row: ResourceRow | undefined = await k('resource')
      .select(
        'uuid',
        'source_uuid as sourceUuid',
        'type',
        'container',
        'format',
        'link'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`No resource row with uuid ${uuid}`);
    }

    return row;
  }

  /**
   * Retrieves all object UUIDs that are linked to a given reference UUID.
   * @param referenceUuid The UUID of the reference.
   * @param trx Knex Transaction. Optional.
   * @returns Array of object UUIDs.
   */
  private async getLinkObjUuidsByReferenceUuid(
    referenceUuid: string,
    container?: string,
    type?: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows: string[] = await k('link')
      .pluck('obj_uuid')
      .where({ reference_uuid: referenceUuid })
      .modify(qb => {
        if (container || type) {
          qb.innerJoin('resource', 'link.obj_uuid', 'resource.uuid');
        }
        if (container) {
          qb.where({ container });
        }
        if (type) {
          qb.where({ type });
        }
      });

    return rows;
  }

  /**
   * Retrieves the reference UUID of a given object UUID.
   * @param objUuid The UUID of the object.
   * @param trx Knex Transaction. Optional.
   * @returns Reference UUID.
   * @throws Error if no link row with the given object UUID exists.
   */
  private async getLinkReferenceUuidByObjUuid(
    objUuid: string,
    trx?: Knex.Transaction
  ): Promise<string> {
    const k = trx || knex;

    const row: { referenceUuid: string } | undefined = await k('link')
      .select('reference_uuid as referenceUuid')
      .where({ obj_uuid: objUuid })
      .first();

    if (!row) {
      throw new Error(`No link row with object uuid ${objUuid}`);
    }

    return row.referenceUuid;
  }

  /**
   * Inserts a resource row.
   * @param row The resource row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertResourceRow(row: ResourceRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('resource').insert({
      uuid: row.uuid,
      source_uuid: row.sourceUuid,
      type: row.type,
      container: row.container,
      format: row.format,
      link: row.link,
    });
  }

  /**
   * Inserts a link row.
   * @param row The link row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertLinkRow(row: LinkRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('link').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      obj_uuid: row.objUuid,
    });
  }
}

export default new ResourceDao();
