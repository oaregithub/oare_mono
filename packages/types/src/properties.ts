import { FieldInfo } from './field';

export interface HierarchyData {
  uuid: string;
  parentUuid: string;
  type: string;
  role: string;
  objectUuid: string;
  objectParentUuid: string | null;
  objectGrandparentUuid: string | null;
  custom: number | null;
}

export interface HierarchyTopNode {
  hierarchy: HierarchyData;
  name: string | null;
  variables: PropertyVariable[];
  fieldInfo: FieldInfo | null;
}

export interface PropertyVariable extends VariableRow {
  hierarchy: HierarchyData;
  level: number | null;
  values: PropertyValue[];
  fieldInfo: FieldInfo | null;
}

export interface PropertyValue extends ValueRow {
  hierarchy: HierarchyData;
  variables: PropertyVariable[];
  fieldInfo: FieldInfo | null;
}

export interface TaxonomyPropertyTree {
  tree: HierarchyTopNode;
}

export interface VariableRow {
  uuid: string;
  name: string;
  abbreviation: string | null;
  type: VariableType;
  tableReference: TableReferenceType | null;
}

export interface ValueRow {
  uuid: string;
  name: string;
  abbreviation: string | null;
}

export type VariableType =
  | 'nominal'
  | 'integral'
  | 'link'
  | 'ordinal'
  | 'logical'
  | 'decimal'
  | 'munsell'
  | 'calendrical'
  | 'alphanumeric'
  | 'serial';

export type TableReferenceType =
  | 'asset'
  | 'bibliography'
  | 'concept?'
  | 'dictionary_word'
  | 'event'
  | 'period'
  | 'person'
  | 'spatial_unit'
  | 'text'
  | 'text_discourse';

export interface AppliedProperty {
  variableRow: PropertyVariable;
  valueRow: PropertyValue | null;
  value: string | boolean | null;
  sourceUuid: string;
  objectUuid: string | null;
  objectDisplay: string | null;
}

export interface LinkItem {
  objectUuid: string;
  objectDisplay: string;
  objectDropdownDisplay?: string;
}

export interface LinkPropertiesSearchPayload {
  tableReference: TableReferenceType;
  search: string;
  textUuidFilter?: string;
}

export interface PreselectionProperty {
  variableHierarchyUuid: string;
  valueUuid: string;
}
