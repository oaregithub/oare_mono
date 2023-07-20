import { Archive, Dossier } from '@oare/types';
import axios from '@/axiosInstance';

async function getAllArchives(): Promise<Archive[]> {
  const { data } = await axios.get('/archives');
  return data;
}

async function getArchive(uuid: string): Promise<Archive> {
  const { data } = await axios.get(`/archive/${uuid}`);
  return data;
}

async function disconnectArchiveText(
  uuid: string,
  textUuid: string
): Promise<void> {
  await axios.delete(`/archive/${uuid}`, {
    params: {
      textUuid,
    },
  });
}

async function getDossier(uuid: string): Promise<Dossier> {
  const { data } = await axios.get(`/dossier/${uuid}`);
  return data;
}

export default {
  getAllArchives,
  getArchive,
  disconnectArchiveText,
  getDossier,
};
