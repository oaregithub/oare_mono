import { ItemPropertyRow } from './words';

export interface PersonRow {
  uuid: string;
  nameUuid: string | null;
  relation: string | null;
  relationNameUuid: string | null;
  label: string;
  type: string;
}

export interface PersonListItem {
  person: PersonRow;
  display: string;
  properties: ItemPropertyRow[];
  occurrences: number | null;
}
