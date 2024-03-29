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

async function getBibliography(uuid: string): Promise<BibliographyResponse> {
  const { data } = await axios.get(`/bibliography/${uuid}`);
  return data;
}

export default {
  getBibliographies,
  getBibliography,
};
