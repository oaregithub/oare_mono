import { knexRead, knexWrite } from '@/connection';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';
import { ResourceRow, LinkRow, EpigraphyLabelLink } from '@oare/types';
import { dynamicImport } from 'tsimportlib';

class ResourceDao {
  async getImageLinksByTextUuid(
    textUuid: string,
    cdliNum: string
  ): Promise<EpigraphyLabelLink[]> {
    const s3Links = await this.getValidS3ImageLinks(textUuid);
    const cdliLinks = await this.getValidCdliImageLinks(cdliNum);
    const metLinks = await this.getValidMetImageLinks(textUuid);

    const response = [...s3Links, ...cdliLinks, ...metLinks];

    return response;
  }

  async getValidS3ImageLinks(textUuid: string): Promise<EpigraphyLabelLink[]> {
    const s3Links: EpigraphyLabelLink[] = [];

    try {
      const s3 = new AWS.S3();

      const resourceLinks: EpigraphyLabelLink[] = await knexRead()(
        'person as p'
      )
        .distinct()
        .select('p.label as label', 'r.link as link')
        .leftOuterJoin('resource as r', 'r.source_uuid', 'p.uuid')
        .where('r.type', 'img')
        .whereIn(
          'r.uuid',
          knexRead()('link')
            .select('obj_uuid as uuid')
            .where('reference_uuid', textUuid)
        );

      const signedUrls = await Promise.all(
        resourceLinks.map(key => {
          const params = {
            Bucket: 'oare-image-bucket',
            Key: key.link,
          };
          return s3.getSignedUrlPromise('getObject', params);
        })
      );

      for (let i = 0; i < resourceLinks.length; i += 1) {
        s3Links.push({ label: resourceLinks[i].label, link: signedUrls[i] });
      }
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError({
        userUuid: null,
        stacktrace: (err as Error).stack || null,
        status: 'In Progress',
        description: 'Error retrieving S3 photos',
      });
    }

    return s3Links;
  }

  async getTextFileByTextUuid(uuid: string) {
    const textLinks: string[] = await knexRead()('resource')
      .pluck('link')
      .where('container', 'oare-texttxt-bucket')
      .whereIn(
        'uuid',
        knexRead()('link').select('obj_uuid').where('reference_uuid', uuid)
      );

    return textLinks[0] || null;
  }

  async getValidCdliImageLinks(cdliNum: string): Promise<EpigraphyLabelLink[]> {
    const photoUrl = `https://www.cdli.ucla.edu/dl/photo/${cdliNum}.jpg`;
    const lineArtUrl = `https://www.cdli.ucla.edu/dl/lineart/${cdliNum}_l.jpg`;

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const cdliLinks: string[] = [];
    const ErrorsDao = sl.get('ErrorsDao');

    try {
      const photoResponse = await fetch.default(photoUrl, { method: 'HEAD' });

      if (photoResponse.ok) {
        cdliLinks.push(photoUrl);
      }
    } catch (err) {
      await ErrorsDao.logError({
        userUuid: null,
        description: 'Error retrieving CDLI photo',
        stacktrace: (err as Error).stack || null,
        status: 'In Progress',
      });
    }

    try {
      const lineArtResponse = await fetch.default(lineArtUrl, {
        method: 'HEAD',
      });

      if (lineArtResponse.ok) {
        cdliLinks.push(lineArtUrl);
      }
    } catch (err) {
      await ErrorsDao.logError({
        userUuid: null,
        description: 'Error retrieving CDLI line art',
        stacktrace: (err as Error).stack || null,
        status: 'In Progress',
      });
    }

    const response = cdliLinks.map(
      link => ({ label: 'CDLI', link } as EpigraphyLabelLink)
    );

    return response;
  }

  async getValidMetImageLinks(textUuid: string): Promise<EpigraphyLabelLink[]> {
    const imageLinks: EpigraphyLabelLink[] = [];

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    try {
      const row: string | null = await knexRead()('resource')
        .select('link')
        .whereIn(
          'uuid',
          knexRead()('link')
            .select('obj_uuid')
            .where('reference_uuid', textUuid)
        )
        .where('type', 'img')
        .andWhere('container', 'metmuseum')
        .first();
      if (row) {
        const objectId = row.link;
        const metLink = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;

        const response = await fetch.default(metLink, {
          insecureHTTPParser: true,
        });

        if (response.ok) {
          const jsonResponse = (await response.json()) as {
            primaryImage: string;
            additionalImages: string[];
          };
          imageLinks.push({
            label: 'The Metropolitan Museum of Art',
            link: jsonResponse.primaryImage,
          });

          const {
            additionalImages,
          }: { additionalImages: string[] } = jsonResponse;
          additionalImages.forEach(image =>
            imageLinks.push({
              label: 'The Metropolitan Museum of Art',
              link: image,
            })
          );
        }
      }
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError({
        userUuid: null,
        stacktrace: (err as Error).stack || null,
        status: 'New',
        description: 'Error retrieving Metropolitan Museum photos',
      });
    }

    return imageLinks;
  }

  async getImageDesignatorMatches(preText: string): Promise<string[]> {
    const results = await knexRead()('resource')
      .pluck('link')
      .where('link', 'like', `${preText}%`);
    return results;
  }

  async insertResourceRow(row: ResourceRow) {
    await knexWrite()('resource').insert({
      uuid: row.uuid,
      source_uuid: row.sourceUuid,
      type: row.type,
      container: row.container,
      format: row.format,
      link: row.link,
    });
  }

  async insertLinkRow(row: LinkRow) {
    await knexWrite()('link').insert({
      uuid: row.uuid,
      reference_uuid: row.referenceUuid,
      obj_uuid: row.objUuid,
    });
  }
}

export default new ResourceDao();
