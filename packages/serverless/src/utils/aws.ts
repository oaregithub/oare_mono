import AWS from 'aws-sdk';
import AWSOffline from 'aws-sdk-mock';

export const setupAWS = () => {
  if (process.env.NODE_ENV !== 'production') {
    AWSOffline.setSDKInstance(AWS);

    AWSOffline.mock(
      'RDS',
      'createDBSnapshot',
      (_params: AWS.RDS.CreateDBSnapshotMessage, callback: Function) => {
        console.log('mocked createDBSnapshot called');
        callback();
      }
    );
    AWSOffline.mock(
      'RDS',
      'describeDBSnapshots',
      (_params: AWS.RDS.DescribeDBSnapshotsMessage, callback: Function) => {
        console.log('mocked describeDBSnapshots called');
        callback();
      }
    );
    AWSOffline.mock(
      'RDS',
      'startExportTask',
      (_params: AWS.RDS.StartExportTaskMessage, callback: Function) => {
        console.log('mocked startExportTask called');
        callback();
      }
    );
  }

  return AWS;
};

export const restoreAWS = async () => {
  if (process.env.NODE_ENV !== 'production') {
    AWSOffline.restore();
  }
};
