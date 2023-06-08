import axios from '@/axiosInstance';
import { RegisterPayload, RegisterResponse, User } from '@oare/types';
import firebase from '@/firebase';

async function register(payload: RegisterPayload): Promise<User> {
  const { data }: { data: RegisterResponse } = await axios.post(
    '/register',
    payload
  );
  await firebase.auth().signInWithCustomToken(data.token);
  return data.user;
}

export default { register };
