import firebase from '@/firebase';

export async function getFirebaseToken(userUuid: string): Promise<string> {
  return firebase.auth().createCustomToken(userUuid);
}
