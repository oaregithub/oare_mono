import * as admin from 'firebase-admin';
import AWS from 'aws-sdk';

/**
 * Initializes Firebase Admin SDK for authentication.
 * @param cb Callback to be called when Firebase has been initialized. Used to delay app startup until Firebase is ready.
 */
export function initializeFirebase(cb: (err?: any) => void) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const s3 = new AWS.S3();
    s3.getObject(
      {
        Bucket: 'oare-resources',
        Key: 'oareauth-firebase-adminsdk-zv8s9-e1fb884d27.json',
      },
      (err, data) => {
        if (err) {
          cb(err);
        } else if (data.Body) {
          const fbCredentials: admin.ServiceAccount = JSON.parse(
            data.Body.toString()
          );
          admin.initializeApp({
            credential: admin.credential.cert(fbCredentials),
          });
          cb();
        } else {
          cb('Failed to retrieve Firebase credentials from S3');
        }
      }
    );
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    cb();
  }
}

export default admin;
