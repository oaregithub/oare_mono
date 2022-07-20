import { QuarantineText } from '@oare/types';
import axios from '@/axiosInstance';

async function quarantineText(textUuid: string): Promise<void> {
  await axios.post(`/quarantine/${textUuid}`);
}

async function getQuarantinedTexts(): Promise<QuarantineText[]> {
  const { data } = await axios.get('/quarantine');
  return data;
}

async function restoreText(textUuid: string): Promise<void> {
  await axios.delete(`/quarantine/${textUuid}`);
}

async function permanentlyDeleteText(textUuid: string): Promise<void> {
  await axios.delete(`/quarantine/permanent_delete/${textUuid}`);
}

export default {
  quarantineText,
  getQuarantinedTexts,
  restoreText,
  permanentlyDeleteText,
};
