import axios from '../axiosInstance';
import { EpigraphicUnit } from '@oare/oare';

export interface EpigraphyResponse {
  canWrite: boolean;
  textName: string;
  collection: {
    uuid: string;
    name: string;
  };
  units: EpigraphicUnit[];
}
async function getEpigraphicInfo(textUuid: string): Promise<EpigraphyResponse> {
  let { data } = await axios.get(`/text_epigraphies/${textUuid}`);
  return data;
}

export default {
  getEpigraphicInfo
};
