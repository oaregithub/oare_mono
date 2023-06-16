import { ItemProperty } from './properties';
import { FieldRow } from './field';

export interface PersonRow {
  uuid: string;
  nameUuid: string | null;
  relation: string | null;
  relationNameUuid: string | null;
  label: string;
  type: string;
  descriptor: string | null;
}

export interface PersonCore extends PersonRow {
  display: string;
  properties: ItemProperty[];
}

export interface Person extends PersonCore {
  father: PersonCore | null;
  mother: PersonCore | null;
  asshatumWives: PersonCore[];
  amtumWives: PersonCore[];
  husbands: PersonCore[];
  siblings: PersonCore[];
  children: PersonCore[];
  temporaryRoles: PersonRoleWithOccurrences[];
  durableRoles: PersonRoleWithOccurrences[];
  roleNotYetAssigned: number;
  discussion: FieldRow[];
}

export interface PersonRole {
  uuid: string;
  name: string;
}

export interface PersonRoleWithOccurrences extends PersonRole {
  occurrences: number;
}
