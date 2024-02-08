import firebase from '@/firebase';

/**
 * Creates custom firebase token for the given user. Used to create initial token for user upon registration.
 * @param userUuid The UUID of the user to create the token for.
 * @returns A Firebase token for the given user.
 */
export async function getFirebaseToken(userUuid: string): Promise<string> {
  return firebase.auth().createCustomToken(userUuid);
}
