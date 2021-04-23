import axios from '@/axiosInstance';
import firebase from '@/firebase';

async function logout(): Promise<void> {
  await axios.get('/logout');
  await firebase.auth().signOut();
}

export default {
  logout,
};
