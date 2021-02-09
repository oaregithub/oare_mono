import { ErrorsPayload } from '@oare/types';
import axios from '../axiosInstance';

async function logError(payload: ErrorsPayload): Promise<void> {
  await axios.post('/errors', payload);
}

export default {
  logError,
};
