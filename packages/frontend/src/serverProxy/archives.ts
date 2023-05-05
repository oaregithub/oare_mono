import {
  ArchiveInfo,
  Archive,
  Pagination,
  Dossier,
  DisconnectTextPayload,
} from '@oare/types';
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
async function disconnectText(payload: DisconnectTextPayload): Promise<void> {
  await axios.delete('/archive_dossier/disconnect_text', { data: payload });
}

export default {
  getAllArchives,
  getArchive,
  getDossier,
  disconnectText,
};
