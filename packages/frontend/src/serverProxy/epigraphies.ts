import { EpigraphyResponse } from '@oare/types';
import axios from '../axiosInstance';

async function getEpigraphicInfo(textUuid: string): Promise<EpigraphyResponse> {
  const { data } = await axios.get(`/text_epigraphies/${textUuid}`);
  return data;
}

export default {
  getEpigraphicInfo,
};
