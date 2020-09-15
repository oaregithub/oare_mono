import axios from '../axiosInstance';
import { MarkupUnit } from '@oare/oare';

async function getEpigraphicMarkups(textUuid: string): Promise<MarkupUnit[]> {
  let { data } = await axios.get('/markups/' + textUuid);
  return data;
}

export default {
  getEpigraphicMarkups,
};
