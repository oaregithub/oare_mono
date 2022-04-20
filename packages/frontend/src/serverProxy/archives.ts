import { ArchiveInfo, Archive, Pagination, Dossier } from '@oare/types';
import axios from '../axiosInstance';

async function getAllArchives(): Promise<ArchiveInfo[]> {
  const { data } = await axios.get('/archives');
  return data;
}

async function getArchive(
  uuid: string,
  pagination: Pagination
): Promise<Archive> {
  const { data } = await axios.get(`/archives/${uuid}`, {
    params: pagination,
  });

  return data;
}
async function getDossier(
  uuid: string,
  pagination: Pagination
): Promise<Dossier> {
  const { data } = await axios.get(`/dossier/${uuid}`, {
    params: pagination,
  });

  return data;
}
export default {
  getAllArchives,
  getArchive,
  getDossier,
};
