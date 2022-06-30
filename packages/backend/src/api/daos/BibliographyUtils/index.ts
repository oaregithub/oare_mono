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
    bibliographies: BibliographyItem[],
    citationStyle: string
  ): Promise<ZoteroResponse[]> {
    const apiKey = await this.getZoteroAPIKEY();

    const fetch = (await dynamicImport(
      'node-fetch',
      module
    )) as typeof import('node-fetch');

    const response = await Promise.all(
      bibliographies.map(async bibliography => {
        const resp = await fetch.default(
          `https://api.zotero.org/groups/318265/items/${bibliography.zot_item_key}?format=json&include=citation&style=${citationStyle}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const json = (await resp.json()) as ZoteroResponse;
        return json;
      })
    );

    return response;
  }
}

export default new BibliographyUtils();
