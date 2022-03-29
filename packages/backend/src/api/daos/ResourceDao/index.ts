import knex from '@/connection';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import { ResourceRow, LinkRow, LabelLink } from '@oare/types';

class ResourceDao {
  async getImageLinksByTextUuid(
    textUuid: string,
    cdliNum: string
  ): Promise<LabelLink[]> {
    const s3 = new AWS.S3();

    const queryLabelLinks = await knex('person as p')
      .distinct()
      .select('p.label as label', 'r.link as link')
      .leftOuterJoin('resource as r', 'r.source_uuid', 'p.uuid')
      .where('r.source_uuid', 'b6ccd101-8223-2afc-5a2f-3adec5f2edc7')
      .where('r.type', 'img')
      .whereIn(
        'r.uuid',
        knex('link')
          .select('obj_uuid as uuid')
          .where('reference_uuid', textUuid)
      );

    const labelLinks: LabelLink[] = queryLabelLinks.map(
      elem => ({ label: elem.label, link: elem.link } as LabelLink)
    );

    const locationLink = labelLinks.map(row => row.link);

    const signedUrls = await Promise.all(
      locationLink.map(key => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: key,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    const cdliLinks = await this.getValidCdliImageLinks(cdliNum);

    const filledLink = cdliLinks.concat(signedUrls);

    labelLinks.forEach((elem, index) => {
      elem.link = filledLink[index];
    });

    return labelLinks;
  }

  async getTextFileByTextUuid(uuid: string) {
    const textLinks: string[] = await knex('resource')
      .pluck('link')
      .where('container', 'oare-texttxt-bucket')
      .whereIn(
        'uuid',
        knex('link')
          .select('obj_uuid')
          .where(
            'reference_uuid',
            knex('text').select('uuid').where('uuid', uuid)
          )
      );

    return textLinks[0] || null;
  }

  async getValidCdliImageLinks(cdliNum: string): Promise<string[]> {
    const photoUrl = `https://www.cdli.ucla.edu/dl/photo/${cdliNum}.jpg`;
    const lineArtUrl = `https://www.cdli.ucla.edu/dl/lineart/${cdliNum}_l.jpg`;

    const response: string[] = [];
    const ErrorsDao = sl.get('ErrorsDao');

    try {
      const photoResponse = await fetch(photoUrl, { method: 'HEAD' });

      if (photoResponse.ok) {
        response.push(photoUrl);
      }
    } catch (err) {
      await ErrorsDao.logError({
        userUuid: null,
        description: 'Error retrieving CDLI photo',
        stacktrace: err.stack,
        status: 'In Progress',
      });
    }

    try {
      const lineArtResponse = await fetch(lineArtUrl, { method: 'HEAD' });

      if (lineArtResponse.ok) {
        response.push(lineArtUrl);
      }
    } catch (err) {
      await ErrorsDao.logError({
        userUuid: null,
        description: 'Error retrieving CDLI line art',
        stacktrace: err.stack,
        status: 'In Progress',
      });
    }

    return response;
  }

  async getImageDesignatorMatches(preText: string): Promise<string[]> {
    const results = await knex('resource')
      .pluck('link')
      .where('link', 'like', `${preText}%`);
    return results;
  }

  async insertResourceRow(row: ResourceRow) {
    await knex('resource').insert({
      uuid: row.uuid,
      source_uuid: row.sourceUuid,
      type: row.type,
      container: row.container,
      format: row.format,
      link: row.link,
    });
  }

  async insertLinkRow(row: LinkRow) {
    await knex('link').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      obj_uuid: row.objUuid,
    });
  }
}

export default new ResourceDao();
