import { BibliographyItem, ZoteroResponse } from '@oare/types';
import { dynamicImport } from 'tsimportlib';
import AWS from 'aws-sdk';

class BibliographyUtils {
  async getZoteroAPIKEY(): Promise<string> {
    const s3 = new AWS.S3();

    let apiKey = '';

    if (process.env.ZOTERO_API_KEY) {
      apiKey = process.env.ZOTERO_API_KEY;
    } else {
      const response = (
        await s3
          .getObject({
            Bucket: 'oare-resources',
            Key: 'zotero_auth.json',
          })
          .promise()
      ).Body;
      if (response) {
        apiKey = JSON.parse(response as string).authKey;
      }
    }

    return apiKey;
  }

  async fetchZotero(
    bibliography: BibliographyItem,
    citationStyle: string,
    toInclude: string
  ): Promise<ZoteroResponse | null> {
    const zoteroAPIKey = await this.getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const zoteroResponse = await fetch.default(
      `https://api.zotero.org/groups/318265/items/${bibliography.zoteroKey}?format=json&include=${toInclude}&style=${citationStyle}`,
      {
        headers: {
          Authorization: `Bearer ${zoteroAPIKey}`,
        },
      }
    );

    const zoteroJSON = zoteroResponse.ok
      ? ((await zoteroResponse.json()) as ZoteroResponse)
      : null;

    return zoteroJSON;
  }
}

export default new BibliographyUtils();
