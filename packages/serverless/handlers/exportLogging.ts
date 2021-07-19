import { ScheduledHandler } from 'aws-lambda';
import { RDS } from 'aws-sdk';
import knex from '../utils/connection';

const rdsConfig: RDS.ClientConfiguration = {
  apiVersion: 'latest',
  region: 'us-west-2',
};

const rds = new RDS(rdsConfig);

export const clearLoggingTables: ScheduledHandler = async (
  _event,
  _context
) => {
  await knex('logging').del();
  await knex('logging_edits').del();
};

export const exportSnapshot: ScheduledHandler = (_event, _context) => {
  const currentDate = new Date();
  const snapshotName = `oare-0-3-snapshot-${currentDate
    .toDateString()
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  rds.describeDBSnapshots(
    { DBSnapshotIdentifier: snapshotName },
    (err, data) => {
      if (err) {
        console.log(err, err.stack); // eslint-disable-line no-console
      } else {
        const sourceArn = data.DBSnapshots
          ? data.DBSnapshots[0].DBSnapshotArn
          : '';

        const startExportTaskParams: RDS.StartExportTaskMessage = {
          ExportTaskIdentifier: `${snapshotName}-export`,
          SourceArn: sourceArn || '',
          S3BucketName: process.env.S3_BUCKET || '',
          IamRoleArn: process.env.IAM_ROLE_ARN || '',
          KmsKeyId: process.env.KMS_KEY_ID || '',
        };

        rds.startExportTask(startExportTaskParams, (error, _datas) => {
          if (error) {
            console.log(error, error.stack); // eslint-disable-line no-console
          } else {
            console.log('Export completed'); // eslint-disable-line no-console
          }
        });
      }
    }
  );
};

export const createSnapshot: ScheduledHandler = (_event, _context) => {
  const currentDate = new Date();
  const snapshotName = `oare-0-3-snapshot-${currentDate
    .toDateString()
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  const createSnapshotParams: RDS.CreateDBSnapshotMessage = {
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
};
