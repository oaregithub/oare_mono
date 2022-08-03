import axios from '@/axiosInstance';
import { BibliographyResponse } from '@oare/types';

async function getBibliographies(params: {
  citationStyle: string;
  page: number;
  limit: number;
}): Promise<BibliographyResponse[]> {
  const { data } = await axios.get('/bibliographies', {
    params,
  });
  return data;
}

export default {
  getBibliographies,
};
