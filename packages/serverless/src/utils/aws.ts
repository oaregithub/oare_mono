import AWS from 'aws-sdk';
import AWSOffline from 'aws-sdk-mock';

export const setupAWS = () => {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    AWSOffline.setSDKInstance(AWS);

    AWSOffline.mock(
      'RDS',
      'createDBSnapshot',
      (_params: AWS.RDS.CreateDBSnapshotMessage, callback: Function) =>
        callback()
    );
    AWSOffline.mock(
      'RDS',
      'describeDBSnapshots',
      (_params: AWS.RDS.DescribeDBSnapshotsMessage, callback: Function) =>
        callback()
    );
    AWSOffline.mock(
      'RDS',
      'startExportTask',
      (_params: AWS.RDS.StartExportTaskMessage, callback: Function) =>
        callback()
    );
  }

  return AWS;
};

export const restoreAWS = async () => {
  if (process.env.NODE_ENV !== 'production') {
    AWSOffline.restore();
  }
};
