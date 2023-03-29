import { Text } from './epigraphies';
import { FieldInfo } from './field';

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
  descriptions: FieldInfo[];
  bibliographyUuid: string | null;
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
  descriptions: FieldInfo[];
  bibliographyUuid: string | null;
}

export interface DossierInfo {
  name: string;
  uuid: string;
  totalTexts: number;
}
