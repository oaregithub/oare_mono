import { TextInfoResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getTextName(uuid: string): Promise<TextInfoResponse> {
  const { data } = await axios.get(`/text_info/${uuid}`);

  return data;
}

export default {
  getTextName,
};
