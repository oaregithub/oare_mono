import { knexRead, knexWrite } from '@/connection';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import {
  ResourceRow,
  LinkRow,
  EpigraphyLabelLink,
  ImageResource,
  ReferringLocationInfo,
} from '@oare/types';
import { Knex } from 'knex';
import axios from 'axios';

class ResourceDao {
  async getImageLinksByTextUuid(
    userUuid: string | null,
    textUuid: string,
    cdliNum: string,
    trx?: Knex.Transaction
  ): Promise<EpigraphyLabelLink[]> {
    const s3Links = await this.getValidS3ImageLinks(textUuid, userUuid, trx);
    const cdliLinks = await this.getValidCdliImageLinks(cdliNum, trx);
    const metLinks = await this.getValidMetImageLinks(textUuid, trx);

    const response = [...s3Links, ...cdliLinks, ...metLinks];

    return response;
  }

  async getValidS3ImageLinks(
    textUuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<EpigraphyLabelLink[]> {
    const k = trx || knexRead();
    const s3Links: EpigraphyLabelLink[] = [];
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    try {
      const s3 = new AWS.S3();
      const CollectionTextUtils = sl.get('CollectionTextUtils');
      const imagesToHide = await CollectionTextUtils.imagesToHide(userUuid);

      const resourceLinks: ImageResource[] = await k('person as p')
        .distinct()
        .select('p.label as label', 'r.link as link', 'r.uuid as uuid')
        .rightOuterJoin('resource as r', 'r.source_uuid', 'p.uuid')
        .where('r.type', 'img')
        .andWhere('r.container', 'oare-image-bucket')
        .whereIn(
          'r.uuid',
          k('link').select('obj_uuid').where('reference_uuid', textUuid)
        )
        .whereNotIn('r.uuid', imagesToHide);

      const signedUrls = await Promise.all(
        resourceLinks.map(key => {
          const params = {
            Bucket: 'oare-image-bucket',
            Key: key.link,
          };
          return s3.getSignedUrlPromise('getObject', params);
        })
      );

      const imagePropertyDetails = await Promise.all(
        resourceLinks.map(resource =>
          ItemPropertiesDao.getImagePropertyDetails(resource.uuid, trx)
        )
      );

      resourceLinks.forEach((elem, idx) => {
        s3Links.push({
          label: elem.label,
          link: signedUrls[idx],
          side: imagePropertyDetails[idx].side,
          view: imagePropertyDetails[idx].view,
        });
      });
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError(
        {
          userUuid: null,
          stacktrace: (err as Error).stack || null,
          status: 'In Progress',
          description: 'Error retrieving S3 images',
        },
        trx
      );
    }

    return s3Links;
  }

  async getTextFileByTextUuid(uuid: string, trx?: Knex.Transaction) {
    const k = trx || knexRead();
    const textLinks: string[] = await k('resource')
      .pluck('link')
      .where('container', 'oare-texttxt-bucket')
      .whereIn(
        'uuid',
        k('link').select('obj_uuid').where('reference_uuid', uuid)
      );

    return textLinks[0] || null;
  }

  async getReferringLocationInfo(
    textUuid: string,
    bibUuid: string,
    trx?: Knex.Transaction
  ): Promise<ReferringLocationInfo> {
    const k = trx || knexRead();
    const beginPage: number | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5ce1f5a2-b68f-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => Number(obj?.value) ?? null);

    const endPage: number | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5cf077ed-b68f-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => Number(obj?.value) ?? null);

    const beginPlate: number | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5d42c28a-b1fe-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => Number(obj?.value) ?? null);

    const endPlate: number | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5d600469-b1fe-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => Number(obj?.value) ?? null);

    const note: string | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5d6b0f28-b1fe-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => obj?.value ?? null);

    const publicationNumber: number | null = await k('item_properties as ip')
      .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
      .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
      .where('ip3.variable_uuid', '5d771785-b1fe-11ec-bcc3-0282f921eac9')
      .andWhere('ip3.reference_uuid', textUuid)
      .andWhere('ip.object_uuid', bibUuid)
      .select('ip3.value')
      .first()
      .then((obj: { value: string | null }) => Number(obj?.value) ?? null);

    return {
      beginPage,
      endPage,
      beginPlate,
      endPlate,
      note,
      publicationNumber,
    };
  }

  async getPDFUrlByBibliographyUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string | null> {
    const k = trx || knexRead();
    const resourceRow: { link: string; container: string } = await k('resource')
      .select('link', 'container')
      .whereIn(
        'uuid',
        knexRead()('link').select('obj_uuid').where('reference_uuid', uuid)
      )
      .where('type', 'pdf')
      .first();

    const s3 = new AWS.S3();

    let fileUrl: string | null;

    try {
      fileUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: resourceRow.container,
        Key: resourceRow.link,
      });
    } catch {
      fileUrl = null;
    }

    return fileUrl;
  }

  async getValidCdliImageLinks(
    cdliNum: string,
    trx?: Knex.Transaction
  ): Promise<EpigraphyLabelLink[]> {
    const photoUrl = `https://www.cdli.ucla.edu/dl/photo/${cdliNum}.jpg`;
    const lineArtUrl = `https://www.cdli.ucla.edu/dl/lineart/${cdliNum}_l.jpg`;

    const cdliLinks: string[] = [];

    try {
      await axios.head(photoUrl);
      cdliLinks.push(photoUrl);
    } catch {
      // Do nothing. Image does not exist.
    }

    try {
      await axios.head(lineArtUrl);
      cdliLinks.push(lineArtUrl);
    } catch {
      // Do nothing. Image line art does not exist.
    }

    const response: EpigraphyLabelLink[] = cdliLinks.map(link => ({
      label: 'CDLI',
      link,
      side: null,
      view: null,
    }));

    return response;
  }

  async getValidMetImageLinks(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<EpigraphyLabelLink[]> {
    const k = trx || knexRead();
    const imageLinks: EpigraphyLabelLink[] = [];

    try {
      const row: ImageResource = await k('resource')
        .select('link', 'uuid')
        .whereIn(
          'uuid',
          k('link').select('obj_uuid').where('reference_uuid', textUuid)
        )
        .where('type', 'img')
        .andWhere('container', 'metmuseum')
        .first();
      if (row) {
        const objectId = row.link;
        const metLink = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;

        const {
          data,
        }: {
          data: {
            primaryImage: string;
            additionalImages: string[];
          };
        } = await axios.get(metLink);

        const imageUrls = [data.primaryImage, ...data.additionalImages];
        imageUrls.forEach(url => {
          imageLinks.push({
            label: 'The Metropolitan Museum of Art',
            link: url,
            side: null,
            view: null,
          });
        });
      }
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError(
        {
          userUuid: null,
          stacktrace: (err as Error).stack || null,
          status: 'New',
          description: 'Error retrieving Metropolitan Museum images',
        },
        trx
      );
    }
    return imageLinks;
  }

  async getImageDesignatorMatches(
    preText: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const results = await k('resource')
      .pluck('link')
      .where('link', 'like', `${preText}%`);
    return results;
  }

  async insertResourceRow(row: ResourceRow, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('resource').insert({
      uuid: row.uuid,
      source_uuid: row.sourceUuid,
      type: row.type,
      container: row.container,
      format: row.format,
      link: row.link,
    });
  }

  async insertLinkRow(row: LinkRow, trx?: Knex.Transaction) {
    const k = trx || knexWrite();
    await k('link').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      obj_uuid: row.objUuid,
    });
  }

  async getDirectObjectLink(
    tag: string,
    trx?: Knex.Transaction
  ): Promise<ResourceRow | null> {
    const k = trx || knexRead();
    const tagList: { [key: string]: string } = {
      explanation: '3d4d9397-b6a8-11ec-bcc3-0282f921eac9',
    };
    const uuid = tagList[tag];
    if (!uuid) {
      return null;
    }
    const result: ResourceRow = await k('resource')
      .select('uuid', 'source_uuid', 'type', 'container', 'format', 'link')
      .where({ uuid })
      .first();

    return result;
  }

  async getImageByUuid(
    imageUuid: string,
    trx?: Knex.Transaction
  ): Promise<{ uuid: string; link: string } | null> {
    const k = trx || knexRead();
    const image = await k('resource')
      .select('uuid', 'link')
      .where('uuid', imageUuid)
      .first();
    return image || null;
  }

  async getAllowListImageWithText(
    imageUuid: string,
    trx?: Knex.Transaction
  ): Promise<ImageResource | null> {
    const s3 = new AWS.S3();
    const k = trx || knexRead();

    const textInfo: { display_name: string } = await k('text')
      .select('display_name')
      .whereIn(
        'uuid',
        k('link').select('reference_uuid').where('obj_uuid', imageUuid)
      )
      .first();
    const resourceLink: { link: string } = await k('resource')
      .select('link')
      .where('uuid', imageUuid)
      .andWhere('type', 'img')
      .andWhere('container', 'oare-image-bucket')
      .first();

    const signedUrl: string = await s3.getSignedUrlPromise('getObject', {
      Bucket: 'oare-image-bucket',
      Key: resourceLink.link,
    });

    const result: ImageResource = {
      uuid: imageUuid,
      link: signedUrl,
      label: textInfo.display_name,
    };

    return result || null;
  }

  async removeLinkRowByReferenceUuid(
    referenceUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('link').del().where({ reference_uuid: referenceUuid });
  }
}

export default new ResourceDao();
