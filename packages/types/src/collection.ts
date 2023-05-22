import { Text } from './epigraphies';
import { HierarchyRow } from './epigraphies';

export interface Collection extends CollectionRow {
  hierarchy: HierarchyRow;
  texts: Text[];
}

export interface CollectionRow {
  uuid: string;
  name: string;
}
