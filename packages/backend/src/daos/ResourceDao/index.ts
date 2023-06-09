import knex from '@/connection';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import { ResourceRow, LinkRow, Image, CitationUrls } from '@oare/types';
import { Knex } from 'knex';
import axios from 'axios';
import { calcPDFPageNum } from './utils';

// FIXME much better, but still needs some work

class ResourceDao {
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

  async getPDFUrlByBibliographyUuid(
    uuid: string,
    beginPage?: number,
    beginPlate?: number,
    trx?: Knex.Transaction
  ): Promise<CitationUrls> {
    const s3 = new AWS.S3();

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(uuid, trx);
    const resourceRows = (
      await Promise.all(
        resourceUuids.map(uuid => this.getResourceRowByUuid(uuid, trx))
      )
    ).filter((row): row is ResourceRow => !!row);

    const relevantResourceRows = resourceRows.filter(row => row.type === 'pdf');

    const resourceRow =
      relevantResourceRows.length > 0 ? relevantResourceRows[0] : null;
    if (!resourceRow) {
      throw new Error('No resource found');
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
    }

    if (resourceRow && resourceRow.format && beginPage && beginPlate) {
      const pdfPageNumResponse = await calcPDFPageNum(
        resourceRow.format,
        beginPage,
        beginPlate
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

  public async getS3ImageByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Image> {
    const s3 = new AWS.S3();
    const k = trx || knex;

    const PersonDao = sl.get('PersonDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const TextDao = sl.get('TextDao');

    const resourceRow = await this.getResourceRowByUuid(uuid, trx);

    if (!resourceRow) {
      throw new Error(`Image with uuid ${uuid} does not exist`);
    }

    const textUuid = await this.getLinkReferenceUuidByObjUuid(uuid, trx);
    if (!textUuid) {
      throw new Error(`Image with uuid ${uuid} does not have a text`);
    }

    const text = await TextDao.getTextByUuid(textUuid, trx);
    if (!text) {
      throw new Error(`Text with uuid ${textUuid} does not exist`);
    }

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

  private async getMetImagesByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const TextDao = sl.get('TextDao');

    const text = await TextDao.getTextByUuid(textUuid, trx);
    if (!text) {
      throw new Error(`Text with uuid ${textUuid} does not exist`);
    }

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(
      textUuid,
      trx
    );

    const resourceRows = (
      await Promise.all(
        resourceUuids.map(uuid => this.getResourceRowByUuid(uuid, trx))
      )
    ).filter((row): row is ResourceRow => row !== null);

    const relevantResourceRows = resourceRows.filter(
      row => row.container === 'metmuseum' && row.type === 'img'
    );

    const relevantResourceRow =
      relevantResourceRows.length > 0 ? relevantResourceRows[0] : null;
    if (!relevantResourceRow) {
      throw new Error(
        `Text with uuid ${textUuid} does not have a relevant image`
      );
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

  private async getCdliImagesByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<Image[]> {
    const TextDao = sl.get('TextDao');

    const text = await TextDao.getTextByUuid(textUuid, trx);
    if (!text) {
      throw new Error(`Text with uuid ${textUuid} does not exist`);
    }

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
    if (!text) {
      throw new Error(`Text with uuid ${textUuid} does not exist`);
    }

    const resourceUuids = await this.getLinkObjUuidsByReferenceUuid(
      textUuid,
      trx
    );

    const resourceRows = (
      await Promise.all(
        resourceUuids.map(uuid => this.getResourceRowByUuid(uuid, trx))
      )
    ).filter((row): row is ResourceRow => row !== null);

    const relevantResourceRows = resourceRows.filter(
      row =>
        row.container === 'oare-image-bucket' &&
        row.type === 'img' &&
        !imagesToHide.includes(row.uuid)
    );

    const sources = (
      await Promise.all(
        relevantResourceRows.map(row =>
          row.sourceUuid
            ? PersonDao.getPersonRowByUuid(row.sourceUuid, trx)
            : null
        )
      )
    ).map(row => (row ? row.label : null));

    const urls = await Promise.all(
      relevantResourceRows.map(row =>
        s3.getSignedUrlPromise('getObject', {
          Bucket: 'oare-image-bucket',
          Key: row.link,
        })
      )
    );

    const imageProperties = await Promise.all(
      relevantResourceRows.map(
        row => ItemPropertiesDao.getImagePropertyDetails(row.uuid, trx) // FIXME would like to revamp this function
      )
    );

    const images: Image[] = relevantResourceRows.map((row, idx) => ({
      resourceRow: row,
      source: sources[idx],
      url: urls[idx],
      side: imageProperties[idx].side,
      view: imageProperties[idx].view,
      text,
    }));

    return images;
  }

  private async getResourceRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ResourceRow | null> {
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

    return row || null;
  }

  private async getLinkObjUuidsByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows: string[] = await k('link')
      .pluck('obj_uuid')
      .where({ reference_uuid: referenceUuid });

    return rows;
  }

  private async getLinkReferenceUuidByObjUuid(
    objUuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knex;

    const referenceUuid: string | null = await k('link')
      .select('reference_uuid as referenceUuid')
      .where({ obj_uuid: objUuid })
      .first()
      .then(row => (row ? row.referenceUuid : null));

    return referenceUuid;
  }

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

  public async insertLinkRow(row: LinkRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('link').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      obj_uuid: row.objUuid,
    });
  }

  public async removeLinkRowByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('link').del().where({ reference_uuid: referenceUuid });
  }
}

export default new ResourceDao();
