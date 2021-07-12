import { ScheduledHandler } from 'aws-lambda';
import { RDS } from 'aws-sdk';

const rdsConfig: RDS.ClientConfiguration = {
  apiVersion: 'latest',
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: 'us-west-2',
};

const rds = new RDS(rdsConfig);

export const exportSnapshotToS3: ScheduledHandler = async (
  _event,
  _context
) => {
  const currentDate = new Date();
  const snapshotName = `oare-0-3-snapshot-${currentDate
    .toDateString()
    .replace(/\s+/g, '-')
    .toLowerCase()}`;

  const createSnapshotParams: RDS.CreateDBSnapshotMessage = {
    DBInstanceIdentifier: 'oare-0-3' /* DB instance name */,
    DBSnapshotIdentifier: snapshotName,
  };
  // let sourceArn;

  console.log('Pre-call');

  rds.createDBSnapshot(createSnapshotParams, (err, data) => {
    console.log('createDBSnapshot called');
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log('successfully created snapshot');
      console.log(data);
    }
    // sourceArn = data.DBSnapshot?.DBSnapshotArn;
  });

  console.log('Post-call');

  /* const startExportTaskeParams: RDS.StartExportTaskMessage = {
    ExportTaskIdentifier: `${snapshotName}-export`,
    SourceArn: sourceArn || '',
    S3BucketName: process.env.S3_BUCKET || '',
    IamRoleArn: process.env.IAM_ROLE_ARN || '',
    KmsKeyId: process.env.KMS_KEY_ID || '',
    ExportOnly: ['oarebyue_0.3.logging', 'oarebyue_0.3.logging_edits'],
  };

  rds.startExportTask(startExportTaskeParams);
  console.log('Export completed'); */
};
