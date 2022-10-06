import axios from '@/axiosInstance';
import { BibliographyResponse } from '@oare/types';

async function getBibliographies(params: {
  citationStyle: string;
}): Promise<BibliographyResponse[]> {
  const { data } = await axios.get('/bibliographies', {
    params,
  });
  return data;
}

async function getBibliographiesCount(): Promise<number> {
  const { data } = await axios.get('/bibliographies_count');
  return data;
}

export default {
  getBibliographies,
  getBibliographiesCount,
};
