import firebase from '@/firebase';

async function logout(): Promise<void> {
  await firebase.auth().signOut();
}

export default {
  logout,
};
