import * as admin from 'firebase-admin';
import AWS from 'aws-sdk';
import knex from '@/connection';
import { User } from '@oare/types';

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

interface UserWithPassword extends User {
  passwordHash: string;
}

export async function portUsersToFirebase() {
  const users: UserWithPassword[] = await knex('user').select(
    'uuid',
    'first_name AS firstName',
    'last_name AS lastName',
    'email',
    'is_admin AS isAdmin',
    'password_hash AS passwordHash'
  );

  await Promise.all(
    users.map(
      async ({ email, firstName, lastName, isAdmin, uuid, passwordHash }) => {
        const [_, salt, hash] = passwordHash.split('$');
        await admin.auth().importUsers(
          [
            {
              uid: uuid,
              email,
              displayName: `${firstName} ${lastName}`,
              passwordSalt: Buffer.from(salt),
              passwordHash: Buffer.from(hash),
              customClaims: {
                isAdmin,
              },
            },
          ],
          {
            hash: {
              algorithm: 'HMAC_SHA256',
              key: Buffer.from(salt),
            },
          }
        );
      }
    )
  );
}

export default admin;
