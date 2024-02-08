import axiosRetry from 'axios-retry';
import axios from 'axios';
import { ZoteroResponse } from '@oare/types';
import AWS from 'aws-sdk';
import sl from '@/serviceLocator';

/**
 * Retrieves the Zotero API key from the environment variables or from the S3 bucket.
 * If not previously set, it will be set in the environment variables for future use.
 * @returns The Zotero API key
 */
const getZoteroAPIKey = async (): Promise<string> => {
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
};

/**
 * Queries the Zotero API for the given citation style and key.
 * Used to support bibliography and citation generation.
 * @param zoteroKey The Zotero key for the item to retrieve.
 * @param citationStyle The citation style to use.
 * @returns Zotero API response.
 */
export const getZoteroData = async (
  zoteroKey: string,
  citationStyle: string
): Promise<ZoteroResponse | null> => {
  try {
    const zoteroAPIKey = await getZoteroAPIKey();

    // Used to prevent rate limit errors
    axiosRetry(axios, {
      retries: 3,
      retryDelay: retryCount => retryCount * 3000,
    });

    const { data }: { data: ZoteroResponse } = await axios.get(
      `https://api.zotero.org/groups/318265/items/${zoteroKey}?format=json&include=citation,bib,data&style=${citationStyle}`,
      {
        headers: {
          Authorization: `Bearer ${zoteroAPIKey}`,
        },
      }
    );

    return data;
  } catch (err) {
    const ErrorsDao = sl.get('ErrorsDao');
    await ErrorsDao.logError(
      null,
      'Error retrieving Zotero API data',
      JSON.stringify(err),
      'New'
    );
    return null;
  }
};
