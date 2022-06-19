import { ResourceRow } from '@oare/types';
import AWS from 'aws-sdk';

export async function getFileURLByRow(
  resourceRows: ResourceRow[]
): Promise<string[]> {
  const s3 = new AWS.S3();

  const fileURL = await Promise.all(
    resourceRows.map(key => {
      const params = {
        Bucket: key.container,
        Key: key.link,
      };
      return s3.getSignedUrlPromise('getObject', params);
    })
  );

  return fileURL;
}
