import axios from '../axiosInstance';
import { EpigraphyResponse } from '@oare/types';

async function getEpigraphicInfo(textUuid: string): Promise<EpigraphyResponse> {
  let { data } = await axios.get(`/text_epigraphies/${textUuid}`);
  return data;
}

export default {
  getEpigraphicInfo,
};
