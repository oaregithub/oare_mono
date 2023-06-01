import { Archive, Dossier } from '@oare/types';
import axios from '../axiosInstance';

async function getAllArchives(): Promise<Archive[]> {
  const { data } = await axios.get('/archives');
  return data;
}

async function getArchive(uuid: string): Promise<Archive> {
  const { data } = await axios.get(`/archive/${uuid}`);
  return data;
}

async function getDossier(uuid: string): Promise<Dossier> {
  const { data } = await axios.get(`/dossier/${uuid}`);
  return data;
}

async function disconnectText(
  archiveUuid: string,
  textUuid: string
): Promise<void> {
  await axios.delete(`archive/${archiveUuid}/disconnect_text/${textUuid}`);
}

export default {
  getAllArchives,
  getArchive,
  getDossier,
  disconnectText,
};
