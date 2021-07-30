import { ScheduledHandler } from 'aws-lambda';
import { restoreAWS, setupAWS } from '../utils/aws';
import knex from '../utils/connection';

export const createSnapshot: ScheduledHandler = (
  _event,
  _context,
  callback
) => {
  const AWS = setupAWS();

  const rdsConfig: AWS.RDS.ClientConfiguration = {
    apiVersion: 'latest',
    region: 'us-west-2',
  };

  const rds = new AWS.RDS(rdsConfig);

  const currentDate = new Date();
  const snapshotName = `oare-0-3-snapshot-${currentDate
    .toDateString()
    .replace(/\s+/g, '-')
    .toLowerCase()}-${currentDate
    .toTimeString()
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  const createSnapshotParams: AWS.RDS.CreateDBSnapshotMessage = {
    DBInstanceIdentifier: 'oare-0-3',
    DBSnapshotIdentifier: snapshotName,
  };

  rds.createDBSnapshot(createSnapshotParams, (err, _data) => {
    if (err) {
      console.log(err, err.stack); // eslint-disable-line no-console
    } else {
      console.log('Snapshot successfully created'); // eslint-disable-line no-console
    }
  });
  restoreAWS();
  callback();
};

export const exportSnapshot: ScheduledHandler = (
  _event,
  _context,
  callback
) => {
  const AWS = setupAWS();

  const rdsConfig: AWS.RDS.ClientConfiguration = {
    apiVersion: 'latest',
    region: 'us-west-2',
  };

  const rds = new AWS.RDS(rdsConfig);

  const currentDate = new Date();
  const snapshotName = `oare-0-3-snapshot-${currentDate
    .toDateString()
    .replace(/\s+/g, '-')
    .toLowerCase()}-${currentDate
    .toTimeString()
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  rds.describeDBSnapshots(
    { DBSnapshotIdentifier: snapshotName },
    (err, data) => {
      if (err) {
        console.log(err, err.stack); // eslint-disable-line no-console
      } else {
        const sourceArn =
          data && data.DBSnapshots ? data.DBSnapshots[0].DBSnapshotArn : '';

        const startExportTaskParams: AWS.RDS.StartExportTaskMessage = {
          ExportTaskIdentifier: `${snapshotName}-export`,
          SourceArn: sourceArn || '',
          S3BucketName: process.env.S3_BUCKET || '',
          IamRoleArn: process.env.IAM_ROLE_ARN || '',
          KmsKeyId: process.env.KMS_KEY_ID || '',
        };

        rds.startExportTask(startExportTaskParams, async (error, _datas) => {
          if (error) {
            console.log(error, error.stack); // eslint-disable-line no-console
          } else {
            console.log('Export completed'); // eslint-disable-line no-console
            // await knex('logging').del();
            // await knex('logging_edits').del();
            console.log('Cleared logging tables'); // eslint-disable-line no-console
          }
        });
      }
    }
  );
  restoreAWS();
  callback();
};
