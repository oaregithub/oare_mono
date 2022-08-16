import {
  BibliographyItem,
  ZoteroRequestType,
  ZoteroResponse,
} from '@oare/types';
import axios from 'axios';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';

class BibliographyUtils {
  async getZoteroAPIKEY(): Promise<string> {
    let apiKey = '';

    if (process.env.ZOTERO_API_KEY) {
      apiKey = process.env.ZOTERO_API_KEY;
    } else {
      const s3 = new AWS.S3();

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
        process.env.ZOTERO_API_KEY = apiKey;
      }
    }

    return apiKey;
  }

  async getZoteroReferences(
    bibliography: BibliographyItem,
    citationStyle: string,
    toInclude: ZoteroRequestType[]
  ): Promise<ZoteroResponse | null> {
    try {
      const zoteroAPIKey = await this.getZoteroAPIKEY();

      const toIncludeString = toInclude.join(',');

      const { data }: { data: ZoteroResponse } = await axios.get(
        `https://api.zotero.org/groups/318265/items/${bibliography.zoteroKey}?format=json&include=${toIncludeString}&style=${citationStyle}`,
        {
          headers: {
            Authorization: `Bearer ${zoteroAPIKey}`,
          },
        }
      );

      return data;
    } catch (err) {
      const ErrorsDao = sl.get('ErrorsDao');
      await ErrorsDao.logError({
        userUuid: null,
        description: 'Error retrieving Zotero API data',
        stacktrace: JSON.stringify(err),
        status: 'New',
      });
      return null;
    }
  }
}

export default new BibliographyUtils();
