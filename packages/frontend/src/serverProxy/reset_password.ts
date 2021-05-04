import axios from '@/axiosInstance';
import { ResetPasswordPayload } from '@oare/types';
import firebase from '@/firebase';

async function sendResetPasswordEmail(email: string) {
  await firebase.auth().sendPasswordResetEmail(email);
}

async function resetPassword(payload: ResetPasswordPayload) {
  await axios.patch('/reset_password', payload);
}

export default {
  sendResetPasswordEmail,
  resetPassword,
};
