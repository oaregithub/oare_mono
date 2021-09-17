import knex from '@/connection';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';

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
      .whereNot('link', 'like', '%cdli%');

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

    const response = cdliLinks.concat(signedUrls);

    return response;
  }

  async getValidCdliImageLinks(cdliNum: string): Promise<string[]> {
    const photoUrl = `https://www.cdli.ucla.edu/dl/photo/${cdliNum}.jpg`;
    const lineArtUrl = `https://www.cdli.ucla.edu/dl/lineart/${cdliNum}_l.jpg`;

    const response: string[] = [];

    const photoResponse = await fetch(photoUrl, { method: 'HEAD' });
    const lineArtResponse = await fetch(lineArtUrl, { method: 'HEAD' });

    if (photoResponse.ok) {
      response.push(photoUrl);
    }
    if (lineArtResponse.ok) {
      response.push(lineArtUrl);
    }

    return response;
  }
}

export default new ResourceDao();
