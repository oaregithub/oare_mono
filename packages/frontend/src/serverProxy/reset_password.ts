import axios from '@/axiosInstance';
import { ResetPasswordPayload } from '@oare/types';
import firebase from '@/firebase';

async function sendResetPasswordEmail(email: string) {
  await firebase.auth().sendPasswordResetEmail(email);
}

async function resetPassword(code: string, password: string) {
  await firebase.auth().confirmPasswordReset(code, password);
}

async function verifyPasswordResetCode(code: string): Promise<string> {
  const email = await firebase.auth().verifyPasswordResetCode(code);
  return email;
}

export default {
  sendResetPasswordEmail,
  resetPassword,
  verifyPasswordResetCode,
};
