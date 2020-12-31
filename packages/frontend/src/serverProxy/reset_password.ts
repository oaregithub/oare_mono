import axios from '@/axiosInstance';

async function sendResetPasswordEmail(email: string) {
  await axios.post('/reset_password', { email });
}

export default {
  sendResetPasswordEmail,
};
