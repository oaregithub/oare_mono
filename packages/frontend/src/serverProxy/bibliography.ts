import axios from '@/axiosInstance';
import { Bibliography } from '@oare/types';

async function getAllBibliographies(
  citationStyle?: string
): Promise<Bibliography[]> {
  const { data } = await axios.get('/bibliographies', {
    params: {
      citationStyle,
    },
  });
  return data;
}

async function getBibliography(
  uuid: string,
  citationStyle?: string
): Promise<Bibliography> {
  const { data } = await axios.get(`/bibliography/${uuid}`, {
    params: {
      citationStyle,
    },
  });
  return data;
}

export default {
  getAllBibliographies,
  getBibliography,
};
