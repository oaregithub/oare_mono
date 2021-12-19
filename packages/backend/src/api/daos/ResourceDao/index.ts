import knex from '@/connection';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import { ResourceRow, LinkRow } from '@oare/types';

class ResourceDao {
  async getImageLinksByTextUuid(
    textUuid: string,
    cdliNum: string
  ): Promise<string[]> {
    const s3 = new AWS.S3();

    const resourceLinks: string[] = await knex('resource')
      .pluck('link')
      .whereIn(
        'uuid',
        knex('link').select('obj_uuid').where('reference_uuid', textUuid)
      )
      .where('type', 'img');

    const signedUrls = await Promise.all(
      resourceLinks.map(key => {
        const params = {
          Bucket: 'oare-image-bucket',
          Key: key,
        };
        return s3.getSignedUrlPromise('getObject', params);
      })
    );

    const cdliLinks = await this.getValidCdliImageLinks(cdliNum);

    const metLinks = await this.getValidMetImageLinks(textUuid);

    const response = metLinks.concat(cdliLinks).concat(signedUrls);

    return response;
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

  async getValidMetImageLinks(textUuid: string): Promise<string[]> {
    const response: string[] = [];
    const ErrorsDao = sl.get('ErrorsDao');

    const objectIDs: string[] = await knex('resource')
      .pluck('link')
      .whereIn(
        'uuid',
        knex('link').select('obj_uuid').where('reference_uuid', textUuid)
      )
      .where('type', 'img');

    await Promise.all(objectIDs.map(async (objectID) => {
      try {
        const metUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;
        const metResponse = await fetch(metUrl);
  
        if (metResponse.ok) {
          const metJson = await metResponse.json();
          response.push(metJson.primaryImage);
        }
      } catch (err) {
        await ErrorsDao.logError({
          userUuid: null,
          description: 'Error retrieving MET photo',
          stacktrace: err.stack,
          status: 'In Progress',
        });
      }
    }))

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
