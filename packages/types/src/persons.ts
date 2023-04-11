import { ItemPropertyRow } from './words';
import { FieldRow } from './field';

export interface PersonRow {
  uuid: string;
  nameUuid: string | null;
  relation: string | null;
  relationNameUuid: string | null;
  label: string;
  descriptor: string | null;
}

export interface PersonListItem {
  person: PersonRow;
  display: string;
  properties: ItemPropertyRow[];
}

export interface PersonCore {
  display: string;
  nameUuid: string | null;
  relation: string | null;
  relationNameUuid: string | null;
  uuid: string;
  descriptor: string | null;
}

export interface PersonRole {
  role: string;
  roleUuid: string;
  occurrences: number;
}

export interface PersonInfo {
  person: PersonRow;
  display: string;
  father: PersonCore | null;
  mother: PersonCore | null;
  asshatumWives: PersonCore[];
  amtumWives: PersonCore[];
  husbands: PersonCore[];
  siblings: PersonCore[];
  children: PersonCore[];
  temporaryRoles: PersonRole[];
  durableRoles: PersonRole[];
  roleNotYetAssigned: number;
  discussion: FieldRow[];
}
