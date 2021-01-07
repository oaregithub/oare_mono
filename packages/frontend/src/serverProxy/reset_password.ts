import axios from '@/axiosInstance';
import { ResetPasswordPayload } from '@oare/types';

async function sendResetPasswordEmail(email: string) {
  await axios.post('/reset_password', { email });
}

async function resetPassword(payload: ResetPasswordPayload) {
  await axios.patch('/reset_password', payload);
}

export default {
  sendResetPasswordEmail,
  resetPassword,
};
