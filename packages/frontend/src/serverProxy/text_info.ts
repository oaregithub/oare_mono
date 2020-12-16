import axios from '../axiosInstance';

import { TextInfoResponse } from '@oare/types';

async function getTextName(uuid: string): Promise<TextInfoResponse> {
  const { data } = await axios.get(`/text_info/${uuid}`);

  return data;
}

export default {
  getTextName,
};
