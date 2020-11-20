import axios from '../axiosInstance';
import { EpigraphicUnit, MarkupUnit, DiscourseUnit } from '@oare/oare';

export interface EpigraphyResponse {
  canWrite: boolean;
  textName: string;
  collection: {
    uuid: string;
    name: string;
  };
  cdliNum: string | null;
  units: EpigraphicUnit[];
  color: string;
  colorMeaning: string;
  markups: MarkupUnit[];
  discourseUnits: DiscourseUnit[];
}
async function getEpigraphicInfo(textUuid: string): Promise<EpigraphyResponse> {
  let { data } = await axios.get(`/text_epigraphies/${textUuid}`);
  return data;
}

export default {
  getEpigraphicInfo,
};
