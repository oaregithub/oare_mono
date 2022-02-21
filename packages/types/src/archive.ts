import { Text } from './epigraphies';

export interface Archive {
  id: string;
  uuid: string;
  parentUuid: string;
  name: string;
  owner: string;
  archLocus: string;
  dossiersInfo: DossierInfo[] | null;
  texts: Text[] | null;
  totalTexts: number;
  totalDossiers: number;
}

export interface Dossier {
  id: string;
  uuid: string;
  parentUuid: string;
  name: string;
  owner: string;
  archLocus: string;
  texts: Text[] | null;
  totalTexts: number;
}

export interface ArchiveInfo {
  name: string;
  uuid: string;
  totalTexts: number;
  totalDossiers: number;
}

export interface DossierInfo {
  name: string;
  uuid: string;
  totalTexts: number;
}
