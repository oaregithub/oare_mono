import axios from '../axiosInstance';
import { DiscourseUnit } from '@oare/oare';

async function getDiscourseUnits(textUuid: string): Promise<DiscourseUnit[]> {
  let { data } = await axios.get(`/discourses/${textUuid}`);
  return data;
}

export default {
  getDiscourseUnits,
};
