import { ScheduledHandler } from 'aws-lambda';
import { RDS } from 'aws-sdk';

const rdsConfig: RDS.ClientConfiguration = {
  apiVersion: 'latest',
  region: 'us-west-2',
};

const rds = new RDS(rdsConfig);

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
        console.log(err, err.stack);
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

        rds.startExportTask(startExportTaskParams, (error, datas) => {
          if (error) {
            console.log(error, error.stack);
          } else {
            console.log('Export completed');
            console.log(datas);
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
  // let sourceArn;

  rds.createDBSnapshot(createSnapshotParams, (err, _data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      // sourceArn = data.DBSnapshot?.DBSnapshotArn;
      console.log('Snapshot successfully created');

      /* rds.describeDBSnapshots(
        { DBSnapshotIdentifier: snapshotName },
        (error, datas) => {
          if (error) {
            console.log(error, error.stack);
          } else {
            console.log('Snapshot retreived');
            console.log(datas);
          }
        }
      ); */

      /* const startExportTaskParams: RDS.StartExportTaskMessage = {
        ExportTaskIdentifier: `${snapshotName}-export`,
        SourceArn: sourceArn || '',
        S3BucketName: process.env.S3_BUCKET || '',
        IamRoleArn: process.env.IAM_ROLE_ARN || '',
        KmsKeyId: process.env.KMS_KEY_ID || '',
        ExportOnly: ['oarebyue_0.3.logging', 'oarebyue_0.3.logging_edits'],
      };

      rds.startExportTask(startExportTaskParams, (error, datas) => {
        if (error) {
          console.log(error, error.stack);
        } else {
          console.log('Export completed');
          console.log(datas);
        }
      }); */
    }
  });
};
