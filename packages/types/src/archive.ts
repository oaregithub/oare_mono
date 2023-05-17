import { Text } from './epigraphies';
import { FieldRow } from './field';

export interface ArchiveRow {
  uuid: string;
  parentUuid: string;
  name: string;
  owner: string | null;
  archLocus: string | null;
  currentEditor: string | null;
  type: string;
}

export interface Archive extends ArchiveRow {
  dossiers: Dossier[];
  texts: Text[];
  descriptions: FieldRow[];
  bibliographyUuids: string[];
}

export interface Dossier extends ArchiveRow {
  texts: Text[];
}
